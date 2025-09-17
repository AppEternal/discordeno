import type { RestManager, SendRequestOptions } from './types.js';
export declare class Queue {
    /** The rest manager */
    rest: RestManager;
    /** Amount of requests that have are remaining. Defaults to 1. */
    remaining: number;
    /** Max requests for this this. Defaults to 1. */
    max: number;
    /** The time that discord allows to make the max number of requests. Defaults to 0 */
    interval: number;
    /** timer to reset to 0 */
    timeoutId: NodeJS.Timeout | undefined;
    /** The requests that are currently pending. */
    waiting: Array<(value: void | PromiseLike<void>) => void>;
    /** The requests that are currently pending. */
    pending: SendRequestOptions[];
    /** Whether or not the waiting queue is already processing. */
    processing: boolean;
    /** Whether or not the pending queue is already processing. */
    processingPending: boolean;
    /** Whether the first request is pending. */
    firstRequest: boolean;
    /** The url that all the requests in this queue are sent to. */
    url: string;
    /** When requests started being made to determine when the interval will reset it. */
    frozenAt: number;
    /** The time in milliseconds to wait before deleting this queue if it is empty. Defaults to 60000(one minute). */
    deleteQueueDelay: number;
    /** The timeout for the deletion of this queue */
    deleteQueueTimeout?: NodeJS.Timeout;
    /**
     * The identifier for this request, may be the request authorization or fallback to the bot auth
     *
     * @remarks
     * This is used to get the identify this queue from the queue mapping of the rest manager
     */
    identifier: string;
    constructor(rest: RestManager, options: QueueOptions);
    /** Check if there is any remaining requests that are allowed. */
    isRequestAllowed(): boolean;
    /** Pauses the execution until a request is allowed to be made. */
    waitUntilRequestAvailable(): Promise<void>;
    /** Process the queue of requests waiting to be handled. */
    processWaiting(): Promise<void>;
    /** Process the queue of all requests pending to be sent. */
    processPending(): Promise<void>;
    handleCompletedRequest(headers: {
        max?: number;
        interval?: number;
        remaining?: number;
    }): void;
    /** Checks if a request is available and adds it to the queue. Also triggers queue processing if not already processing. */
    makeRequest(options: SendRequestOptions): Promise<void>;
    /** Cleans up the queue by checking if there is nothing left and removing it. */
    cleanup(): void;
    /** Simply checks if the queue is able to be cleared or it has requests pending. */
    isQueueClearable(): boolean;
    get queueType(): string;
}
export interface QueueOptions {
    /** How many requests are remaining. Defaults to 1 */
    remaining?: number;
    /** Max number of requests allowed in this this. Defaults to 1. */
    max?: number;
    /** The time in milliseconds that discord allows to make the max number of invalid requests. Defaults to 0 */
    interval?: number;
    /** timer to reset to 0 */
    timeoutId?: NodeJS.Timeout;
    /** The url this queue will be handling. */
    url: string;
    /** The time in milliseconds to wait before deleting this queue if it is empty. Defaults to 60000(one minute). */
    deleteQueueDelay?: number;
    /** The base key that identifies this queue in the rest manager */
    identifier: string;
}
//# sourceMappingURL=queue.d.ts.map