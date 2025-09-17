import { Buffer } from 'node:buffer'
import zlib from 'node:zlib'
import { GatewayCloseEventCodes, GatewayOpcodes } from '@discordeno/types'
import { delay, LeakyBucket, logger } from '@discordeno/utils'
import NodeWebSocket from 'ws'
import { ShardSocketCloseCodes, ShardState, TransportCompression } from './types.js'

const ZLIB_SYNC_FLUSH = new Uint8Array([0x0, 0x0, 0xff, 0xff])
let fzstd
/** Since fzstd is an optional dependency, we need to import it lazily. */ async function getFZStd() {
  return (fzstd ??= await import('fzstd'))
}
export class DiscordenoShard {
  constructor(options) {
    /** The maximum of requests which can be send to discord per rate limit tick. Typically this value should not be changed. */ this.maxRequestsPerRateLimitTick = 120
    /** The previous payload sequence number. */ this.previousSequenceNumber = null
    /** In which interval (in milliseconds) the gateway resets it's rate limit. */ this.rateLimitResetInterval = 60000
    /** Current internal state of the this. */ this.state = ShardState.Offline
    /** The url provided by discord to use when resuming a connection for this this. */ this.resumeGatewayUrl = ''
    /** The shard related event handlers. */ this.events = {}
    /** Cache for pending gateway requests which should have been send while the gateway went offline. */ this.offlineSendQueue = []
    /** Resolve internal waiting states. Mapped by SelectedEvents => ResolveFunction */ this.resolves = new Map()
    /**
     * Is the shard going offline?
     *
     * @remarks
     * This will be true if the close method has been called with either 1000 or 1001
     *
     * @private
     * This is for internal purposes only, and subject to breaking changes.
     */ this.goingOffline = false
    /** Text decoder used for compressed payloads. */ this.textDecoder = new TextDecoder()
    /** ZLib inflate buffer. */ this.inflateBuffer = null
    /** Queue for compressed payloads for Zstd Decompress */ this.decompressionPromisesQueue = []
    this.id = options.id
    this.connection = options.connection
    this.events = options.events
    this.logger = options.logger ?? logger
    this.heart = {
      acknowledged: false,
      interval: 45000,
    }
    if (options.requestIdentify) this.requestIdentify = options.requestIdentify
    if (options.makePresence) this.makePresence = options.makePresence
    this.bucket = new LeakyBucket({
      max: this.calculateSafeRequests(),
      refillAmount: this.calculateSafeRequests(),
      refillInterval: 60000,
      logger: this.logger,
    })
  }
  /** The gateway configuration which is used to connect to Discord. */ get gatewayConfig() {
    return this.connection
  }
  /** The url to connect to. Initially this is the discord gateway url, and then is switched to resume gateway url once a READY is received. */ get connectionUrl() {
    // Use || and not ?? here. ?? will cause a bug.
    return this.resumeGatewayUrl || this.gatewayConfig.url
  }
  /** Calculate the amount of requests which can safely be made per rate limit interval, before the gateway gets disconnected due to an exceeded rate limit. */ calculateSafeRequests() {
    // * 2 adds extra safety layer for discords OP 1 requests that we need to respond to
    const safeRequests = this.maxRequestsPerRateLimitTick - Math.ceil(this.rateLimitResetInterval / this.heart.interval) * 2
    return safeRequests < 0 ? 0 : safeRequests
  }
  async checkOffline(highPriority) {
    if (this.isOpen()) return
    return await new Promise((resolve) => {
      // Higher priority requests get added at the beginning of the array.
      if (highPriority) this.offlineSendQueue.unshift(resolve)
      else this.offlineSendQueue.push(resolve)
    })
  }
  /** Close the socket connection to discord if present. */ async close(code, reason) {
    this.logger.debug(`[Shard] Request for Shard #${this.id} to close the socket with code ${code}.`)
    if (this.socket?.readyState !== NodeWebSocket.OPEN) {
      this.logger.debug(`[Shard] Shard #${this.id}'s ready state is ${this.socket?.readyState}, Unable to close.`)
      return
    }
    this.goingOffline = code === GatewayCloseEventCodes.NormalClosure || code === GatewayCloseEventCodes.GoingAway
    // This has to be created before the actual call to socket.close as for example Bun calls socket.onclose immediately on the .close() call instead of waiting for the connection to end
    const promise = new Promise((resolve) => {
      this.resolveAfterClose = resolve
    })
    this.socket.close(code, reason)
    this.logger.debug(`[Shard] Waiting for Shard #${this.id} to close the socket with code ${code}.`)
    // We need to wait for the socket to be fully closed, otherwise there'll be race condition issues if we try to connect again, resulting in unexpected behavior.
    await promise
    this.logger.debug(`[Shard] Shard #${this.id} closed the socket with code ${code}.`)
    // Reset the resolveAfterClose function after it has been resolved.
    this.resolveAfterClose = undefined
  }
  /** Connect the shard with the gateway and start heartbeating. This will not identify the shard to the gateway. */ async connect() {
    // Only set the shard to `Connecting` state,
    // if the connection request does not come from an identify or resume action.
    if (![ShardState.Identifying, ShardState.Resuming].includes(this.state)) {
      this.state = ShardState.Connecting
    }
    this.logger.debug(`[Shard] Connecting Shard #${this.id} socket.`)
    this.events.connecting?.(this)
    const url = new URL(this.connectionUrl)
    url.searchParams.set('v', this.gatewayConfig.version.toString())
    url.searchParams.set('encoding', 'json')
    // Set the compress url param and initialize the decompression contexts
    if (this.gatewayConfig.transportCompression) {
      url.searchParams.set('compress', this.gatewayConfig.transportCompression)
      if (this.gatewayConfig.transportCompression === TransportCompression.zlib) {
        this.inflateBuffer = null
        this.inflate = zlib.createInflate({
          finishFlush: zlib.constants.Z_SYNC_FLUSH,
          chunkSize: 64 * 1024,
        })
        this.inflate.on('error', (e) => {
          this.logger.error('The was an error in decompressing a ZLib compressed payload', e)
        })
        this.inflate.on('data', (data) => {
          if (!(data instanceof Uint8Array)) return
          if (this.inflateBuffer) {
            const newBuffer = new Uint8Array(this.inflateBuffer.byteLength + data.byteLength)
            newBuffer.set(this.inflateBuffer)
            newBuffer.set(data, this.inflateBuffer.byteLength)
            this.inflateBuffer = newBuffer
            return
          }
          this.inflateBuffer = data
        })
      }
      if (this.gatewayConfig.transportCompression === TransportCompression.zstd) {
        if ('createZstdDecompress' in zlib) {
          this.logger.debug('[Shard] Using node:zlib zstd decompression.')
          this.inflateBuffer = null
          this.inflate = zlib.createZstdDecompress({
            chunkSize: 64 * 1024,
          })
          this.inflate.on('error', (e) => {
            this.logger.error('The was an error in decompressing a Zstd compressed payload', e)
          })
          this.inflate.on('data', (data) => {
            if (!(data instanceof Uint8Array)) return
            if (this.inflateBuffer) {
              const newBuffer = new Uint8Array(this.inflateBuffer.byteLength + data.byteLength)
              newBuffer.set(this.inflateBuffer)
              newBuffer.set(data, this.inflateBuffer.byteLength)
              this.inflateBuffer = newBuffer
              return
            }
            this.inflateBuffer = data
          })
        } else {
          const fzstd = await getFZStd().catch(() => {
            this.logger.warn('[Shard] "fzstd" is not installed. Disabled transport compression.')
            url.searchParams.delete('compress')
            return null
          })
          if (fzstd) {
            this.logger.debug('[Shard] Using fzstd zstd decompression.')
            this.zstdDecompress = new fzstd.Decompress((data) => {
              const decodedData = this.textDecoder.decode(data)
              const parsedData = JSON.parse(decodedData)
              this.decompressionPromisesQueue.shift()?.(parsedData)
            })
          }
        }
      }
    }
    if (this.gatewayConfig.compress && this.gatewayConfig.transportCompression) {
      this.logger.warn('[Shard] Payload compression has been disabled since transport compression is enabled as well.')
      this.gatewayConfig.compress = false
    }
    // We check for built-in WebSocket implementations in Bun or Deno, NodeJS v22 has an implementation too but it seems to be less optimized so for now it is better to use the ws npm package
    const shouldUseBuiltin = Reflect.has(globalThis, 'WebSocket') && (Reflect.has(globalThis, 'Bun') || Reflect.has(globalThis, 'Deno'))
    // @ts-expect-error NodeWebSocket doesn't support "dispatchEvent", and while we don't use it, it is required on the "WebSocket" type
    const socket = shouldUseBuiltin ? new WebSocket(url) : new NodeWebSocket(url)
    this.socket = socket
    // By default WebSocket will give us a Blob, this changes it so that it gives us an ArrayBuffer
    socket.binaryType = 'arraybuffer'
    socket.onerror = (event) => this.handleError(event)
    socket.onclose = (closeEvent) => this.handleClose(closeEvent)
    socket.onmessage = (messageEvent) => this.handleMessage(messageEvent)
    return await new Promise((resolve) => {
      socket.onopen = () => {
        // Only set the shard to `Unidentified` state if the connection request does not come from an identify or resume action.
        if (![ShardState.Identifying, ShardState.Resuming].includes(this.state)) {
          this.state = ShardState.Unidentified
        }
        this.logger.debug(`[Shard] Shard #${this.id} socket connected.`)
        this.events.connected?.(this)
        resolve(this)
      }
    })
  }
  /**
   * Identify the shard to the gateway. If not connected, this will also connect the shard to the gateway.
   * @param bypassRequest - Whether to bypass the requestIdentify handler and identify immediately. This should be used carefully as it can cause invalid sessions.
   */ async identify(bypassRequest = false) {
    // A new identify has been requested even though there is already a connection open.
    // Therefore we need to close the old connection and heartbeating before creating a new one.
    if (this.isOpen()) {
      this.logger.debug(`[Shard] Identifying open Shard #${this.id}, closing the connection`)
      await this.close(ShardSocketCloseCodes.ReIdentifying, 'Re-identifying closure of old connection.')
    }
    if (!bypassRequest) {
      await this.requestIdentify()
    }
    this.state = ShardState.Identifying
    this.events.identifying?.(this)
    // It is possible that the shard is in Heartbeating state but not identified,
    // so check whether there is already a gateway connection existing.
    // If not we need to create one before we identify.
    if (!this.isOpen()) {
      await this.connect()
    }
    this.logger.debug(`[Shard] Sending Identify payload for Shard #${this.id}.`)
    this.send(
      {
        op: GatewayOpcodes.Identify,
        d: {
          token: `Bot ${this.gatewayConfig.token}`,
          compress: this.gatewayConfig.compress,
          properties: this.gatewayConfig.properties,
          intents: this.gatewayConfig.intents,
          shard: [this.id, this.gatewayConfig.totalShards],
          presence: await this.makePresence(),
        },
      },
      true,
    )
    return await new Promise((resolve) => {
      this.resolves.set('READY', () => {
        resolve()
      })
      // When identifying too fast, Discord sends an invalid session payload.
      // This can safely be ignored though and the shard starts a new identify action.
      this.resolves.set('INVALID_SESSION', () => {
        this.resolves.delete('READY')
        resolve()
      })
    })
  }
  /** Check whether the connection to Discord is currently open. */ isOpen() {
    return this.socket?.readyState === NodeWebSocket.OPEN
  }
  /** Attempt to resume the previous shards session with the gateway. */ async resume() {
    this.logger.debug(`[Shard] Resuming Shard #${this.id}`)
    // It has been requested to resume the Shards session.
    // It's possible that the shard is still connected with Discord's gateway therefore we need to forcefully close it.
    if (this.isOpen()) {
      this.logger.debug(`[Shard] Resuming open Shard #${this.id}, closing the connection`)
      await this.close(ShardSocketCloseCodes.ResumeClosingOldConnection, 'Reconnecting the shard, closing old connection.')
    }
    // Shard has never identified, so we cannot resume.
    if (!this.sessionId) {
      this.logger.debug(`[Shard] Trying to resume Shard #${this.id} without the session id. Identifying the shard instead.`)
      await this.identify()
      return
    }
    this.state = ShardState.Resuming
    // Before we can resume, we need to create a new connection with Discord's gateway.
    await this.connect()
    this.logger.debug(`[Shard] Resuming Shard #${this.id} connected. Session id: ${this.sessionId} | Sequence: ${this.previousSequenceNumber}`)
    this.send(
      {
        op: GatewayOpcodes.Resume,
        d: {
          token: `Bot ${this.gatewayConfig.token}`,
          session_id: this.sessionId,
          seq: this.previousSequenceNumber ?? 0,
        },
      },
      true,
    )
    return await new Promise((resolve) => {
      this.resolves.set('RESUMED', () => resolve())
      // If it is attempted to resume with an invalid session id, Discord sends an invalid session payload
      // Not erroring here since it is easy that this happens, also it would be not catchable
      this.resolves.set('INVALID_SESSION', () => {
        this.resolves.delete('RESUMED')
        resolve()
      })
    })
  }
  /**
   * Send a message to Discord.
   * @param highPriority - Whether this message should be send asap.
   */ async send(message, highPriority = false) {
    // Before acquiring a token from the bucket, check whether the shard is currently offline or not.
    // Else bucket and token wait time just get wasted.
    await this.checkOffline(highPriority)
    await this.bucket.acquire(highPriority)
    // It's possible, that the shard went offline after a token has been acquired from the bucket.
    await this.checkOffline(highPriority)
    this.socket?.send(JSON.stringify(message))
  }
  /** Shutdown the this. Forcefully disconnect the shard from Discord. The shard may not attempt to reconnect with Discord. */ async shutdown() {
    await this.close(ShardSocketCloseCodes.Shutdown, 'Shard shutting down.')
    this.state = ShardState.Offline
  }
  /** Handle a gateway connection error */ handleError(error) {
    this.logger.error(`[Shard] There was an error connecting Shard #${this.id}.`, error)
  }
  /** Handle a gateway connection close. */ async handleClose(close) {
    this.socket = undefined
    this.stopHeartbeating()
    // Clear the zlib/zstd data
    this.inflate = undefined
    this.zstdDecompress = undefined
    this.inflateBuffer = null
    this.decompressionPromisesQueue = []
    this.logger.debug(`[Shard] Shard #${this.id} closed with code ${close.code}${close.reason ? `, and reason: ${close.reason}` : ''}.`)
    // Resolve the close promise if it exists
    this.resolveAfterClose?.(close)
    switch (close.code) {
      case ShardSocketCloseCodes.TestingFinished: {
        this.state = ShardState.Offline
        this.events.disconnected?.(this)
        return
      }
      // On these codes a manual start will be done.
      case ShardSocketCloseCodes.Shutdown:
      case ShardSocketCloseCodes.ReIdentifying:
      case ShardSocketCloseCodes.Resharded:
      case ShardSocketCloseCodes.ResumeClosingOldConnection: {
        this.state = ShardState.Disconnected
        this.events.disconnected?.(this)
        return
      }
      // When these codes are received something went really wrong.
      // On those we cannot start a reconnect attempt.
      case GatewayCloseEventCodes.AuthenticationFailed:
      case GatewayCloseEventCodes.InvalidShard:
      case GatewayCloseEventCodes.ShardingRequired:
      case GatewayCloseEventCodes.InvalidApiVersion:
      case GatewayCloseEventCodes.InvalidIntents:
      case GatewayCloseEventCodes.DisallowedIntents: {
        this.state = ShardState.Offline
        this.events.disconnected?.(this)
        throw new Error(close.reason || 'Discord gave no reason! GG! You broke Discord!')
      }
      // Gateway connection closes which require a new identify.
      case GatewayCloseEventCodes.NotAuthenticated:
      case GatewayCloseEventCodes.InvalidSeq:
      case GatewayCloseEventCodes.SessionTimedOut: {
        this.logger.debug(`[Shard] Shard #${this.id} closed requiring re-identify.`)
        this.state = ShardState.Identifying
        this.events.disconnected?.(this)
        await this.identify()
        return
      }
      // NOTE: This case must always be right above the cases that runs with default case because of how switch works when you don't break / return, more info below.
      case GatewayCloseEventCodes.NormalClosure:
      case GatewayCloseEventCodes.GoingAway: {
        // If the shard is marked as goingOffline, it stays disconnected.
        if (this.goingOffline) {
          this.state = ShardState.Disconnected
          this.events.disconnected?.(this)
          this.goingOffline = false
          return
        }
        // Otherwise, we want the shard to go through the default case where it gets resumed, as it might be an unexpected closure from Discord or Cloudflare for example, so we don't use break / return here.
      }
      // Gateway connection closes on which a resume is allowed.
      case GatewayCloseEventCodes.UnknownError:
      case GatewayCloseEventCodes.UnknownOpcode:
      case GatewayCloseEventCodes.DecodeError:
      case GatewayCloseEventCodes.RateLimited:
      case GatewayCloseEventCodes.AlreadyAuthenticated:
      default: {
        // We don't want to get into an infinite loop where we resume forever, so if we were already resuming we identify instead
        this.state = this.state === ShardState.Resuming ? ShardState.Identifying : ShardState.Resuming
        this.events.disconnected?.(this)
        if (this.state === ShardState.Resuming) {
          await this.resume()
        } else {
          await this.identify()
        }
        return
      }
    }
  }
  /** Handle an incoming gateway message. */ async handleMessage(message) {
    // The ws npm package will use a Buffer, while the global built-in will use ArrayBuffer
    const isCompressed = message.data instanceof ArrayBuffer || message.data instanceof Buffer
    const data = isCompressed ? await this.decompressPacket(message.data) : JSON.parse(message.data)
    // Check if the decompression was not successful
    if (!data) return
    await this.handleDiscordPacket(data)
  }
  /**
   * Decompress a zlib/zstd compressed packet
   *
   * @private
   */ async decompressPacket(data) {
    // A buffer is a Uint8Array under the hood. An ArrayBuffer is generic, so we need to create the Uint8Array that uses the whole ArrayBuffer
    const compressedData = data instanceof Buffer ? data : new Uint8Array(data)
    if (this.gatewayConfig.transportCompression === TransportCompression.zlib) {
      if (!this.inflate) {
        this.logger.fatal('[Shard] zlib-stream transport compression was enabled but no instance of Inflate was found.')
        return null
      }
      // Alias, used to avoid some null checks in the Promise constructor
      const inflate = this.inflate
      const writePromise = new Promise((resolve, reject) => {
        inflate.write(compressedData, 'binary', (error) => (error ? reject(error) : resolve()))
      })
      if (!endsWithMarker(compressedData, ZLIB_SYNC_FLUSH)) return null
      await writePromise
      if (!this.inflateBuffer) {
        this.logger.warn('[Shard] The ZLib inflate buffer was cleared at an unexpected moment.')
        return null
      }
      const decodedData = this.textDecoder.decode(this.inflateBuffer)
      this.inflateBuffer = null
      return JSON.parse(decodedData)
    }
    if (this.gatewayConfig.transportCompression === TransportCompression.zstd) {
      if (this.zstdDecompress) {
        this.zstdDecompress.push(compressedData)
        const decompressionPromise = new Promise((r) => this.decompressionPromisesQueue.push(r))
        return await decompressionPromise
      }
      if (this.inflate) {
        // Alias, used to avoid some null checks in the Promise constructor
        const decompress = this.inflate
        const writePromise = new Promise((resolve, reject) => {
          decompress.write(compressedData, 'binary', (error) => (error ? reject(error) : resolve()))
        })
        await writePromise
        if (!this.inflateBuffer) {
          this.logger.warn('[Shard] The ZLib inflate buffer was cleared at an unexpected moment.')
          return null
        }
        const decodedData = this.textDecoder.decode(this.inflateBuffer)
        this.inflateBuffer = null
        return JSON.parse(decodedData)
      }
      this.logger.fatal('[Shard] zstd-stream transport compression was enabled but no zstd decompressor was found.')
      return null
    }
    if (this.gatewayConfig.compress) {
      const decompressed = zlib.inflateSync(compressedData)
      const decodedData = this.textDecoder.decode(decompressed)
      return JSON.parse(decodedData)
    }
    return null
  }
  /** Handles a incoming gateway packet. */ async handleDiscordPacket(packet) {
    // Edge case start: https://github.com/discordeno/discordeno/issues/2311
    this.heart.lastAck = Date.now()
    this.heart.acknowledged = true
    // Edge case end!
    switch (packet.op) {
      case GatewayOpcodes.Heartbeat: {
        if (!this.isOpen()) return
        this.heart.lastBeat = Date.now()
        // Discord randomly sends this requiring an immediate heartbeat back.
        // Using a direct socket.send call here because heartbeat requests are reserved by us.
        this.socket?.send(
          JSON.stringify({
            op: GatewayOpcodes.Heartbeat,
            d: this.previousSequenceNumber,
          }),
        )
        this.events.heartbeat?.(this)
        break
      }
      case GatewayOpcodes.Hello: {
        const interval = packet.d.heartbeat_interval
        this.logger.debug(`[Shard] Shard #${this.id} received Hello`)
        this.startHeartbeating(interval)
        if (this.state !== ShardState.Resuming) {
          const currentQueue = [...this.bucket.queue]
          // HELLO has been send on a non resume action.
          // This means that the shard starts a new session,
          // therefore the rate limit interval has been reset too.
          this.bucket = new LeakyBucket({
            max: this.calculateSafeRequests(),
            refillInterval: 60000,
            refillAmount: this.calculateSafeRequests(),
            logger: this.logger,
          })
          // Queue should not be lost on a re-identify.
          this.bucket.queue.unshift(...currentQueue)
        }
        this.events.hello?.(this)
        break
      }
      case GatewayOpcodes.HeartbeatACK: {
        // Manually calculating the round trip time for users who need it.
        if (this.heart.lastBeat) {
          this.heart.rtt = this.heart.lastAck - this.heart.lastBeat
        }
        this.events.heartbeatAck?.(this)
        break
      }
      case GatewayOpcodes.Reconnect: {
        this.logger.debug(`[Shard] Received a Reconnect for Shard #${this.id}`)
        this.events.requestedReconnect?.(this)
        await this.resume()
        break
      }
      case GatewayOpcodes.InvalidSession: {
        const resumable = packet.d
        this.logger.debug(`[Shard] Received Invalid Session for Shard #${this.id} with resumable as ${resumable}`)
        this.events.invalidSession?.(this, resumable)
        // We need to wait for a random amount of time between 1 and 5
        // Reference: https://discord.com/developers/docs/topics/gateway#resuming
        await delay(Math.floor((Math.random() * 4 + 1) * 1000))
        this.resolves.get('INVALID_SESSION')?.(packet)
        this.resolves.delete('INVALID_SESSION')
        // When resumable is false we need to re-identify
        if (!resumable) {
          await this.identify()
          break
        }
        // The session is invalid but apparently it is resumable
        await this.resume()
        break
      }
    }
    switch (packet.t) {
      case 'RESUMED':
        this.state = ShardState.Connected
        this.events.resumed?.(this)
        this.logger.debug(`[Shard] Shard #${this.id} received RESUMED`)
        // Continue the requests which have been queued since the shard went offline.
        this.offlineSendQueue.forEach((resolve) => resolve())
        // Setting the length to 0 will delete the elements in it
        this.offlineSendQueue.length = 0
        this.resolves.get('RESUMED')?.(packet)
        this.resolves.delete('RESUMED')
        break
      case 'READY': {
        const payload = packet.d
        this.events.ready?.(this)
        // Important for future resumes.
        this.resumeGatewayUrl = payload.resume_gateway_url
        this.sessionId = payload.session_id
        this.state = ShardState.Connected
        this.logger.debug(`[Shard] Shard #${this.id} received READY`)
        // Continue the requests which have been queued since the shard went offline.
        // Important when this is a re-identify
        this.offlineSendQueue.forEach((resolve) => resolve())
        // Setting the length to 0 will delete the elements in it
        this.offlineSendQueue.length = 0
        this.resolves.get('READY')?.(packet)
        this.resolves.delete('READY')
        break
      }
    }
    // Update the sequence number if it is present
    // `s` can be either `null` or a `number`.
    // In order to prevent update misses when `s` is `0` we check against null.
    if (packet.s !== null) {
      this.previousSequenceNumber = packet.s
    }
    this.events.message?.(this, packet)
  }
  /**
   * Override in order to make the shards presence.
   * async in case devs create the presence based on eg. database values.
   * Passing the shard's id there to make it easier for the dev to use this function.
   */ async makePresence() {
    return
  }
  /**
   * This function communicates with the management process, in order to know whether its free to identify.
   * When this function resolves, this means that the shard is allowed to send an identify payload to discord.
   */ async requestIdentify() {}
  /** Start sending heartbeat payloads to Discord in the provided interval. */ startHeartbeating(interval) {
    this.logger.debug(`[Shard] Start heartbeating on Shard #${this.id}`)
    // If old heartbeast exist like after resume, clear the old ones.
    this.stopHeartbeating()
    this.heart.interval = interval
    // Only set the shard's state to `Unidentified`
    // if heartbeating has not been started due to an identify or resume action.
    if ([ShardState.Disconnected, ShardState.Offline].includes(this.state)) {
      this.logger.debug(`[Shard] Shard is disconnected or offline but the heartbeat was started #${this.id}`)
      this.state = ShardState.Unidentified
    }
    // The first heartbeat needs to be send with a random delay between `0` and `interval`
    // Using a `setTimeout(_, jitter)` here to accomplish that.
    // `Math.random()` can be `0` so we use `0.5` if this happens
    // Reference: https://discord.com/developers/docs/topics/gateway#heartbeating
    const jitter = Math.ceil(this.heart.interval * (Math.random() || 0.5))
    this.heart.timeoutId = setTimeout(() => {
      this.logger.debug(`[Shard] Beginning heartbeating process for Shard #${this.id}`)
      if (!this.isOpen()) return
      this.logger.debug(`[Shard] Heartbeating on Shard #${this.id}. Previous sequence number: ${this.previousSequenceNumber}`)
      // Using a direct socket.send call here because heartbeat requests are reserved by us.
      this.socket?.send(
        JSON.stringify({
          op: GatewayOpcodes.Heartbeat,
          d: this.previousSequenceNumber,
        }),
      )
      this.heart.lastBeat = Date.now()
      this.heart.acknowledged = false
      // After the random heartbeat jitter we can start a normal interval.
      this.heart.intervalId = setInterval(async () => {
        if (!this.isOpen()) {
          this.logger.debug(`[Shard] Shard #${this.id} is not open, but attempted heartbeat, ignoring.`)
          return
        }
        // The Shard did not receive a heartbeat ACK from Discord in time,
        // therefore we have to assume that the connection has failed or got "zombied".
        // The Shard needs to start a re-identify action accordingly.
        // Reference: https://discord.com/developers/docs/topics/gateway#heartbeating-example-gateway-heartbeat-ack
        if (!this.heart.acknowledged) {
          this.logger.debug(`[Shard] Heartbeat not acknowledged for Shard #${this.id}. Assuming zombied connection.`)
          await this.close(ShardSocketCloseCodes.ZombiedConnection, 'Zombied connection, did not receive an heartbeat ACK in time.')
          return
        }
        this.logger.debug(`[Shard] Heartbeating on Shard #${this.id}. Previous sequence number: ${this.previousSequenceNumber}`)
        // Using a direct socket.send call here because heartbeat requests are reserved by us.
        this.socket?.send(
          JSON.stringify({
            op: GatewayOpcodes.Heartbeat,
            d: this.previousSequenceNumber,
          }),
        )
        this.heart.lastBeat = Date.now()
        this.heart.acknowledged = false
        this.events.heartbeat?.(this)
      }, this.heart.interval)
    }, jitter)
  }
  /** Stop the heartbeating process with discord. */ stopHeartbeating() {
    // Clear the regular heartbeat interval.
    clearInterval(this.heart.intervalId)
    // It's possible that the Shard got closed before the first jittered heartbeat.
    // To go safe we should clear the related timeout too.
    clearTimeout(this.heart.timeoutId)
  }
}
/** Check if the buffer ends with the marker */ function endsWithMarker(buffer, marker) {
  if (buffer.length < marker.length) return false
  for (let i = 0; i < marker.length; i++) {
    if (buffer[buffer.length - marker.length + i] !== marker[i]) return false
  }
  return true
}
export default DiscordenoShard

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9TaGFyZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdub2RlOmJ1ZmZlcidcbmltcG9ydCB6bGliIGZyb20gJ25vZGU6emxpYidcbmltcG9ydCB0eXBlIHsgRGlzY29yZEdhdGV3YXlQYXlsb2FkLCBEaXNjb3JkSGVsbG8sIERpc2NvcmRSZWFkeSwgRGlzY29yZFVwZGF0ZVByZXNlbmNlIH0gZnJvbSAnQGRpc2NvcmRlbm8vdHlwZXMnXG5pbXBvcnQgeyBHYXRld2F5Q2xvc2VFdmVudENvZGVzLCBHYXRld2F5T3Bjb2RlcyB9IGZyb20gJ0BkaXNjb3JkZW5vL3R5cGVzJ1xuaW1wb3J0IHsgZGVsYXksIExlYWt5QnVja2V0LCBsb2dnZXIgfSBmcm9tICdAZGlzY29yZGVuby91dGlscydcbmltcG9ydCB0eXBlIHsgRGVjb21wcmVzcyBhcyBGWnN0ZERlY29tcHJlc3MgfSBmcm9tICdmenN0ZCdcbmltcG9ydCBOb2RlV2ViU29ja2V0IGZyb20gJ3dzJ1xuaW1wb3J0IHtcbiAgdHlwZSBTaGFyZEV2ZW50cyxcbiAgdHlwZSBTaGFyZEdhdGV3YXlDb25maWcsXG4gIHR5cGUgU2hhcmRIZWFydCxcbiAgU2hhcmRTb2NrZXRDbG9zZUNvZGVzLFxuICB0eXBlIFNoYXJkU29ja2V0UmVxdWVzdCxcbiAgU2hhcmRTdGF0ZSxcbiAgVHJhbnNwb3J0Q29tcHJlc3Npb24sXG59IGZyb20gJy4vdHlwZXMuanMnXG5cbmNvbnN0IFpMSUJfU1lOQ19GTFVTSCA9IG5ldyBVaW50OEFycmF5KFsweDAsIDB4MCwgMHhmZiwgMHhmZl0pXG5cbmxldCBmenN0ZDogdHlwZW9mIGltcG9ydCgnZnpzdGQnKVxuXG4vKiogU2luY2UgZnpzdGQgaXMgYW4gb3B0aW9uYWwgZGVwZW5kZW5jeSwgd2UgbmVlZCB0byBpbXBvcnQgaXQgbGF6aWx5LiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2V0RlpTdGQoKSB7XG4gIHJldHVybiAoZnpzdGQgPz89IGF3YWl0IGltcG9ydCgnZnpzdGQnKSlcbn1cblxuZXhwb3J0IGNsYXNzIERpc2NvcmRlbm9TaGFyZCB7XG4gIC8qKiBUaGUgaWQgb2YgdGhlIHNoYXJkLiAqL1xuICBpZDogbnVtYmVyXG4gIC8qKiBUaGUgY29ubmVjdGlvbiBjb25maWcgZGV0YWlscyB0aGF0IHRoaXMgc2hhcmQgd2lsbCB1c2VkIHRvIGNvbm5lY3QgdG8gZGlzY29yZC4gKi9cbiAgY29ubmVjdGlvbjogU2hhcmRHYXRld2F5Q29uZmlnXG4gIC8qKiBUaGlzIGNvbnRhaW5zIGFsbCB0aGUgaGVhcnRiZWF0IGluZm9ybWF0aW9uICovXG4gIGhlYXJ0OiBTaGFyZEhlYXJ0XG4gIC8qKiBUaGUgbWF4aW11bSBvZiByZXF1ZXN0cyB3aGljaCBjYW4gYmUgc2VuZCB0byBkaXNjb3JkIHBlciByYXRlIGxpbWl0IHRpY2suIFR5cGljYWxseSB0aGlzIHZhbHVlIHNob3VsZCBub3QgYmUgY2hhbmdlZC4gKi9cbiAgbWF4UmVxdWVzdHNQZXJSYXRlTGltaXRUaWNrOiBudW1iZXIgPSAxMjBcbiAgLyoqIFRoZSBwcmV2aW91cyBwYXlsb2FkIHNlcXVlbmNlIG51bWJlci4gKi9cbiAgcHJldmlvdXNTZXF1ZW5jZU51bWJlcjogbnVtYmVyIHwgbnVsbCA9IG51bGxcbiAgLyoqIEluIHdoaWNoIGludGVydmFsIChpbiBtaWxsaXNlY29uZHMpIHRoZSBnYXRld2F5IHJlc2V0cyBpdCdzIHJhdGUgbGltaXQuICovXG4gIHJhdGVMaW1pdFJlc2V0SW50ZXJ2YWw6IG51bWJlciA9IDYwMDAwXG4gIC8qKiBDdXJyZW50IHNlc3Npb24gaWQgb2YgdGhlIHNoYXJkIGlmIHByZXNlbnQuICovXG4gIHNlc3Npb25JZD86IHN0cmluZ1xuICAvKiogVGhpcyBjb250YWlucyB0aGUgV2ViU29ja2V0IGNvbm5lY3Rpb24gdG8gRGlzY29yZCwgaWYgY3VycmVudGx5IGNvbm5lY3RlZC4gKi9cbiAgc29ja2V0PzogV2ViU29ja2V0XG4gIC8qKiBDdXJyZW50IGludGVybmFsIHN0YXRlIG9mIHRoZSB0aGlzLiAqL1xuICBzdGF0ZSA9IFNoYXJkU3RhdGUuT2ZmbGluZVxuICAvKiogVGhlIHVybCBwcm92aWRlZCBieSBkaXNjb3JkIHRvIHVzZSB3aGVuIHJlc3VtaW5nIGEgY29ubmVjdGlvbiBmb3IgdGhpcyB0aGlzLiAqL1xuICByZXN1bWVHYXRld2F5VXJsOiBzdHJpbmcgPSAnJ1xuICAvKiogVGhlIHNoYXJkIHJlbGF0ZWQgZXZlbnQgaGFuZGxlcnMuICovXG4gIGV2ZW50czogU2hhcmRFdmVudHMgPSB7fVxuICAvKiogQ2FjaGUgZm9yIHBlbmRpbmcgZ2F0ZXdheSByZXF1ZXN0cyB3aGljaCBzaG91bGQgaGF2ZSBiZWVuIHNlbmQgd2hpbGUgdGhlIGdhdGV3YXkgd2VudCBvZmZsaW5lLiAqL1xuICBvZmZsaW5lU2VuZFF1ZXVlOiAoKCkgPT4gdm9pZClbXSA9IFtdXG4gIC8qKiBSZXNvbHZlIGludGVybmFsIHdhaXRpbmcgc3RhdGVzLiBNYXBwZWQgYnkgU2VsZWN0ZWRFdmVudHMgPT4gUmVzb2x2ZUZ1bmN0aW9uICovXG4gIHJlc29sdmVzID0gbmV3IE1hcDwnUkVBRFknIHwgJ1JFU1VNRUQnIHwgJ0lOVkFMSURfU0VTU0lPTicsIChwYXlsb2FkOiBEaXNjb3JkR2F0ZXdheVBheWxvYWQpID0+IHZvaWQ+KClcbiAgLyoqIFNoYXJkIGJ1Y2tldC4gT25seSBhY2Nlc3MgdGhpcyBpZiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuIEJ1Y2tldCBmb3IgaGFuZGxpbmcgc2hhcmQgcmVxdWVzdCByYXRlIGxpbWl0cy4gKi9cbiAgYnVja2V0OiBMZWFreUJ1Y2tldFxuICAvKiogTG9nZ2VyIGZvciB0aGUgYnVja2V0LiAqL1xuICBsb2dnZXI6IFBpY2s8dHlwZW9mIGxvZ2dlciwgJ2RlYnVnJyB8ICdpbmZvJyB8ICd3YXJuJyB8ICdlcnJvcicgfCAnZmF0YWwnPlxuICAvKipcbiAgICogSXMgdGhlIHNoYXJkIGdvaW5nIG9mZmxpbmU/XG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgd2lsbCBiZSB0cnVlIGlmIHRoZSBjbG9zZSBtZXRob2QgaGFzIGJlZW4gY2FsbGVkIHdpdGggZWl0aGVyIDEwMDAgb3IgMTAwMVxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBUaGlzIGlzIGZvciBpbnRlcm5hbCBwdXJwb3NlcyBvbmx5LCBhbmQgc3ViamVjdCB0byBicmVha2luZyBjaGFuZ2VzLlxuICAgKi9cbiAgZ29pbmdPZmZsaW5lID0gZmFsc2VcbiAgLyoqIFRleHQgZGVjb2RlciB1c2VkIGZvciBjb21wcmVzc2VkIHBheWxvYWRzLiAqL1xuICB0ZXh0RGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpXG4gIC8qKiB6bGliIEluZmxhdGUgb3IgenN0ZCBkZWNvbXByZXNzIChmcm9tIG5vZGU6emxpYikgaW5zdGFuY2UgZm9yIHRyYW5zcG9ydCBwYXlsb2Fkcy4gKi9cbiAgaW5mbGF0ZT86IHpsaWIuSW5mbGF0ZSB8IHpsaWIuWnN0ZERlY29tcHJlc3NcbiAgLyoqIFpMaWIgaW5mbGF0ZSBidWZmZXIuICovXG4gIGluZmxhdGVCdWZmZXI6IFVpbnQ4QXJyYXkgfCBudWxsID0gbnVsbFxuICAvKiogWlN0ZCBEZWNvbXByZXNzIGluc3RhbmNlIGZvciBaU3RkLXN0cmVhbSB0cmFuc3BvcnQgcGF5bG9hZHMuICovXG4gIHpzdGREZWNvbXByZXNzPzogRlpzdGREZWNvbXByZXNzXG4gIC8qKiBRdWV1ZSBmb3IgY29tcHJlc3NlZCBwYXlsb2FkcyBmb3IgWnN0ZCBEZWNvbXByZXNzICovXG4gIGRlY29tcHJlc3Npb25Qcm9taXNlc1F1ZXVlOiAoKGRhdGE6IERpc2NvcmRHYXRld2F5UGF5bG9hZCkgPT4gdm9pZClbXSA9IFtdXG4gIC8qKlxuICAgKiBBIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgb25jZSB0aGUgc29ja2V0IGlzIGNsb3NlZCBhbmQgaGFuZGxlQ2xvc2UoKSBoYXMgZmluaXNoZWQgdXBkYXRpbmcgaW50ZXJuYWwgc3RhdGVzLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBUaGlzIGlzIGZvciBpbnRlcm5hbCBwdXJwb3NlcyBvbmx5LCBhbmQgc3ViamVjdCB0byBicmVha2luZyBjaGFuZ2VzLlxuICAgKi9cbiAgcmVzb2x2ZUFmdGVyQ2xvc2U/OiAoY2xvc2U6IENsb3NlRXZlbnQpID0+IHZvaWRcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBTaGFyZENyZWF0ZU9wdGlvbnMpIHtcbiAgICB0aGlzLmlkID0gb3B0aW9ucy5pZFxuICAgIHRoaXMuY29ubmVjdGlvbiA9IG9wdGlvbnMuY29ubmVjdGlvblxuICAgIHRoaXMuZXZlbnRzID0gb3B0aW9ucy5ldmVudHNcbiAgICB0aGlzLmxvZ2dlciA9IG9wdGlvbnMubG9nZ2VyID8/IGxvZ2dlclxuXG4gICAgdGhpcy5oZWFydCA9IHtcbiAgICAgIGFja25vd2xlZGdlZDogZmFsc2UsXG4gICAgICBpbnRlcnZhbDogNDUwMDAsXG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMucmVxdWVzdElkZW50aWZ5KSB0aGlzLnJlcXVlc3RJZGVudGlmeSA9IG9wdGlvbnMucmVxdWVzdElkZW50aWZ5XG4gICAgaWYgKG9wdGlvbnMubWFrZVByZXNlbmNlKSB0aGlzLm1ha2VQcmVzZW5jZSA9IG9wdGlvbnMubWFrZVByZXNlbmNlXG5cbiAgICB0aGlzLmJ1Y2tldCA9IG5ldyBMZWFreUJ1Y2tldCh7XG4gICAgICBtYXg6IHRoaXMuY2FsY3VsYXRlU2FmZVJlcXVlc3RzKCksXG4gICAgICByZWZpbGxBbW91bnQ6IHRoaXMuY2FsY3VsYXRlU2FmZVJlcXVlc3RzKCksXG4gICAgICByZWZpbGxJbnRlcnZhbDogNjAwMDAsXG4gICAgICBsb2dnZXI6IHRoaXMubG9nZ2VyLFxuICAgIH0pXG4gIH1cblxuICAvKiogVGhlIGdhdGV3YXkgY29uZmlndXJhdGlvbiB3aGljaCBpcyB1c2VkIHRvIGNvbm5lY3QgdG8gRGlzY29yZC4gKi9cbiAgZ2V0IGdhdGV3YXlDb25maWcoKTogU2hhcmRHYXRld2F5Q29uZmlnIHtcbiAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uXG4gIH1cblxuICAvKiogVGhlIHVybCB0byBjb25uZWN0IHRvLiBJbml0aWFsbHkgdGhpcyBpcyB0aGUgZGlzY29yZCBnYXRld2F5IHVybCwgYW5kIHRoZW4gaXMgc3dpdGNoZWQgdG8gcmVzdW1lIGdhdGV3YXkgdXJsIG9uY2UgYSBSRUFEWSBpcyByZWNlaXZlZC4gKi9cbiAgZ2V0IGNvbm5lY3Rpb25VcmwoKTogc3RyaW5nIHtcbiAgICAvLyBVc2UgfHwgYW5kIG5vdCA/PyBoZXJlLiA/PyB3aWxsIGNhdXNlIGEgYnVnLlxuICAgIHJldHVybiB0aGlzLnJlc3VtZUdhdGV3YXlVcmwgfHwgdGhpcy5nYXRld2F5Q29uZmlnLnVybFxuICB9XG5cbiAgLyoqIENhbGN1bGF0ZSB0aGUgYW1vdW50IG9mIHJlcXVlc3RzIHdoaWNoIGNhbiBzYWZlbHkgYmUgbWFkZSBwZXIgcmF0ZSBsaW1pdCBpbnRlcnZhbCwgYmVmb3JlIHRoZSBnYXRld2F5IGdldHMgZGlzY29ubmVjdGVkIGR1ZSB0byBhbiBleGNlZWRlZCByYXRlIGxpbWl0LiAqL1xuICBjYWxjdWxhdGVTYWZlUmVxdWVzdHMoKTogbnVtYmVyIHtcbiAgICAvLyAqIDIgYWRkcyBleHRyYSBzYWZldHkgbGF5ZXIgZm9yIGRpc2NvcmRzIE9QIDEgcmVxdWVzdHMgdGhhdCB3ZSBuZWVkIHRvIHJlc3BvbmQgdG9cbiAgICBjb25zdCBzYWZlUmVxdWVzdHMgPSB0aGlzLm1heFJlcXVlc3RzUGVyUmF0ZUxpbWl0VGljayAtIE1hdGguY2VpbCh0aGlzLnJhdGVMaW1pdFJlc2V0SW50ZXJ2YWwgLyB0aGlzLmhlYXJ0LmludGVydmFsKSAqIDJcblxuICAgIHJldHVybiBzYWZlUmVxdWVzdHMgPCAwID8gMCA6IHNhZmVSZXF1ZXN0c1xuICB9XG5cbiAgYXN5bmMgY2hlY2tPZmZsaW5lKGhpZ2hQcmlvcml0eTogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmlzT3BlbigpKSByZXR1cm5cblxuICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgLy8gSGlnaGVyIHByaW9yaXR5IHJlcXVlc3RzIGdldCBhZGRlZCBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhcnJheS5cbiAgICAgIGlmIChoaWdoUHJpb3JpdHkpIHRoaXMub2ZmbGluZVNlbmRRdWV1ZS51bnNoaWZ0KHJlc29sdmUpXG4gICAgICBlbHNlIHRoaXMub2ZmbGluZVNlbmRRdWV1ZS5wdXNoKHJlc29sdmUpXG4gICAgfSlcbiAgfVxuXG4gIC8qKiBDbG9zZSB0aGUgc29ja2V0IGNvbm5lY3Rpb24gdG8gZGlzY29yZCBpZiBwcmVzZW50LiAqL1xuICBhc3luYyBjbG9zZShjb2RlOiBudW1iZXIsIHJlYXNvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5sb2dnZXIuZGVidWcoYFtTaGFyZF0gUmVxdWVzdCBmb3IgU2hhcmQgIyR7dGhpcy5pZH0gdG8gY2xvc2UgdGhlIHNvY2tldCB3aXRoIGNvZGUgJHtjb2RlfS5gKVxuXG4gICAgaWYgKHRoaXMuc29ja2V0Py5yZWFkeVN0YXRlICE9PSBOb2RlV2ViU29ja2V0Lk9QRU4pIHtcbiAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBbU2hhcmRdIFNoYXJkICMke3RoaXMuaWR9J3MgcmVhZHkgc3RhdGUgaXMgJHt0aGlzLnNvY2tldD8ucmVhZHlTdGF0ZX0sIFVuYWJsZSB0byBjbG9zZS5gKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5nb2luZ09mZmxpbmUgPSBjb2RlID09PSBHYXRld2F5Q2xvc2VFdmVudENvZGVzLk5vcm1hbENsb3N1cmUgfHwgY29kZSA9PT0gR2F0ZXdheUNsb3NlRXZlbnRDb2Rlcy5Hb2luZ0F3YXlcblxuICAgIC8vIFRoaXMgaGFzIHRvIGJlIGNyZWF0ZWQgYmVmb3JlIHRoZSBhY3R1YWwgY2FsbCB0byBzb2NrZXQuY2xvc2UgYXMgZm9yIGV4YW1wbGUgQnVuIGNhbGxzIHNvY2tldC5vbmNsb3NlIGltbWVkaWF0ZWx5IG9uIHRoZSAuY2xvc2UoKSBjYWxsIGluc3RlYWQgb2Ygd2FpdGluZyBmb3IgdGhlIGNvbm5lY3Rpb24gdG8gZW5kXG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmVBZnRlckNsb3NlID0gcmVzb2x2ZVxuICAgIH0pXG5cbiAgICB0aGlzLnNvY2tldC5jbG9zZShjb2RlLCByZWFzb24pXG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZyhgW1NoYXJkXSBXYWl0aW5nIGZvciBTaGFyZCAjJHt0aGlzLmlkfSB0byBjbG9zZSB0aGUgc29ja2V0IHdpdGggY29kZSAke2NvZGV9LmApXG5cbiAgICAvLyBXZSBuZWVkIHRvIHdhaXQgZm9yIHRoZSBzb2NrZXQgdG8gYmUgZnVsbHkgY2xvc2VkLCBvdGhlcndpc2UgdGhlcmUnbGwgYmUgcmFjZSBjb25kaXRpb24gaXNzdWVzIGlmIHdlIHRyeSB0byBjb25uZWN0IGFnYWluLCByZXN1bHRpbmcgaW4gdW5leHBlY3RlZCBiZWhhdmlvci5cbiAgICBhd2FpdCBwcm9taXNlXG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZyhgW1NoYXJkXSBTaGFyZCAjJHt0aGlzLmlkfSBjbG9zZWQgdGhlIHNvY2tldCB3aXRoIGNvZGUgJHtjb2RlfS5gKVxuXG4gICAgLy8gUmVzZXQgdGhlIHJlc29sdmVBZnRlckNsb3NlIGZ1bmN0aW9uIGFmdGVyIGl0IGhhcyBiZWVuIHJlc29sdmVkLlxuICAgIHRoaXMucmVzb2x2ZUFmdGVyQ2xvc2UgPSB1bmRlZmluZWRcbiAgfVxuXG4gIC8qKiBDb25uZWN0IHRoZSBzaGFyZCB3aXRoIHRoZSBnYXRld2F5IGFuZCBzdGFydCBoZWFydGJlYXRpbmcuIFRoaXMgd2lsbCBub3QgaWRlbnRpZnkgdGhlIHNoYXJkIHRvIHRoZSBnYXRld2F5LiAqL1xuICBhc3luYyBjb25uZWN0KCk6IFByb21pc2U8RGlzY29yZGVub1NoYXJkPiB7XG4gICAgLy8gT25seSBzZXQgdGhlIHNoYXJkIHRvIGBDb25uZWN0aW5nYCBzdGF0ZSxcbiAgICAvLyBpZiB0aGUgY29ubmVjdGlvbiByZXF1ZXN0IGRvZXMgbm90IGNvbWUgZnJvbSBhbiBpZGVudGlmeSBvciByZXN1bWUgYWN0aW9uLlxuICAgIGlmICghW1NoYXJkU3RhdGUuSWRlbnRpZnlpbmcsIFNoYXJkU3RhdGUuUmVzdW1pbmddLmluY2x1ZGVzKHRoaXMuc3RhdGUpKSB7XG4gICAgICB0aGlzLnN0YXRlID0gU2hhcmRTdGF0ZS5Db25uZWN0aW5nXG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoYFtTaGFyZF0gQ29ubmVjdGluZyBTaGFyZCAjJHt0aGlzLmlkfSBzb2NrZXQuYClcblxuICAgIHRoaXMuZXZlbnRzLmNvbm5lY3Rpbmc/Lih0aGlzKVxuXG4gICAgY29uc3QgdXJsID0gbmV3IFVSTCh0aGlzLmNvbm5lY3Rpb25VcmwpXG4gICAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ3YnLCB0aGlzLmdhdGV3YXlDb25maWcudmVyc2lvbi50b1N0cmluZygpKVxuICAgIHVybC5zZWFyY2hQYXJhbXMuc2V0KCdlbmNvZGluZycsICdqc29uJylcblxuICAgIC8vIFNldCB0aGUgY29tcHJlc3MgdXJsIHBhcmFtIGFuZCBpbml0aWFsaXplIHRoZSBkZWNvbXByZXNzaW9uIGNvbnRleHRzXG4gICAgaWYgKHRoaXMuZ2F0ZXdheUNvbmZpZy50cmFuc3BvcnRDb21wcmVzc2lvbikge1xuICAgICAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ2NvbXByZXNzJywgdGhpcy5nYXRld2F5Q29uZmlnLnRyYW5zcG9ydENvbXByZXNzaW9uKVxuXG4gICAgICBpZiAodGhpcy5nYXRld2F5Q29uZmlnLnRyYW5zcG9ydENvbXByZXNzaW9uID09PSBUcmFuc3BvcnRDb21wcmVzc2lvbi56bGliKSB7XG4gICAgICAgIHRoaXMuaW5mbGF0ZUJ1ZmZlciA9IG51bGxcbiAgICAgICAgdGhpcy5pbmZsYXRlID0gemxpYi5jcmVhdGVJbmZsYXRlKHtcbiAgICAgICAgICBmaW5pc2hGbHVzaDogemxpYi5jb25zdGFudHMuWl9TWU5DX0ZMVVNILFxuICAgICAgICAgIGNodW5rU2l6ZTogNjQgKiAxMDI0LFxuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMuaW5mbGF0ZS5vbignZXJyb3InLCAoZSkgPT4ge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdUaGUgd2FzIGFuIGVycm9yIGluIGRlY29tcHJlc3NpbmcgYSBaTGliIGNvbXByZXNzZWQgcGF5bG9hZCcsIGUpXG4gICAgICAgIH0pXG5cbiAgICAgICAgdGhpcy5pbmZsYXRlLm9uKCdkYXRhJywgKGRhdGEpID0+IHtcbiAgICAgICAgICBpZiAoIShkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSkpIHJldHVyblxuXG4gICAgICAgICAgaWYgKHRoaXMuaW5mbGF0ZUJ1ZmZlcikge1xuICAgICAgICAgICAgY29uc3QgbmV3QnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5pbmZsYXRlQnVmZmVyLmJ5dGVMZW5ndGggKyBkYXRhLmJ5dGVMZW5ndGgpXG4gICAgICAgICAgICBuZXdCdWZmZXIuc2V0KHRoaXMuaW5mbGF0ZUJ1ZmZlcilcbiAgICAgICAgICAgIG5ld0J1ZmZlci5zZXQoZGF0YSwgdGhpcy5pbmZsYXRlQnVmZmVyLmJ5dGVMZW5ndGgpXG4gICAgICAgICAgICB0aGlzLmluZmxhdGVCdWZmZXIgPSBuZXdCdWZmZXJcblxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5pbmZsYXRlQnVmZmVyID0gZGF0YVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5nYXRld2F5Q29uZmlnLnRyYW5zcG9ydENvbXByZXNzaW9uID09PSBUcmFuc3BvcnRDb21wcmVzc2lvbi56c3RkKSB7XG4gICAgICAgIGlmICgnY3JlYXRlWnN0ZERlY29tcHJlc3MnIGluIHpsaWIpIHtcbiAgICAgICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnW1NoYXJkXSBVc2luZyBub2RlOnpsaWIgenN0ZCBkZWNvbXByZXNzaW9uLicpXG5cbiAgICAgICAgICB0aGlzLmluZmxhdGVCdWZmZXIgPSBudWxsXG4gICAgICAgICAgdGhpcy5pbmZsYXRlID0gemxpYi5jcmVhdGVac3RkRGVjb21wcmVzcyh7XG4gICAgICAgICAgICBjaHVua1NpemU6IDY0ICogMTAyNCxcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgdGhpcy5pbmZsYXRlLm9uKCdlcnJvcicsIChlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcignVGhlIHdhcyBhbiBlcnJvciBpbiBkZWNvbXByZXNzaW5nIGEgWnN0ZCBjb21wcmVzc2VkIHBheWxvYWQnLCBlKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICB0aGlzLmluZmxhdGUub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgaWYgKCEoZGF0YSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpKSByZXR1cm5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaW5mbGF0ZUJ1ZmZlcikge1xuICAgICAgICAgICAgICBjb25zdCBuZXdCdWZmZXIgPSBuZXcgVWludDhBcnJheSh0aGlzLmluZmxhdGVCdWZmZXIuYnl0ZUxlbmd0aCArIGRhdGEuYnl0ZUxlbmd0aClcbiAgICAgICAgICAgICAgbmV3QnVmZmVyLnNldCh0aGlzLmluZmxhdGVCdWZmZXIpXG4gICAgICAgICAgICAgIG5ld0J1ZmZlci5zZXQoZGF0YSwgdGhpcy5pbmZsYXRlQnVmZmVyLmJ5dGVMZW5ndGgpXG4gICAgICAgICAgICAgIHRoaXMuaW5mbGF0ZUJ1ZmZlciA9IG5ld0J1ZmZlclxuXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmluZmxhdGVCdWZmZXIgPSBkYXRhXG4gICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBmenN0ZCA9IGF3YWl0IGdldEZaU3RkKCkuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2dnZXIud2FybignW1NoYXJkXSBcImZ6c3RkXCIgaXMgbm90IGluc3RhbGxlZC4gRGlzYWJsZWQgdHJhbnNwb3J0IGNvbXByZXNzaW9uLicpXG4gICAgICAgICAgICB1cmwuc2VhcmNoUGFyYW1zLmRlbGV0ZSgnY29tcHJlc3MnKVxuXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBpZiAoZnpzdGQpIHtcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdbU2hhcmRdIFVzaW5nIGZ6c3RkIHpzdGQgZGVjb21wcmVzc2lvbi4nKVxuXG4gICAgICAgICAgICB0aGlzLnpzdGREZWNvbXByZXNzID0gbmV3IGZ6c3RkLkRlY29tcHJlc3MoKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgZGVjb2RlZERhdGEgPSB0aGlzLnRleHREZWNvZGVyLmRlY29kZShkYXRhKVxuICAgICAgICAgICAgICBjb25zdCBwYXJzZWREYXRhID0gSlNPTi5wYXJzZShkZWNvZGVkRGF0YSlcbiAgICAgICAgICAgICAgdGhpcy5kZWNvbXByZXNzaW9uUHJvbWlzZXNRdWV1ZS5zaGlmdCgpPy4ocGFyc2VkRGF0YSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZ2F0ZXdheUNvbmZpZy5jb21wcmVzcyAmJiB0aGlzLmdhdGV3YXlDb25maWcudHJhbnNwb3J0Q29tcHJlc3Npb24pIHtcbiAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ1tTaGFyZF0gUGF5bG9hZCBjb21wcmVzc2lvbiBoYXMgYmVlbiBkaXNhYmxlZCBzaW5jZSB0cmFuc3BvcnQgY29tcHJlc3Npb24gaXMgZW5hYmxlZCBhcyB3ZWxsLicpXG4gICAgICB0aGlzLmdhdGV3YXlDb25maWcuY29tcHJlc3MgPSBmYWxzZVxuICAgIH1cblxuICAgIC8vIFdlIGNoZWNrIGZvciBidWlsdC1pbiBXZWJTb2NrZXQgaW1wbGVtZW50YXRpb25zIGluIEJ1biBvciBEZW5vLCBOb2RlSlMgdjIyIGhhcyBhbiBpbXBsZW1lbnRhdGlvbiB0b28gYnV0IGl0IHNlZW1zIHRvIGJlIGxlc3Mgb3B0aW1pemVkIHNvIGZvciBub3cgaXQgaXMgYmV0dGVyIHRvIHVzZSB0aGUgd3MgbnBtIHBhY2thZ2VcbiAgICBjb25zdCBzaG91bGRVc2VCdWlsdGluID0gUmVmbGVjdC5oYXMoZ2xvYmFsVGhpcywgJ1dlYlNvY2tldCcpICYmIChSZWZsZWN0LmhhcyhnbG9iYWxUaGlzLCAnQnVuJykgfHwgUmVmbGVjdC5oYXMoZ2xvYmFsVGhpcywgJ0Rlbm8nKSlcblxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgTm9kZVdlYlNvY2tldCBkb2Vzbid0IHN1cHBvcnQgXCJkaXNwYXRjaEV2ZW50XCIsIGFuZCB3aGlsZSB3ZSBkb24ndCB1c2UgaXQsIGl0IGlzIHJlcXVpcmVkIG9uIHRoZSBcIldlYlNvY2tldFwiIHR5cGVcbiAgICBjb25zdCBzb2NrZXQ6IFdlYlNvY2tldCA9IHNob3VsZFVzZUJ1aWx0aW4gPyBuZXcgV2ViU29ja2V0KHVybCkgOiBuZXcgTm9kZVdlYlNvY2tldCh1cmwpXG4gICAgdGhpcy5zb2NrZXQgPSBzb2NrZXRcblxuICAgIC8vIEJ5IGRlZmF1bHQgV2ViU29ja2V0IHdpbGwgZ2l2ZSB1cyBhIEJsb2IsIHRoaXMgY2hhbmdlcyBpdCBzbyB0aGF0IGl0IGdpdmVzIHVzIGFuIEFycmF5QnVmZmVyXG4gICAgc29ja2V0LmJpbmFyeVR5cGUgPSAnYXJyYXlidWZmZXInXG5cbiAgICBzb2NrZXQub25lcnJvciA9IChldmVudCkgPT4gdGhpcy5oYW5kbGVFcnJvcihldmVudClcbiAgICBzb2NrZXQub25jbG9zZSA9IChjbG9zZUV2ZW50KSA9PiB0aGlzLmhhbmRsZUNsb3NlKGNsb3NlRXZlbnQpXG4gICAgc29ja2V0Lm9ubWVzc2FnZSA9IChtZXNzYWdlRXZlbnQpID0+IHRoaXMuaGFuZGxlTWVzc2FnZShtZXNzYWdlRXZlbnQpXG5cbiAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHNvY2tldC5vbm9wZW4gPSAoKSA9PiB7XG4gICAgICAgIC8vIE9ubHkgc2V0IHRoZSBzaGFyZCB0byBgVW5pZGVudGlmaWVkYCBzdGF0ZSBpZiB0aGUgY29ubmVjdGlvbiByZXF1ZXN0IGRvZXMgbm90IGNvbWUgZnJvbSBhbiBpZGVudGlmeSBvciByZXN1bWUgYWN0aW9uLlxuICAgICAgICBpZiAoIVtTaGFyZFN0YXRlLklkZW50aWZ5aW5nLCBTaGFyZFN0YXRlLlJlc3VtaW5nXS5pbmNsdWRlcyh0aGlzLnN0YXRlKSkge1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTaGFyZFN0YXRlLlVuaWRlbnRpZmllZFxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoYFtTaGFyZF0gU2hhcmQgIyR7dGhpcy5pZH0gc29ja2V0IGNvbm5lY3RlZC5gKVxuXG4gICAgICAgIHRoaXMuZXZlbnRzLmNvbm5lY3RlZD8uKHRoaXMpXG5cbiAgICAgICAgcmVzb2x2ZSh0aGlzKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogSWRlbnRpZnkgdGhlIHNoYXJkIHRvIHRoZSBnYXRld2F5LiBJZiBub3QgY29ubmVjdGVkLCB0aGlzIHdpbGwgYWxzbyBjb25uZWN0IHRoZSBzaGFyZCB0byB0aGUgZ2F0ZXdheS5cbiAgICogQHBhcmFtIGJ5cGFzc1JlcXVlc3QgLSBXaGV0aGVyIHRvIGJ5cGFzcyB0aGUgcmVxdWVzdElkZW50aWZ5IGhhbmRsZXIgYW5kIGlkZW50aWZ5IGltbWVkaWF0ZWx5LiBUaGlzIHNob3VsZCBiZSB1c2VkIGNhcmVmdWxseSBhcyBpdCBjYW4gY2F1c2UgaW52YWxpZCBzZXNzaW9ucy5cbiAgICovXG4gIGFzeW5jIGlkZW50aWZ5KGJ5cGFzc1JlcXVlc3QgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIEEgbmV3IGlkZW50aWZ5IGhhcyBiZWVuIHJlcXVlc3RlZCBldmVuIHRob3VnaCB0aGVyZSBpcyBhbHJlYWR5IGEgY29ubmVjdGlvbiBvcGVuLlxuICAgIC8vIFRoZXJlZm9yZSB3ZSBuZWVkIHRvIGNsb3NlIHRoZSBvbGQgY29ubmVjdGlvbiBhbmQgaGVhcnRiZWF0aW5nIGJlZm9yZSBjcmVhdGluZyBhIG5ldyBvbmUuXG4gICAgaWYgKHRoaXMuaXNPcGVuKCkpIHtcbiAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBbU2hhcmRdIElkZW50aWZ5aW5nIG9wZW4gU2hhcmQgIyR7dGhpcy5pZH0sIGNsb3NpbmcgdGhlIGNvbm5lY3Rpb25gKVxuICAgICAgYXdhaXQgdGhpcy5jbG9zZShTaGFyZFNvY2tldENsb3NlQ29kZXMuUmVJZGVudGlmeWluZywgJ1JlLWlkZW50aWZ5aW5nIGNsb3N1cmUgb2Ygb2xkIGNvbm5lY3Rpb24uJylcbiAgICB9XG5cbiAgICBpZiAoIWJ5cGFzc1JlcXVlc3QpIHtcbiAgICAgIGF3YWl0IHRoaXMucmVxdWVzdElkZW50aWZ5KClcbiAgICB9XG5cbiAgICB0aGlzLnN0YXRlID0gU2hhcmRTdGF0ZS5JZGVudGlmeWluZ1xuICAgIHRoaXMuZXZlbnRzLmlkZW50aWZ5aW5nPy4odGhpcylcblxuICAgIC8vIEl0IGlzIHBvc3NpYmxlIHRoYXQgdGhlIHNoYXJkIGlzIGluIEhlYXJ0YmVhdGluZyBzdGF0ZSBidXQgbm90IGlkZW50aWZpZWQsXG4gICAgLy8gc28gY2hlY2sgd2hldGhlciB0aGVyZSBpcyBhbHJlYWR5IGEgZ2F0ZXdheSBjb25uZWN0aW9uIGV4aXN0aW5nLlxuICAgIC8vIElmIG5vdCB3ZSBuZWVkIHRvIGNyZWF0ZSBvbmUgYmVmb3JlIHdlIGlkZW50aWZ5LlxuICAgIGlmICghdGhpcy5pc09wZW4oKSkge1xuICAgICAgYXdhaXQgdGhpcy5jb25uZWN0KClcbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZyhgW1NoYXJkXSBTZW5kaW5nIElkZW50aWZ5IHBheWxvYWQgZm9yIFNoYXJkICMke3RoaXMuaWR9LmApXG5cbiAgICB0aGlzLnNlbmQoXG4gICAgICB7XG4gICAgICAgIG9wOiBHYXRld2F5T3Bjb2Rlcy5JZGVudGlmeSxcbiAgICAgICAgZDoge1xuICAgICAgICAgIHRva2VuOiBgQm90ICR7dGhpcy5nYXRld2F5Q29uZmlnLnRva2VufWAsXG4gICAgICAgICAgY29tcHJlc3M6IHRoaXMuZ2F0ZXdheUNvbmZpZy5jb21wcmVzcyxcbiAgICAgICAgICBwcm9wZXJ0aWVzOiB0aGlzLmdhdGV3YXlDb25maWcucHJvcGVydGllcyxcbiAgICAgICAgICBpbnRlbnRzOiB0aGlzLmdhdGV3YXlDb25maWcuaW50ZW50cyxcbiAgICAgICAgICBzaGFyZDogW3RoaXMuaWQsIHRoaXMuZ2F0ZXdheUNvbmZpZy50b3RhbFNoYXJkc10sXG4gICAgICAgICAgcHJlc2VuY2U6IGF3YWl0IHRoaXMubWFrZVByZXNlbmNlKCksXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdHJ1ZSxcbiAgICApXG5cbiAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZXMuc2V0KCdSRUFEWScsICgpID0+IHtcbiAgICAgICAgcmVzb2x2ZSgpXG4gICAgICB9KVxuICAgICAgLy8gV2hlbiBpZGVudGlmeWluZyB0b28gZmFzdCwgRGlzY29yZCBzZW5kcyBhbiBpbnZhbGlkIHNlc3Npb24gcGF5bG9hZC5cbiAgICAgIC8vIFRoaXMgY2FuIHNhZmVseSBiZSBpZ25vcmVkIHRob3VnaCBhbmQgdGhlIHNoYXJkIHN0YXJ0cyBhIG5ldyBpZGVudGlmeSBhY3Rpb24uXG4gICAgICB0aGlzLnJlc29sdmVzLnNldCgnSU5WQUxJRF9TRVNTSU9OJywgKCkgPT4ge1xuICAgICAgICB0aGlzLnJlc29sdmVzLmRlbGV0ZSgnUkVBRFknKVxuICAgICAgICByZXNvbHZlKClcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKiBDaGVjayB3aGV0aGVyIHRoZSBjb25uZWN0aW9uIHRvIERpc2NvcmQgaXMgY3VycmVudGx5IG9wZW4uICovXG4gIGlzT3BlbigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zb2NrZXQ/LnJlYWR5U3RhdGUgPT09IE5vZGVXZWJTb2NrZXQuT1BFTlxuICB9XG5cbiAgLyoqIEF0dGVtcHQgdG8gcmVzdW1lIHRoZSBwcmV2aW91cyBzaGFyZHMgc2Vzc2lvbiB3aXRoIHRoZSBnYXRld2F5LiAqL1xuICBhc3luYyByZXN1bWUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5sb2dnZXIuZGVidWcoYFtTaGFyZF0gUmVzdW1pbmcgU2hhcmQgIyR7dGhpcy5pZH1gKVxuXG4gICAgLy8gSXQgaGFzIGJlZW4gcmVxdWVzdGVkIHRvIHJlc3VtZSB0aGUgU2hhcmRzIHNlc3Npb24uXG4gICAgLy8gSXQncyBwb3NzaWJsZSB0aGF0IHRoZSBzaGFyZCBpcyBzdGlsbCBjb25uZWN0ZWQgd2l0aCBEaXNjb3JkJ3MgZ2F0ZXdheSB0aGVyZWZvcmUgd2UgbmVlZCB0byBmb3JjZWZ1bGx5IGNsb3NlIGl0LlxuICAgIGlmICh0aGlzLmlzT3BlbigpKSB7XG4gICAgICB0aGlzLmxvZ2dlci5kZWJ1ZyhgW1NoYXJkXSBSZXN1bWluZyBvcGVuIFNoYXJkICMke3RoaXMuaWR9LCBjbG9zaW5nIHRoZSBjb25uZWN0aW9uYClcbiAgICAgIGF3YWl0IHRoaXMuY2xvc2UoU2hhcmRTb2NrZXRDbG9zZUNvZGVzLlJlc3VtZUNsb3NpbmdPbGRDb25uZWN0aW9uLCAnUmVjb25uZWN0aW5nIHRoZSBzaGFyZCwgY2xvc2luZyBvbGQgY29ubmVjdGlvbi4nKVxuICAgIH1cblxuICAgIC8vIFNoYXJkIGhhcyBuZXZlciBpZGVudGlmaWVkLCBzbyB3ZSBjYW5ub3QgcmVzdW1lLlxuICAgIGlmICghdGhpcy5zZXNzaW9uSWQpIHtcbiAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBbU2hhcmRdIFRyeWluZyB0byByZXN1bWUgU2hhcmQgIyR7dGhpcy5pZH0gd2l0aG91dCB0aGUgc2Vzc2lvbiBpZC4gSWRlbnRpZnlpbmcgdGhlIHNoYXJkIGluc3RlYWQuYClcblxuICAgICAgYXdhaXQgdGhpcy5pZGVudGlmeSgpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLnN0YXRlID0gU2hhcmRTdGF0ZS5SZXN1bWluZ1xuXG4gICAgLy8gQmVmb3JlIHdlIGNhbiByZXN1bWUsIHdlIG5lZWQgdG8gY3JlYXRlIGEgbmV3IGNvbm5lY3Rpb24gd2l0aCBEaXNjb3JkJ3MgZ2F0ZXdheS5cbiAgICBhd2FpdCB0aGlzLmNvbm5lY3QoKVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoYFtTaGFyZF0gUmVzdW1pbmcgU2hhcmQgIyR7dGhpcy5pZH0gY29ubmVjdGVkLiBTZXNzaW9uIGlkOiAke3RoaXMuc2Vzc2lvbklkfSB8IFNlcXVlbmNlOiAke3RoaXMucHJldmlvdXNTZXF1ZW5jZU51bWJlcn1gKVxuXG4gICAgdGhpcy5zZW5kKFxuICAgICAge1xuICAgICAgICBvcDogR2F0ZXdheU9wY29kZXMuUmVzdW1lLFxuICAgICAgICBkOiB7XG4gICAgICAgICAgdG9rZW46IGBCb3QgJHt0aGlzLmdhdGV3YXlDb25maWcudG9rZW59YCxcbiAgICAgICAgICBzZXNzaW9uX2lkOiB0aGlzLnNlc3Npb25JZCxcbiAgICAgICAgICBzZXE6IHRoaXMucHJldmlvdXNTZXF1ZW5jZU51bWJlciA/PyAwLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHRydWUsXG4gICAgKVxuXG4gICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmVzLnNldCgnUkVTVU1FRCcsICgpID0+IHJlc29sdmUoKSlcblxuICAgICAgLy8gSWYgaXQgaXMgYXR0ZW1wdGVkIHRvIHJlc3VtZSB3aXRoIGFuIGludmFsaWQgc2Vzc2lvbiBpZCwgRGlzY29yZCBzZW5kcyBhbiBpbnZhbGlkIHNlc3Npb24gcGF5bG9hZFxuICAgICAgLy8gTm90IGVycm9yaW5nIGhlcmUgc2luY2UgaXQgaXMgZWFzeSB0aGF0IHRoaXMgaGFwcGVucywgYWxzbyBpdCB3b3VsZCBiZSBub3QgY2F0Y2hhYmxlXG4gICAgICB0aGlzLnJlc29sdmVzLnNldCgnSU5WQUxJRF9TRVNTSU9OJywgKCkgPT4ge1xuICAgICAgICB0aGlzLnJlc29sdmVzLmRlbGV0ZSgnUkVTVU1FRCcpXG4gICAgICAgIHJlc29sdmUoKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSBtZXNzYWdlIHRvIERpc2NvcmQuXG4gICAqIEBwYXJhbSBoaWdoUHJpb3JpdHkgLSBXaGV0aGVyIHRoaXMgbWVzc2FnZSBzaG91bGQgYmUgc2VuZCBhc2FwLlxuICAgKi9cbiAgYXN5bmMgc2VuZChtZXNzYWdlOiBTaGFyZFNvY2tldFJlcXVlc3QsIGhpZ2hQcmlvcml0eTogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gQmVmb3JlIGFjcXVpcmluZyBhIHRva2VuIGZyb20gdGhlIGJ1Y2tldCwgY2hlY2sgd2hldGhlciB0aGUgc2hhcmQgaXMgY3VycmVudGx5IG9mZmxpbmUgb3Igbm90LlxuICAgIC8vIEVsc2UgYnVja2V0IGFuZCB0b2tlbiB3YWl0IHRpbWUganVzdCBnZXQgd2FzdGVkLlxuICAgIGF3YWl0IHRoaXMuY2hlY2tPZmZsaW5lKGhpZ2hQcmlvcml0eSlcblxuICAgIGF3YWl0IHRoaXMuYnVja2V0LmFjcXVpcmUoaGlnaFByaW9yaXR5KVxuXG4gICAgLy8gSXQncyBwb3NzaWJsZSwgdGhhdCB0aGUgc2hhcmQgd2VudCBvZmZsaW5lIGFmdGVyIGEgdG9rZW4gaGFzIGJlZW4gYWNxdWlyZWQgZnJvbSB0aGUgYnVja2V0LlxuICAgIGF3YWl0IHRoaXMuY2hlY2tPZmZsaW5lKGhpZ2hQcmlvcml0eSlcblxuICAgIHRoaXMuc29ja2V0Py5zZW5kKEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpKVxuICB9XG5cbiAgLyoqIFNodXRkb3duIHRoZSB0aGlzLiBGb3JjZWZ1bGx5IGRpc2Nvbm5lY3QgdGhlIHNoYXJkIGZyb20gRGlzY29yZC4gVGhlIHNoYXJkIG1heSBub3QgYXR0ZW1wdCB0byByZWNvbm5lY3Qgd2l0aCBEaXNjb3JkLiAqL1xuICBhc3luYyBzaHV0ZG93bigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmNsb3NlKFNoYXJkU29ja2V0Q2xvc2VDb2Rlcy5TaHV0ZG93biwgJ1NoYXJkIHNodXR0aW5nIGRvd24uJylcbiAgICB0aGlzLnN0YXRlID0gU2hhcmRTdGF0ZS5PZmZsaW5lXG4gIH1cblxuICAvKiogSGFuZGxlIGEgZ2F0ZXdheSBjb25uZWN0aW9uIGVycm9yICovXG4gIGhhbmRsZUVycm9yKGVycm9yOiBFdmVudCk6IHZvaWQge1xuICAgIHRoaXMubG9nZ2VyLmVycm9yKGBbU2hhcmRdIFRoZXJlIHdhcyBhbiBlcnJvciBjb25uZWN0aW5nIFNoYXJkICMke3RoaXMuaWR9LmAsIGVycm9yKVxuICB9XG5cbiAgLyoqIEhhbmRsZSBhIGdhdGV3YXkgY29ubmVjdGlvbiBjbG9zZS4gKi9cbiAgYXN5bmMgaGFuZGxlQ2xvc2UoY2xvc2U6IENsb3NlRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnNvY2tldCA9IHVuZGVmaW5lZFxuICAgIHRoaXMuc3RvcEhlYXJ0YmVhdGluZygpXG5cbiAgICAvLyBDbGVhciB0aGUgemxpYi96c3RkIGRhdGFcbiAgICB0aGlzLmluZmxhdGUgPSB1bmRlZmluZWRcbiAgICB0aGlzLnpzdGREZWNvbXByZXNzID0gdW5kZWZpbmVkXG4gICAgdGhpcy5pbmZsYXRlQnVmZmVyID0gbnVsbFxuICAgIHRoaXMuZGVjb21wcmVzc2lvblByb21pc2VzUXVldWUgPSBbXVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoYFtTaGFyZF0gU2hhcmQgIyR7dGhpcy5pZH0gY2xvc2VkIHdpdGggY29kZSAke2Nsb3NlLmNvZGV9JHtjbG9zZS5yZWFzb24gPyBgLCBhbmQgcmVhc29uOiAke2Nsb3NlLnJlYXNvbn1gIDogJyd9LmApXG5cbiAgICAvLyBSZXNvbHZlIHRoZSBjbG9zZSBwcm9taXNlIGlmIGl0IGV4aXN0c1xuICAgIHRoaXMucmVzb2x2ZUFmdGVyQ2xvc2U/LihjbG9zZSlcblxuICAgIHN3aXRjaCAoY2xvc2UuY29kZSkge1xuICAgICAgY2FzZSBTaGFyZFNvY2tldENsb3NlQ29kZXMuVGVzdGluZ0ZpbmlzaGVkOiB7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBTaGFyZFN0YXRlLk9mZmxpbmVcbiAgICAgICAgdGhpcy5ldmVudHMuZGlzY29ubmVjdGVkPy4odGhpcylcblxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIC8vIE9uIHRoZXNlIGNvZGVzIGEgbWFudWFsIHN0YXJ0IHdpbGwgYmUgZG9uZS5cbiAgICAgIGNhc2UgU2hhcmRTb2NrZXRDbG9zZUNvZGVzLlNodXRkb3duOlxuICAgICAgY2FzZSBTaGFyZFNvY2tldENsb3NlQ29kZXMuUmVJZGVudGlmeWluZzpcbiAgICAgIGNhc2UgU2hhcmRTb2NrZXRDbG9zZUNvZGVzLlJlc2hhcmRlZDpcbiAgICAgIGNhc2UgU2hhcmRTb2NrZXRDbG9zZUNvZGVzLlJlc3VtZUNsb3NpbmdPbGRDb25uZWN0aW9uOiB7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBTaGFyZFN0YXRlLkRpc2Nvbm5lY3RlZFxuICAgICAgICB0aGlzLmV2ZW50cy5kaXNjb25uZWN0ZWQ/Lih0aGlzKVxuXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgLy8gV2hlbiB0aGVzZSBjb2RlcyBhcmUgcmVjZWl2ZWQgc29tZXRoaW5nIHdlbnQgcmVhbGx5IHdyb25nLlxuICAgICAgLy8gT24gdGhvc2Ugd2UgY2Fubm90IHN0YXJ0IGEgcmVjb25uZWN0IGF0dGVtcHQuXG4gICAgICBjYXNlIEdhdGV3YXlDbG9zZUV2ZW50Q29kZXMuQXV0aGVudGljYXRpb25GYWlsZWQ6XG4gICAgICBjYXNlIEdhdGV3YXlDbG9zZUV2ZW50Q29kZXMuSW52YWxpZFNoYXJkOlxuICAgICAgY2FzZSBHYXRld2F5Q2xvc2VFdmVudENvZGVzLlNoYXJkaW5nUmVxdWlyZWQ6XG4gICAgICBjYXNlIEdhdGV3YXlDbG9zZUV2ZW50Q29kZXMuSW52YWxpZEFwaVZlcnNpb246XG4gICAgICBjYXNlIEdhdGV3YXlDbG9zZUV2ZW50Q29kZXMuSW52YWxpZEludGVudHM6XG4gICAgICBjYXNlIEdhdGV3YXlDbG9zZUV2ZW50Q29kZXMuRGlzYWxsb3dlZEludGVudHM6IHtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IFNoYXJkU3RhdGUuT2ZmbGluZVxuICAgICAgICB0aGlzLmV2ZW50cy5kaXNjb25uZWN0ZWQ/Lih0aGlzKVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihjbG9zZS5yZWFzb24gfHwgJ0Rpc2NvcmQgZ2F2ZSBubyByZWFzb24hIEdHISBZb3UgYnJva2UgRGlzY29yZCEnKVxuICAgICAgfVxuICAgICAgLy8gR2F0ZXdheSBjb25uZWN0aW9uIGNsb3NlcyB3aGljaCByZXF1aXJlIGEgbmV3IGlkZW50aWZ5LlxuICAgICAgY2FzZSBHYXRld2F5Q2xvc2VFdmVudENvZGVzLk5vdEF1dGhlbnRpY2F0ZWQ6XG4gICAgICBjYXNlIEdhdGV3YXlDbG9zZUV2ZW50Q29kZXMuSW52YWxpZFNlcTpcbiAgICAgIGNhc2UgR2F0ZXdheUNsb3NlRXZlbnRDb2Rlcy5TZXNzaW9uVGltZWRPdXQ6IHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoYFtTaGFyZF0gU2hhcmQgIyR7dGhpcy5pZH0gY2xvc2VkIHJlcXVpcmluZyByZS1pZGVudGlmeS5gKVxuICAgICAgICB0aGlzLnN0YXRlID0gU2hhcmRTdGF0ZS5JZGVudGlmeWluZ1xuICAgICAgICB0aGlzLmV2ZW50cy5kaXNjb25uZWN0ZWQ/Lih0aGlzKVxuXG4gICAgICAgIGF3YWl0IHRoaXMuaWRlbnRpZnkoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIC8vIE5PVEU6IFRoaXMgY2FzZSBtdXN0IGFsd2F5cyBiZSByaWdodCBhYm92ZSB0aGUgY2FzZXMgdGhhdCBydW5zIHdpdGggZGVmYXVsdCBjYXNlIGJlY2F1c2Ugb2YgaG93IHN3aXRjaCB3b3JrcyB3aGVuIHlvdSBkb24ndCBicmVhayAvIHJldHVybiwgbW9yZSBpbmZvIGJlbG93LlxuICAgICAgY2FzZSBHYXRld2F5Q2xvc2VFdmVudENvZGVzLk5vcm1hbENsb3N1cmU6XG4gICAgICBjYXNlIEdhdGV3YXlDbG9zZUV2ZW50Q29kZXMuR29pbmdBd2F5OiB7XG4gICAgICAgIC8vIElmIHRoZSBzaGFyZCBpcyBtYXJrZWQgYXMgZ29pbmdPZmZsaW5lLCBpdCBzdGF5cyBkaXNjb25uZWN0ZWQuXG4gICAgICAgIGlmICh0aGlzLmdvaW5nT2ZmbGluZSkge1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBTaGFyZFN0YXRlLkRpc2Nvbm5lY3RlZFxuICAgICAgICAgIHRoaXMuZXZlbnRzLmRpc2Nvbm5lY3RlZD8uKHRoaXMpXG5cbiAgICAgICAgICB0aGlzLmdvaW5nT2ZmbGluZSA9IGZhbHNlXG5cbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE90aGVyd2lzZSwgd2Ugd2FudCB0aGUgc2hhcmQgdG8gZ28gdGhyb3VnaCB0aGUgZGVmYXVsdCBjYXNlIHdoZXJlIGl0IGdldHMgcmVzdW1lZCwgYXMgaXQgbWlnaHQgYmUgYW4gdW5leHBlY3RlZCBjbG9zdXJlIGZyb20gRGlzY29yZCBvciBDbG91ZGZsYXJlIGZvciBleGFtcGxlLCBzbyB3ZSBkb24ndCB1c2UgYnJlYWsgLyByZXR1cm4gaGVyZS5cbiAgICAgIH1cbiAgICAgIC8vIEdhdGV3YXkgY29ubmVjdGlvbiBjbG9zZXMgb24gd2hpY2ggYSByZXN1bWUgaXMgYWxsb3dlZC5cbiAgICAgIGNhc2UgR2F0ZXdheUNsb3NlRXZlbnRDb2Rlcy5Vbmtub3duRXJyb3I6XG4gICAgICBjYXNlIEdhdGV3YXlDbG9zZUV2ZW50Q29kZXMuVW5rbm93bk9wY29kZTpcbiAgICAgIGNhc2UgR2F0ZXdheUNsb3NlRXZlbnRDb2Rlcy5EZWNvZGVFcnJvcjpcbiAgICAgIGNhc2UgR2F0ZXdheUNsb3NlRXZlbnRDb2Rlcy5SYXRlTGltaXRlZDpcbiAgICAgIGNhc2UgR2F0ZXdheUNsb3NlRXZlbnRDb2Rlcy5BbHJlYWR5QXV0aGVudGljYXRlZDpcbiAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgLy8gV2UgZG9uJ3Qgd2FudCB0byBnZXQgaW50byBhbiBpbmZpbml0ZSBsb29wIHdoZXJlIHdlIHJlc3VtZSBmb3JldmVyLCBzbyBpZiB3ZSB3ZXJlIGFscmVhZHkgcmVzdW1pbmcgd2UgaWRlbnRpZnkgaW5zdGVhZFxuICAgICAgICB0aGlzLnN0YXRlID0gdGhpcy5zdGF0ZSA9PT0gU2hhcmRTdGF0ZS5SZXN1bWluZyA/IFNoYXJkU3RhdGUuSWRlbnRpZnlpbmcgOiBTaGFyZFN0YXRlLlJlc3VtaW5nXG4gICAgICAgIHRoaXMuZXZlbnRzLmRpc2Nvbm5lY3RlZD8uKHRoaXMpXG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT09IFNoYXJkU3RhdGUuUmVzdW1pbmcpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnJlc3VtZSgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5pZGVudGlmeSgpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogSGFuZGxlIGFuIGluY29taW5nIGdhdGV3YXkgbWVzc2FnZS4gKi9cbiAgYXN5bmMgaGFuZGxlTWVzc2FnZShtZXNzYWdlOiBNZXNzYWdlRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBUaGUgd3MgbnBtIHBhY2thZ2Ugd2lsbCB1c2UgYSBCdWZmZXIsIHdoaWxlIHRoZSBnbG9iYWwgYnVpbHQtaW4gd2lsbCB1c2UgQXJyYXlCdWZmZXJcbiAgICBjb25zdCBpc0NvbXByZXNzZWQgPSBtZXNzYWdlLmRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBtZXNzYWdlLmRhdGEgaW5zdGFuY2VvZiBCdWZmZXJcblxuICAgIGNvbnN0IGRhdGEgPSBpc0NvbXByZXNzZWQgPyBhd2FpdCB0aGlzLmRlY29tcHJlc3NQYWNrZXQobWVzc2FnZS5kYXRhKSA6IChKU09OLnBhcnNlKG1lc3NhZ2UuZGF0YSkgYXMgRGlzY29yZEdhdGV3YXlQYXlsb2FkKVxuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGRlY29tcHJlc3Npb24gd2FzIG5vdCBzdWNjZXNzZnVsXG4gICAgaWYgKCFkYXRhKSByZXR1cm5cblxuICAgIGF3YWl0IHRoaXMuaGFuZGxlRGlzY29yZFBhY2tldChkYXRhKVxuICB9XG5cbiAgLyoqXG4gICAqIERlY29tcHJlc3MgYSB6bGliL3pzdGQgY29tcHJlc3NlZCBwYWNrZXRcbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGFzeW5jIGRlY29tcHJlc3NQYWNrZXQoZGF0YTogQXJyYXlCdWZmZXIgfCBCdWZmZXIpOiBQcm9taXNlPERpc2NvcmRHYXRld2F5UGF5bG9hZCB8IG51bGw+IHtcbiAgICAvLyBBIGJ1ZmZlciBpcyBhIFVpbnQ4QXJyYXkgdW5kZXIgdGhlIGhvb2QuIEFuIEFycmF5QnVmZmVyIGlzIGdlbmVyaWMsIHNvIHdlIG5lZWQgdG8gY3JlYXRlIHRoZSBVaW50OEFycmF5IHRoYXQgdXNlcyB0aGUgd2hvbGUgQXJyYXlCdWZmZXJcbiAgICBjb25zdCBjb21wcmVzc2VkRGF0YTogVWludDhBcnJheSA9IGRhdGEgaW5zdGFuY2VvZiBCdWZmZXIgPyBkYXRhIDogbmV3IFVpbnQ4QXJyYXkoZGF0YSlcblxuICAgIGlmICh0aGlzLmdhdGV3YXlDb25maWcudHJhbnNwb3J0Q29tcHJlc3Npb24gPT09IFRyYW5zcG9ydENvbXByZXNzaW9uLnpsaWIpIHtcbiAgICAgIGlmICghdGhpcy5pbmZsYXRlKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmZhdGFsKCdbU2hhcmRdIHpsaWItc3RyZWFtIHRyYW5zcG9ydCBjb21wcmVzc2lvbiB3YXMgZW5hYmxlZCBidXQgbm8gaW5zdGFuY2Ugb2YgSW5mbGF0ZSB3YXMgZm91bmQuJylcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgIH1cblxuICAgICAgLy8gQWxpYXMsIHVzZWQgdG8gYXZvaWQgc29tZSBudWxsIGNoZWNrcyBpbiB0aGUgUHJvbWlzZSBjb25zdHJ1Y3RvclxuICAgICAgY29uc3QgaW5mbGF0ZSA9IHRoaXMuaW5mbGF0ZVxuXG4gICAgICBjb25zdCB3cml0ZVByb21pc2UgPSBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGluZmxhdGUud3JpdGUoY29tcHJlc3NlZERhdGEsICdiaW5hcnknLCAoZXJyb3IpID0+IChlcnJvciA/IHJlamVjdChlcnJvcikgOiByZXNvbHZlKCkpKVxuICAgICAgfSlcblxuICAgICAgaWYgKCFlbmRzV2l0aE1hcmtlcihjb21wcmVzc2VkRGF0YSwgWkxJQl9TWU5DX0ZMVVNIKSkgcmV0dXJuIG51bGxcblxuICAgICAgYXdhaXQgd3JpdGVQcm9taXNlXG5cbiAgICAgIGlmICghdGhpcy5pbmZsYXRlQnVmZmVyKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oJ1tTaGFyZF0gVGhlIFpMaWIgaW5mbGF0ZSBidWZmZXIgd2FzIGNsZWFyZWQgYXQgYW4gdW5leHBlY3RlZCBtb21lbnQuJylcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGVjb2RlZERhdGEgPSB0aGlzLnRleHREZWNvZGVyLmRlY29kZSh0aGlzLmluZmxhdGVCdWZmZXIpXG4gICAgICB0aGlzLmluZmxhdGVCdWZmZXIgPSBudWxsXG5cbiAgICAgIHJldHVybiBKU09OLnBhcnNlKGRlY29kZWREYXRhKVxuICAgIH1cblxuICAgIGlmICh0aGlzLmdhdGV3YXlDb25maWcudHJhbnNwb3J0Q29tcHJlc3Npb24gPT09IFRyYW5zcG9ydENvbXByZXNzaW9uLnpzdGQpIHtcbiAgICAgIGlmICh0aGlzLnpzdGREZWNvbXByZXNzKSB7XG4gICAgICAgIHRoaXMuenN0ZERlY29tcHJlc3MucHVzaChjb21wcmVzc2VkRGF0YSlcblxuICAgICAgICBjb25zdCBkZWNvbXByZXNzaW9uUHJvbWlzZSA9IG5ldyBQcm9taXNlPERpc2NvcmRHYXRld2F5UGF5bG9hZD4oKHIpID0+IHRoaXMuZGVjb21wcmVzc2lvblByb21pc2VzUXVldWUucHVzaChyKSlcbiAgICAgICAgcmV0dXJuIGF3YWl0IGRlY29tcHJlc3Npb25Qcm9taXNlXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmluZmxhdGUpIHtcbiAgICAgICAgLy8gQWxpYXMsIHVzZWQgdG8gYXZvaWQgc29tZSBudWxsIGNoZWNrcyBpbiB0aGUgUHJvbWlzZSBjb25zdHJ1Y3RvclxuICAgICAgICBjb25zdCBkZWNvbXByZXNzID0gdGhpcy5pbmZsYXRlXG5cbiAgICAgICAgY29uc3Qgd3JpdGVQcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIGRlY29tcHJlc3Mud3JpdGUoY29tcHJlc3NlZERhdGEsICdiaW5hcnknLCAoZXJyb3IpID0+IChlcnJvciA/IHJlamVjdChlcnJvcikgOiByZXNvbHZlKCkpKVxuICAgICAgICB9KVxuXG4gICAgICAgIGF3YWl0IHdyaXRlUHJvbWlzZVxuXG4gICAgICAgIGlmICghdGhpcy5pbmZsYXRlQnVmZmVyKSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIud2FybignW1NoYXJkXSBUaGUgWkxpYiBpbmZsYXRlIGJ1ZmZlciB3YXMgY2xlYXJlZCBhdCBhbiB1bmV4cGVjdGVkIG1vbWVudC4nKVxuICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkZWNvZGVkRGF0YSA9IHRoaXMudGV4dERlY29kZXIuZGVjb2RlKHRoaXMuaW5mbGF0ZUJ1ZmZlcilcbiAgICAgICAgdGhpcy5pbmZsYXRlQnVmZmVyID0gbnVsbFxuXG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKGRlY29kZWREYXRhKVxuICAgICAgfVxuXG4gICAgICB0aGlzLmxvZ2dlci5mYXRhbCgnW1NoYXJkXSB6c3RkLXN0cmVhbSB0cmFuc3BvcnQgY29tcHJlc3Npb24gd2FzIGVuYWJsZWQgYnV0IG5vIHpzdGQgZGVjb21wcmVzc29yIHdhcyBmb3VuZC4nKVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICBpZiAodGhpcy5nYXRld2F5Q29uZmlnLmNvbXByZXNzKSB7XG4gICAgICBjb25zdCBkZWNvbXByZXNzZWQgPSB6bGliLmluZmxhdGVTeW5jKGNvbXByZXNzZWREYXRhKVxuICAgICAgY29uc3QgZGVjb2RlZERhdGEgPSB0aGlzLnRleHREZWNvZGVyLmRlY29kZShkZWNvbXByZXNzZWQpXG5cbiAgICAgIHJldHVybiBKU09OLnBhcnNlKGRlY29kZWREYXRhKVxuICAgIH1cblxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvKiogSGFuZGxlcyBhIGluY29taW5nIGdhdGV3YXkgcGFja2V0LiAqL1xuICBhc3luYyBoYW5kbGVEaXNjb3JkUGFja2V0KHBhY2tldDogRGlzY29yZEdhdGV3YXlQYXlsb2FkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gRWRnZSBjYXNlIHN0YXJ0OiBodHRwczovL2dpdGh1Yi5jb20vZGlzY29yZGVuby9kaXNjb3JkZW5vL2lzc3Vlcy8yMzExXG4gICAgdGhpcy5oZWFydC5sYXN0QWNrID0gRGF0ZS5ub3coKVxuICAgIHRoaXMuaGVhcnQuYWNrbm93bGVkZ2VkID0gdHJ1ZVxuICAgIC8vIEVkZ2UgY2FzZSBlbmQhXG5cbiAgICBzd2l0Y2ggKHBhY2tldC5vcCkge1xuICAgICAgY2FzZSBHYXRld2F5T3Bjb2Rlcy5IZWFydGJlYXQ6IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzT3BlbigpKSByZXR1cm5cblxuICAgICAgICB0aGlzLmhlYXJ0Lmxhc3RCZWF0ID0gRGF0ZS5ub3coKVxuICAgICAgICAvLyBEaXNjb3JkIHJhbmRvbWx5IHNlbmRzIHRoaXMgcmVxdWlyaW5nIGFuIGltbWVkaWF0ZSBoZWFydGJlYXQgYmFjay5cbiAgICAgICAgLy8gVXNpbmcgYSBkaXJlY3Qgc29ja2V0LnNlbmQgY2FsbCBoZXJlIGJlY2F1c2UgaGVhcnRiZWF0IHJlcXVlc3RzIGFyZSByZXNlcnZlZCBieSB1cy5cbiAgICAgICAgdGhpcy5zb2NrZXQ/LnNlbmQoXG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgb3A6IEdhdGV3YXlPcGNvZGVzLkhlYXJ0YmVhdCxcbiAgICAgICAgICAgIGQ6IHRoaXMucHJldmlvdXNTZXF1ZW5jZU51bWJlcixcbiAgICAgICAgICB9KSxcbiAgICAgICAgKVxuICAgICAgICB0aGlzLmV2ZW50cy5oZWFydGJlYXQ/Lih0aGlzKVxuXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBjYXNlIEdhdGV3YXlPcGNvZGVzLkhlbGxvOiB7XG4gICAgICAgIGNvbnN0IGludGVydmFsID0gKHBhY2tldC5kIGFzIERpc2NvcmRIZWxsbykuaGVhcnRiZWF0X2ludGVydmFsXG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBbU2hhcmRdIFNoYXJkICMke3RoaXMuaWR9IHJlY2VpdmVkIEhlbGxvYClcbiAgICAgICAgdGhpcy5zdGFydEhlYXJ0YmVhdGluZyhpbnRlcnZhbClcblxuICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPT0gU2hhcmRTdGF0ZS5SZXN1bWluZykge1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRRdWV1ZSA9IFsuLi50aGlzLmJ1Y2tldC5xdWV1ZV1cbiAgICAgICAgICAvLyBIRUxMTyBoYXMgYmVlbiBzZW5kIG9uIGEgbm9uIHJlc3VtZSBhY3Rpb24uXG4gICAgICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IHRoZSBzaGFyZCBzdGFydHMgYSBuZXcgc2Vzc2lvbixcbiAgICAgICAgICAvLyB0aGVyZWZvcmUgdGhlIHJhdGUgbGltaXQgaW50ZXJ2YWwgaGFzIGJlZW4gcmVzZXQgdG9vLlxuICAgICAgICAgIHRoaXMuYnVja2V0ID0gbmV3IExlYWt5QnVja2V0KHtcbiAgICAgICAgICAgIG1heDogdGhpcy5jYWxjdWxhdGVTYWZlUmVxdWVzdHMoKSxcbiAgICAgICAgICAgIHJlZmlsbEludGVydmFsOiA2MDAwMCxcbiAgICAgICAgICAgIHJlZmlsbEFtb3VudDogdGhpcy5jYWxjdWxhdGVTYWZlUmVxdWVzdHMoKSxcbiAgICAgICAgICAgIGxvZ2dlcjogdGhpcy5sb2dnZXIsXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIC8vIFF1ZXVlIHNob3VsZCBub3QgYmUgbG9zdCBvbiBhIHJlLWlkZW50aWZ5LlxuICAgICAgICAgIHRoaXMuYnVja2V0LnF1ZXVlLnVuc2hpZnQoLi4uY3VycmVudFF1ZXVlKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ldmVudHMuaGVsbG8/Lih0aGlzKVxuXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBjYXNlIEdhdGV3YXlPcGNvZGVzLkhlYXJ0YmVhdEFDSzoge1xuICAgICAgICAvLyBNYW51YWxseSBjYWxjdWxhdGluZyB0aGUgcm91bmQgdHJpcCB0aW1lIGZvciB1c2VycyB3aG8gbmVlZCBpdC5cbiAgICAgICAgaWYgKHRoaXMuaGVhcnQubGFzdEJlYXQpIHtcbiAgICAgICAgICB0aGlzLmhlYXJ0LnJ0dCA9IHRoaXMuaGVhcnQubGFzdEFjayAtIHRoaXMuaGVhcnQubGFzdEJlYXRcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZXZlbnRzLmhlYXJ0YmVhdEFjaz8uKHRoaXMpXG5cbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICAgIGNhc2UgR2F0ZXdheU9wY29kZXMuUmVjb25uZWN0OiB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBbU2hhcmRdIFJlY2VpdmVkIGEgUmVjb25uZWN0IGZvciBTaGFyZCAjJHt0aGlzLmlkfWApXG4gICAgICAgIHRoaXMuZXZlbnRzLnJlcXVlc3RlZFJlY29ubmVjdD8uKHRoaXMpXG5cbiAgICAgICAgYXdhaXQgdGhpcy5yZXN1bWUoKVxuXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBjYXNlIEdhdGV3YXlPcGNvZGVzLkludmFsaWRTZXNzaW9uOiB7XG4gICAgICAgIGNvbnN0IHJlc3VtYWJsZSA9IHBhY2tldC5kIGFzIGJvb2xlYW5cbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoYFtTaGFyZF0gUmVjZWl2ZWQgSW52YWxpZCBTZXNzaW9uIGZvciBTaGFyZCAjJHt0aGlzLmlkfSB3aXRoIHJlc3VtYWJsZSBhcyAke3Jlc3VtYWJsZX1gKVxuXG4gICAgICAgIHRoaXMuZXZlbnRzLmludmFsaWRTZXNzaW9uPy4odGhpcywgcmVzdW1hYmxlKVxuXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gd2FpdCBmb3IgYSByYW5kb20gYW1vdW50IG9mIHRpbWUgYmV0d2VlbiAxIGFuZCA1XG4gICAgICAgIC8vIFJlZmVyZW5jZTogaHR0cHM6Ly9kaXNjb3JkLmNvbS9kZXZlbG9wZXJzL2RvY3MvdG9waWNzL2dhdGV3YXkjcmVzdW1pbmdcbiAgICAgICAgYXdhaXQgZGVsYXkoTWF0aC5mbG9vcigoTWF0aC5yYW5kb20oKSAqIDQgKyAxKSAqIDEwMDApKVxuXG4gICAgICAgIHRoaXMucmVzb2x2ZXMuZ2V0KCdJTlZBTElEX1NFU1NJT04nKT8uKHBhY2tldClcbiAgICAgICAgdGhpcy5yZXNvbHZlcy5kZWxldGUoJ0lOVkFMSURfU0VTU0lPTicpXG5cbiAgICAgICAgLy8gV2hlbiByZXN1bWFibGUgaXMgZmFsc2Ugd2UgbmVlZCB0byByZS1pZGVudGlmeVxuICAgICAgICBpZiAoIXJlc3VtYWJsZSkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuaWRlbnRpZnkoKVxuXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBzZXNzaW9uIGlzIGludmFsaWQgYnV0IGFwcGFyZW50bHkgaXQgaXMgcmVzdW1hYmxlXG4gICAgICAgIGF3YWl0IHRoaXMucmVzdW1lKClcblxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cblxuICAgIHN3aXRjaCAocGFja2V0LnQpIHtcbiAgICAgIGNhc2UgJ1JFU1VNRUQnOlxuICAgICAgICB0aGlzLnN0YXRlID0gU2hhcmRTdGF0ZS5Db25uZWN0ZWRcbiAgICAgICAgdGhpcy5ldmVudHMucmVzdW1lZD8uKHRoaXMpXG5cbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoYFtTaGFyZF0gU2hhcmQgIyR7dGhpcy5pZH0gcmVjZWl2ZWQgUkVTVU1FRGApXG5cbiAgICAgICAgLy8gQ29udGludWUgdGhlIHJlcXVlc3RzIHdoaWNoIGhhdmUgYmVlbiBxdWV1ZWQgc2luY2UgdGhlIHNoYXJkIHdlbnQgb2ZmbGluZS5cbiAgICAgICAgdGhpcy5vZmZsaW5lU2VuZFF1ZXVlLmZvckVhY2goKHJlc29sdmUpID0+IHJlc29sdmUoKSlcbiAgICAgICAgLy8gU2V0dGluZyB0aGUgbGVuZ3RoIHRvIDAgd2lsbCBkZWxldGUgdGhlIGVsZW1lbnRzIGluIGl0XG4gICAgICAgIHRoaXMub2ZmbGluZVNlbmRRdWV1ZS5sZW5ndGggPSAwXG5cbiAgICAgICAgdGhpcy5yZXNvbHZlcy5nZXQoJ1JFU1VNRUQnKT8uKHBhY2tldClcbiAgICAgICAgdGhpcy5yZXNvbHZlcy5kZWxldGUoJ1JFU1VNRUQnKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnUkVBRFknOiB7XG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSBwYWNrZXQuZCBhcyBEaXNjb3JkUmVhZHlcbiAgICAgICAgdGhpcy5ldmVudHMucmVhZHk/Lih0aGlzKVxuXG4gICAgICAgIC8vIEltcG9ydGFudCBmb3IgZnV0dXJlIHJlc3VtZXMuXG4gICAgICAgIHRoaXMucmVzdW1lR2F0ZXdheVVybCA9IHBheWxvYWQucmVzdW1lX2dhdGV3YXlfdXJsXG4gICAgICAgIHRoaXMuc2Vzc2lvbklkID0gcGF5bG9hZC5zZXNzaW9uX2lkXG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IFNoYXJkU3RhdGUuQ29ubmVjdGVkXG5cbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoYFtTaGFyZF0gU2hhcmQgIyR7dGhpcy5pZH0gcmVjZWl2ZWQgUkVBRFlgKVxuXG4gICAgICAgIC8vIENvbnRpbnVlIHRoZSByZXF1ZXN0cyB3aGljaCBoYXZlIGJlZW4gcXVldWVkIHNpbmNlIHRoZSBzaGFyZCB3ZW50IG9mZmxpbmUuXG4gICAgICAgIC8vIEltcG9ydGFudCB3aGVuIHRoaXMgaXMgYSByZS1pZGVudGlmeVxuICAgICAgICB0aGlzLm9mZmxpbmVTZW5kUXVldWUuZm9yRWFjaCgocmVzb2x2ZSkgPT4gcmVzb2x2ZSgpKVxuICAgICAgICAvLyBTZXR0aW5nIHRoZSBsZW5ndGggdG8gMCB3aWxsIGRlbGV0ZSB0aGUgZWxlbWVudHMgaW4gaXRcbiAgICAgICAgdGhpcy5vZmZsaW5lU2VuZFF1ZXVlLmxlbmd0aCA9IDBcblxuICAgICAgICB0aGlzLnJlc29sdmVzLmdldCgnUkVBRFknKT8uKHBhY2tldClcbiAgICAgICAgdGhpcy5yZXNvbHZlcy5kZWxldGUoJ1JFQURZJylcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgdGhlIHNlcXVlbmNlIG51bWJlciBpZiBpdCBpcyBwcmVzZW50XG4gICAgLy8gYHNgIGNhbiBiZSBlaXRoZXIgYG51bGxgIG9yIGEgYG51bWJlcmAuXG4gICAgLy8gSW4gb3JkZXIgdG8gcHJldmVudCB1cGRhdGUgbWlzc2VzIHdoZW4gYHNgIGlzIGAwYCB3ZSBjaGVjayBhZ2FpbnN0IG51bGwuXG4gICAgaWYgKHBhY2tldC5zICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnByZXZpb3VzU2VxdWVuY2VOdW1iZXIgPSBwYWNrZXQuc1xuICAgIH1cblxuICAgIHRoaXMuZXZlbnRzLm1lc3NhZ2U/Lih0aGlzLCBwYWNrZXQpXG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGUgaW4gb3JkZXIgdG8gbWFrZSB0aGUgc2hhcmRzIHByZXNlbmNlLlxuICAgKiBhc3luYyBpbiBjYXNlIGRldnMgY3JlYXRlIHRoZSBwcmVzZW5jZSBiYXNlZCBvbiBlZy4gZGF0YWJhc2UgdmFsdWVzLlxuICAgKiBQYXNzaW5nIHRoZSBzaGFyZCdzIGlkIHRoZXJlIHRvIG1ha2UgaXQgZWFzaWVyIGZvciB0aGUgZGV2IHRvIHVzZSB0aGlzIGZ1bmN0aW9uLlxuICAgKi9cbiAgYXN5bmMgbWFrZVByZXNlbmNlKCk6IFByb21pc2U8RGlzY29yZFVwZGF0ZVByZXNlbmNlIHwgdW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuXG4gIH1cblxuICAvKipcbiAgICogVGhpcyBmdW5jdGlvbiBjb21tdW5pY2F0ZXMgd2l0aCB0aGUgbWFuYWdlbWVudCBwcm9jZXNzLCBpbiBvcmRlciB0byBrbm93IHdoZXRoZXIgaXRzIGZyZWUgdG8gaWRlbnRpZnkuXG4gICAqIFdoZW4gdGhpcyBmdW5jdGlvbiByZXNvbHZlcywgdGhpcyBtZWFucyB0aGF0IHRoZSBzaGFyZCBpcyBhbGxvd2VkIHRvIHNlbmQgYW4gaWRlbnRpZnkgcGF5bG9hZCB0byBkaXNjb3JkLlxuICAgKi9cbiAgYXN5bmMgcmVxdWVzdElkZW50aWZ5KCk6IFByb21pc2U8dm9pZD4ge31cblxuICAvKiogU3RhcnQgc2VuZGluZyBoZWFydGJlYXQgcGF5bG9hZHMgdG8gRGlzY29yZCBpbiB0aGUgcHJvdmlkZWQgaW50ZXJ2YWwuICovXG4gIHN0YXJ0SGVhcnRiZWF0aW5nKGludGVydmFsOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZyhgW1NoYXJkXSBTdGFydCBoZWFydGJlYXRpbmcgb24gU2hhcmQgIyR7dGhpcy5pZH1gKVxuXG4gICAgLy8gSWYgb2xkIGhlYXJ0YmVhc3QgZXhpc3QgbGlrZSBhZnRlciByZXN1bWUsIGNsZWFyIHRoZSBvbGQgb25lcy5cbiAgICB0aGlzLnN0b3BIZWFydGJlYXRpbmcoKVxuXG4gICAgdGhpcy5oZWFydC5pbnRlcnZhbCA9IGludGVydmFsXG5cbiAgICAvLyBPbmx5IHNldCB0aGUgc2hhcmQncyBzdGF0ZSB0byBgVW5pZGVudGlmaWVkYFxuICAgIC8vIGlmIGhlYXJ0YmVhdGluZyBoYXMgbm90IGJlZW4gc3RhcnRlZCBkdWUgdG8gYW4gaWRlbnRpZnkgb3IgcmVzdW1lIGFjdGlvbi5cbiAgICBpZiAoW1NoYXJkU3RhdGUuRGlzY29ubmVjdGVkLCBTaGFyZFN0YXRlLk9mZmxpbmVdLmluY2x1ZGVzKHRoaXMuc3RhdGUpKSB7XG4gICAgICB0aGlzLmxvZ2dlci5kZWJ1ZyhgW1NoYXJkXSBTaGFyZCBpcyBkaXNjb25uZWN0ZWQgb3Igb2ZmbGluZSBidXQgdGhlIGhlYXJ0YmVhdCB3YXMgc3RhcnRlZCAjJHt0aGlzLmlkfWApXG4gICAgICB0aGlzLnN0YXRlID0gU2hhcmRTdGF0ZS5VbmlkZW50aWZpZWRcbiAgICB9XG5cbiAgICAvLyBUaGUgZmlyc3QgaGVhcnRiZWF0IG5lZWRzIHRvIGJlIHNlbmQgd2l0aCBhIHJhbmRvbSBkZWxheSBiZXR3ZWVuIGAwYCBhbmQgYGludGVydmFsYFxuICAgIC8vIFVzaW5nIGEgYHNldFRpbWVvdXQoXywgaml0dGVyKWAgaGVyZSB0byBhY2NvbXBsaXNoIHRoYXQuXG4gICAgLy8gYE1hdGgucmFuZG9tKClgIGNhbiBiZSBgMGAgc28gd2UgdXNlIGAwLjVgIGlmIHRoaXMgaGFwcGVuc1xuICAgIC8vIFJlZmVyZW5jZTogaHR0cHM6Ly9kaXNjb3JkLmNvbS9kZXZlbG9wZXJzL2RvY3MvdG9waWNzL2dhdGV3YXkjaGVhcnRiZWF0aW5nXG4gICAgY29uc3Qgaml0dGVyID0gTWF0aC5jZWlsKHRoaXMuaGVhcnQuaW50ZXJ2YWwgKiAoTWF0aC5yYW5kb20oKSB8fCAwLjUpKVxuXG4gICAgdGhpcy5oZWFydC50aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBbU2hhcmRdIEJlZ2lubmluZyBoZWFydGJlYXRpbmcgcHJvY2VzcyBmb3IgU2hhcmQgIyR7dGhpcy5pZH1gKVxuXG4gICAgICBpZiAoIXRoaXMuaXNPcGVuKCkpIHJldHVyblxuXG4gICAgICB0aGlzLmxvZ2dlci5kZWJ1ZyhgW1NoYXJkXSBIZWFydGJlYXRpbmcgb24gU2hhcmQgIyR7dGhpcy5pZH0uIFByZXZpb3VzIHNlcXVlbmNlIG51bWJlcjogJHt0aGlzLnByZXZpb3VzU2VxdWVuY2VOdW1iZXJ9YClcblxuICAgICAgLy8gVXNpbmcgYSBkaXJlY3Qgc29ja2V0LnNlbmQgY2FsbCBoZXJlIGJlY2F1c2UgaGVhcnRiZWF0IHJlcXVlc3RzIGFyZSByZXNlcnZlZCBieSB1cy5cbiAgICAgIHRoaXMuc29ja2V0Py5zZW5kKFxuICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgb3A6IEdhdGV3YXlPcGNvZGVzLkhlYXJ0YmVhdCxcbiAgICAgICAgICBkOiB0aGlzLnByZXZpb3VzU2VxdWVuY2VOdW1iZXIsXG4gICAgICAgIH0pLFxuICAgICAgKVxuXG4gICAgICB0aGlzLmhlYXJ0Lmxhc3RCZWF0ID0gRGF0ZS5ub3coKVxuICAgICAgdGhpcy5oZWFydC5hY2tub3dsZWRnZWQgPSBmYWxzZVxuXG4gICAgICAvLyBBZnRlciB0aGUgcmFuZG9tIGhlYXJ0YmVhdCBqaXR0ZXIgd2UgY2FuIHN0YXJ0IGEgbm9ybWFsIGludGVydmFsLlxuICAgICAgdGhpcy5oZWFydC5pbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoYXN5bmMgKCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuaXNPcGVuKCkpIHtcbiAgICAgICAgICB0aGlzLmxvZ2dlci5kZWJ1ZyhgW1NoYXJkXSBTaGFyZCAjJHt0aGlzLmlkfSBpcyBub3Qgb3BlbiwgYnV0IGF0dGVtcHRlZCBoZWFydGJlYXQsIGlnbm9yaW5nLmApXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgU2hhcmQgZGlkIG5vdCByZWNlaXZlIGEgaGVhcnRiZWF0IEFDSyBmcm9tIERpc2NvcmQgaW4gdGltZSxcbiAgICAgICAgLy8gdGhlcmVmb3JlIHdlIGhhdmUgdG8gYXNzdW1lIHRoYXQgdGhlIGNvbm5lY3Rpb24gaGFzIGZhaWxlZCBvciBnb3QgXCJ6b21iaWVkXCIuXG4gICAgICAgIC8vIFRoZSBTaGFyZCBuZWVkcyB0byBzdGFydCBhIHJlLWlkZW50aWZ5IGFjdGlvbiBhY2NvcmRpbmdseS5cbiAgICAgICAgLy8gUmVmZXJlbmNlOiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy90b3BpY3MvZ2F0ZXdheSNoZWFydGJlYXRpbmctZXhhbXBsZS1nYXRld2F5LWhlYXJ0YmVhdC1hY2tcbiAgICAgICAgaWYgKCF0aGlzLmhlYXJ0LmFja25vd2xlZGdlZCkge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBbU2hhcmRdIEhlYXJ0YmVhdCBub3QgYWNrbm93bGVkZ2VkIGZvciBTaGFyZCAjJHt0aGlzLmlkfS4gQXNzdW1pbmcgem9tYmllZCBjb25uZWN0aW9uLmApXG4gICAgICAgICAgYXdhaXQgdGhpcy5jbG9zZShTaGFyZFNvY2tldENsb3NlQ29kZXMuWm9tYmllZENvbm5lY3Rpb24sICdab21iaWVkIGNvbm5lY3Rpb24sIGRpZCBub3QgcmVjZWl2ZSBhbiBoZWFydGJlYXQgQUNLIGluIHRpbWUuJylcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBbU2hhcmRdIEhlYXJ0YmVhdGluZyBvbiBTaGFyZCAjJHt0aGlzLmlkfS4gUHJldmlvdXMgc2VxdWVuY2UgbnVtYmVyOiAke3RoaXMucHJldmlvdXNTZXF1ZW5jZU51bWJlcn1gKVxuXG4gICAgICAgIC8vIFVzaW5nIGEgZGlyZWN0IHNvY2tldC5zZW5kIGNhbGwgaGVyZSBiZWNhdXNlIGhlYXJ0YmVhdCByZXF1ZXN0cyBhcmUgcmVzZXJ2ZWQgYnkgdXMuXG4gICAgICAgIHRoaXMuc29ja2V0Py5zZW5kKFxuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIG9wOiBHYXRld2F5T3Bjb2Rlcy5IZWFydGJlYXQsXG4gICAgICAgICAgICBkOiB0aGlzLnByZXZpb3VzU2VxdWVuY2VOdW1iZXIsXG4gICAgICAgICAgfSksXG4gICAgICAgIClcblxuICAgICAgICB0aGlzLmhlYXJ0Lmxhc3RCZWF0ID0gRGF0ZS5ub3coKVxuICAgICAgICB0aGlzLmhlYXJ0LmFja25vd2xlZGdlZCA9IGZhbHNlXG5cbiAgICAgICAgdGhpcy5ldmVudHMuaGVhcnRiZWF0Py4odGhpcylcbiAgICAgIH0sIHRoaXMuaGVhcnQuaW50ZXJ2YWwpXG4gICAgfSwgaml0dGVyKVxuICB9XG5cbiAgLyoqIFN0b3AgdGhlIGhlYXJ0YmVhdGluZyBwcm9jZXNzIHdpdGggZGlzY29yZC4gKi9cbiAgc3RvcEhlYXJ0YmVhdGluZygpOiB2b2lkIHtcbiAgICAvLyBDbGVhciB0aGUgcmVndWxhciBoZWFydGJlYXQgaW50ZXJ2YWwuXG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLmhlYXJ0LmludGVydmFsSWQpXG4gICAgLy8gSXQncyBwb3NzaWJsZSB0aGF0IHRoZSBTaGFyZCBnb3QgY2xvc2VkIGJlZm9yZSB0aGUgZmlyc3Qgaml0dGVyZWQgaGVhcnRiZWF0LlxuICAgIC8vIFRvIGdvIHNhZmUgd2Ugc2hvdWxkIGNsZWFyIHRoZSByZWxhdGVkIHRpbWVvdXQgdG9vLlxuICAgIGNsZWFyVGltZW91dCh0aGlzLmhlYXJ0LnRpbWVvdXRJZClcbiAgfVxufVxuXG4vKiogQ2hlY2sgaWYgdGhlIGJ1ZmZlciBlbmRzIHdpdGggdGhlIG1hcmtlciAqL1xuZnVuY3Rpb24gZW5kc1dpdGhNYXJrZXIoYnVmZmVyOiBVaW50OEFycmF5LCBtYXJrZXI6IFVpbnQ4QXJyYXkpIHtcbiAgaWYgKGJ1ZmZlci5sZW5ndGggPCBtYXJrZXIubGVuZ3RoKSByZXR1cm4gZmFsc2VcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1hcmtlci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChidWZmZXJbYnVmZmVyLmxlbmd0aCAtIG1hcmtlci5sZW5ndGggKyBpXSAhPT0gbWFya2VyW2ldKSByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2hhcmRDcmVhdGVPcHRpb25zIHtcbiAgLyoqIFRoZSBzaGFyZCBpZCAqL1xuICBpZDogbnVtYmVyXG4gIC8qKiBUaGUgY29ubmVjdGlvbiBkZXRhaWxzICovXG4gIGNvbm5lY3Rpb246IFNoYXJkR2F0ZXdheUNvbmZpZ1xuICAvKiogVGhlIGV2ZW50IGhhbmRsZXJzIGZvciBldmVudHMgb24gdGhlIHNoYXJkLiAqL1xuICBldmVudHM6IFNoYXJkRXZlbnRzXG4gIC8qKiBUaGUgbG9nZ2VyIGZvciB0aGUgc2hhcmQgKi9cbiAgbG9nZ2VyPzogUGljazx0eXBlb2YgbG9nZ2VyLCAnZGVidWcnIHwgJ2luZm8nIHwgJ3dhcm4nIHwgJ2Vycm9yJyB8ICdmYXRhbCc+XG4gIC8qKiBUaGUgaGFuZGxlciB0byByZXF1ZXN0IGEgc3BhY2UgdG8gbWFrZSBhbiBpZGVudGlmeSByZXF1ZXN0LiAqL1xuICByZXF1ZXN0SWRlbnRpZnk/OiAoKSA9PiBQcm9taXNlPHZvaWQ+XG4gIC8qKiBGdW5jdGlvbiB0byBjcmVhdGUgdGhlIGJvdCBzdGF0dXMgdG8gc2VuZCBvbiBJZGVudGlmeSByZXF1ZXN0cyAqL1xuICBtYWtlUHJlc2VuY2U/OiAoKSA9PiBQcm9taXNlPERpc2NvcmRVcGRhdGVQcmVzZW5jZSB8IHVuZGVmaW5lZD5cbn1cblxuZXhwb3J0IGRlZmF1bHQgRGlzY29yZGVub1NoYXJkXG4iXSwibmFtZXMiOlsiQnVmZmVyIiwiemxpYiIsIkdhdGV3YXlDbG9zZUV2ZW50Q29kZXMiLCJHYXRld2F5T3Bjb2RlcyIsImRlbGF5IiwiTGVha3lCdWNrZXQiLCJsb2dnZXIiLCJOb2RlV2ViU29ja2V0IiwiU2hhcmRTb2NrZXRDbG9zZUNvZGVzIiwiU2hhcmRTdGF0ZSIsIlRyYW5zcG9ydENvbXByZXNzaW9uIiwiWkxJQl9TWU5DX0ZMVVNIIiwiVWludDhBcnJheSIsImZ6c3RkIiwiZ2V0RlpTdGQiLCJEaXNjb3JkZW5vU2hhcmQiLCJvcHRpb25zIiwibWF4UmVxdWVzdHNQZXJSYXRlTGltaXRUaWNrIiwicHJldmlvdXNTZXF1ZW5jZU51bWJlciIsInJhdGVMaW1pdFJlc2V0SW50ZXJ2YWwiLCJzdGF0ZSIsIk9mZmxpbmUiLCJyZXN1bWVHYXRld2F5VXJsIiwiZXZlbnRzIiwib2ZmbGluZVNlbmRRdWV1ZSIsInJlc29sdmVzIiwiTWFwIiwiZ29pbmdPZmZsaW5lIiwidGV4dERlY29kZXIiLCJUZXh0RGVjb2RlciIsImluZmxhdGVCdWZmZXIiLCJkZWNvbXByZXNzaW9uUHJvbWlzZXNRdWV1ZSIsImlkIiwiY29ubmVjdGlvbiIsImhlYXJ0IiwiYWNrbm93bGVkZ2VkIiwiaW50ZXJ2YWwiLCJyZXF1ZXN0SWRlbnRpZnkiLCJtYWtlUHJlc2VuY2UiLCJidWNrZXQiLCJtYXgiLCJjYWxjdWxhdGVTYWZlUmVxdWVzdHMiLCJyZWZpbGxBbW91bnQiLCJyZWZpbGxJbnRlcnZhbCIsImdhdGV3YXlDb25maWciLCJjb25uZWN0aW9uVXJsIiwidXJsIiwic2FmZVJlcXVlc3RzIiwiTWF0aCIsImNlaWwiLCJjaGVja09mZmxpbmUiLCJoaWdoUHJpb3JpdHkiLCJpc09wZW4iLCJQcm9taXNlIiwicmVzb2x2ZSIsInVuc2hpZnQiLCJwdXNoIiwiY2xvc2UiLCJjb2RlIiwicmVhc29uIiwiZGVidWciLCJzb2NrZXQiLCJyZWFkeVN0YXRlIiwiT1BFTiIsIk5vcm1hbENsb3N1cmUiLCJHb2luZ0F3YXkiLCJwcm9taXNlIiwicmVzb2x2ZUFmdGVyQ2xvc2UiLCJ1bmRlZmluZWQiLCJjb25uZWN0IiwiSWRlbnRpZnlpbmciLCJSZXN1bWluZyIsImluY2x1ZGVzIiwiQ29ubmVjdGluZyIsImNvbm5lY3RpbmciLCJVUkwiLCJzZWFyY2hQYXJhbXMiLCJzZXQiLCJ2ZXJzaW9uIiwidG9TdHJpbmciLCJ0cmFuc3BvcnRDb21wcmVzc2lvbiIsImluZmxhdGUiLCJjcmVhdGVJbmZsYXRlIiwiZmluaXNoRmx1c2giLCJjb25zdGFudHMiLCJaX1NZTkNfRkxVU0giLCJjaHVua1NpemUiLCJvbiIsImUiLCJlcnJvciIsImRhdGEiLCJuZXdCdWZmZXIiLCJieXRlTGVuZ3RoIiwienN0ZCIsImNyZWF0ZVpzdGREZWNvbXByZXNzIiwiY2F0Y2giLCJ3YXJuIiwiZGVsZXRlIiwienN0ZERlY29tcHJlc3MiLCJEZWNvbXByZXNzIiwiZGVjb2RlZERhdGEiLCJkZWNvZGUiLCJwYXJzZWREYXRhIiwiSlNPTiIsInBhcnNlIiwic2hpZnQiLCJjb21wcmVzcyIsInNob3VsZFVzZUJ1aWx0aW4iLCJSZWZsZWN0IiwiaGFzIiwiZ2xvYmFsVGhpcyIsIldlYlNvY2tldCIsImJpbmFyeVR5cGUiLCJvbmVycm9yIiwiZXZlbnQiLCJoYW5kbGVFcnJvciIsIm9uY2xvc2UiLCJjbG9zZUV2ZW50IiwiaGFuZGxlQ2xvc2UiLCJvbm1lc3NhZ2UiLCJtZXNzYWdlRXZlbnQiLCJoYW5kbGVNZXNzYWdlIiwib25vcGVuIiwiVW5pZGVudGlmaWVkIiwiY29ubmVjdGVkIiwiaWRlbnRpZnkiLCJieXBhc3NSZXF1ZXN0IiwiUmVJZGVudGlmeWluZyIsImlkZW50aWZ5aW5nIiwic2VuZCIsIm9wIiwiSWRlbnRpZnkiLCJkIiwidG9rZW4iLCJwcm9wZXJ0aWVzIiwiaW50ZW50cyIsInNoYXJkIiwidG90YWxTaGFyZHMiLCJwcmVzZW5jZSIsInJlc3VtZSIsIlJlc3VtZUNsb3NpbmdPbGRDb25uZWN0aW9uIiwic2Vzc2lvbklkIiwiUmVzdW1lIiwic2Vzc2lvbl9pZCIsInNlcSIsIm1lc3NhZ2UiLCJhY3F1aXJlIiwic3RyaW5naWZ5Iiwic2h1dGRvd24iLCJTaHV0ZG93biIsInN0b3BIZWFydGJlYXRpbmciLCJUZXN0aW5nRmluaXNoZWQiLCJkaXNjb25uZWN0ZWQiLCJSZXNoYXJkZWQiLCJEaXNjb25uZWN0ZWQiLCJBdXRoZW50aWNhdGlvbkZhaWxlZCIsIkludmFsaWRTaGFyZCIsIlNoYXJkaW5nUmVxdWlyZWQiLCJJbnZhbGlkQXBpVmVyc2lvbiIsIkludmFsaWRJbnRlbnRzIiwiRGlzYWxsb3dlZEludGVudHMiLCJFcnJvciIsIk5vdEF1dGhlbnRpY2F0ZWQiLCJJbnZhbGlkU2VxIiwiU2Vzc2lvblRpbWVkT3V0IiwiVW5rbm93bkVycm9yIiwiVW5rbm93bk9wY29kZSIsIkRlY29kZUVycm9yIiwiUmF0ZUxpbWl0ZWQiLCJBbHJlYWR5QXV0aGVudGljYXRlZCIsImlzQ29tcHJlc3NlZCIsIkFycmF5QnVmZmVyIiwiZGVjb21wcmVzc1BhY2tldCIsImhhbmRsZURpc2NvcmRQYWNrZXQiLCJjb21wcmVzc2VkRGF0YSIsImZhdGFsIiwid3JpdGVQcm9taXNlIiwicmVqZWN0Iiwid3JpdGUiLCJlbmRzV2l0aE1hcmtlciIsImRlY29tcHJlc3Npb25Qcm9taXNlIiwiciIsImRlY29tcHJlc3MiLCJkZWNvbXByZXNzZWQiLCJpbmZsYXRlU3luYyIsInBhY2tldCIsImxhc3RBY2siLCJEYXRlIiwibm93IiwiSGVhcnRiZWF0IiwibGFzdEJlYXQiLCJoZWFydGJlYXQiLCJIZWxsbyIsImhlYXJ0YmVhdF9pbnRlcnZhbCIsInN0YXJ0SGVhcnRiZWF0aW5nIiwiY3VycmVudFF1ZXVlIiwicXVldWUiLCJoZWxsbyIsIkhlYXJ0YmVhdEFDSyIsInJ0dCIsImhlYXJ0YmVhdEFjayIsIlJlY29ubmVjdCIsInJlcXVlc3RlZFJlY29ubmVjdCIsIkludmFsaWRTZXNzaW9uIiwicmVzdW1hYmxlIiwiaW52YWxpZFNlc3Npb24iLCJmbG9vciIsInJhbmRvbSIsImdldCIsInQiLCJDb25uZWN0ZWQiLCJyZXN1bWVkIiwiZm9yRWFjaCIsImxlbmd0aCIsInBheWxvYWQiLCJyZWFkeSIsInJlc3VtZV9nYXRld2F5X3VybCIsInMiLCJqaXR0ZXIiLCJ0aW1lb3V0SWQiLCJzZXRUaW1lb3V0IiwiaW50ZXJ2YWxJZCIsInNldEludGVydmFsIiwiWm9tYmllZENvbm5lY3Rpb24iLCJjbGVhckludGVydmFsIiwiY2xlYXJUaW1lb3V0IiwiYnVmZmVyIiwibWFya2VyIiwiaSJdLCJtYXBwaW5ncyI6IkFBQUEsU0FBU0EsTUFBTSxRQUFRLGNBQWE7QUFDcEMsT0FBT0MsVUFBVSxZQUFXO0FBRTVCLFNBQVNDLHNCQUFzQixFQUFFQyxjQUFjLFFBQVEsb0JBQW1CO0FBQzFFLFNBQVNDLEtBQUss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
