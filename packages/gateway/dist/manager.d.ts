import { type AtLeastOne, type BigString, type Camelize, type DiscordGetGatewayBot, type DiscordMemberWithUser, type DiscordUpdatePresence, type RequestGuildMembers } from '@discordeno/types';
import { Collection, LeakyBucket, logger } from '@discordeno/utils';
import Shard from './Shard.js';
import { type ShardEvents, type ShardSocketRequest, type TransportCompression, type UpdateVoiceState } from './types.js';
export declare function createGatewayManager(options: CreateGatewayManagerOptions): GatewayManager;
export interface CreateGatewayManagerOptions {
    /**
     * Id of the first Shard which should get controlled by this manager.
     * @default 0
     */
    firstShardId?: number;
    /**
     * Id of the last Shard which should get controlled by this manager.
     * @default 0
     */
    lastShardId?: number;
    /**
     * Delay in milliseconds to wait before spawning next shard. OPTIMAL IS ABOVE 5100. YOU DON'T WANT TO HIT THE RATE LIMIT!!!
     * @default 5300
     */
    spawnShardDelay?: number;
    /**
     * Total amount of shards your bot uses. Useful for zero-downtime updates or resharding.
     * @default 1
     */
    totalShards?: number;
    /**
     * The amount of shards to load per worker.
     * @default 25
     */
    shardsPerWorker?: number;
    /**
     * The total amount of workers to use for your bot.
     * @default 4
     */
    totalWorkers?: number;
    /**
     * Whether to spread shards across workers in a round-robin manner.
     *
     * @remarks
     * By default, shards are assigned to workers in contiguous blocks based on shardsPerWorker. If any shard is left over, it will be assigned to the last worker.
     * This means that if you have 3 workers and 40 shards while shardsPerWorker is 10, the first worker will get shards 0-9, the second worker will get shards 10-19, and so on, the last worker will get shards 20-39.
     *
     * If this option is set to true, the shards will be assigned in a round-robin manner to spread more evenly across workers.
     * For example, with 3 workers and 40 shards, the first shard will go to worker 0, the second shard to worker 1, the third shard to worker 2, the fourth shard to worker 0, and so on.
     *
     * @default false
     */
    spreadShardsInRoundRobin?: boolean;
    /** Important data which is used by the manager to connect shards to the gateway. */
    connection?: Camelize<DiscordGetGatewayBot>;
    /** Whether incoming payloads are compressed using zlib.
     *
     * @default false
     */
    compress?: boolean;
    /** What transport compression should be used */
    transportCompression?: TransportCompression | null;
    /** The calculated intent value of the events which the shard should receive.
     *
     * @default 0
     */
    intents?: number;
    /** Identify properties to use */
    properties?: {
        /** Operating system the shard runs on.
         *
         * @default "darwin" | "linux" | "windows"
         */
        os: string;
        /** The "browser" where this shard is running on.
         *
         * @default "Discordeno"
         */
        browser: string;
        /** The device on which the shard is running.
         *
         * @default "Discordeno"
         */
        device: string;
    };
    /** Bot token which is used to connect to Discord */
    token: string;
    /** The URL of the gateway which should be connected to.
     *
     * @default "wss://gateway.discord.gg"
     */
    url?: string;
    /** The gateway version which should be used.
     *
     * @default 10
     */
    version?: number;
    /** The events handlers */
    events?: ShardEvents;
    /** This managers cache related settings. */
    cache?: {
        requestMembers?: {
            /**
             * Whether or not request member requests should be cached.
             * @default false
             */
            enabled?: boolean;
        };
    };
    /**
     * The logger that the gateway manager will use.
     * @default logger // The logger exported by `@discordeno/utils`
     */
    logger?: Pick<typeof logger, 'debug' | 'info' | 'warn' | 'error' | 'fatal'>;
    /**
     * Make the presence for when the bot connects to the gateway
     *
     * @remarks
     * This function will be called each time a Shard is going to identify
     */
    makePresence?: () => Promise<DiscordUpdatePresence | undefined>;
    /** Options related to resharding. */
    resharding?: {
        /**
         * Whether or not automated resharding should be enabled.
         * @default true
         */
        enabled: boolean;
        /**
         * The % of how full a shard is when resharding should be triggered.
         *
         * @remarks
         * We use discord recommended shard value to get an **approximation** of the shard full percentage to compare with this value so the bot may not reshard at the exact percentage provided but may reshard when it is a bit higher than the provided percentage.
         * For accurate calculation, you may override the `checkIfReshardingIsNeeded` function
         *
         * @default 80 as in 80%
         */
        shardsFullPercentage: number;
        /**
         * The interval in milliseconds, of how often to check whether resharding is needed and reshard automatically. Set to -1 to disable auto resharding.
         * @default 28800000 (8 hours)
         */
        checkInterval: number;
        /** Handler to get shard count and other session info. */
        getSessionInfo?: () => Promise<Camelize<DiscordGetGatewayBot>>;
        /** Handler to edit the shard id on any cached guilds. */
        updateGuildsShardId?: (guildIds: string[], shardId: number) => Promise<void>;
    };
}
export interface GatewayManager extends Required<CreateGatewayManagerOptions> {
    /** The max concurrency buckets. Those will be created when the `spawnShards` (which calls `prepareBuckets` under the hood) function gets called. */
    buckets: Map<number, {
        workers: Array<{
            id: number;
            queue: number[];
        }>;
        /** The bucket to queue the identifies. */
        leakyBucket: LeakyBucket;
    }>;
    /** The shards that are created. */
    shards: Map<number, Shard>;
    /** The logger for the gateway manager. */
    logger: Pick<typeof logger, 'debug' | 'info' | 'warn' | 'error' | 'fatal'>;
    /** Everything related to resharding. */
    resharding: CreateGatewayManagerOptions['resharding'] & {
        /** The interval id of the check interval. This is used to clear the interval when the manager is shutdown. */
        checkIntervalId?: NodeJS.Timeout | undefined;
        /** Holds the shards that resharding has created. Once resharding is done, this replaces the gateway.shards */
        shards: Map<number, Shard>;
        /** Handler to check if resharding is necessary. */
        checkIfReshardingIsNeeded: () => Promise<{
            needed: boolean;
            info?: Camelize<DiscordGetGatewayBot>;
        }>;
        /**
         * Handler to begin resharding.
         *
         * @remarks
         * This function will resolve once the resharding is done.
         * So when all the calls to {@link tellWorkerToPrepare} and {@link onReshardingSwitch} are done.
         */
        reshard: (info: Camelize<DiscordGetGatewayBot> & {
            firstShardId?: number;
            lastShardId?: number;
        }) => Promise<void>;
        /**
         * Handler to communicate to a worker that it needs to spawn a new shard and identify it for the resharding.
         *
         * @remarks
         * This handler works in the same way as the {@link tellWorkerToIdentify} handler.
         * So you should wait for the worker to have identified the shard before resolving the promise
         */
        tellWorkerToPrepare: (workerId: number, shardId: number, bucketId: number) => Promise<void>;
        /**
         * Handle called when all the workers have finished preparing for the resharding.
         *
         * This should make the new resharded shards become the active ones and shutdown the old ones
         */
        onReshardingSwitch: () => Promise<void>;
    };
    /** Determine max number of shards to use based upon the max concurrency. */
    calculateTotalShards: () => number;
    /** Determine the id of the worker which is handling a shard. */
    calculateWorkerId: (shardId: number) => number;
    /** Prepares all the buckets that are available for identifying the shards. */
    prepareBuckets: () => void;
    /** Start identifying all the shards. */
    spawnShards: () => Promise<void>;
    /** Shutdown all shards. */
    shutdown: (code: number, reason: string, clearReshardingInterval?: boolean) => Promise<void>;
    sendPayload: (shardId: number, payload: ShardSocketRequest) => Promise<void>;
    /**
     * Allows users to hook in and change to communicate to different workers across different servers or anything they like.
     * For example using redis pubsub to talk to other servers.
     *
     * @remarks
     * This should wait for the worker to have identified the shard before resolving the returned promise
     */
    tellWorkerToIdentify: (workerId: number, shardId: number, bucketId: number) => Promise<void>;
    /** Tell the manager to identify a Shard. If this Shard is not already managed this will also add the Shard to the manager. */
    identify: (shardId: number) => Promise<void>;
    /** Kill a shard. Close a shards connection to Discord's gateway (if any) and remove it from the manager. */
    kill: (shardId: number) => Promise<void>;
    /** This function makes sure that the bucket is allowed to make the next identify request. */
    requestIdentify: (shardId: number) => Promise<void>;
    /** Calculates the number of shards based on the guild id and total shards. */
    calculateShardId: (guildId: BigString, totalShards?: number) => number;
    /**
     * Connects the bot user to a voice or stage channel.
     *
     * This function sends the _Update Voice State_ gateway command over the gateway behind the scenes.
     *
     * @param guildId - The ID of the guild the voice channel to leave is in.
     * @param channelId - The ID of the channel you want to join.
     *
     * @remarks
     * Requires the `CONNECT` permission.
     *
     * Fires a _Voice State Update_ gateway event.
     *
     * @see {@link https://discord.com/developers/docs/topics/gateway#update-voice-state}
     */
    joinVoiceChannel: (guildId: BigString, channelId: BigString, options?: AtLeastOne<Omit<UpdateVoiceState, 'guildId' | 'channelId'>>) => Promise<void>;
    /**
     * Edits the bot status in all shards that this gateway manages.
     *
     * @param data The status data to set the bots status to.
     * @returns nothing
     */
    editBotStatus: (data: DiscordUpdatePresence) => Promise<void>;
    /**
     * Edits the bot's status on one shard.
     *
     * @param shardId The shard id to edit the status for.
     * @param data The status data to set the bots status to.
     * @returns nothing
     */
    editShardStatus: (shardId: number, data: DiscordUpdatePresence) => Promise<void>;
    /**
     * Fetches the list of members for a guild over the gateway. If `gateway.cache.requestMembers.enabled` is not set, this function will return an empty array and you'll have to handle the `GUILD_MEMBERS_CHUNK` events yourself.
     *
     * @param guildId - The ID of the guild to get the list of members for.
     * @param options - The parameters for the fetching of the members.
     *
     * @remarks
     * If requesting the entire member list:
     * - Requires the `GUILD_MEMBERS` intent.
     *
     * If requesting presences ({@link RequestGuildMembers.presences | presences} set to `true`):
     * - Requires the `GUILD_PRESENCES` intent.
     *
     * If requesting a prefix ({@link RequestGuildMembers.query | query} non-`undefined`):
     * - Returns a maximum of 100 members.
     *
     * If requesting a users by ID ({@link RequestGuildMembers.userIds | userIds} non-`undefined`):
     * - Returns a maximum of 100 members.
     *
     * Fires a _Guild Members Chunk_ gateway event for every 1000 members fetched.
     *
     * @see {@link https://discord.com/developers/docs/topics/gateway#request-guild-members}
     */
    requestMembers: (guildId: BigString, options?: Omit<RequestGuildMembers, 'guildId'>) => Promise<Camelize<DiscordMemberWithUser[]>>;
    /**
     * Leaves the voice channel the bot user is currently in.
     *
     * This function sends the _Update Voice State_ gateway command over the gateway behind the scenes.
     *
     * @param guildId - The ID of the guild the voice channel to leave is in.
     *
     * @remarks
     * Fires a _Voice State Update_ gateway event.
     *
     * @see {@link https://discord.com/developers/docs/topics/gateway#update-voice-state}
     */
    leaveVoiceChannel: (guildId: BigString) => Promise<void>;
    /**
     * Used to request soundboard sounds for a list of guilds.
     *
     * This function sends multiple (see remarks) _Request Soundboard Sounds_ gateway command over the gateway behind the scenes.
     *
     * @param guildIds - The guilds to get the sounds from
     *
     * @remarks
     * Fires a _Soundboard Sounds_ gateway event.
     *
     * ⚠️ Discord will send the _Soundboard Sounds_ for each of the guild ids
     * however you may not receive the same number of events as the ids passed to _Request Soundboard Sounds_ for one of the following reasons:
     * - The bot is not in the server provided
     * - The shard the message has been sent from does not receive events for the specified guild
     *
     * To avoid this Discordeno will automatically try to group the ids based on what shard they will need to be sent, but this involves sending multiple messages in multiple shards
     *
     * @see {@link https://discord.com/developers/docs/topics/gateway-events#request-soundboard-sounds}
     */
    requestSoundboardSounds: (guildIds: BigString[]) => Promise<void>;
    /** This managers cache related settings. */
    cache: {
        requestMembers: {
            /**
             * Whether or not request member requests should be cached.
             * @default false
             */
            enabled: boolean;
            /** The pending requests. */
            pending: Collection<string, RequestMemberRequest>;
        };
    };
}
export interface RequestMemberRequest {
    /** The unique nonce for this request. */
    nonce: string;
    /** The resolver handler to run when all members arrive. */
    resolve: (value: Camelize<DiscordMemberWithUser[]> | PromiseLike<Camelize<DiscordMemberWithUser[]>>) => void;
    /** The members that have already arrived for this request. */
    members: DiscordMemberWithUser[];
}
//# sourceMappingURL=manager.d.ts.map