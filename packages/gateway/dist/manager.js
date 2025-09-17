import { randomBytes } from 'node:crypto'
import { GatewayIntents, GatewayOpcodes } from '@discordeno/types'
import { Collection, jsonSafeReplacer, LeakyBucket, logger } from '@discordeno/utils'
import Shard from './Shard.js'
import { ShardSocketCloseCodes } from './types.js'
export function createGatewayManager(options) {
  const connectionOptions = options.connection ?? {
    url: 'wss://gateway.discord.gg',
    shards: 1,
    sessionStartLimit: {
      maxConcurrency: 1,
      remaining: 1000,
      total: 1000,
      resetAfter: 1000 * 60 * 60 * 24,
    },
  }
  const gateway = {
    events: options.events ?? {},
    compress: options.compress ?? false,
    transportCompression: options.transportCompression ?? null,
    intents: options.intents ?? 0,
    properties: {
      os: options.properties?.os ?? process.platform,
      browser: options.properties?.browser ?? 'Discordeno',
      device: options.properties?.device ?? 'Discordeno',
    },
    token: options.token,
    url: options.url ?? connectionOptions.url ?? 'wss://gateway.discord.gg',
    version: options.version ?? 10,
    connection: connectionOptions,
    totalShards: options.totalShards ?? connectionOptions.shards ?? 1,
    lastShardId: options.lastShardId ?? (options.totalShards ? options.totalShards - 1 : connectionOptions ? connectionOptions.shards - 1 : 0),
    firstShardId: options.firstShardId ?? 0,
    totalWorkers: options.totalWorkers ?? 4,
    shardsPerWorker: options.shardsPerWorker ?? 25,
    spawnShardDelay: options.spawnShardDelay ?? 5300,
    spreadShardsInRoundRobin: options.spreadShardsInRoundRobin ?? false,
    shards: new Map(),
    buckets: new Map(),
    cache: {
      requestMembers: {
        enabled: options.cache?.requestMembers?.enabled ?? false,
        pending: new Collection(),
      },
    },
    logger: options.logger ?? logger,
    makePresence: options.makePresence ?? (() => Promise.resolve(undefined)),
    resharding: {
      enabled: options.resharding?.enabled ?? true,
      shardsFullPercentage: options.resharding?.shardsFullPercentage ?? 80,
      checkInterval: options.resharding?.checkInterval ?? 28800000,
      shards: new Map(),
      getSessionInfo: options.resharding?.getSessionInfo,
      updateGuildsShardId: options.resharding?.updateGuildsShardId,
      async checkIfReshardingIsNeeded() {
        gateway.logger.debug('[Resharding] Checking if resharding is needed.')
        if (!gateway.resharding.enabled) {
          gateway.logger.debug('[Resharding] Resharding is disabled.')
          return {
            needed: false,
          }
        }
        if (!gateway.resharding.getSessionInfo) {
          throw new Error("[Resharding] Resharding is enabled but no 'resharding.getSessionInfo()' is not provided.")
        }
        gateway.logger.debug('[Resharding] Resharding is enabled.')
        const sessionInfo = await gateway.resharding.getSessionInfo()
        gateway.logger.debug(`[Resharding] Session info retrieved: ${JSON.stringify(sessionInfo)}`)
        // Don't have enough identify limits to try resharding
        if (sessionInfo.sessionStartLimit.remaining < sessionInfo.shards) {
          gateway.logger.debug('[Resharding] Not enough session start limits left to reshard.')
          return {
            needed: false,
            info: sessionInfo,
          }
        }
        gateway.logger.debug('[Resharding] Able to reshard, checking whether necessary now.')
        // 2500 is the max amount of guilds a single shard can handle
        // 1000 is the amount of guilds discord uses to determine how many shards to recommend.
        // This algo helps check if your bot has grown enough to reshard.
        // While this is imprecise as discord changes the recommended number of shard every 1000 guilds it is good enough
        // The alternative is to store the guild count for each shard and require the Guilds intent for `GUILD_CREATE` and `GUILD_DELETE` events
        const percentage = (sessionInfo.shards / ((gateway.totalShards * 2500) / 1000)) * 100
        // Less than necessary% being used so do nothing
        if (percentage < gateway.resharding.shardsFullPercentage) {
          gateway.logger.debug('[Resharding] Resharding not needed.')
          return {
            needed: false,
            info: sessionInfo,
          }
        }
        gateway.logger.info('[Resharding] Resharding is needed.')
        return {
          needed: true,
          info: sessionInfo,
        }
      },
      async reshard(info) {
        gateway.logger.info(`[Resharding] Starting the reshard process. Previous total shards: ${gateway.totalShards}`)
        // Set values on gateway
        gateway.totalShards = info.shards
        // Handles preparing mid sized bots for LBS
        gateway.totalShards = gateway.calculateTotalShards()
        // Set first shard id if provided in info
        if (typeof info.firstShardId === 'number') gateway.firstShardId = info.firstShardId
        // Set last shard id if provided in info
        if (typeof info.lastShardId === 'number') gateway.lastShardId = info.lastShardId
        else gateway.lastShardId = gateway.totalShards - 1
        gateway.logger.info(`[Resharding] Starting the reshard process. New total shards: ${gateway.totalShards}`)
        // Resetting buckets
        gateway.buckets.clear()
        // Refilling buckets with new values
        gateway.prepareBuckets()
        // Call all the buckets and tell their workers & shards to identify
        const promises = Array.from(gateway.buckets.entries()).map(async ([bucketId, bucket]) => {
          for (const worker of bucket.workers) {
            for (const shardId of worker.queue) {
              await gateway.resharding.tellWorkerToPrepare(worker.id, shardId, bucketId)
            }
          }
        })
        await Promise.all(promises)
        gateway.logger.info(`[Resharding] All shards are now online.`)
        await gateway.resharding.onReshardingSwitch()
      },
      async tellWorkerToPrepare(workerId, shardId, bucketId) {
        gateway.logger.debug(`[Resharding] Telling worker to prepare. Worker: ${workerId} | Shard: ${shardId} | Bucket: ${bucketId}.`)
        const shard = new Shard({
          id: shardId,
          connection: {
            compress: gateway.compress,
            transportCompression: gateway.transportCompression ?? null,
            intents: gateway.intents,
            properties: gateway.properties,
            token: gateway.token,
            totalShards: gateway.totalShards,
            url: gateway.url,
            version: gateway.version,
          },
          events: {
            async message(_shard, payload) {
              // Ignore all events until we swich from the old shards to the new ones.
              if (payload.t === 'READY') {
                await gateway.resharding.updateGuildsShardId?.(
                  payload.d.guilds.map((g) => g.id),
                  shardId,
                )
              }
            },
          },
          logger: gateway.logger,
          requestIdentify: async () => await gateway.requestIdentify(shardId),
          makePresence: gateway.makePresence,
        })
        gateway.resharding.shards.set(shardId, shard)
        await shard.identify()
        gateway.logger.debug(`[Resharding] Shard #${shardId} identified.`)
      },
      async onReshardingSwitch() {
        gateway.logger.debug(`[Resharding] Making the switch from the old shards to the new ones.`)
        // Move the events from the old shards to the new ones
        for (const shard of gateway.resharding.shards.values()) {
          shard.events = options.events ?? {}
        }
        // Old shards stop processing events
        for (const shard of gateway.shards.values()) {
          const oldHandler = shard.events.message
          // Change with spread operator to not affect new shards, as changing anything on shard.events will directly change options.events, which changes new shards' events
          shard.events = {
            ...shard.events,
            message: async function (_, message) {
              // Member checks need to continue but others can stop
              if (message.t === 'GUILD_MEMBERS_CHUNK') {
                oldHandler?.(shard, message)
              }
            },
          }
        }
        gateway.logger.info(`[Resharding] Shutting down old shards.`)
        await gateway.shutdown(ShardSocketCloseCodes.Resharded, 'Resharded!', false)
        gateway.logger.info(`[Resharding] Completed.`)
        gateway.shards = new Map(gateway.resharding.shards)
        gateway.resharding.shards.clear()
      },
    },
    calculateTotalShards() {
      // Bots under 100k servers do not have access to LBS.
      if (gateway.totalShards < 100) {
        gateway.logger.debug(`[Gateway] Calculating total shards: ${gateway.totalShards}`)
        return gateway.totalShards
      }
      gateway.logger.debug(`[Gateway] Calculating total shards`, gateway.totalShards, gateway.connection.sessionStartLimit.maxConcurrency)
      // Calculate a multiple of `maxConcurrency` which can be used to connect to the gateway.
      return (
        Math.ceil(
          gateway.totalShards / // If `maxConcurrency` is 1, we can safely use 16 to get `totalShards` to be in a multiple of 16 so that we can prepare bots with 100k servers for LBS.
            (gateway.connection.sessionStartLimit.maxConcurrency === 1 ? 16 : gateway.connection.sessionStartLimit.maxConcurrency),
        ) * (gateway.connection.sessionStartLimit.maxConcurrency === 1 ? 16 : gateway.connection.sessionStartLimit.maxConcurrency)
      )
    },
    calculateWorkerId(shardId) {
      const workerId = options.spreadShardsInRoundRobin
        ? shardId % gateway.totalWorkers
        : Math.min(Math.floor(shardId / gateway.shardsPerWorker), gateway.totalWorkers - 1)
      gateway.logger.debug(
        `[Gateway] Calculating workerId: Shard: ${shardId} -> Worker: ${workerId} -> Per Worker: ${gateway.shardsPerWorker} -> Total: ${gateway.totalWorkers}`,
      )
      return workerId
    },
    prepareBuckets() {
      for (let i = 0; i < gateway.connection.sessionStartLimit.maxConcurrency; ++i) {
        gateway.logger.debug(`[Gateway] Preparing buckets for concurrency: ${i}`)
        gateway.buckets.set(i, {
          workers: [],
          leakyBucket: new LeakyBucket({
            max: 1,
            refillAmount: 1,
            refillInterval: gateway.spawnShardDelay,
            logger: this.logger,
          }),
        })
      }
      // Organize all shards into their own buckets
      for (let shardId = gateway.firstShardId; shardId <= gateway.lastShardId; ++shardId) {
        gateway.logger.debug(`[Gateway] Preparing buckets for shard: ${shardId}`)
        if (shardId >= gateway.totalShards) {
          throw new Error(`Shard (id: ${shardId}) is bigger or equal to the used amount of used shards which is ${gateway.totalShards}`)
        }
        const bucketId = shardId % gateway.connection.sessionStartLimit.maxConcurrency
        const bucket = gateway.buckets.get(bucketId)
        if (!bucket) {
          throw new Error(
            `Shard (id: ${shardId}) got assigned to an illegal bucket id: ${bucketId}, expected a bucket id between 0 and ${gateway.connection.sessionStartLimit.maxConcurrency - 1}`,
          )
        }
        // Get the worker id for this shard
        const workerId = gateway.calculateWorkerId(shardId)
        const worker = bucket.workers.find((w) => w.id === workerId)
        // If this worker already exists, add the shard to its queue
        if (worker) {
          worker.queue.push(shardId)
        } else {
          bucket.workers.push({
            id: workerId,
            queue: [shardId],
          })
        }
      }
    },
    async spawnShards() {
      // Prepare the concurrency buckets
      gateway.prepareBuckets()
      const promises = [...gateway.buckets.entries()].map(async ([bucketId, bucket]) => {
        for (const worker of bucket.workers) {
          for (const shardId of worker.queue) {
            await gateway.tellWorkerToIdentify(worker.id, shardId, bucketId)
          }
        }
      })
      // We use Promise.all so we can start all buckets at the same time
      await Promise.all(promises)
      // Check and reshard automatically if auto resharding is enabled.
      if (gateway.resharding.enabled && gateway.resharding.checkInterval !== -1) {
        // It is better to ensure there is always only one
        clearInterval(gateway.resharding.checkIntervalId)
        if (!gateway.resharding.getSessionInfo) {
          gateway.resharding.enabled = false
          gateway.logger.warn("[Resharding] Resharding is enabled but 'resharding.getSessionInfo()' was not provided. Disabling resharding.")
          return
        }
        gateway.resharding.checkIntervalId = setInterval(async () => {
          const reshardingInfo = await gateway.resharding.checkIfReshardingIsNeeded()
          if (reshardingInfo.needed && reshardingInfo.info) await gateway.resharding.reshard(reshardingInfo.info)
        }, gateway.resharding.checkInterval)
      }
    },
    async shutdown(code, reason, clearReshardingInterval = true) {
      if (clearReshardingInterval) clearInterval(gateway.resharding.checkIntervalId)
      await Promise.all(Array.from(gateway.shards.values()).map((shard) => shard.close(code, reason)))
    },
    async sendPayload(shardId, payload) {
      const shard = gateway.shards.get(shardId)
      if (!shard) {
        throw new Error(`Shard (id: ${shardId} not found`)
      }
      await shard.send(payload)
    },
    async tellWorkerToIdentify(workerId, shardId, bucketId) {
      gateway.logger.debug(`[Gateway] Tell worker #${workerId} to identify shard #${shardId} from bucket ${bucketId}`)
      await gateway.identify(shardId)
    },
    async identify(shardId) {
      let shard = this.shards.get(shardId)
      gateway.logger.debug(`[Gateway] Identifying ${shard ? 'existing' : 'new'} shard (${shardId})`)
      if (!shard) {
        shard = new Shard({
          id: shardId,
          connection: {
            compress: this.compress,
            transportCompression: gateway.transportCompression,
            intents: this.intents,
            properties: this.properties,
            token: this.token,
            totalShards: this.totalShards,
            url: this.url,
            version: this.version,
          },
          events: options.events ?? {},
          logger: this.logger,
          requestIdentify: async () => await gateway.requestIdentify(shardId),
          makePresence: gateway.makePresence,
        })
        this.shards.set(shardId, shard)
      }
      await shard.identify()
    },
    async requestIdentify(shardId) {
      gateway.logger.debug(`[Gateway] Shard #${shardId} requested an identify.`)
      const bucket = gateway.buckets.get(shardId % gateway.connection.sessionStartLimit.maxConcurrency)
      if (!bucket) {
        throw new Error("Can't request identify for a shard that is not assigned to any bucket.")
      }
      await bucket.leakyBucket.acquire()
      gateway.logger.debug(`[Gateway] Approved identify request for Shard #${shardId}.`)
    },
    async kill(shardId) {
      const shard = this.shards.get(shardId)
      if (!shard) {
        gateway.logger.debug(`[Gateway] Shard #${shardId} was requested to be killed, but the shard could not be found.`)
        return
      }
      gateway.logger.debug(`[Gateway] Killing Shard #${shardId}`)
      this.shards.delete(shardId)
      await shard.shutdown()
    },
    // Helpers methods below this
    calculateShardId(guildId, totalShards) {
      // If none is provided, use the total shards number from gateway object.
      if (!totalShards) totalShards = gateway.totalShards
      // If it is only 1 shard, it will always be shard id 0
      if (totalShards === 1) {
        gateway.logger.debug(`[Gateway] calculateShardId (1 shard)`)
        return 0
      }
      gateway.logger.debug(`[Gateway] calculateShardId (guildId: ${guildId}, totalShards: ${totalShards})`)
      return Number((BigInt(guildId) >> 22n) % BigInt(totalShards))
    },
    async joinVoiceChannel(guildId, channelId, options) {
      const shardId = gateway.calculateShardId(guildId)
      gateway.logger.debug(`[Gateway] joinVoiceChannel guildId: ${guildId} channelId: ${channelId}`)
      await gateway.sendPayload(shardId, {
        op: GatewayOpcodes.VoiceStateUpdate,
        d: {
          guild_id: guildId.toString(),
          channel_id: channelId.toString(),
          self_mute: options?.selfMute ?? false,
          self_deaf: options?.selfDeaf ?? true,
        },
      })
    },
    async editBotStatus(data) {
      gateway.logger.debug(`[Gateway] editBotStatus data: ${JSON.stringify(data, jsonSafeReplacer)}`)
      await Promise.all(
        [...gateway.shards.values()].map(async (shard) => {
          gateway.editShardStatus(shard.id, data)
        }),
      )
    },
    async editShardStatus(shardId, data) {
      gateway.logger.debug(`[Gateway] editShardStatus shardId: ${shardId} -> data: ${JSON.stringify(data)}`)
      await gateway.sendPayload(shardId, {
        op: GatewayOpcodes.PresenceUpdate,
        d: {
          since: null,
          afk: false,
          activities: data.activities,
          status: data.status,
        },
      })
    },
    async requestMembers(guildId, options) {
      const shardId = gateway.calculateShardId(guildId)
      if (gateway.intents && (!options?.limit || options.limit > 1) && !(gateway.intents & GatewayIntents.GuildMembers))
        throw new Error('Cannot fetch more then 1 member without the GUILD_MEMBERS intent')
      gateway.logger.debug(`[Gateway] requestMembers guildId: ${guildId} -> data: ${JSON.stringify(options)}`)
      if (options?.userIds?.length) {
        gateway.logger.debug(`[Gateway] requestMembers guildId: ${guildId} -> setting user limit based on userIds length: ${options.userIds.length}`)
        options.limit = options.userIds.length
      }
      if (!options?.nonce) {
        let nonce = ''
        while (!nonce || gateway.cache.requestMembers.pending.has(nonce)) {
          nonce = randomBytes(16).toString('hex')
        }
        options ??= {
          limit: 0,
        }
        options.nonce = nonce
      }
      const members = !gateway.cache.requestMembers.enabled
        ? []
        : new Promise((resolve, reject) => {
            // Should never happen.
            if (!gateway.cache.requestMembers.enabled || !options?.nonce) {
              reject(new Error("Can't request the members without the nonce or with the feature disabled."))
              return
            }
            gateway.cache.requestMembers.pending.set(options.nonce, {
              nonce: options.nonce,
              resolve,
              members: [],
            })
          })
      await gateway.sendPayload(shardId, {
        op: GatewayOpcodes.RequestGuildMembers,
        d: {
          guild_id: guildId.toString(),
          // If a query is provided use it, OR if a limit is NOT provided use ""
          query: options?.query ?? (options?.limit ? undefined : ''),
          limit: options?.limit ?? 0,
          presences: options?.presences ?? false,
          user_ids: options?.userIds?.map((id) => id.toString()),
          nonce: options?.nonce,
        },
      })
      return await members
    },
    async leaveVoiceChannel(guildId) {
      const shardId = gateway.calculateShardId(guildId)
      gateway.logger.debug(`[Gateway] leaveVoiceChannel guildId: ${guildId} Shard ${shardId}`)
      await gateway.sendPayload(shardId, {
        op: GatewayOpcodes.VoiceStateUpdate,
        d: {
          guild_id: guildId.toString(),
          channel_id: null,
          self_mute: false,
          self_deaf: false,
        },
      })
    },
    async requestSoundboardSounds(guildIds) {
      /**
       * Discord will send the events for the guilds that are "under the shard" that sends the opcode.
       * For this reason we need to group the ids with the shard the calculateShardId method gives
       */ const map = new Map()
      for (const guildId of guildIds) {
        const shardId = gateway.calculateShardId(guildId)
        const ids = map.get(shardId) ?? []
        map.set(shardId, ids)
        ids.push(guildId)
      }
      await Promise.all(
        [...map.entries()].map(([shardId, ids]) =>
          gateway.sendPayload(shardId, {
            op: GatewayOpcodes.RequestSoundboardSounds,
            d: {
              guild_ids: ids,
            },
          }),
        ),
      )
    },
  }
  return gateway
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYW5hZ2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJhbmRvbUJ5dGVzIH0gZnJvbSAnbm9kZTpjcnlwdG8nXG5pbXBvcnQge1xuICB0eXBlIEF0TGVhc3RPbmUsXG4gIHR5cGUgQmlnU3RyaW5nLFxuICB0eXBlIENhbWVsaXplLFxuICB0eXBlIERpc2NvcmRHZXRHYXRld2F5Qm90LFxuICB0eXBlIERpc2NvcmRNZW1iZXJXaXRoVXNlcixcbiAgdHlwZSBEaXNjb3JkUmVhZHksXG4gIHR5cGUgRGlzY29yZFVwZGF0ZVByZXNlbmNlLFxuICBHYXRld2F5SW50ZW50cyxcbiAgR2F0ZXdheU9wY29kZXMsXG4gIHR5cGUgUmVxdWVzdEd1aWxkTWVtYmVycyxcbn0gZnJvbSAnQGRpc2NvcmRlbm8vdHlwZXMnXG5pbXBvcnQgeyBDb2xsZWN0aW9uLCBqc29uU2FmZVJlcGxhY2VyLCBMZWFreUJ1Y2tldCwgbG9nZ2VyIH0gZnJvbSAnQGRpc2NvcmRlbm8vdXRpbHMnXG5pbXBvcnQgU2hhcmQgZnJvbSAnLi9TaGFyZC5qcydcbmltcG9ydCB7IHR5cGUgU2hhcmRFdmVudHMsIFNoYXJkU29ja2V0Q2xvc2VDb2RlcywgdHlwZSBTaGFyZFNvY2tldFJlcXVlc3QsIHR5cGUgVHJhbnNwb3J0Q29tcHJlc3Npb24sIHR5cGUgVXBkYXRlVm9pY2VTdGF0ZSB9IGZyb20gJy4vdHlwZXMuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVHYXRld2F5TWFuYWdlcihvcHRpb25zOiBDcmVhdGVHYXRld2F5TWFuYWdlck9wdGlvbnMpOiBHYXRld2F5TWFuYWdlciB7XG4gIGNvbnN0IGNvbm5lY3Rpb25PcHRpb25zID0gb3B0aW9ucy5jb25uZWN0aW9uID8/IHtcbiAgICB1cmw6ICd3c3M6Ly9nYXRld2F5LmRpc2NvcmQuZ2cnLFxuICAgIHNoYXJkczogMSxcbiAgICBzZXNzaW9uU3RhcnRMaW1pdDoge1xuICAgICAgbWF4Q29uY3VycmVuY3k6IDEsXG4gICAgICByZW1haW5pbmc6IDEwMDAsXG4gICAgICB0b3RhbDogMTAwMCxcbiAgICAgIHJlc2V0QWZ0ZXI6IDEwMDAgKiA2MCAqIDYwICogMjQsXG4gICAgfSxcbiAgfVxuXG4gIGNvbnN0IGdhdGV3YXk6IEdhdGV3YXlNYW5hZ2VyID0ge1xuICAgIGV2ZW50czogb3B0aW9ucy5ldmVudHMgPz8ge30sXG4gICAgY29tcHJlc3M6IG9wdGlvbnMuY29tcHJlc3MgPz8gZmFsc2UsXG4gICAgdHJhbnNwb3J0Q29tcHJlc3Npb246IG9wdGlvbnMudHJhbnNwb3J0Q29tcHJlc3Npb24gPz8gbnVsbCxcbiAgICBpbnRlbnRzOiBvcHRpb25zLmludGVudHMgPz8gMCxcbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICBvczogb3B0aW9ucy5wcm9wZXJ0aWVzPy5vcyA/PyBwcm9jZXNzLnBsYXRmb3JtLFxuICAgICAgYnJvd3Nlcjogb3B0aW9ucy5wcm9wZXJ0aWVzPy5icm93c2VyID8/ICdEaXNjb3JkZW5vJyxcbiAgICAgIGRldmljZTogb3B0aW9ucy5wcm9wZXJ0aWVzPy5kZXZpY2UgPz8gJ0Rpc2NvcmRlbm8nLFxuICAgIH0sXG4gICAgdG9rZW46IG9wdGlvbnMudG9rZW4sXG4gICAgdXJsOiBvcHRpb25zLnVybCA/PyBjb25uZWN0aW9uT3B0aW9ucy51cmwgPz8gJ3dzczovL2dhdGV3YXkuZGlzY29yZC5nZycsXG4gICAgdmVyc2lvbjogb3B0aW9ucy52ZXJzaW9uID8/IDEwLFxuICAgIGNvbm5lY3Rpb246IGNvbm5lY3Rpb25PcHRpb25zLFxuICAgIHRvdGFsU2hhcmRzOiBvcHRpb25zLnRvdGFsU2hhcmRzID8/IGNvbm5lY3Rpb25PcHRpb25zLnNoYXJkcyA/PyAxLFxuICAgIGxhc3RTaGFyZElkOiBvcHRpb25zLmxhc3RTaGFyZElkID8/IChvcHRpb25zLnRvdGFsU2hhcmRzID8gb3B0aW9ucy50b3RhbFNoYXJkcyAtIDEgOiBjb25uZWN0aW9uT3B0aW9ucyA/IGNvbm5lY3Rpb25PcHRpb25zLnNoYXJkcyAtIDEgOiAwKSxcbiAgICBmaXJzdFNoYXJkSWQ6IG9wdGlvbnMuZmlyc3RTaGFyZElkID8/IDAsXG4gICAgdG90YWxXb3JrZXJzOiBvcHRpb25zLnRvdGFsV29ya2VycyA/PyA0LFxuICAgIHNoYXJkc1Blcldvcmtlcjogb3B0aW9ucy5zaGFyZHNQZXJXb3JrZXIgPz8gMjUsXG4gICAgc3Bhd25TaGFyZERlbGF5OiBvcHRpb25zLnNwYXduU2hhcmREZWxheSA/PyA1MzAwLFxuICAgIHNwcmVhZFNoYXJkc0luUm91bmRSb2Jpbjogb3B0aW9ucy5zcHJlYWRTaGFyZHNJblJvdW5kUm9iaW4gPz8gZmFsc2UsXG4gICAgc2hhcmRzOiBuZXcgTWFwKCksXG4gICAgYnVja2V0czogbmV3IE1hcCgpLFxuICAgIGNhY2hlOiB7XG4gICAgICByZXF1ZXN0TWVtYmVyczoge1xuICAgICAgICBlbmFibGVkOiBvcHRpb25zLmNhY2hlPy5yZXF1ZXN0TWVtYmVycz8uZW5hYmxlZCA/PyBmYWxzZSxcbiAgICAgICAgcGVuZGluZzogbmV3IENvbGxlY3Rpb24oKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBsb2dnZXI6IG9wdGlvbnMubG9nZ2VyID8/IGxvZ2dlcixcbiAgICBtYWtlUHJlc2VuY2U6IG9wdGlvbnMubWFrZVByZXNlbmNlID8/ICgoKSA9PiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSksXG4gICAgcmVzaGFyZGluZzoge1xuICAgICAgZW5hYmxlZDogb3B0aW9ucy5yZXNoYXJkaW5nPy5lbmFibGVkID8/IHRydWUsXG4gICAgICBzaGFyZHNGdWxsUGVyY2VudGFnZTogb3B0aW9ucy5yZXNoYXJkaW5nPy5zaGFyZHNGdWxsUGVyY2VudGFnZSA/PyA4MCxcbiAgICAgIGNoZWNrSW50ZXJ2YWw6IG9wdGlvbnMucmVzaGFyZGluZz8uY2hlY2tJbnRlcnZhbCA/PyAyODgwMDAwMCwgLy8gOCBob3Vyc1xuICAgICAgc2hhcmRzOiBuZXcgTWFwKCksXG4gICAgICBnZXRTZXNzaW9uSW5mbzogb3B0aW9ucy5yZXNoYXJkaW5nPy5nZXRTZXNzaW9uSW5mbyxcbiAgICAgIHVwZGF0ZUd1aWxkc1NoYXJkSWQ6IG9wdGlvbnMucmVzaGFyZGluZz8udXBkYXRlR3VpbGRzU2hhcmRJZCxcbiAgICAgIGFzeW5jIGNoZWNrSWZSZXNoYXJkaW5nSXNOZWVkZWQoKSB7XG4gICAgICAgIGdhdGV3YXkubG9nZ2VyLmRlYnVnKCdbUmVzaGFyZGluZ10gQ2hlY2tpbmcgaWYgcmVzaGFyZGluZyBpcyBuZWVkZWQuJylcblxuICAgICAgICBpZiAoIWdhdGV3YXkucmVzaGFyZGluZy5lbmFibGVkKSB7XG4gICAgICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoJ1tSZXNoYXJkaW5nXSBSZXNoYXJkaW5nIGlzIGRpc2FibGVkLicpXG5cbiAgICAgICAgICByZXR1cm4geyBuZWVkZWQ6IGZhbHNlIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZ2F0ZXdheS5yZXNoYXJkaW5nLmdldFNlc3Npb25JbmZvKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiW1Jlc2hhcmRpbmddIFJlc2hhcmRpbmcgaXMgZW5hYmxlZCBidXQgbm8gJ3Jlc2hhcmRpbmcuZ2V0U2Vzc2lvbkluZm8oKScgaXMgbm90IHByb3ZpZGVkLlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoJ1tSZXNoYXJkaW5nXSBSZXNoYXJkaW5nIGlzIGVuYWJsZWQuJylcblxuICAgICAgICBjb25zdCBzZXNzaW9uSW5mbyA9IGF3YWl0IGdhdGV3YXkucmVzaGFyZGluZy5nZXRTZXNzaW9uSW5mbygpXG5cbiAgICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoYFtSZXNoYXJkaW5nXSBTZXNzaW9uIGluZm8gcmV0cmlldmVkOiAke0pTT04uc3RyaW5naWZ5KHNlc3Npb25JbmZvKX1gKVxuXG4gICAgICAgIC8vIERvbid0IGhhdmUgZW5vdWdoIGlkZW50aWZ5IGxpbWl0cyB0byB0cnkgcmVzaGFyZGluZ1xuICAgICAgICBpZiAoc2Vzc2lvbkluZm8uc2Vzc2lvblN0YXJ0TGltaXQucmVtYWluaW5nIDwgc2Vzc2lvbkluZm8uc2hhcmRzKSB7XG4gICAgICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoJ1tSZXNoYXJkaW5nXSBOb3QgZW5vdWdoIHNlc3Npb24gc3RhcnQgbGltaXRzIGxlZnQgdG8gcmVzaGFyZC4nKVxuXG4gICAgICAgICAgcmV0dXJuIHsgbmVlZGVkOiBmYWxzZSwgaW5mbzogc2Vzc2lvbkluZm8gfVxuICAgICAgICB9XG5cbiAgICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoJ1tSZXNoYXJkaW5nXSBBYmxlIHRvIHJlc2hhcmQsIGNoZWNraW5nIHdoZXRoZXIgbmVjZXNzYXJ5IG5vdy4nKVxuXG4gICAgICAgIC8vIDI1MDAgaXMgdGhlIG1heCBhbW91bnQgb2YgZ3VpbGRzIGEgc2luZ2xlIHNoYXJkIGNhbiBoYW5kbGVcbiAgICAgICAgLy8gMTAwMCBpcyB0aGUgYW1vdW50IG9mIGd1aWxkcyBkaXNjb3JkIHVzZXMgdG8gZGV0ZXJtaW5lIGhvdyBtYW55IHNoYXJkcyB0byByZWNvbW1lbmQuXG4gICAgICAgIC8vIFRoaXMgYWxnbyBoZWxwcyBjaGVjayBpZiB5b3VyIGJvdCBoYXMgZ3Jvd24gZW5vdWdoIHRvIHJlc2hhcmQuXG4gICAgICAgIC8vIFdoaWxlIHRoaXMgaXMgaW1wcmVjaXNlIGFzIGRpc2NvcmQgY2hhbmdlcyB0aGUgcmVjb21tZW5kZWQgbnVtYmVyIG9mIHNoYXJkIGV2ZXJ5IDEwMDAgZ3VpbGRzIGl0IGlzIGdvb2QgZW5vdWdoXG4gICAgICAgIC8vIFRoZSBhbHRlcm5hdGl2ZSBpcyB0byBzdG9yZSB0aGUgZ3VpbGQgY291bnQgZm9yIGVhY2ggc2hhcmQgYW5kIHJlcXVpcmUgdGhlIEd1aWxkcyBpbnRlbnQgZm9yIGBHVUlMRF9DUkVBVEVgIGFuZCBgR1VJTERfREVMRVRFYCBldmVudHNcbiAgICAgICAgY29uc3QgcGVyY2VudGFnZSA9IChzZXNzaW9uSW5mby5zaGFyZHMgLyAoKGdhdGV3YXkudG90YWxTaGFyZHMgKiAyNTAwKSAvIDEwMDApKSAqIDEwMFxuXG4gICAgICAgIC8vIExlc3MgdGhhbiBuZWNlc3NhcnklIGJlaW5nIHVzZWQgc28gZG8gbm90aGluZ1xuICAgICAgICBpZiAocGVyY2VudGFnZSA8IGdhdGV3YXkucmVzaGFyZGluZy5zaGFyZHNGdWxsUGVyY2VudGFnZSkge1xuICAgICAgICAgIGdhdGV3YXkubG9nZ2VyLmRlYnVnKCdbUmVzaGFyZGluZ10gUmVzaGFyZGluZyBub3QgbmVlZGVkLicpXG5cbiAgICAgICAgICByZXR1cm4geyBuZWVkZWQ6IGZhbHNlLCBpbmZvOiBzZXNzaW9uSW5mbyB9XG4gICAgICAgIH1cblxuICAgICAgICBnYXRld2F5LmxvZ2dlci5pbmZvKCdbUmVzaGFyZGluZ10gUmVzaGFyZGluZyBpcyBuZWVkZWQuJylcblxuICAgICAgICByZXR1cm4geyBuZWVkZWQ6IHRydWUsIGluZm86IHNlc3Npb25JbmZvIH1cbiAgICAgIH0sXG4gICAgICBhc3luYyByZXNoYXJkKGluZm8pIHtcbiAgICAgICAgZ2F0ZXdheS5sb2dnZXIuaW5mbyhgW1Jlc2hhcmRpbmddIFN0YXJ0aW5nIHRoZSByZXNoYXJkIHByb2Nlc3MuIFByZXZpb3VzIHRvdGFsIHNoYXJkczogJHtnYXRld2F5LnRvdGFsU2hhcmRzfWApXG4gICAgICAgIC8vIFNldCB2YWx1ZXMgb24gZ2F0ZXdheVxuICAgICAgICBnYXRld2F5LnRvdGFsU2hhcmRzID0gaW5mby5zaGFyZHNcbiAgICAgICAgLy8gSGFuZGxlcyBwcmVwYXJpbmcgbWlkIHNpemVkIGJvdHMgZm9yIExCU1xuICAgICAgICBnYXRld2F5LnRvdGFsU2hhcmRzID0gZ2F0ZXdheS5jYWxjdWxhdGVUb3RhbFNoYXJkcygpXG4gICAgICAgIC8vIFNldCBmaXJzdCBzaGFyZCBpZCBpZiBwcm92aWRlZCBpbiBpbmZvXG4gICAgICAgIGlmICh0eXBlb2YgaW5mby5maXJzdFNoYXJkSWQgPT09ICdudW1iZXInKSBnYXRld2F5LmZpcnN0U2hhcmRJZCA9IGluZm8uZmlyc3RTaGFyZElkXG4gICAgICAgIC8vIFNldCBsYXN0IHNoYXJkIGlkIGlmIHByb3ZpZGVkIGluIGluZm9cbiAgICAgICAgaWYgKHR5cGVvZiBpbmZvLmxhc3RTaGFyZElkID09PSAnbnVtYmVyJykgZ2F0ZXdheS5sYXN0U2hhcmRJZCA9IGluZm8ubGFzdFNoYXJkSWRcbiAgICAgICAgLy8gSWYgd2UgZGlkbid0IGdldCBhbnkgbGFzdFNoYXJkSWQsIHdlIGFzc3VtZSBhbGwgdGhlIHNoYXJkcyBhcmUgdG8gYmUgdXNlZFxuICAgICAgICBlbHNlIGdhdGV3YXkubGFzdFNoYXJkSWQgPSBnYXRld2F5LnRvdGFsU2hhcmRzIC0gMVxuICAgICAgICBnYXRld2F5LmxvZ2dlci5pbmZvKGBbUmVzaGFyZGluZ10gU3RhcnRpbmcgdGhlIHJlc2hhcmQgcHJvY2Vzcy4gTmV3IHRvdGFsIHNoYXJkczogJHtnYXRld2F5LnRvdGFsU2hhcmRzfWApXG5cbiAgICAgICAgLy8gUmVzZXR0aW5nIGJ1Y2tldHNcbiAgICAgICAgZ2F0ZXdheS5idWNrZXRzLmNsZWFyKClcbiAgICAgICAgLy8gUmVmaWxsaW5nIGJ1Y2tldHMgd2l0aCBuZXcgdmFsdWVzXG4gICAgICAgIGdhdGV3YXkucHJlcGFyZUJ1Y2tldHMoKVxuXG4gICAgICAgIC8vIENhbGwgYWxsIHRoZSBidWNrZXRzIGFuZCB0ZWxsIHRoZWlyIHdvcmtlcnMgJiBzaGFyZHMgdG8gaWRlbnRpZnlcbiAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBBcnJheS5mcm9tKGdhdGV3YXkuYnVja2V0cy5lbnRyaWVzKCkpLm1hcChhc3luYyAoW2J1Y2tldElkLCBidWNrZXRdKSA9PiB7XG4gICAgICAgICAgZm9yIChjb25zdCB3b3JrZXIgb2YgYnVja2V0LndvcmtlcnMpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgc2hhcmRJZCBvZiB3b3JrZXIucXVldWUpIHtcbiAgICAgICAgICAgICAgYXdhaXQgZ2F0ZXdheS5yZXNoYXJkaW5nLnRlbGxXb3JrZXJUb1ByZXBhcmUod29ya2VyLmlkLCBzaGFyZElkLCBidWNrZXRJZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpXG5cbiAgICAgICAgZ2F0ZXdheS5sb2dnZXIuaW5mbyhgW1Jlc2hhcmRpbmddIEFsbCBzaGFyZHMgYXJlIG5vdyBvbmxpbmUuYClcblxuICAgICAgICBhd2FpdCBnYXRld2F5LnJlc2hhcmRpbmcub25SZXNoYXJkaW5nU3dpdGNoKClcbiAgICAgIH0sXG4gICAgICBhc3luYyB0ZWxsV29ya2VyVG9QcmVwYXJlKHdvcmtlcklkLCBzaGFyZElkLCBidWNrZXRJZCkge1xuICAgICAgICBnYXRld2F5LmxvZ2dlci5kZWJ1ZyhgW1Jlc2hhcmRpbmddIFRlbGxpbmcgd29ya2VyIHRvIHByZXBhcmUuIFdvcmtlcjogJHt3b3JrZXJJZH0gfCBTaGFyZDogJHtzaGFyZElkfSB8IEJ1Y2tldDogJHtidWNrZXRJZH0uYClcbiAgICAgICAgY29uc3Qgc2hhcmQgPSBuZXcgU2hhcmQoe1xuICAgICAgICAgIGlkOiBzaGFyZElkLFxuICAgICAgICAgIGNvbm5lY3Rpb246IHtcbiAgICAgICAgICAgIGNvbXByZXNzOiBnYXRld2F5LmNvbXByZXNzLFxuICAgICAgICAgICAgdHJhbnNwb3J0Q29tcHJlc3Npb246IGdhdGV3YXkudHJhbnNwb3J0Q29tcHJlc3Npb24gPz8gbnVsbCxcbiAgICAgICAgICAgIGludGVudHM6IGdhdGV3YXkuaW50ZW50cyxcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IGdhdGV3YXkucHJvcGVydGllcyxcbiAgICAgICAgICAgIHRva2VuOiBnYXRld2F5LnRva2VuLFxuICAgICAgICAgICAgdG90YWxTaGFyZHM6IGdhdGV3YXkudG90YWxTaGFyZHMsXG4gICAgICAgICAgICB1cmw6IGdhdGV3YXkudXJsLFxuICAgICAgICAgICAgdmVyc2lvbjogZ2F0ZXdheS52ZXJzaW9uLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICBhc3luYyBtZXNzYWdlKF9zaGFyZCwgcGF5bG9hZCkge1xuICAgICAgICAgICAgICAvLyBJZ25vcmUgYWxsIGV2ZW50cyB1bnRpbCB3ZSBzd2ljaCBmcm9tIHRoZSBvbGQgc2hhcmRzIHRvIHRoZSBuZXcgb25lcy5cbiAgICAgICAgICAgICAgaWYgKHBheWxvYWQudCA9PT0gJ1JFQURZJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGdhdGV3YXkucmVzaGFyZGluZy51cGRhdGVHdWlsZHNTaGFyZElkPy4oXG4gICAgICAgICAgICAgICAgICAocGF5bG9hZC5kIGFzIERpc2NvcmRSZWFkeSkuZ3VpbGRzLm1hcCgoZykgPT4gZy5pZCksXG4gICAgICAgICAgICAgICAgICBzaGFyZElkLFxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGxvZ2dlcjogZ2F0ZXdheS5sb2dnZXIsXG4gICAgICAgICAgcmVxdWVzdElkZW50aWZ5OiBhc3luYyAoKSA9PiBhd2FpdCBnYXRld2F5LnJlcXVlc3RJZGVudGlmeShzaGFyZElkKSxcbiAgICAgICAgICBtYWtlUHJlc2VuY2U6IGdhdGV3YXkubWFrZVByZXNlbmNlLFxuICAgICAgICB9KVxuXG4gICAgICAgIGdhdGV3YXkucmVzaGFyZGluZy5zaGFyZHMuc2V0KHNoYXJkSWQsIHNoYXJkKVxuXG4gICAgICAgIGF3YWl0IHNoYXJkLmlkZW50aWZ5KClcblxuICAgICAgICBnYXRld2F5LmxvZ2dlci5kZWJ1ZyhgW1Jlc2hhcmRpbmddIFNoYXJkICMke3NoYXJkSWR9IGlkZW50aWZpZWQuYClcbiAgICAgIH0sXG4gICAgICBhc3luYyBvblJlc2hhcmRpbmdTd2l0Y2goKSB7XG4gICAgICAgIGdhdGV3YXkubG9nZ2VyLmRlYnVnKGBbUmVzaGFyZGluZ10gTWFraW5nIHRoZSBzd2l0Y2ggZnJvbSB0aGUgb2xkIHNoYXJkcyB0byB0aGUgbmV3IG9uZXMuYClcblxuICAgICAgICAvLyBNb3ZlIHRoZSBldmVudHMgZnJvbSB0aGUgb2xkIHNoYXJkcyB0byB0aGUgbmV3IG9uZXNcbiAgICAgICAgZm9yIChjb25zdCBzaGFyZCBvZiBnYXRld2F5LnJlc2hhcmRpbmcuc2hhcmRzLnZhbHVlcygpKSB7XG4gICAgICAgICAgc2hhcmQuZXZlbnRzID0gb3B0aW9ucy5ldmVudHMgPz8ge31cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE9sZCBzaGFyZHMgc3RvcCBwcm9jZXNzaW5nIGV2ZW50c1xuICAgICAgICBmb3IgKGNvbnN0IHNoYXJkIG9mIGdhdGV3YXkuc2hhcmRzLnZhbHVlcygpKSB7XG4gICAgICAgICAgY29uc3Qgb2xkSGFuZGxlciA9IHNoYXJkLmV2ZW50cy5tZXNzYWdlXG5cbiAgICAgICAgICAvLyBDaGFuZ2Ugd2l0aCBzcHJlYWQgb3BlcmF0b3IgdG8gbm90IGFmZmVjdCBuZXcgc2hhcmRzLCBhcyBjaGFuZ2luZyBhbnl0aGluZyBvbiBzaGFyZC5ldmVudHMgd2lsbCBkaXJlY3RseSBjaGFuZ2Ugb3B0aW9ucy5ldmVudHMsIHdoaWNoIGNoYW5nZXMgbmV3IHNoYXJkcycgZXZlbnRzXG4gICAgICAgICAgc2hhcmQuZXZlbnRzID0ge1xuICAgICAgICAgICAgLi4uc2hhcmQuZXZlbnRzLFxuICAgICAgICAgICAgbWVzc2FnZTogYXN5bmMgZnVuY3Rpb24gKF8sIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgLy8gTWVtYmVyIGNoZWNrcyBuZWVkIHRvIGNvbnRpbnVlIGJ1dCBvdGhlcnMgY2FuIHN0b3BcbiAgICAgICAgICAgICAgaWYgKG1lc3NhZ2UudCA9PT0gJ0dVSUxEX01FTUJFUlNfQ0hVTksnKSB7XG4gICAgICAgICAgICAgICAgb2xkSGFuZGxlcj8uKHNoYXJkLCBtZXNzYWdlKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGdhdGV3YXkubG9nZ2VyLmluZm8oYFtSZXNoYXJkaW5nXSBTaHV0dGluZyBkb3duIG9sZCBzaGFyZHMuYClcbiAgICAgICAgYXdhaXQgZ2F0ZXdheS5zaHV0ZG93bihTaGFyZFNvY2tldENsb3NlQ29kZXMuUmVzaGFyZGVkLCAnUmVzaGFyZGVkIScsIGZhbHNlKVxuXG4gICAgICAgIGdhdGV3YXkubG9nZ2VyLmluZm8oYFtSZXNoYXJkaW5nXSBDb21wbGV0ZWQuYClcbiAgICAgICAgZ2F0ZXdheS5zaGFyZHMgPSBuZXcgTWFwKGdhdGV3YXkucmVzaGFyZGluZy5zaGFyZHMpXG4gICAgICAgIGdhdGV3YXkucmVzaGFyZGluZy5zaGFyZHMuY2xlYXIoKVxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgY2FsY3VsYXRlVG90YWxTaGFyZHMoKSB7XG4gICAgICAvLyBCb3RzIHVuZGVyIDEwMGsgc2VydmVycyBkbyBub3QgaGF2ZSBhY2Nlc3MgdG8gTEJTLlxuICAgICAgaWYgKGdhdGV3YXkudG90YWxTaGFyZHMgPCAxMDApIHtcbiAgICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoYFtHYXRld2F5XSBDYWxjdWxhdGluZyB0b3RhbCBzaGFyZHM6ICR7Z2F0ZXdheS50b3RhbFNoYXJkc31gKVxuICAgICAgICByZXR1cm4gZ2F0ZXdheS50b3RhbFNoYXJkc1xuICAgICAgfVxuXG4gICAgICBnYXRld2F5LmxvZ2dlci5kZWJ1ZyhgW0dhdGV3YXldIENhbGN1bGF0aW5nIHRvdGFsIHNoYXJkc2AsIGdhdGV3YXkudG90YWxTaGFyZHMsIGdhdGV3YXkuY29ubmVjdGlvbi5zZXNzaW9uU3RhcnRMaW1pdC5tYXhDb25jdXJyZW5jeSlcbiAgICAgIC8vIENhbGN1bGF0ZSBhIG11bHRpcGxlIG9mIGBtYXhDb25jdXJyZW5jeWAgd2hpY2ggY2FuIGJlIHVzZWQgdG8gY29ubmVjdCB0byB0aGUgZ2F0ZXdheS5cbiAgICAgIHJldHVybiAoXG4gICAgICAgIE1hdGguY2VpbChcbiAgICAgICAgICBnYXRld2F5LnRvdGFsU2hhcmRzIC9cbiAgICAgICAgICAgIC8vIElmIGBtYXhDb25jdXJyZW5jeWAgaXMgMSwgd2UgY2FuIHNhZmVseSB1c2UgMTYgdG8gZ2V0IGB0b3RhbFNoYXJkc2AgdG8gYmUgaW4gYSBtdWx0aXBsZSBvZiAxNiBzbyB0aGF0IHdlIGNhbiBwcmVwYXJlIGJvdHMgd2l0aCAxMDBrIHNlcnZlcnMgZm9yIExCUy5cbiAgICAgICAgICAgIChnYXRld2F5LmNvbm5lY3Rpb24uc2Vzc2lvblN0YXJ0TGltaXQubWF4Q29uY3VycmVuY3kgPT09IDEgPyAxNiA6IGdhdGV3YXkuY29ubmVjdGlvbi5zZXNzaW9uU3RhcnRMaW1pdC5tYXhDb25jdXJyZW5jeSksXG4gICAgICAgICkgKiAoZ2F0ZXdheS5jb25uZWN0aW9uLnNlc3Npb25TdGFydExpbWl0Lm1heENvbmN1cnJlbmN5ID09PSAxID8gMTYgOiBnYXRld2F5LmNvbm5lY3Rpb24uc2Vzc2lvblN0YXJ0TGltaXQubWF4Q29uY3VycmVuY3kpXG4gICAgICApXG4gICAgfSxcbiAgICBjYWxjdWxhdGVXb3JrZXJJZChzaGFyZElkKSB7XG4gICAgICBjb25zdCB3b3JrZXJJZCA9IG9wdGlvbnMuc3ByZWFkU2hhcmRzSW5Sb3VuZFJvYmluXG4gICAgICAgID8gc2hhcmRJZCAlIGdhdGV3YXkudG90YWxXb3JrZXJzXG4gICAgICAgIDogTWF0aC5taW4oTWF0aC5mbG9vcihzaGFyZElkIC8gZ2F0ZXdheS5zaGFyZHNQZXJXb3JrZXIpLCBnYXRld2F5LnRvdGFsV29ya2VycyAtIDEpXG4gICAgICBnYXRld2F5LmxvZ2dlci5kZWJ1ZyhcbiAgICAgICAgYFtHYXRld2F5XSBDYWxjdWxhdGluZyB3b3JrZXJJZDogU2hhcmQ6ICR7c2hhcmRJZH0gLT4gV29ya2VyOiAke3dvcmtlcklkfSAtPiBQZXIgV29ya2VyOiAke2dhdGV3YXkuc2hhcmRzUGVyV29ya2VyfSAtPiBUb3RhbDogJHtnYXRld2F5LnRvdGFsV29ya2Vyc31gLFxuICAgICAgKVxuICAgICAgcmV0dXJuIHdvcmtlcklkXG4gICAgfSxcbiAgICBwcmVwYXJlQnVja2V0cygpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2F0ZXdheS5jb25uZWN0aW9uLnNlc3Npb25TdGFydExpbWl0Lm1heENvbmN1cnJlbmN5OyArK2kpIHtcbiAgICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoYFtHYXRld2F5XSBQcmVwYXJpbmcgYnVja2V0cyBmb3IgY29uY3VycmVuY3k6ICR7aX1gKVxuICAgICAgICBnYXRld2F5LmJ1Y2tldHMuc2V0KGksIHtcbiAgICAgICAgICB3b3JrZXJzOiBbXSxcbiAgICAgICAgICBsZWFreUJ1Y2tldDogbmV3IExlYWt5QnVja2V0KHtcbiAgICAgICAgICAgIG1heDogMSxcbiAgICAgICAgICAgIHJlZmlsbEFtb3VudDogMSxcbiAgICAgICAgICAgIHJlZmlsbEludGVydmFsOiBnYXRld2F5LnNwYXduU2hhcmREZWxheSxcbiAgICAgICAgICAgIGxvZ2dlcjogdGhpcy5sb2dnZXIsXG4gICAgICAgICAgfSksXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIC8vIE9yZ2FuaXplIGFsbCBzaGFyZHMgaW50byB0aGVpciBvd24gYnVja2V0c1xuICAgICAgZm9yIChsZXQgc2hhcmRJZCA9IGdhdGV3YXkuZmlyc3RTaGFyZElkOyBzaGFyZElkIDw9IGdhdGV3YXkubGFzdFNoYXJkSWQ7ICsrc2hhcmRJZCkge1xuICAgICAgICBnYXRld2F5LmxvZ2dlci5kZWJ1ZyhgW0dhdGV3YXldIFByZXBhcmluZyBidWNrZXRzIGZvciBzaGFyZDogJHtzaGFyZElkfWApXG5cbiAgICAgICAgaWYgKHNoYXJkSWQgPj0gZ2F0ZXdheS50b3RhbFNoYXJkcykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgU2hhcmQgKGlkOiAke3NoYXJkSWR9KSBpcyBiaWdnZXIgb3IgZXF1YWwgdG8gdGhlIHVzZWQgYW1vdW50IG9mIHVzZWQgc2hhcmRzIHdoaWNoIGlzICR7Z2F0ZXdheS50b3RhbFNoYXJkc31gKVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYnVja2V0SWQgPSBzaGFyZElkICUgZ2F0ZXdheS5jb25uZWN0aW9uLnNlc3Npb25TdGFydExpbWl0Lm1heENvbmN1cnJlbmN5XG4gICAgICAgIGNvbnN0IGJ1Y2tldCA9IGdhdGV3YXkuYnVja2V0cy5nZXQoYnVja2V0SWQpXG5cbiAgICAgICAgaWYgKCFidWNrZXQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgU2hhcmQgKGlkOiAke3NoYXJkSWR9KSBnb3QgYXNzaWduZWQgdG8gYW4gaWxsZWdhbCBidWNrZXQgaWQ6ICR7YnVja2V0SWR9LCBleHBlY3RlZCBhIGJ1Y2tldCBpZCBiZXR3ZWVuIDAgYW5kICR7XG4gICAgICAgICAgICAgIGdhdGV3YXkuY29ubmVjdGlvbi5zZXNzaW9uU3RhcnRMaW1pdC5tYXhDb25jdXJyZW5jeSAtIDFcbiAgICAgICAgICAgIH1gLFxuICAgICAgICAgIClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldCB0aGUgd29ya2VyIGlkIGZvciB0aGlzIHNoYXJkXG4gICAgICAgIGNvbnN0IHdvcmtlcklkID0gZ2F0ZXdheS5jYWxjdWxhdGVXb3JrZXJJZChzaGFyZElkKVxuICAgICAgICBjb25zdCB3b3JrZXIgPSBidWNrZXQud29ya2Vycy5maW5kKCh3KSA9PiB3LmlkID09PSB3b3JrZXJJZClcblxuICAgICAgICAvLyBJZiB0aGlzIHdvcmtlciBhbHJlYWR5IGV4aXN0cywgYWRkIHRoZSBzaGFyZCB0byBpdHMgcXVldWVcbiAgICAgICAgaWYgKHdvcmtlcikge1xuICAgICAgICAgIHdvcmtlci5xdWV1ZS5wdXNoKHNoYXJkSWQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnVja2V0LndvcmtlcnMucHVzaCh7IGlkOiB3b3JrZXJJZCwgcXVldWU6IFtzaGFyZElkXSB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBhc3luYyBzcGF3blNoYXJkcygpIHtcbiAgICAgIC8vIFByZXBhcmUgdGhlIGNvbmN1cnJlbmN5IGJ1Y2tldHNcbiAgICAgIGdhdGV3YXkucHJlcGFyZUJ1Y2tldHMoKVxuXG4gICAgICBjb25zdCBwcm9taXNlcyA9IFsuLi5nYXRld2F5LmJ1Y2tldHMuZW50cmllcygpXS5tYXAoYXN5bmMgKFtidWNrZXRJZCwgYnVja2V0XSkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IHdvcmtlciBvZiBidWNrZXQud29ya2Vycykge1xuICAgICAgICAgIGZvciAoY29uc3Qgc2hhcmRJZCBvZiB3b3JrZXIucXVldWUpIHtcbiAgICAgICAgICAgIGF3YWl0IGdhdGV3YXkudGVsbFdvcmtlclRvSWRlbnRpZnkod29ya2VyLmlkLCBzaGFyZElkLCBidWNrZXRJZClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIC8vIFdlIHVzZSBQcm9taXNlLmFsbCBzbyB3ZSBjYW4gc3RhcnQgYWxsIGJ1Y2tldHMgYXQgdGhlIHNhbWUgdGltZVxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpXG5cbiAgICAgIC8vIENoZWNrIGFuZCByZXNoYXJkIGF1dG9tYXRpY2FsbHkgaWYgYXV0byByZXNoYXJkaW5nIGlzIGVuYWJsZWQuXG4gICAgICBpZiAoZ2F0ZXdheS5yZXNoYXJkaW5nLmVuYWJsZWQgJiYgZ2F0ZXdheS5yZXNoYXJkaW5nLmNoZWNrSW50ZXJ2YWwgIT09IC0xKSB7XG4gICAgICAgIC8vIEl0IGlzIGJldHRlciB0byBlbnN1cmUgdGhlcmUgaXMgYWx3YXlzIG9ubHkgb25lXG4gICAgICAgIGNsZWFySW50ZXJ2YWwoZ2F0ZXdheS5yZXNoYXJkaW5nLmNoZWNrSW50ZXJ2YWxJZClcblxuICAgICAgICBpZiAoIWdhdGV3YXkucmVzaGFyZGluZy5nZXRTZXNzaW9uSW5mbykge1xuICAgICAgICAgIGdhdGV3YXkucmVzaGFyZGluZy5lbmFibGVkID0gZmFsc2VcbiAgICAgICAgICBnYXRld2F5LmxvZ2dlci53YXJuKFwiW1Jlc2hhcmRpbmddIFJlc2hhcmRpbmcgaXMgZW5hYmxlZCBidXQgJ3Jlc2hhcmRpbmcuZ2V0U2Vzc2lvbkluZm8oKScgd2FzIG5vdCBwcm92aWRlZC4gRGlzYWJsaW5nIHJlc2hhcmRpbmcuXCIpXG5cbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGdhdGV3YXkucmVzaGFyZGluZy5jaGVja0ludGVydmFsSWQgPSBzZXRJbnRlcnZhbChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVzaGFyZGluZ0luZm8gPSBhd2FpdCBnYXRld2F5LnJlc2hhcmRpbmcuY2hlY2tJZlJlc2hhcmRpbmdJc05lZWRlZCgpXG5cbiAgICAgICAgICBpZiAocmVzaGFyZGluZ0luZm8ubmVlZGVkICYmIHJlc2hhcmRpbmdJbmZvLmluZm8pIGF3YWl0IGdhdGV3YXkucmVzaGFyZGluZy5yZXNoYXJkKHJlc2hhcmRpbmdJbmZvLmluZm8pXG4gICAgICAgIH0sIGdhdGV3YXkucmVzaGFyZGluZy5jaGVja0ludGVydmFsKVxuICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgc2h1dGRvd24oY29kZSwgcmVhc29uLCBjbGVhclJlc2hhcmRpbmdJbnRlcnZhbCA9IHRydWUpIHtcbiAgICAgIGlmIChjbGVhclJlc2hhcmRpbmdJbnRlcnZhbCkgY2xlYXJJbnRlcnZhbChnYXRld2F5LnJlc2hhcmRpbmcuY2hlY2tJbnRlcnZhbElkKVxuXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChBcnJheS5mcm9tKGdhdGV3YXkuc2hhcmRzLnZhbHVlcygpKS5tYXAoKHNoYXJkKSA9PiBzaGFyZC5jbG9zZShjb2RlLCByZWFzb24pKSlcbiAgICB9LFxuICAgIGFzeW5jIHNlbmRQYXlsb2FkKHNoYXJkSWQsIHBheWxvYWQpIHtcbiAgICAgIGNvbnN0IHNoYXJkID0gZ2F0ZXdheS5zaGFyZHMuZ2V0KHNoYXJkSWQpXG5cbiAgICAgIGlmICghc2hhcmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBTaGFyZCAoaWQ6ICR7c2hhcmRJZH0gbm90IGZvdW5kYClcbiAgICAgIH1cblxuICAgICAgYXdhaXQgc2hhcmQuc2VuZChwYXlsb2FkKVxuICAgIH0sXG4gICAgYXN5bmMgdGVsbFdvcmtlclRvSWRlbnRpZnkod29ya2VySWQsIHNoYXJkSWQsIGJ1Y2tldElkKSB7XG4gICAgICBnYXRld2F5LmxvZ2dlci5kZWJ1ZyhgW0dhdGV3YXldIFRlbGwgd29ya2VyICMke3dvcmtlcklkfSB0byBpZGVudGlmeSBzaGFyZCAjJHtzaGFyZElkfSBmcm9tIGJ1Y2tldCAke2J1Y2tldElkfWApXG4gICAgICBhd2FpdCBnYXRld2F5LmlkZW50aWZ5KHNoYXJkSWQpXG4gICAgfSxcbiAgICBhc3luYyBpZGVudGlmeShzaGFyZElkOiBudW1iZXIpIHtcbiAgICAgIGxldCBzaGFyZCA9IHRoaXMuc2hhcmRzLmdldChzaGFyZElkKVxuICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoYFtHYXRld2F5XSBJZGVudGlmeWluZyAke3NoYXJkID8gJ2V4aXN0aW5nJyA6ICduZXcnfSBzaGFyZCAoJHtzaGFyZElkfSlgKVxuXG4gICAgICBpZiAoIXNoYXJkKSB7XG4gICAgICAgIHNoYXJkID0gbmV3IFNoYXJkKHtcbiAgICAgICAgICBpZDogc2hhcmRJZCxcbiAgICAgICAgICBjb25uZWN0aW9uOiB7XG4gICAgICAgICAgICBjb21wcmVzczogdGhpcy5jb21wcmVzcyxcbiAgICAgICAgICAgIHRyYW5zcG9ydENvbXByZXNzaW9uOiBnYXRld2F5LnRyYW5zcG9ydENvbXByZXNzaW9uLFxuICAgICAgICAgICAgaW50ZW50czogdGhpcy5pbnRlbnRzLFxuICAgICAgICAgICAgcHJvcGVydGllczogdGhpcy5wcm9wZXJ0aWVzLFxuICAgICAgICAgICAgdG9rZW46IHRoaXMudG9rZW4sXG4gICAgICAgICAgICB0b3RhbFNoYXJkczogdGhpcy50b3RhbFNoYXJkcyxcbiAgICAgICAgICAgIHVybDogdGhpcy51cmwsXG4gICAgICAgICAgICB2ZXJzaW9uOiB0aGlzLnZlcnNpb24sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBldmVudHM6IG9wdGlvbnMuZXZlbnRzID8/IHt9LFxuICAgICAgICAgIGxvZ2dlcjogdGhpcy5sb2dnZXIsXG4gICAgICAgICAgcmVxdWVzdElkZW50aWZ5OiBhc3luYyAoKSA9PiBhd2FpdCBnYXRld2F5LnJlcXVlc3RJZGVudGlmeShzaGFyZElkKSxcbiAgICAgICAgICBtYWtlUHJlc2VuY2U6IGdhdGV3YXkubWFrZVByZXNlbmNlLFxuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMuc2hhcmRzLnNldChzaGFyZElkLCBzaGFyZClcbiAgICAgIH1cblxuICAgICAgYXdhaXQgc2hhcmQuaWRlbnRpZnkoKVxuICAgIH0sXG5cbiAgICBhc3luYyByZXF1ZXN0SWRlbnRpZnkoc2hhcmRJZCkge1xuICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoYFtHYXRld2F5XSBTaGFyZCAjJHtzaGFyZElkfSByZXF1ZXN0ZWQgYW4gaWRlbnRpZnkuYClcblxuICAgICAgY29uc3QgYnVja2V0ID0gZ2F0ZXdheS5idWNrZXRzLmdldChzaGFyZElkICUgZ2F0ZXdheS5jb25uZWN0aW9uLnNlc3Npb25TdGFydExpbWl0Lm1heENvbmN1cnJlbmN5KVxuXG4gICAgICBpZiAoIWJ1Y2tldCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCByZXF1ZXN0IGlkZW50aWZ5IGZvciBhIHNoYXJkIHRoYXQgaXMgbm90IGFzc2lnbmVkIHRvIGFueSBidWNrZXQuXCIpXG4gICAgICB9XG5cbiAgICAgIGF3YWl0IGJ1Y2tldC5sZWFreUJ1Y2tldC5hY3F1aXJlKClcblxuICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoYFtHYXRld2F5XSBBcHByb3ZlZCBpZGVudGlmeSByZXF1ZXN0IGZvciBTaGFyZCAjJHtzaGFyZElkfS5gKVxuICAgIH0sXG5cbiAgICBhc3luYyBraWxsKHNoYXJkSWQ6IG51bWJlcikge1xuICAgICAgY29uc3Qgc2hhcmQgPSB0aGlzLnNoYXJkcy5nZXQoc2hhcmRJZClcbiAgICAgIGlmICghc2hhcmQpIHtcbiAgICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoYFtHYXRld2F5XSBTaGFyZCAjJHtzaGFyZElkfSB3YXMgcmVxdWVzdGVkIHRvIGJlIGtpbGxlZCwgYnV0IHRoZSBzaGFyZCBjb3VsZCBub3QgYmUgZm91bmQuYClcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGdhdGV3YXkubG9nZ2VyLmRlYnVnKGBbR2F0ZXdheV0gS2lsbGluZyBTaGFyZCAjJHtzaGFyZElkfWApXG4gICAgICB0aGlzLnNoYXJkcy5kZWxldGUoc2hhcmRJZClcbiAgICAgIGF3YWl0IHNoYXJkLnNodXRkb3duKClcbiAgICB9LFxuXG4gICAgLy8gSGVscGVycyBtZXRob2RzIGJlbG93IHRoaXNcblxuICAgIGNhbGN1bGF0ZVNoYXJkSWQoZ3VpbGRJZCwgdG90YWxTaGFyZHMpIHtcbiAgICAgIC8vIElmIG5vbmUgaXMgcHJvdmlkZWQsIHVzZSB0aGUgdG90YWwgc2hhcmRzIG51bWJlciBmcm9tIGdhdGV3YXkgb2JqZWN0LlxuICAgICAgaWYgKCF0b3RhbFNoYXJkcykgdG90YWxTaGFyZHMgPSBnYXRld2F5LnRvdGFsU2hhcmRzXG4gICAgICAvLyBJZiBpdCBpcyBvbmx5IDEgc2hhcmQsIGl0IHdpbGwgYWx3YXlzIGJlIHNoYXJkIGlkIDBcbiAgICAgIGlmICh0b3RhbFNoYXJkcyA9PT0gMSkge1xuICAgICAgICBnYXRld2F5LmxvZ2dlci5kZWJ1ZyhgW0dhdGV3YXldIGNhbGN1bGF0ZVNoYXJkSWQgKDEgc2hhcmQpYClcbiAgICAgICAgcmV0dXJuIDBcbiAgICAgIH1cblxuICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoYFtHYXRld2F5XSBjYWxjdWxhdGVTaGFyZElkIChndWlsZElkOiAke2d1aWxkSWR9LCB0b3RhbFNoYXJkczogJHt0b3RhbFNoYXJkc30pYClcbiAgICAgIHJldHVybiBOdW1iZXIoKEJpZ0ludChndWlsZElkKSA+PiAyMm4pICUgQmlnSW50KHRvdGFsU2hhcmRzKSlcbiAgICB9LFxuXG4gICAgYXN5bmMgam9pblZvaWNlQ2hhbm5lbChndWlsZElkLCBjaGFubmVsSWQsIG9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IHNoYXJkSWQgPSBnYXRld2F5LmNhbGN1bGF0ZVNoYXJkSWQoZ3VpbGRJZClcblxuICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoYFtHYXRld2F5XSBqb2luVm9pY2VDaGFubmVsIGd1aWxkSWQ6ICR7Z3VpbGRJZH0gY2hhbm5lbElkOiAke2NoYW5uZWxJZH1gKVxuXG4gICAgICBhd2FpdCBnYXRld2F5LnNlbmRQYXlsb2FkKHNoYXJkSWQsIHtcbiAgICAgICAgb3A6IEdhdGV3YXlPcGNvZGVzLlZvaWNlU3RhdGVVcGRhdGUsXG4gICAgICAgIGQ6IHtcbiAgICAgICAgICBndWlsZF9pZDogZ3VpbGRJZC50b1N0cmluZygpLFxuICAgICAgICAgIGNoYW5uZWxfaWQ6IGNoYW5uZWxJZC50b1N0cmluZygpLFxuICAgICAgICAgIHNlbGZfbXV0ZTogb3B0aW9ucz8uc2VsZk11dGUgPz8gZmFsc2UsXG4gICAgICAgICAgc2VsZl9kZWFmOiBvcHRpb25zPy5zZWxmRGVhZiA/PyB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgZWRpdEJvdFN0YXR1cyhkYXRhKSB7XG4gICAgICBnYXRld2F5LmxvZ2dlci5kZWJ1ZyhgW0dhdGV3YXldIGVkaXRCb3RTdGF0dXMgZGF0YTogJHtKU09OLnN0cmluZ2lmeShkYXRhLCBqc29uU2FmZVJlcGxhY2VyKX1gKVxuXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgWy4uLmdhdGV3YXkuc2hhcmRzLnZhbHVlcygpXS5tYXAoYXN5bmMgKHNoYXJkKSA9PiB7XG4gICAgICAgICAgZ2F0ZXdheS5lZGl0U2hhcmRTdGF0dXMoc2hhcmQuaWQsIGRhdGEpXG4gICAgICAgIH0pLFxuICAgICAgKVxuICAgIH0sXG5cbiAgICBhc3luYyBlZGl0U2hhcmRTdGF0dXMoc2hhcmRJZCwgZGF0YSkge1xuICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoYFtHYXRld2F5XSBlZGl0U2hhcmRTdGF0dXMgc2hhcmRJZDogJHtzaGFyZElkfSAtPiBkYXRhOiAke0pTT04uc3RyaW5naWZ5KGRhdGEpfWApXG5cbiAgICAgIGF3YWl0IGdhdGV3YXkuc2VuZFBheWxvYWQoc2hhcmRJZCwge1xuICAgICAgICBvcDogR2F0ZXdheU9wY29kZXMuUHJlc2VuY2VVcGRhdGUsXG4gICAgICAgIGQ6IHtcbiAgICAgICAgICBzaW5jZTogbnVsbCxcbiAgICAgICAgICBhZms6IGZhbHNlLFxuICAgICAgICAgIGFjdGl2aXRpZXM6IGRhdGEuYWN0aXZpdGllcyxcbiAgICAgICAgICBzdGF0dXM6IGRhdGEuc3RhdHVzLFxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICB9LFxuXG4gICAgYXN5bmMgcmVxdWVzdE1lbWJlcnMoZ3VpbGRJZCwgb3B0aW9ucykge1xuICAgICAgY29uc3Qgc2hhcmRJZCA9IGdhdGV3YXkuY2FsY3VsYXRlU2hhcmRJZChndWlsZElkKVxuXG4gICAgICBpZiAoZ2F0ZXdheS5pbnRlbnRzICYmICghb3B0aW9ucz8ubGltaXQgfHwgb3B0aW9ucy5saW1pdCA+IDEpICYmICEoZ2F0ZXdheS5pbnRlbnRzICYgR2F0ZXdheUludGVudHMuR3VpbGRNZW1iZXJzKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZmV0Y2ggbW9yZSB0aGVuIDEgbWVtYmVyIHdpdGhvdXQgdGhlIEdVSUxEX01FTUJFUlMgaW50ZW50JylcblxuICAgICAgZ2F0ZXdheS5sb2dnZXIuZGVidWcoYFtHYXRld2F5XSByZXF1ZXN0TWVtYmVycyBndWlsZElkOiAke2d1aWxkSWR9IC0+IGRhdGE6ICR7SlNPTi5zdHJpbmdpZnkob3B0aW9ucyl9YClcblxuICAgICAgaWYgKG9wdGlvbnM/LnVzZXJJZHM/Lmxlbmd0aCkge1xuICAgICAgICBnYXRld2F5LmxvZ2dlci5kZWJ1ZyhgW0dhdGV3YXldIHJlcXVlc3RNZW1iZXJzIGd1aWxkSWQ6ICR7Z3VpbGRJZH0gLT4gc2V0dGluZyB1c2VyIGxpbWl0IGJhc2VkIG9uIHVzZXJJZHMgbGVuZ3RoOiAke29wdGlvbnMudXNlcklkcy5sZW5ndGh9YClcblxuICAgICAgICBvcHRpb25zLmxpbWl0ID0gb3B0aW9ucy51c2VySWRzLmxlbmd0aFxuICAgICAgfVxuXG4gICAgICBpZiAoIW9wdGlvbnM/Lm5vbmNlKSB7XG4gICAgICAgIGxldCBub25jZSA9ICcnXG5cbiAgICAgICAgd2hpbGUgKCFub25jZSB8fCBnYXRld2F5LmNhY2hlLnJlcXVlc3RNZW1iZXJzLnBlbmRpbmcuaGFzKG5vbmNlKSkge1xuICAgICAgICAgIG5vbmNlID0gcmFuZG9tQnl0ZXMoMTYpLnRvU3RyaW5nKCdoZXgnKVxuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9ucyA/Pz0geyBsaW1pdDogMCB9XG4gICAgICAgIG9wdGlvbnMubm9uY2UgPSBub25jZVxuICAgICAgfVxuXG4gICAgICBjb25zdCBtZW1iZXJzID0gIWdhdGV3YXkuY2FjaGUucmVxdWVzdE1lbWJlcnMuZW5hYmxlZFxuICAgICAgICA/IFtdXG4gICAgICAgIDogbmV3IFByb21pc2U8Q2FtZWxpemU8RGlzY29yZE1lbWJlcldpdGhVc2VyW10+PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAvLyBTaG91bGQgbmV2ZXIgaGFwcGVuLlxuICAgICAgICAgICAgaWYgKCFnYXRld2F5LmNhY2hlLnJlcXVlc3RNZW1iZXJzLmVuYWJsZWQgfHwgIW9wdGlvbnM/Lm5vbmNlKSB7XG4gICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJDYW4ndCByZXF1ZXN0IHRoZSBtZW1iZXJzIHdpdGhvdXQgdGhlIG5vbmNlIG9yIHdpdGggdGhlIGZlYXR1cmUgZGlzYWJsZWQuXCIpKVxuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZ2F0ZXdheS5jYWNoZS5yZXF1ZXN0TWVtYmVycy5wZW5kaW5nLnNldChvcHRpb25zLm5vbmNlLCB7XG4gICAgICAgICAgICAgIG5vbmNlOiBvcHRpb25zLm5vbmNlLFxuICAgICAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgICAgICBtZW1iZXJzOiBbXSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcblxuICAgICAgYXdhaXQgZ2F0ZXdheS5zZW5kUGF5bG9hZChzaGFyZElkLCB7XG4gICAgICAgIG9wOiBHYXRld2F5T3Bjb2Rlcy5SZXF1ZXN0R3VpbGRNZW1iZXJzLFxuICAgICAgICBkOiB7XG4gICAgICAgICAgZ3VpbGRfaWQ6IGd1aWxkSWQudG9TdHJpbmcoKSxcbiAgICAgICAgICAvLyBJZiBhIHF1ZXJ5IGlzIHByb3ZpZGVkIHVzZSBpdCwgT1IgaWYgYSBsaW1pdCBpcyBOT1QgcHJvdmlkZWQgdXNlIFwiXCJcbiAgICAgICAgICBxdWVyeTogb3B0aW9ucz8ucXVlcnkgPz8gKG9wdGlvbnM/LmxpbWl0ID8gdW5kZWZpbmVkIDogJycpLFxuICAgICAgICAgIGxpbWl0OiBvcHRpb25zPy5saW1pdCA/PyAwLFxuICAgICAgICAgIHByZXNlbmNlczogb3B0aW9ucz8ucHJlc2VuY2VzID8/IGZhbHNlLFxuICAgICAgICAgIHVzZXJfaWRzOiBvcHRpb25zPy51c2VySWRzPy5tYXAoKGlkKSA9PiBpZC50b1N0cmluZygpKSxcbiAgICAgICAgICBub25jZTogb3B0aW9ucz8ubm9uY2UsXG4gICAgICAgIH0sXG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gYXdhaXQgbWVtYmVyc1xuICAgIH0sXG5cbiAgICBhc3luYyBsZWF2ZVZvaWNlQ2hhbm5lbChndWlsZElkKSB7XG4gICAgICBjb25zdCBzaGFyZElkID0gZ2F0ZXdheS5jYWxjdWxhdGVTaGFyZElkKGd1aWxkSWQpXG5cbiAgICAgIGdhdGV3YXkubG9nZ2VyLmRlYnVnKGBbR2F0ZXdheV0gbGVhdmVWb2ljZUNoYW5uZWwgZ3VpbGRJZDogJHtndWlsZElkfSBTaGFyZCAke3NoYXJkSWR9YClcblxuICAgICAgYXdhaXQgZ2F0ZXdheS5zZW5kUGF5bG9hZChzaGFyZElkLCB7XG4gICAgICAgIG9wOiBHYXRld2F5T3Bjb2Rlcy5Wb2ljZVN0YXRlVXBkYXRlLFxuICAgICAgICBkOiB7XG4gICAgICAgICAgZ3VpbGRfaWQ6IGd1aWxkSWQudG9TdHJpbmcoKSxcbiAgICAgICAgICBjaGFubmVsX2lkOiBudWxsLFxuICAgICAgICAgIHNlbGZfbXV0ZTogZmFsc2UsXG4gICAgICAgICAgc2VsZl9kZWFmOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIGFzeW5jIHJlcXVlc3RTb3VuZGJvYXJkU291bmRzKGd1aWxkSWRzKSB7XG4gICAgICAvKipcbiAgICAgICAqIERpc2NvcmQgd2lsbCBzZW5kIHRoZSBldmVudHMgZm9yIHRoZSBndWlsZHMgdGhhdCBhcmUgXCJ1bmRlciB0aGUgc2hhcmRcIiB0aGF0IHNlbmRzIHRoZSBvcGNvZGUuXG4gICAgICAgKiBGb3IgdGhpcyByZWFzb24gd2UgbmVlZCB0byBncm91cCB0aGUgaWRzIHdpdGggdGhlIHNoYXJkIHRoZSBjYWxjdWxhdGVTaGFyZElkIG1ldGhvZCBnaXZlc1xuICAgICAgICovXG5cbiAgICAgIGNvbnN0IG1hcCA9IG5ldyBNYXA8bnVtYmVyLCBCaWdTdHJpbmdbXT4oKVxuXG4gICAgICBmb3IgKGNvbnN0IGd1aWxkSWQgb2YgZ3VpbGRJZHMpIHtcbiAgICAgICAgY29uc3Qgc2hhcmRJZCA9IGdhdGV3YXkuY2FsY3VsYXRlU2hhcmRJZChndWlsZElkKVxuXG4gICAgICAgIGNvbnN0IGlkcyA9IG1hcC5nZXQoc2hhcmRJZCkgPz8gW11cbiAgICAgICAgbWFwLnNldChzaGFyZElkLCBpZHMpXG5cbiAgICAgICAgaWRzLnB1c2goZ3VpbGRJZClcbiAgICAgIH1cblxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIFsuLi5tYXAuZW50cmllcygpXS5tYXAoKFtzaGFyZElkLCBpZHNdKSA9PlxuICAgICAgICAgIGdhdGV3YXkuc2VuZFBheWxvYWQoc2hhcmRJZCwge1xuICAgICAgICAgICAgb3A6IEdhdGV3YXlPcGNvZGVzLlJlcXVlc3RTb3VuZGJvYXJkU291bmRzLFxuICAgICAgICAgICAgZDoge1xuICAgICAgICAgICAgICBndWlsZF9pZHM6IGlkcyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgICksXG4gICAgICApXG4gICAgfSxcbiAgfVxuXG4gIHJldHVybiBnYXRld2F5XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlR2F0ZXdheU1hbmFnZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIElkIG9mIHRoZSBmaXJzdCBTaGFyZCB3aGljaCBzaG91bGQgZ2V0IGNvbnRyb2xsZWQgYnkgdGhpcyBtYW5hZ2VyLlxuICAgKiBAZGVmYXVsdCAwXG4gICAqL1xuICBmaXJzdFNoYXJkSWQ/OiBudW1iZXJcbiAgLyoqXG4gICAqIElkIG9mIHRoZSBsYXN0IFNoYXJkIHdoaWNoIHNob3VsZCBnZXQgY29udHJvbGxlZCBieSB0aGlzIG1hbmFnZXIuXG4gICAqIEBkZWZhdWx0IDBcbiAgICovXG4gIGxhc3RTaGFyZElkPzogbnVtYmVyXG4gIC8qKlxuICAgKiBEZWxheSBpbiBtaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgc3Bhd25pbmcgbmV4dCBzaGFyZC4gT1BUSU1BTCBJUyBBQk9WRSA1MTAwLiBZT1UgRE9OJ1QgV0FOVCBUTyBISVQgVEhFIFJBVEUgTElNSVQhISFcbiAgICogQGRlZmF1bHQgNTMwMFxuICAgKi9cbiAgc3Bhd25TaGFyZERlbGF5PzogbnVtYmVyXG4gIC8qKlxuICAgKiBUb3RhbCBhbW91bnQgb2Ygc2hhcmRzIHlvdXIgYm90IHVzZXMuIFVzZWZ1bCBmb3IgemVyby1kb3dudGltZSB1cGRhdGVzIG9yIHJlc2hhcmRpbmcuXG4gICAqIEBkZWZhdWx0IDFcbiAgICovXG4gIHRvdGFsU2hhcmRzPzogbnVtYmVyXG4gIC8qKlxuICAgKiBUaGUgYW1vdW50IG9mIHNoYXJkcyB0byBsb2FkIHBlciB3b3JrZXIuXG4gICAqIEBkZWZhdWx0IDI1XG4gICAqL1xuICBzaGFyZHNQZXJXb3JrZXI/OiBudW1iZXJcbiAgLyoqXG4gICAqIFRoZSB0b3RhbCBhbW91bnQgb2Ygd29ya2VycyB0byB1c2UgZm9yIHlvdXIgYm90LlxuICAgKiBAZGVmYXVsdCA0XG4gICAqL1xuICB0b3RhbFdvcmtlcnM/OiBudW1iZXJcbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gc3ByZWFkIHNoYXJkcyBhY3Jvc3Mgd29ya2VycyBpbiBhIHJvdW5kLXJvYmluIG1hbm5lci5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogQnkgZGVmYXVsdCwgc2hhcmRzIGFyZSBhc3NpZ25lZCB0byB3b3JrZXJzIGluIGNvbnRpZ3VvdXMgYmxvY2tzIGJhc2VkIG9uIHNoYXJkc1Blcldvcmtlci4gSWYgYW55IHNoYXJkIGlzIGxlZnQgb3ZlciwgaXQgd2lsbCBiZSBhc3NpZ25lZCB0byB0aGUgbGFzdCB3b3JrZXIuXG4gICAqIFRoaXMgbWVhbnMgdGhhdCBpZiB5b3UgaGF2ZSAzIHdvcmtlcnMgYW5kIDQwIHNoYXJkcyB3aGlsZSBzaGFyZHNQZXJXb3JrZXIgaXMgMTAsIHRoZSBmaXJzdCB3b3JrZXIgd2lsbCBnZXQgc2hhcmRzIDAtOSwgdGhlIHNlY29uZCB3b3JrZXIgd2lsbCBnZXQgc2hhcmRzIDEwLTE5LCBhbmQgc28gb24sIHRoZSBsYXN0IHdvcmtlciB3aWxsIGdldCBzaGFyZHMgMjAtMzkuXG4gICAqXG4gICAqIElmIHRoaXMgb3B0aW9uIGlzIHNldCB0byB0cnVlLCB0aGUgc2hhcmRzIHdpbGwgYmUgYXNzaWduZWQgaW4gYSByb3VuZC1yb2JpbiBtYW5uZXIgdG8gc3ByZWFkIG1vcmUgZXZlbmx5IGFjcm9zcyB3b3JrZXJzLlxuICAgKiBGb3IgZXhhbXBsZSwgd2l0aCAzIHdvcmtlcnMgYW5kIDQwIHNoYXJkcywgdGhlIGZpcnN0IHNoYXJkIHdpbGwgZ28gdG8gd29ya2VyIDAsIHRoZSBzZWNvbmQgc2hhcmQgdG8gd29ya2VyIDEsIHRoZSB0aGlyZCBzaGFyZCB0byB3b3JrZXIgMiwgdGhlIGZvdXJ0aCBzaGFyZCB0byB3b3JrZXIgMCwgYW5kIHNvIG9uLlxuICAgKlxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgc3ByZWFkU2hhcmRzSW5Sb3VuZFJvYmluPzogYm9vbGVhblxuICAvKiogSW1wb3J0YW50IGRhdGEgd2hpY2ggaXMgdXNlZCBieSB0aGUgbWFuYWdlciB0byBjb25uZWN0IHNoYXJkcyB0byB0aGUgZ2F0ZXdheS4gKi9cbiAgY29ubmVjdGlvbj86IENhbWVsaXplPERpc2NvcmRHZXRHYXRld2F5Qm90PlxuICAvKiogV2hldGhlciBpbmNvbWluZyBwYXlsb2FkcyBhcmUgY29tcHJlc3NlZCB1c2luZyB6bGliLlxuICAgKlxuICAgKiBAZGVmYXVsdCBmYWxzZVxuICAgKi9cbiAgY29tcHJlc3M/OiBib29sZWFuXG4gIC8qKiBXaGF0IHRyYW5zcG9ydCBjb21wcmVzc2lvbiBzaG91bGQgYmUgdXNlZCAqL1xuICB0cmFuc3BvcnRDb21wcmVzc2lvbj86IFRyYW5zcG9ydENvbXByZXNzaW9uIHwgbnVsbFxuICAvKiogVGhlIGNhbGN1bGF0ZWQgaW50ZW50IHZhbHVlIG9mIHRoZSBldmVudHMgd2hpY2ggdGhlIHNoYXJkIHNob3VsZCByZWNlaXZlLlxuICAgKlxuICAgKiBAZGVmYXVsdCAwXG4gICAqL1xuICBpbnRlbnRzPzogbnVtYmVyXG4gIC8qKiBJZGVudGlmeSBwcm9wZXJ0aWVzIHRvIHVzZSAqL1xuICBwcm9wZXJ0aWVzPzoge1xuICAgIC8qKiBPcGVyYXRpbmcgc3lzdGVtIHRoZSBzaGFyZCBydW5zIG9uLlxuICAgICAqXG4gICAgICogQGRlZmF1bHQgXCJkYXJ3aW5cIiB8IFwibGludXhcIiB8IFwid2luZG93c1wiXG4gICAgICovXG4gICAgb3M6IHN0cmluZ1xuICAgIC8qKiBUaGUgXCJicm93c2VyXCIgd2hlcmUgdGhpcyBzaGFyZCBpcyBydW5uaW5nIG9uLlxuICAgICAqXG4gICAgICogQGRlZmF1bHQgXCJEaXNjb3JkZW5vXCJcbiAgICAgKi9cbiAgICBicm93c2VyOiBzdHJpbmdcbiAgICAvKiogVGhlIGRldmljZSBvbiB3aGljaCB0aGUgc2hhcmQgaXMgcnVubmluZy5cbiAgICAgKlxuICAgICAqIEBkZWZhdWx0IFwiRGlzY29yZGVub1wiXG4gICAgICovXG4gICAgZGV2aWNlOiBzdHJpbmdcbiAgfVxuICAvKiogQm90IHRva2VuIHdoaWNoIGlzIHVzZWQgdG8gY29ubmVjdCB0byBEaXNjb3JkICovXG4gIHRva2VuOiBzdHJpbmdcbiAgLyoqIFRoZSBVUkwgb2YgdGhlIGdhdGV3YXkgd2hpY2ggc2hvdWxkIGJlIGNvbm5lY3RlZCB0by5cbiAgICpcbiAgICogQGRlZmF1bHQgXCJ3c3M6Ly9nYXRld2F5LmRpc2NvcmQuZ2dcIlxuICAgKi9cbiAgdXJsPzogc3RyaW5nXG4gIC8qKiBUaGUgZ2F0ZXdheSB2ZXJzaW9uIHdoaWNoIHNob3VsZCBiZSB1c2VkLlxuICAgKlxuICAgKiBAZGVmYXVsdCAxMFxuICAgKi9cbiAgdmVyc2lvbj86IG51bWJlclxuICAvKiogVGhlIGV2ZW50cyBoYW5kbGVycyAqL1xuICBldmVudHM/OiBTaGFyZEV2ZW50c1xuICAvKiogVGhpcyBtYW5hZ2VycyBjYWNoZSByZWxhdGVkIHNldHRpbmdzLiAqL1xuICBjYWNoZT86IHtcbiAgICByZXF1ZXN0TWVtYmVycz86IHtcbiAgICAgIC8qKlxuICAgICAgICogV2hldGhlciBvciBub3QgcmVxdWVzdCBtZW1iZXIgcmVxdWVzdHMgc2hvdWxkIGJlIGNhY2hlZC5cbiAgICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICAgKi9cbiAgICAgIGVuYWJsZWQ/OiBib29sZWFuXG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBUaGUgbG9nZ2VyIHRoYXQgdGhlIGdhdGV3YXkgbWFuYWdlciB3aWxsIHVzZS5cbiAgICogQGRlZmF1bHQgbG9nZ2VyIC8vIFRoZSBsb2dnZXIgZXhwb3J0ZWQgYnkgYEBkaXNjb3JkZW5vL3V0aWxzYFxuICAgKi9cbiAgbG9nZ2VyPzogUGljazx0eXBlb2YgbG9nZ2VyLCAnZGVidWcnIHwgJ2luZm8nIHwgJ3dhcm4nIHwgJ2Vycm9yJyB8ICdmYXRhbCc+XG4gIC8qKlxuICAgKiBNYWtlIHRoZSBwcmVzZW5jZSBmb3Igd2hlbiB0aGUgYm90IGNvbm5lY3RzIHRvIHRoZSBnYXRld2F5XG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgZWFjaCB0aW1lIGEgU2hhcmQgaXMgZ29pbmcgdG8gaWRlbnRpZnlcbiAgICovXG4gIG1ha2VQcmVzZW5jZT86ICgpID0+IFByb21pc2U8RGlzY29yZFVwZGF0ZVByZXNlbmNlIHwgdW5kZWZpbmVkPlxuICAvKiogT3B0aW9ucyByZWxhdGVkIHRvIHJlc2hhcmRpbmcuICovXG4gIHJlc2hhcmRpbmc/OiB7XG4gICAgLyoqXG4gICAgICogV2hldGhlciBvciBub3QgYXV0b21hdGVkIHJlc2hhcmRpbmcgc2hvdWxkIGJlIGVuYWJsZWQuXG4gICAgICogQGRlZmF1bHQgdHJ1ZVxuICAgICAqL1xuICAgIGVuYWJsZWQ6IGJvb2xlYW5cbiAgICAvKipcbiAgICAgKiBUaGUgJSBvZiBob3cgZnVsbCBhIHNoYXJkIGlzIHdoZW4gcmVzaGFyZGluZyBzaG91bGQgYmUgdHJpZ2dlcmVkLlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBXZSB1c2UgZGlzY29yZCByZWNvbW1lbmRlZCBzaGFyZCB2YWx1ZSB0byBnZXQgYW4gKiphcHByb3hpbWF0aW9uKiogb2YgdGhlIHNoYXJkIGZ1bGwgcGVyY2VudGFnZSB0byBjb21wYXJlIHdpdGggdGhpcyB2YWx1ZSBzbyB0aGUgYm90IG1heSBub3QgcmVzaGFyZCBhdCB0aGUgZXhhY3QgcGVyY2VudGFnZSBwcm92aWRlZCBidXQgbWF5IHJlc2hhcmQgd2hlbiBpdCBpcyBhIGJpdCBoaWdoZXIgdGhhbiB0aGUgcHJvdmlkZWQgcGVyY2VudGFnZS5cbiAgICAgKiBGb3IgYWNjdXJhdGUgY2FsY3VsYXRpb24sIHlvdSBtYXkgb3ZlcnJpZGUgdGhlIGBjaGVja0lmUmVzaGFyZGluZ0lzTmVlZGVkYCBmdW5jdGlvblxuICAgICAqXG4gICAgICogQGRlZmF1bHQgODAgYXMgaW4gODAlXG4gICAgICovXG4gICAgc2hhcmRzRnVsbFBlcmNlbnRhZ2U6IG51bWJlclxuICAgIC8qKlxuICAgICAqIFRoZSBpbnRlcnZhbCBpbiBtaWxsaXNlY29uZHMsIG9mIGhvdyBvZnRlbiB0byBjaGVjayB3aGV0aGVyIHJlc2hhcmRpbmcgaXMgbmVlZGVkIGFuZCByZXNoYXJkIGF1dG9tYXRpY2FsbHkuIFNldCB0byAtMSB0byBkaXNhYmxlIGF1dG8gcmVzaGFyZGluZy5cbiAgICAgKiBAZGVmYXVsdCAyODgwMDAwMCAoOCBob3VycylcbiAgICAgKi9cbiAgICBjaGVja0ludGVydmFsOiBudW1iZXJcbiAgICAvKiogSGFuZGxlciB0byBnZXQgc2hhcmQgY291bnQgYW5kIG90aGVyIHNlc3Npb24gaW5mby4gKi9cbiAgICBnZXRTZXNzaW9uSW5mbz86ICgpID0+IFByb21pc2U8Q2FtZWxpemU8RGlzY29yZEdldEdhdGV3YXlCb3Q+PlxuICAgIC8qKiBIYW5kbGVyIHRvIGVkaXQgdGhlIHNoYXJkIGlkIG9uIGFueSBjYWNoZWQgZ3VpbGRzLiAqL1xuICAgIHVwZGF0ZUd1aWxkc1NoYXJkSWQ/OiAoZ3VpbGRJZHM6IHN0cmluZ1tdLCBzaGFyZElkOiBudW1iZXIpID0+IFByb21pc2U8dm9pZD5cbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdhdGV3YXlNYW5hZ2VyIGV4dGVuZHMgUmVxdWlyZWQ8Q3JlYXRlR2F0ZXdheU1hbmFnZXJPcHRpb25zPiB7XG4gIC8qKiBUaGUgbWF4IGNvbmN1cnJlbmN5IGJ1Y2tldHMuIFRob3NlIHdpbGwgYmUgY3JlYXRlZCB3aGVuIHRoZSBgc3Bhd25TaGFyZHNgICh3aGljaCBjYWxscyBgcHJlcGFyZUJ1Y2tldHNgIHVuZGVyIHRoZSBob29kKSBmdW5jdGlvbiBnZXRzIGNhbGxlZC4gKi9cbiAgYnVja2V0czogTWFwPFxuICAgIG51bWJlcixcbiAgICB7XG4gICAgICB3b3JrZXJzOiBBcnJheTx7IGlkOiBudW1iZXI7IHF1ZXVlOiBudW1iZXJbXSB9PlxuICAgICAgLyoqIFRoZSBidWNrZXQgdG8gcXVldWUgdGhlIGlkZW50aWZpZXMuICovXG4gICAgICBsZWFreUJ1Y2tldDogTGVha3lCdWNrZXRcbiAgICB9XG4gID5cbiAgLyoqIFRoZSBzaGFyZHMgdGhhdCBhcmUgY3JlYXRlZC4gKi9cbiAgc2hhcmRzOiBNYXA8bnVtYmVyLCBTaGFyZD5cbiAgLyoqIFRoZSBsb2dnZXIgZm9yIHRoZSBnYXRld2F5IG1hbmFnZXIuICovXG4gIGxvZ2dlcjogUGljazx0eXBlb2YgbG9nZ2VyLCAnZGVidWcnIHwgJ2luZm8nIHwgJ3dhcm4nIHwgJ2Vycm9yJyB8ICdmYXRhbCc+XG4gIC8qKiBFdmVyeXRoaW5nIHJlbGF0ZWQgdG8gcmVzaGFyZGluZy4gKi9cbiAgcmVzaGFyZGluZzogQ3JlYXRlR2F0ZXdheU1hbmFnZXJPcHRpb25zWydyZXNoYXJkaW5nJ10gJiB7XG4gICAgLyoqIFRoZSBpbnRlcnZhbCBpZCBvZiB0aGUgY2hlY2sgaW50ZXJ2YWwuIFRoaXMgaXMgdXNlZCB0byBjbGVhciB0aGUgaW50ZXJ2YWwgd2hlbiB0aGUgbWFuYWdlciBpcyBzaHV0ZG93bi4gKi9cbiAgICBjaGVja0ludGVydmFsSWQ/OiBOb2RlSlMuVGltZW91dCB8IHVuZGVmaW5lZFxuICAgIC8qKiBIb2xkcyB0aGUgc2hhcmRzIHRoYXQgcmVzaGFyZGluZyBoYXMgY3JlYXRlZC4gT25jZSByZXNoYXJkaW5nIGlzIGRvbmUsIHRoaXMgcmVwbGFjZXMgdGhlIGdhdGV3YXkuc2hhcmRzICovXG4gICAgc2hhcmRzOiBNYXA8bnVtYmVyLCBTaGFyZD5cbiAgICAvKiogSGFuZGxlciB0byBjaGVjayBpZiByZXNoYXJkaW5nIGlzIG5lY2Vzc2FyeS4gKi9cbiAgICBjaGVja0lmUmVzaGFyZGluZ0lzTmVlZGVkOiAoKSA9PiBQcm9taXNlPHsgbmVlZGVkOiBib29sZWFuOyBpbmZvPzogQ2FtZWxpemU8RGlzY29yZEdldEdhdGV3YXlCb3Q+IH0+XG4gICAgLyoqXG4gICAgICogSGFuZGxlciB0byBiZWdpbiByZXNoYXJkaW5nLlxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIHdpbGwgcmVzb2x2ZSBvbmNlIHRoZSByZXNoYXJkaW5nIGlzIGRvbmUuXG4gICAgICogU28gd2hlbiBhbGwgdGhlIGNhbGxzIHRvIHtAbGluayB0ZWxsV29ya2VyVG9QcmVwYXJlfSBhbmQge0BsaW5rIG9uUmVzaGFyZGluZ1N3aXRjaH0gYXJlIGRvbmUuXG4gICAgICovXG4gICAgcmVzaGFyZDogKGluZm86IENhbWVsaXplPERpc2NvcmRHZXRHYXRld2F5Qm90PiAmIHsgZmlyc3RTaGFyZElkPzogbnVtYmVyOyBsYXN0U2hhcmRJZD86IG51bWJlciB9KSA9PiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogSGFuZGxlciB0byBjb21tdW5pY2F0ZSB0byBhIHdvcmtlciB0aGF0IGl0IG5lZWRzIHRvIHNwYXduIGEgbmV3IHNoYXJkIGFuZCBpZGVudGlmeSBpdCBmb3IgdGhlIHJlc2hhcmRpbmcuXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFRoaXMgaGFuZGxlciB3b3JrcyBpbiB0aGUgc2FtZSB3YXkgYXMgdGhlIHtAbGluayB0ZWxsV29ya2VyVG9JZGVudGlmeX0gaGFuZGxlci5cbiAgICAgKiBTbyB5b3Ugc2hvdWxkIHdhaXQgZm9yIHRoZSB3b3JrZXIgdG8gaGF2ZSBpZGVudGlmaWVkIHRoZSBzaGFyZCBiZWZvcmUgcmVzb2x2aW5nIHRoZSBwcm9taXNlXG4gICAgICovXG4gICAgdGVsbFdvcmtlclRvUHJlcGFyZTogKHdvcmtlcklkOiBudW1iZXIsIHNoYXJkSWQ6IG51bWJlciwgYnVja2V0SWQ6IG51bWJlcikgPT4gUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIEhhbmRsZSBjYWxsZWQgd2hlbiBhbGwgdGhlIHdvcmtlcnMgaGF2ZSBmaW5pc2hlZCBwcmVwYXJpbmcgZm9yIHRoZSByZXNoYXJkaW5nLlxuICAgICAqXG4gICAgICogVGhpcyBzaG91bGQgbWFrZSB0aGUgbmV3IHJlc2hhcmRlZCBzaGFyZHMgYmVjb21lIHRoZSBhY3RpdmUgb25lcyBhbmQgc2h1dGRvd24gdGhlIG9sZCBvbmVzXG4gICAgICovXG4gICAgb25SZXNoYXJkaW5nU3dpdGNoOiAoKSA9PiBQcm9taXNlPHZvaWQ+XG4gIH1cbiAgLyoqIERldGVybWluZSBtYXggbnVtYmVyIG9mIHNoYXJkcyB0byB1c2UgYmFzZWQgdXBvbiB0aGUgbWF4IGNvbmN1cnJlbmN5LiAqL1xuICBjYWxjdWxhdGVUb3RhbFNoYXJkczogKCkgPT4gbnVtYmVyXG4gIC8qKiBEZXRlcm1pbmUgdGhlIGlkIG9mIHRoZSB3b3JrZXIgd2hpY2ggaXMgaGFuZGxpbmcgYSBzaGFyZC4gKi9cbiAgY2FsY3VsYXRlV29ya2VySWQ6IChzaGFyZElkOiBudW1iZXIpID0+IG51bWJlclxuICAvKiogUHJlcGFyZXMgYWxsIHRoZSBidWNrZXRzIHRoYXQgYXJlIGF2YWlsYWJsZSBmb3IgaWRlbnRpZnlpbmcgdGhlIHNoYXJkcy4gKi9cbiAgcHJlcGFyZUJ1Y2tldHM6ICgpID0+IHZvaWRcbiAgLyoqIFN0YXJ0IGlkZW50aWZ5aW5nIGFsbCB0aGUgc2hhcmRzLiAqL1xuICBzcGF3blNoYXJkczogKCkgPT4gUHJvbWlzZTx2b2lkPlxuICAvKiogU2h1dGRvd24gYWxsIHNoYXJkcy4gKi9cbiAgc2h1dGRvd246IChjb2RlOiBudW1iZXIsIHJlYXNvbjogc3RyaW5nLCBjbGVhclJlc2hhcmRpbmdJbnRlcnZhbD86IGJvb2xlYW4pID0+IFByb21pc2U8dm9pZD5cbiAgc2VuZFBheWxvYWQ6IChzaGFyZElkOiBudW1iZXIsIHBheWxvYWQ6IFNoYXJkU29ja2V0UmVxdWVzdCkgPT4gUHJvbWlzZTx2b2lkPlxuICAvKipcbiAgICogQWxsb3dzIHVzZXJzIHRvIGhvb2sgaW4gYW5kIGNoYW5nZSB0byBjb21tdW5pY2F0ZSB0byBkaWZmZXJlbnQgd29ya2VycyBhY3Jvc3MgZGlmZmVyZW50IHNlcnZlcnMgb3IgYW55dGhpbmcgdGhleSBsaWtlLlxuICAgKiBGb3IgZXhhbXBsZSB1c2luZyByZWRpcyBwdWJzdWIgdG8gdGFsayB0byBvdGhlciBzZXJ2ZXJzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIHNob3VsZCB3YWl0IGZvciB0aGUgd29ya2VyIHRvIGhhdmUgaWRlbnRpZmllZCB0aGUgc2hhcmQgYmVmb3JlIHJlc29sdmluZyB0aGUgcmV0dXJuZWQgcHJvbWlzZVxuICAgKi9cbiAgdGVsbFdvcmtlclRvSWRlbnRpZnk6ICh3b3JrZXJJZDogbnVtYmVyLCBzaGFyZElkOiBudW1iZXIsIGJ1Y2tldElkOiBudW1iZXIpID0+IFByb21pc2U8dm9pZD5cbiAgLyoqIFRlbGwgdGhlIG1hbmFnZXIgdG8gaWRlbnRpZnkgYSBTaGFyZC4gSWYgdGhpcyBTaGFyZCBpcyBub3QgYWxyZWFkeSBtYW5hZ2VkIHRoaXMgd2lsbCBhbHNvIGFkZCB0aGUgU2hhcmQgdG8gdGhlIG1hbmFnZXIuICovXG4gIGlkZW50aWZ5OiAoc2hhcmRJZDogbnVtYmVyKSA9PiBQcm9taXNlPHZvaWQ+XG4gIC8qKiBLaWxsIGEgc2hhcmQuIENsb3NlIGEgc2hhcmRzIGNvbm5lY3Rpb24gdG8gRGlzY29yZCdzIGdhdGV3YXkgKGlmIGFueSkgYW5kIHJlbW92ZSBpdCBmcm9tIHRoZSBtYW5hZ2VyLiAqL1xuICBraWxsOiAoc2hhcmRJZDogbnVtYmVyKSA9PiBQcm9taXNlPHZvaWQ+XG4gIC8qKiBUaGlzIGZ1bmN0aW9uIG1ha2VzIHN1cmUgdGhhdCB0aGUgYnVja2V0IGlzIGFsbG93ZWQgdG8gbWFrZSB0aGUgbmV4dCBpZGVudGlmeSByZXF1ZXN0LiAqL1xuICByZXF1ZXN0SWRlbnRpZnk6IChzaGFyZElkOiBudW1iZXIpID0+IFByb21pc2U8dm9pZD5cbiAgLyoqIENhbGN1bGF0ZXMgdGhlIG51bWJlciBvZiBzaGFyZHMgYmFzZWQgb24gdGhlIGd1aWxkIGlkIGFuZCB0b3RhbCBzaGFyZHMuICovXG4gIGNhbGN1bGF0ZVNoYXJkSWQ6IChndWlsZElkOiBCaWdTdHJpbmcsIHRvdGFsU2hhcmRzPzogbnVtYmVyKSA9PiBudW1iZXJcbiAgLyoqXG4gICAqIENvbm5lY3RzIHRoZSBib3QgdXNlciB0byBhIHZvaWNlIG9yIHN0YWdlIGNoYW5uZWwuXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gc2VuZHMgdGhlIF9VcGRhdGUgVm9pY2UgU3RhdGVfIGdhdGV3YXkgY29tbWFuZCBvdmVyIHRoZSBnYXRld2F5IGJlaGluZCB0aGUgc2NlbmVzLlxuICAgKlxuICAgKiBAcGFyYW0gZ3VpbGRJZCAtIFRoZSBJRCBvZiB0aGUgZ3VpbGQgdGhlIHZvaWNlIGNoYW5uZWwgdG8gbGVhdmUgaXMgaW4uXG4gICAqIEBwYXJhbSBjaGFubmVsSWQgLSBUaGUgSUQgb2YgdGhlIGNoYW5uZWwgeW91IHdhbnQgdG8gam9pbi5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogUmVxdWlyZXMgdGhlIGBDT05ORUNUYCBwZXJtaXNzaW9uLlxuICAgKlxuICAgKiBGaXJlcyBhIF9Wb2ljZSBTdGF0ZSBVcGRhdGVfIGdhdGV3YXkgZXZlbnQuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3RvcGljcy9nYXRld2F5I3VwZGF0ZS12b2ljZS1zdGF0ZX1cbiAgICovXG4gIGpvaW5Wb2ljZUNoYW5uZWw6IChndWlsZElkOiBCaWdTdHJpbmcsIGNoYW5uZWxJZDogQmlnU3RyaW5nLCBvcHRpb25zPzogQXRMZWFzdE9uZTxPbWl0PFVwZGF0ZVZvaWNlU3RhdGUsICdndWlsZElkJyB8ICdjaGFubmVsSWQnPj4pID0+IFByb21pc2U8dm9pZD5cbiAgLyoqXG4gICAqIEVkaXRzIHRoZSBib3Qgc3RhdHVzIGluIGFsbCBzaGFyZHMgdGhhdCB0aGlzIGdhdGV3YXkgbWFuYWdlcy5cbiAgICpcbiAgICogQHBhcmFtIGRhdGEgVGhlIHN0YXR1cyBkYXRhIHRvIHNldCB0aGUgYm90cyBzdGF0dXMgdG8uXG4gICAqIEByZXR1cm5zIG5vdGhpbmdcbiAgICovXG4gIGVkaXRCb3RTdGF0dXM6IChkYXRhOiBEaXNjb3JkVXBkYXRlUHJlc2VuY2UpID0+IFByb21pc2U8dm9pZD5cbiAgLyoqXG4gICAqIEVkaXRzIHRoZSBib3QncyBzdGF0dXMgb24gb25lIHNoYXJkLlxuICAgKlxuICAgKiBAcGFyYW0gc2hhcmRJZCBUaGUgc2hhcmQgaWQgdG8gZWRpdCB0aGUgc3RhdHVzIGZvci5cbiAgICogQHBhcmFtIGRhdGEgVGhlIHN0YXR1cyBkYXRhIHRvIHNldCB0aGUgYm90cyBzdGF0dXMgdG8uXG4gICAqIEByZXR1cm5zIG5vdGhpbmdcbiAgICovXG4gIGVkaXRTaGFyZFN0YXR1czogKHNoYXJkSWQ6IG51bWJlciwgZGF0YTogRGlzY29yZFVwZGF0ZVByZXNlbmNlKSA9PiBQcm9taXNlPHZvaWQ+XG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBsaXN0IG9mIG1lbWJlcnMgZm9yIGEgZ3VpbGQgb3ZlciB0aGUgZ2F0ZXdheS4gSWYgYGdhdGV3YXkuY2FjaGUucmVxdWVzdE1lbWJlcnMuZW5hYmxlZGAgaXMgbm90IHNldCwgdGhpcyBmdW5jdGlvbiB3aWxsIHJldHVybiBhbiBlbXB0eSBhcnJheSBhbmQgeW91J2xsIGhhdmUgdG8gaGFuZGxlIHRoZSBgR1VJTERfTUVNQkVSU19DSFVOS2AgZXZlbnRzIHlvdXJzZWxmLlxuICAgKlxuICAgKiBAcGFyYW0gZ3VpbGRJZCAtIFRoZSBJRCBvZiB0aGUgZ3VpbGQgdG8gZ2V0IHRoZSBsaXN0IG9mIG1lbWJlcnMgZm9yLlxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIFRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgZmV0Y2hpbmcgb2YgdGhlIG1lbWJlcnMuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIElmIHJlcXVlc3RpbmcgdGhlIGVudGlyZSBtZW1iZXIgbGlzdDpcbiAgICogLSBSZXF1aXJlcyB0aGUgYEdVSUxEX01FTUJFUlNgIGludGVudC5cbiAgICpcbiAgICogSWYgcmVxdWVzdGluZyBwcmVzZW5jZXMgKHtAbGluayBSZXF1ZXN0R3VpbGRNZW1iZXJzLnByZXNlbmNlcyB8IHByZXNlbmNlc30gc2V0IHRvIGB0cnVlYCk6XG4gICAqIC0gUmVxdWlyZXMgdGhlIGBHVUlMRF9QUkVTRU5DRVNgIGludGVudC5cbiAgICpcbiAgICogSWYgcmVxdWVzdGluZyBhIHByZWZpeCAoe0BsaW5rIFJlcXVlc3RHdWlsZE1lbWJlcnMucXVlcnkgfCBxdWVyeX0gbm9uLWB1bmRlZmluZWRgKTpcbiAgICogLSBSZXR1cm5zIGEgbWF4aW11bSBvZiAxMDAgbWVtYmVycy5cbiAgICpcbiAgICogSWYgcmVxdWVzdGluZyBhIHVzZXJzIGJ5IElEICh7QGxpbmsgUmVxdWVzdEd1aWxkTWVtYmVycy51c2VySWRzIHwgdXNlcklkc30gbm9uLWB1bmRlZmluZWRgKTpcbiAgICogLSBSZXR1cm5zIGEgbWF4aW11bSBvZiAxMDAgbWVtYmVycy5cbiAgICpcbiAgICogRmlyZXMgYSBfR3VpbGQgTWVtYmVycyBDaHVua18gZ2F0ZXdheSBldmVudCBmb3IgZXZlcnkgMTAwMCBtZW1iZXJzIGZldGNoZWQuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3RvcGljcy9nYXRld2F5I3JlcXVlc3QtZ3VpbGQtbWVtYmVyc31cbiAgICovXG4gIHJlcXVlc3RNZW1iZXJzOiAoZ3VpbGRJZDogQmlnU3RyaW5nLCBvcHRpb25zPzogT21pdDxSZXF1ZXN0R3VpbGRNZW1iZXJzLCAnZ3VpbGRJZCc+KSA9PiBQcm9taXNlPENhbWVsaXplPERpc2NvcmRNZW1iZXJXaXRoVXNlcltdPj5cbiAgLyoqXG4gICAqIExlYXZlcyB0aGUgdm9pY2UgY2hhbm5lbCB0aGUgYm90IHVzZXIgaXMgY3VycmVudGx5IGluLlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIHNlbmRzIHRoZSBfVXBkYXRlIFZvaWNlIFN0YXRlXyBnYXRld2F5IGNvbW1hbmQgb3ZlciB0aGUgZ2F0ZXdheSBiZWhpbmQgdGhlIHNjZW5lcy5cbiAgICpcbiAgICogQHBhcmFtIGd1aWxkSWQgLSBUaGUgSUQgb2YgdGhlIGd1aWxkIHRoZSB2b2ljZSBjaGFubmVsIHRvIGxlYXZlIGlzIGluLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBGaXJlcyBhIF9Wb2ljZSBTdGF0ZSBVcGRhdGVfIGdhdGV3YXkgZXZlbnQuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3RvcGljcy9nYXRld2F5I3VwZGF0ZS12b2ljZS1zdGF0ZX1cbiAgICovXG4gIGxlYXZlVm9pY2VDaGFubmVsOiAoZ3VpbGRJZDogQmlnU3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+XG4gIC8qKlxuICAgKiBVc2VkIHRvIHJlcXVlc3Qgc291bmRib2FyZCBzb3VuZHMgZm9yIGEgbGlzdCBvZiBndWlsZHMuXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gc2VuZHMgbXVsdGlwbGUgKHNlZSByZW1hcmtzKSBfUmVxdWVzdCBTb3VuZGJvYXJkIFNvdW5kc18gZ2F0ZXdheSBjb21tYW5kIG92ZXIgdGhlIGdhdGV3YXkgYmVoaW5kIHRoZSBzY2VuZXMuXG4gICAqXG4gICAqIEBwYXJhbSBndWlsZElkcyAtIFRoZSBndWlsZHMgdG8gZ2V0IHRoZSBzb3VuZHMgZnJvbVxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBGaXJlcyBhIF9Tb3VuZGJvYXJkIFNvdW5kc18gZ2F0ZXdheSBldmVudC5cbiAgICpcbiAgICog4pqg77iPIERpc2NvcmQgd2lsbCBzZW5kIHRoZSBfU291bmRib2FyZCBTb3VuZHNfIGZvciBlYWNoIG9mIHRoZSBndWlsZCBpZHNcbiAgICogaG93ZXZlciB5b3UgbWF5IG5vdCByZWNlaXZlIHRoZSBzYW1lIG51bWJlciBvZiBldmVudHMgYXMgdGhlIGlkcyBwYXNzZWQgdG8gX1JlcXVlc3QgU291bmRib2FyZCBTb3VuZHNfIGZvciBvbmUgb2YgdGhlIGZvbGxvd2luZyByZWFzb25zOlxuICAgKiAtIFRoZSBib3QgaXMgbm90IGluIHRoZSBzZXJ2ZXIgcHJvdmlkZWRcbiAgICogLSBUaGUgc2hhcmQgdGhlIG1lc3NhZ2UgaGFzIGJlZW4gc2VudCBmcm9tIGRvZXMgbm90IHJlY2VpdmUgZXZlbnRzIGZvciB0aGUgc3BlY2lmaWVkIGd1aWxkXG4gICAqXG4gICAqIFRvIGF2b2lkIHRoaXMgRGlzY29yZGVubyB3aWxsIGF1dG9tYXRpY2FsbHkgdHJ5IHRvIGdyb3VwIHRoZSBpZHMgYmFzZWQgb24gd2hhdCBzaGFyZCB0aGV5IHdpbGwgbmVlZCB0byBiZSBzZW50LCBidXQgdGhpcyBpbnZvbHZlcyBzZW5kaW5nIG11bHRpcGxlIG1lc3NhZ2VzIGluIG11bHRpcGxlIHNoYXJkc1xuICAgKlxuICAgKiBAc2VlIHtAbGluayBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy90b3BpY3MvZ2F0ZXdheS1ldmVudHMjcmVxdWVzdC1zb3VuZGJvYXJkLXNvdW5kc31cbiAgICovXG4gIHJlcXVlc3RTb3VuZGJvYXJkU291bmRzOiAoZ3VpbGRJZHM6IEJpZ1N0cmluZ1tdKSA9PiBQcm9taXNlPHZvaWQ+XG4gIC8qKiBUaGlzIG1hbmFnZXJzIGNhY2hlIHJlbGF0ZWQgc2V0dGluZ3MuICovXG4gIGNhY2hlOiB7XG4gICAgcmVxdWVzdE1lbWJlcnM6IHtcbiAgICAgIC8qKlxuICAgICAgICogV2hldGhlciBvciBub3QgcmVxdWVzdCBtZW1iZXIgcmVxdWVzdHMgc2hvdWxkIGJlIGNhY2hlZC5cbiAgICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICAgKi9cbiAgICAgIGVuYWJsZWQ6IGJvb2xlYW5cbiAgICAgIC8qKiBUaGUgcGVuZGluZyByZXF1ZXN0cy4gKi9cbiAgICAgIHBlbmRpbmc6IENvbGxlY3Rpb248c3RyaW5nLCBSZXF1ZXN0TWVtYmVyUmVxdWVzdD5cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZXF1ZXN0TWVtYmVyUmVxdWVzdCB7XG4gIC8qKiBUaGUgdW5pcXVlIG5vbmNlIGZvciB0aGlzIHJlcXVlc3QuICovXG4gIG5vbmNlOiBzdHJpbmdcbiAgLyoqIFRoZSByZXNvbHZlciBoYW5kbGVyIHRvIHJ1biB3aGVuIGFsbCBtZW1iZXJzIGFycml2ZS4gKi9cbiAgcmVzb2x2ZTogKHZhbHVlOiBDYW1lbGl6ZTxEaXNjb3JkTWVtYmVyV2l0aFVzZXJbXT4gfCBQcm9taXNlTGlrZTxDYW1lbGl6ZTxEaXNjb3JkTWVtYmVyV2l0aFVzZXJbXT4+KSA9PiB2b2lkXG4gIC8qKiBUaGUgbWVtYmVycyB0aGF0IGhhdmUgYWxyZWFkeSBhcnJpdmVkIGZvciB0aGlzIHJlcXVlc3QuICovXG4gIG1lbWJlcnM6IERpc2NvcmRNZW1iZXJXaXRoVXNlcltdXG59XG4iXSwibmFtZXMiOlsicmFuZG9tQnl0ZXMiLCJHYXRld2F5SW50ZW50cyIsIkdhdGV3YXlPcGNvZGVzIiwiQ29sbGVjdGlvbiIsImpzb25TYWZlUmVwbGFjZXIiLCJMZWFreUJ1Y2tldCIsImxvZ2dlciIsIlNoYXJkIiwiU2hhcmRTb2NrZXRDbG9zZUNvZGVzIiwiY3JlYXRlR2F0ZXdheU1hbmFnZXIiLCJvcHRpb25zIiwiY29ubmVjdGlvbk9wdGlvbnMiLCJjb25uZWN0aW9uIiwidXJsIiwic2hhcmRzIiwic2Vzc2lvblN0YXJ0TGltaXQiLCJtYXhDb25jdXJyZW5jeSIsInJlbWFpbmluZyIsInRvdGFsIiwicmVzZXRBZnRlciIsImdhdGV3YXkiLCJldmVudHMiLCJjb21wcmVzcyIsInRyYW5zcG9ydENvbXByZXNzaW9uIiwiaW50ZW50cyIsInByb3BlcnRpZXMiLCJvcyIsInByb2Nlc3MiLCJwbGF0Zm9ybSIsImJyb3dzZXIiLCJkZXZpY2UiLCJ0b2tlbiIsInZlcnNpb24iLCJ0b3RhbFNoYXJkcyIsImxhc3RTaGFyZElkIiwiZmlyc3RTaGFyZElkIiwidG90YWxXb3JrZXJzIiwic2hhcmRzUGVyV29ya2VyIiwic3Bhd25TaGFyZERlbGF5Iiwic3ByZWFkU2hhcmRzSW5Sb3VuZFJvYmluIiwiTWFwIiwiYnVja2V0cyIsImNhY2hlIiwicmVxdWVzdE1lbWJlcnMiLCJlbmFibGVkIiwicGVuZGluZyIsIm1ha2VQcmVzZW5jZSIsIlByb21pc2UiLCJyZXNvbHZlIiwidW5kZWZpbmVkIiwicmVzaGFyZGluZyIsInNoYXJkc0Z1bGxQZXJjZW50YWdlIiwiY2hlY2tJbnRlcnZhbCIsImdldFNlc3Npb25JbmZvIiwidXBkYXRlR3VpbGRzU2hhcmRJZCIsImNoZWNrSWZSZXNoYXJkaW5nSXNOZWVkZWQiLCJkZWJ1ZyIsIm5lZWRlZCIsIkVycm9yIiwic2Vzc2lvbkluZm8iLCJKU09OIiwic3RyaW5naWZ5IiwiaW5mbyIsInBlcmNlbnRhZ2UiLCJyZXNoYXJkIiwiY2FsY3VsYXRlVG90YWxTaGFyZHMiLCJjbGVhciIsInByZXBhcmVCdWNrZXRzIiwicHJvbWlzZXMiLCJBcnJheSIsImZyb20iLCJlbnRyaWVzIiwibWFwIiwiYnVja2V0SWQiLCJidWNrZXQiLCJ3b3JrZXIiLCJ3b3JrZXJzIiwic2hhcmRJZCIsInF1ZXVlIiwidGVsbFdvcmtlclRvUHJlcGFyZSIsImlkIiwiYWxsIiwib25SZXNoYXJkaW5nU3dpdGNoIiwid29ya2VySWQiLCJzaGFyZCIsIm1lc3NhZ2UiLCJfc2hhcmQiLCJwYXlsb2FkIiwidCIsImQiLCJndWlsZHMiLCJnIiwicmVxdWVzdElkZW50aWZ5Iiwic2V0IiwiaWRlbnRpZnkiLCJ2YWx1ZXMiLCJvbGRIYW5kbGVyIiwiXyIsInNodXRkb3duIiwiUmVzaGFyZGVkIiwiTWF0aCIsImNlaWwiLCJjYWxjdWxhdGVXb3JrZXJJZCIsIm1pbiIsImZsb29yIiwiaSIsImxlYWt5QnVja2V0IiwibWF4IiwicmVmaWxsQW1vdW50IiwicmVmaWxsSW50ZXJ2YWwiLCJnZXQiLCJmaW5kIiwidyIsInB1c2giLCJzcGF3blNoYXJkcyIsInRlbGxXb3JrZXJUb0lkZW50aWZ5IiwiY2xlYXJJbnRlcnZhbCIsImNoZWNrSW50ZXJ2YWxJZCIsIndhcm4iLCJzZXRJbnRlcnZhbCIsInJlc2hhcmRpbmdJbmZvIiwiY29kZSIsInJlYXNvbiIsImNsZWFyUmVzaGFyZGluZ0ludGVydmFsIiwiY2xvc2UiLCJzZW5kUGF5bG9hZCIsInNlbmQiLCJhY3F1aXJlIiwia2lsbCIsImRlbGV0ZSIsImNhbGN1bGF0ZVNoYXJkSWQiLCJndWlsZElkIiwiTnVtYmVyIiwiQmlnSW50Iiwiam9pblZvaWNlQ2hhbm5lbCIsImNoYW5uZWxJZCIsIm9wIiwiVm9pY2VTdGF0ZVVwZGF0ZSIsImd1aWxkX2lkIiwidG9TdHJpbmciLCJjaGFubmVsX2lkIiwic2VsZl9tdXRlIiwic2VsZk11dGUiLCJzZWxmX2RlYWYiLCJzZWxmRGVhZiIsImVkaXRCb3RTdGF0dXMiLCJkYXRhIiwiZWRpdFNoYXJkU3RhdHVzIiwiUHJlc2VuY2VVcGRhdGUiLCJzaW5jZSIsImFmayIsImFjdGl2aXRpZXMiLCJzdGF0dXMiLCJsaW1pdCIsIkd1aWxkTWVtYmVycyIsInVzZXJJZHMiLCJsZW5ndGgiLCJub25jZSIsImhhcyIsIm1lbWJlcnMiLCJyZWplY3QiLCJSZXF1ZXN0R3VpbGRNZW1iZXJzIiwicXVlcnkiLCJwcmVzZW5jZXMiLCJ1c2VyX2lkcyIsImxlYXZlVm9pY2VDaGFubmVsIiwicmVxdWVzdFNvdW5kYm9hcmRTb3VuZHMiLCJndWlsZElkcyIsImlkcyIsIlJlcXVlc3RTb3VuZGJvYXJkU291bmRzIiwiZ3VpbGRfaWRzIl0sIm1hcHBpbmdzIjoiQUFBQSxTQUFTQSxXQUFXLFFBQVEsY0FBYTtBQUN6QyxTQVFFQyxjQUFjLEVBQ2RDLGNBQWMsUUFFVCxvQkFBbUI7QUFDMUIsU0FBU0MsVUFBVSxFQUFFQyxnQkFBZ0IsRUFBRUMsV0FBVyxFQUFFQyxNQUFNLFFBQVEsb0JBQW1CO0FBQ3JGLE9BQU9DLFdBQVcsYUFBWTtBQUM5QixTQUEyQkMscUJBQXFCLFFBQW1GLGFBQVk7QUFFL0ksT0FBTyxT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
