import logger from './logger.js';
export declare class LeakyBucket implements LeakyBucketOptions {
    max: number;
    refillInterval: number;
    refillAmount: number;
    /** The amount of requests that have been used up already. */
    used: number;
    /** The queue of requests to acquire an available request. Mapped by <shardId, resolve()> */
    queue: Array<(value: void | PromiseLike<void>) => void>;
    /** Whether or not the queue is already processing. */
    processing: boolean;
    /** The timeout id for the timer to reduce the used amount by the refill amount. */
    timeoutId?: NodeJS.Timeout;
    /** The timestamp in milliseconds when the next refill is scheduled. */
    refillsAt?: number;
    /** Logger used in the leaky bucket */
    logger: Pick<typeof logger, 'debug' | 'info' | 'warn' | 'error' | 'fatal'>;
    constructor(options?: LeakyBucketOptions);
    /** The amount of requests that still remain. */
    get remaining(): number;
    /** Refills the bucket as needed. */
    refillBucket(): void;
    /** Begin processing the queue. */
    processQueue(): Promise<void>;
    /** Pauses the execution until the request is available to be made. */
    acquire(highPriority?: boolean): Promise<void>;
}
export interface LeakyBucketOptions {
    /**
     * Max requests allowed at once.
     * @default 1
     */
    max?: number;
    /**
     * Interval in milliseconds between refills.
     * @default 5000
     */
    refillInterval?: number;
    /**
     * Amount of requests to refill at each interval.
     * @default 1
     */
    refillAmount?: number;
    /**
     * The logger that the leaky bucket will use
     * @default logger // The logger exported by `@discordeno/utils`
     */
    logger?: Pick<typeof logger, 'debug' | 'info' | 'warn' | 'error' | 'fatal'>;
}
//# sourceMappingURL=bucket.d.ts.map