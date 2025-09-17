import { Buffer } from 'node:buffer'
import zlib from 'node:zlib'
import type { DiscordGatewayPayload, DiscordUpdatePresence } from '@discordeno/types'
import { LeakyBucket, logger } from '@discordeno/utils'
import type { Decompress as FZstdDecompress } from 'fzstd'
import { type ShardEvents, type ShardGatewayConfig, type ShardHeart, type ShardSocketRequest, ShardState } from './types.js'
export declare class DiscordenoShard {
  /** The id of the shard. */
  id: number
  /** The connection config details that this shard will used to connect to discord. */
  connection: ShardGatewayConfig
  /** This contains all the heartbeat information */
  heart: ShardHeart
  /** The maximum of requests which can be send to discord per rate limit tick. Typically this value should not be changed. */
  maxRequestsPerRateLimitTick: number
  /** The previous payload sequence number. */
  previousSequenceNumber: number | null
  /** In which interval (in milliseconds) the gateway resets it's rate limit. */
  rateLimitResetInterval: number
  /** Current session id of the shard if present. */
  sessionId?: string
  /** This contains the WebSocket connection to Discord, if currently connected. */
  socket?: WebSocket
  /** Current internal state of the this. */
  state: ShardState
  /** The url provided by discord to use when resuming a connection for this this. */
  resumeGatewayUrl: string
  /** The shard related event handlers. */
  events: ShardEvents
  /** Cache for pending gateway requests which should have been send while the gateway went offline. */
  offlineSendQueue: (() => void)[]
  /** Resolve internal waiting states. Mapped by SelectedEvents => ResolveFunction */
  resolves: Map<'READY' | 'RESUMED' | 'INVALID_SESSION', (payload: DiscordGatewayPayload) => void>
  /** Shard bucket. Only access this if you know what you are doing. Bucket for handling shard request rate limits. */
  bucket: LeakyBucket
  /** Logger for the bucket. */
  logger: Pick<typeof logger, 'debug' | 'info' | 'warn' | 'error' | 'fatal'>
  /**
   * Is the shard going offline?
   *
   * @remarks
   * This will be true if the close method has been called with either 1000 or 1001
   *
   * @private
   * This is for internal purposes only, and subject to breaking changes.
   */
  goingOffline: boolean
  /** Text decoder used for compressed payloads. */
  textDecoder: TextDecoder
  /** zlib Inflate or zstd decompress (from node:zlib) instance for transport payloads. */
  inflate?: zlib.Inflate | zlib.ZstdDecompress
  /** ZLib inflate buffer. */
  inflateBuffer: Uint8Array | null
  /** ZStd Decompress instance for ZStd-stream transport payloads. */
  zstdDecompress?: FZstdDecompress
  /** Queue for compressed payloads for Zstd Decompress */
  decompressionPromisesQueue: ((data: DiscordGatewayPayload) => void)[]
  /**
   * A function that will be called once the socket is closed and handleClose() has finished updating internal states.
   *
   * @private
   * This is for internal purposes only, and subject to breaking changes.
   */
  resolveAfterClose?: (close: CloseEvent) => void
  constructor(options: ShardCreateOptions)
  /** The gateway configuration which is used to connect to Discord. */
  get gatewayConfig(): ShardGatewayConfig
  /** The url to connect to. Initially this is the discord gateway url, and then is switched to resume gateway url once a READY is received. */
  get connectionUrl(): string
  /** Calculate the amount of requests which can safely be made per rate limit interval, before the gateway gets disconnected due to an exceeded rate limit. */
  calculateSafeRequests(): number
  checkOffline(highPriority: boolean): Promise<void>
  /** Close the socket connection to discord if present. */
  close(code: number, reason: string): Promise<void>
  /** Connect the shard with the gateway and start heartbeating. This will not identify the shard to the gateway. */
  connect(): Promise<DiscordenoShard>
  /**
   * Identify the shard to the gateway. If not connected, this will also connect the shard to the gateway.
   * @param bypassRequest - Whether to bypass the requestIdentify handler and identify immediately. This should be used carefully as it can cause invalid sessions.
   */
  identify(bypassRequest?: boolean): Promise<void>
  /** Check whether the connection to Discord is currently open. */
  isOpen(): boolean
  /** Attempt to resume the previous shards session with the gateway. */
  resume(): Promise<void>
  /**
   * Send a message to Discord.
   * @param highPriority - Whether this message should be send asap.
   */
  send(message: ShardSocketRequest, highPriority?: boolean): Promise<void>
  /** Shutdown the this. Forcefully disconnect the shard from Discord. The shard may not attempt to reconnect with Discord. */
  shutdown(): Promise<void>
  /** Handle a gateway connection error */
  handleError(error: Event): void
  /** Handle a gateway connection close. */
  handleClose(close: CloseEvent): Promise<void>
  /** Handle an incoming gateway message. */
  handleMessage(message: MessageEvent): Promise<void>
  /**
   * Decompress a zlib/zstd compressed packet
   *
   * @private
   */
  decompressPacket(data: ArrayBuffer | Buffer): Promise<DiscordGatewayPayload | null>
  /** Handles a incoming gateway packet. */
  handleDiscordPacket(packet: DiscordGatewayPayload): Promise<void>
  /**
   * Override in order to make the shards presence.
   * async in case devs create the presence based on eg. database values.
   * Passing the shard's id there to make it easier for the dev to use this function.
   */
  makePresence(): Promise<DiscordUpdatePresence | undefined>
  /**
   * This function communicates with the management process, in order to know whether its free to identify.
   * When this function resolves, this means that the shard is allowed to send an identify payload to discord.
   */
  requestIdentify(): Promise<void>
  /** Start sending heartbeat payloads to Discord in the provided interval. */
  startHeartbeating(interval: number): void
  /** Stop the heartbeating process with discord. */
  stopHeartbeating(): void
}
export interface ShardCreateOptions {
  /** The shard id */
  id: number
  /** The connection details */
  connection: ShardGatewayConfig
  /** The event handlers for events on the shard. */
  events: ShardEvents
  /** The logger for the shard */
  logger?: Pick<typeof logger, 'debug' | 'info' | 'warn' | 'error' | 'fatal'>
  /** The handler to request a space to make an identify request. */
  requestIdentify?: () => Promise<void>
  /** Function to create the bot status to send on Identify requests */
  makePresence?: () => Promise<DiscordUpdatePresence | undefined>
}
export default DiscordenoShard
//# sourceMappingURL=Shard.d.ts.map
