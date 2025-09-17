import { logger } from '@discordeno/utils';
/**
 * A invalid request bucket is used in a similar manner as a leaky bucket but a invalid request bucket can be refilled as needed.
 * It's purpose is to make sure the bot does not hit the limit to getting a 1 hr ban.
 *
 * @param options The options used to configure this bucket.
 * @returns RefillingBucket
 */
export declare function createInvalidRequestBucket(options: InvalidRequestBucketOptions): InvalidRequestBucket;
export interface InvalidRequestBucketOptions {
    /** current invalid amount */
    current?: number;
    /** max invalid requests allowed until ban. Defaults to 10,000 */
    max?: number;
    /** The time that discord allows to make the max number of invalid requests. Defaults to 10 minutes */
    interval?: number;
    /** When the timeout for the bucket has started at. */
    resetAt?: number;
    /** how safe to be from max. Defaults to 1 */
    safety?: number;
    /** The request statuses that count as an invalid request. */
    errorStatuses?: number[];
    /** The amount of requests that were requested from this bucket. */
    requested?: number;
    /** The logger that will be used for the bucket */
    logger?: Pick<typeof logger, 'debug' | 'info' | 'warn' | 'error' | 'fatal'>;
}
export interface InvalidRequestBucket {
    /** current invalid amount */
    invalidRequests: number;
    /** max invalid requests allowed until ban. Defaults to 10,000 */
    max: number;
    /** The time that discord allows to make the max number of invalid requests. Defaults to 10 minutes */
    interval: number;
    /** When the timeout for this bucket has started at. */
    resetAt: number | undefined;
    /** how safe to be from max. Defaults to 1 */
    safety: number;
    /** The request statuses that count as an invalid request. */
    errorStatuses: number[];
    /** The amount of requests that were requested from this bucket. */
    activeRequests: number;
    /** The requests that are currently pending. */
    waiting: Array<(value: void | PromiseLike<void>) => void>;
    /** Whether or not the waiting queue is already processing. */
    processing: boolean;
    /** The logger that will be used for the bucket */
    logger: Pick<typeof logger, 'debug' | 'info' | 'warn' | 'error' | 'fatal'>;
    /** Gives the number of requests that are currently allowed. */
    requestsAllowed: () => number;
    /** Checks if a request is allowed at this time. */
    isRequestAllowed: () => boolean;
    /** Waits until a request is available */
    waitUntilRequestAvailable: () => Promise<void>;
    /** Begins processing the waiting queue of requests. */
    processWaiting: () => Promise<void>;
    /** Handler for whenever a request is validated. This should update the requested values or trigger any other necessary stuff. */
    handleCompletedRequest: (code: number, sharedScope: boolean) => void;
}
//# sourceMappingURL=invalidBucket.d.ts.map