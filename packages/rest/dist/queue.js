import { delay } from '@discordeno/utils';
export class Queue {
    constructor(rest, options){
        /** Amount of requests that have are remaining. Defaults to 1. */ this.remaining = 1;
        /** Max requests for this this. Defaults to 1. */ this.max = 1;
        /** The time that discord allows to make the max number of requests. Defaults to 0 */ this.interval = 0;
        /** The requests that are currently pending. */ this.waiting = [];
        /** The requests that are currently pending. */ this.pending = [];
        /** Whether or not the waiting queue is already processing. */ this.processing = false;
        /** Whether or not the pending queue is already processing. */ this.processingPending = false;
        /** Whether the first request is pending. */ this.firstRequest = false;
        /** When requests started being made to determine when the interval will reset it. */ this.frozenAt = 0;
        /** The time in milliseconds to wait before deleting this queue if it is empty. Defaults to 60000(one minute). */ this.deleteQueueDelay = 60000;
        this.rest = rest;
        this.url = options.url;
        this.identifier = options.identifier;
        if (options.interval) this.interval = options.interval;
        if (options.max) this.max = options.max;
        if (options.remaining) this.remaining = options.remaining;
        if (options.timeoutId) this.timeoutId = options.timeoutId;
        if (options.deleteQueueDelay) this.deleteQueueDelay = options.deleteQueueDelay;
    }
    /** Check if there is any remaining requests that are allowed. */ isRequestAllowed() {
        return this.remaining > 0;
    }
    /** Pauses the execution until a request is allowed to be made. */ async waitUntilRequestAvailable() {
        return await new Promise(async (resolve)=>{
            // If whatever amount of requests is left is more than the safety margin, allow the request
            if (this.isRequestAllowed()) {
                // this.remaining++;
                resolve();
            } else {
                this.waiting.push(resolve);
                await this.processWaiting();
            }
        });
    }
    /** Process the queue of requests waiting to be handled. */ async processWaiting() {
        // If already processing, that loop will handle all waiting requests.
        if (this.processing) return;
        // Mark as processing so other loops don't start
        this.processing = true;
        while(this.waiting.length > 0){
            this.rest.logger.debug(`[Queue] ${this.queueType} ${this.url} process waiting while loop ran.`);
            if (this.isRequestAllowed()) {
                // Resolve the next item in the queue
                this.waiting.shift()?.();
            } else {
                await delay(1000);
            }
        }
        // Mark as false so next pending request can be triggered by new loop.
        this.processing = false;
    }
    /** Process the queue of all requests pending to be sent. */ async processPending() {
        // If already processing, that loop will handle all pending requests.
        if (this.processingPending || !this.pending.length) return;
        // Mark as processing so other loops don't start
        this.processingPending = true;
        while(this.pending.length > 0){
            this.rest.logger.debug(`Queue ${this.queueType} ${this.url} process pending while loop ran with ${this.pending.length}.`);
            if (!this.firstRequest && !this.isRequestAllowed()) {
                const now = Date.now();
                const future = this.frozenAt + this.interval;
                await delay(future > now ? future - now : 1000);
                continue;
            }
            const request = this.pending[0];
            if (request) {
                const basicURL = this.rest.simplifyUrl(request.route, request.method);
                // If this url is still rate limited, try again
                const urlResetIn = this.rest.checkRateLimits(basicURL, this.identifier);
                if (urlResetIn) await delay(urlResetIn);
                // IF A BUCKET EXISTS, CHECK THE BUCKET'S RATE LIMITS
                const bucketResetIn = request.bucketId ? this.rest.checkRateLimits(request.bucketId, this.identifier) : false;
                if (bucketResetIn) await delay(bucketResetIn);
                this.firstRequest = false;
                this.remaining--;
                if (this.remaining === 0 && this.interval !== 0) {
                    this.timeoutId ??= setTimeout(()=>{
                        this.remaining = this.max;
                        this.timeoutId = undefined;
                    }, this.interval);
                }
                // Remove from queue, we are executing it.
                this.pending.shift();
                // Check if this request is able to be made globally
                await this.rest.invalidBucket.waitUntilRequestAvailable();
                await this.rest.sendRequest(request)// Should be handled in sendRequest, this catch just prevents bots from dying
                .catch(()=>null);
            }
        }
        this.rest.logger.debug(`Queue ${this.queueType} ${this.url} process pending while loop exited with ${this.pending.length}.`);
        // Mark as false so next pending request can be triggered by new loop.
        this.processingPending = false;
        this.cleanup();
    }
    handleCompletedRequest(headers) {
        if (headers.max === 0) {
            this.remaining++;
            return;
        }
        if (!this.frozenAt) this.frozenAt = Date.now();
        if (headers.interval !== undefined) this.interval = headers.interval;
        if (headers.remaining !== undefined) this.remaining = headers.remaining;
        if (this.remaining <= 1) {
            this.timeoutId ??= setTimeout(()=>{
                this.remaining = this.max;
                this.timeoutId = undefined;
            }, headers.interval);
        }
    }
    /** Checks if a request is available and adds it to the queue. Also triggers queue processing if not already processing. */ async makeRequest(options) {
        await this.waitUntilRequestAvailable();
        this.pending.push(options);
        this.processPending();
    }
    /** Cleans up the queue by checking if there is nothing left and removing it. */ cleanup() {
        if (!this.isQueueClearable()) {
            this.processPending();
            return;
        }
        this.rest.logger.debug(`[Queue] ${this.queueType} ${this.url}. Delaying delete for ${this.deleteQueueDelay}ms`);
        // Delete in a minute giving a bit of time to allow new requests that may reuse this queue
        clearTimeout(this.deleteQueueTimeout);
        this.deleteQueueTimeout = setTimeout(()=>{
            if (!this.isQueueClearable()) {
                this.rest.logger.debug(`[Queue] ${this.queueType} ${this.url}. is not clearable. Restarting processing of queue.`);
                this.processPending();
                return;
            }
            this.rest.logger.debug(`[Queue] ${this.queueType} ${this.url}. Deleting`);
            if (this.timeoutId) clearTimeout(this.timeoutId);
            // No requests have been requested for this queue so we nuke this queue
            this.rest.queues.delete(`${this.identifier}${this.url}`);
            this.rest.logger.debug(`[Queue] ${this.queueType} ${this.url}. Deleted! Remaining: (${this.rest.queues.size})`, [
                ...this.rest.queues.values()
            ].map((queue)=>`${queue.queueType}${queue.url}`));
        }, this.deleteQueueDelay);
    }
    /** Simply checks if the queue is able to be cleared or it has requests pending. */ isQueueClearable() {
        if (this.firstRequest) return false;
        if (this.waiting.length > 0) return false;
        if (this.pending.length > 0) return false;
        if (this.processing) return false;
        if (this.processingPending) return false;
        return true;
    }
    get queueType() {
        return this.identifier.slice(0, this.identifier.indexOf(' '));
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9xdWV1ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZWxheSB9IGZyb20gJ0BkaXNjb3JkZW5vL3V0aWxzJ1xuaW1wb3J0IHR5cGUgeyBSZXN0TWFuYWdlciwgU2VuZFJlcXVlc3RPcHRpb25zIH0gZnJvbSAnLi90eXBlcy5qcydcblxuZXhwb3J0IGNsYXNzIFF1ZXVlIHtcbiAgLyoqIFRoZSByZXN0IG1hbmFnZXIgKi9cbiAgcmVzdDogUmVzdE1hbmFnZXJcbiAgLyoqIEFtb3VudCBvZiByZXF1ZXN0cyB0aGF0IGhhdmUgYXJlIHJlbWFpbmluZy4gRGVmYXVsdHMgdG8gMS4gKi9cbiAgcmVtYWluaW5nOiBudW1iZXIgPSAxXG4gIC8qKiBNYXggcmVxdWVzdHMgZm9yIHRoaXMgdGhpcy4gRGVmYXVsdHMgdG8gMS4gKi9cbiAgbWF4OiBudW1iZXIgPSAxXG4gIC8qKiBUaGUgdGltZSB0aGF0IGRpc2NvcmQgYWxsb3dzIHRvIG1ha2UgdGhlIG1heCBudW1iZXIgb2YgcmVxdWVzdHMuIERlZmF1bHRzIHRvIDAgKi9cbiAgaW50ZXJ2YWw6IG51bWJlciA9IDBcbiAgLyoqIHRpbWVyIHRvIHJlc2V0IHRvIDAgKi9cbiAgdGltZW91dElkOiBOb2RlSlMuVGltZW91dCB8IHVuZGVmaW5lZFxuICAvKiogVGhlIHJlcXVlc3RzIHRoYXQgYXJlIGN1cnJlbnRseSBwZW5kaW5nLiAqL1xuICB3YWl0aW5nOiBBcnJheTwodmFsdWU6IHZvaWQgfCBQcm9taXNlTGlrZTx2b2lkPikgPT4gdm9pZD4gPSBbXVxuICAvKiogVGhlIHJlcXVlc3RzIHRoYXQgYXJlIGN1cnJlbnRseSBwZW5kaW5nLiAqL1xuICBwZW5kaW5nOiBTZW5kUmVxdWVzdE9wdGlvbnNbXSA9IFtdXG4gIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGUgd2FpdGluZyBxdWV1ZSBpcyBhbHJlYWR5IHByb2Nlc3NpbmcuICovXG4gIHByb2Nlc3Npbmc6IGJvb2xlYW4gPSBmYWxzZVxuICAvKiogV2hldGhlciBvciBub3QgdGhlIHBlbmRpbmcgcXVldWUgaXMgYWxyZWFkeSBwcm9jZXNzaW5nLiAqL1xuICBwcm9jZXNzaW5nUGVuZGluZzogYm9vbGVhbiA9IGZhbHNlXG4gIC8qKiBXaGV0aGVyIHRoZSBmaXJzdCByZXF1ZXN0IGlzIHBlbmRpbmcuICovXG4gIGZpcnN0UmVxdWVzdDogYm9vbGVhbiA9IGZhbHNlXG4gIC8qKiBUaGUgdXJsIHRoYXQgYWxsIHRoZSByZXF1ZXN0cyBpbiB0aGlzIHF1ZXVlIGFyZSBzZW50IHRvLiAqL1xuICB1cmw6IHN0cmluZ1xuICAvKiogV2hlbiByZXF1ZXN0cyBzdGFydGVkIGJlaW5nIG1hZGUgdG8gZGV0ZXJtaW5lIHdoZW4gdGhlIGludGVydmFsIHdpbGwgcmVzZXQgaXQuICovXG4gIGZyb3plbkF0OiBudW1iZXIgPSAwXG4gIC8qKiBUaGUgdGltZSBpbiBtaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgZGVsZXRpbmcgdGhpcyBxdWV1ZSBpZiBpdCBpcyBlbXB0eS4gRGVmYXVsdHMgdG8gNjAwMDAob25lIG1pbnV0ZSkuICovXG4gIGRlbGV0ZVF1ZXVlRGVsYXk6IG51bWJlciA9IDYwMDAwXG4gIC8qKiBUaGUgdGltZW91dCBmb3IgdGhlIGRlbGV0aW9uIG9mIHRoaXMgcXVldWUgKi9cbiAgZGVsZXRlUXVldWVUaW1lb3V0PzogTm9kZUpTLlRpbWVvdXRcbiAgLyoqXG4gICAqIFRoZSBpZGVudGlmaWVyIGZvciB0aGlzIHJlcXVlc3QsIG1heSBiZSB0aGUgcmVxdWVzdCBhdXRob3JpemF0aW9uIG9yIGZhbGxiYWNrIHRvIHRoZSBib3QgYXV0aFxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIGlzIHVzZWQgdG8gZ2V0IHRoZSBpZGVudGlmeSB0aGlzIHF1ZXVlIGZyb20gdGhlIHF1ZXVlIG1hcHBpbmcgb2YgdGhlIHJlc3QgbWFuYWdlclxuICAgKi9cbiAgaWRlbnRpZmllcjogc3RyaW5nXG5cbiAgY29uc3RydWN0b3IocmVzdDogUmVzdE1hbmFnZXIsIG9wdGlvbnM6IFF1ZXVlT3B0aW9ucykge1xuICAgIHRoaXMucmVzdCA9IHJlc3RcbiAgICB0aGlzLnVybCA9IG9wdGlvbnMudXJsXG4gICAgdGhpcy5pZGVudGlmaWVyID0gb3B0aW9ucy5pZGVudGlmaWVyXG5cbiAgICBpZiAob3B0aW9ucy5pbnRlcnZhbCkgdGhpcy5pbnRlcnZhbCA9IG9wdGlvbnMuaW50ZXJ2YWxcbiAgICBpZiAob3B0aW9ucy5tYXgpIHRoaXMubWF4ID0gb3B0aW9ucy5tYXhcbiAgICBpZiAob3B0aW9ucy5yZW1haW5pbmcpIHRoaXMucmVtYWluaW5nID0gb3B0aW9ucy5yZW1haW5pbmdcbiAgICBpZiAob3B0aW9ucy50aW1lb3V0SWQpIHRoaXMudGltZW91dElkID0gb3B0aW9ucy50aW1lb3V0SWRcbiAgICBpZiAob3B0aW9ucy5kZWxldGVRdWV1ZURlbGF5KSB0aGlzLmRlbGV0ZVF1ZXVlRGVsYXkgPSBvcHRpb25zLmRlbGV0ZVF1ZXVlRGVsYXlcbiAgfVxuXG4gIC8qKiBDaGVjayBpZiB0aGVyZSBpcyBhbnkgcmVtYWluaW5nIHJlcXVlc3RzIHRoYXQgYXJlIGFsbG93ZWQuICovXG4gIGlzUmVxdWVzdEFsbG93ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucmVtYWluaW5nID4gMFxuICB9XG5cbiAgLyoqIFBhdXNlcyB0aGUgZXhlY3V0aW9uIHVudGlsIGEgcmVxdWVzdCBpcyBhbGxvd2VkIHRvIGJlIG1hZGUuICovXG4gIGFzeW5jIHdhaXRVbnRpbFJlcXVlc3RBdmFpbGFibGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgICAvLyBJZiB3aGF0ZXZlciBhbW91bnQgb2YgcmVxdWVzdHMgaXMgbGVmdCBpcyBtb3JlIHRoYW4gdGhlIHNhZmV0eSBtYXJnaW4sIGFsbG93IHRoZSByZXF1ZXN0XG4gICAgICBpZiAodGhpcy5pc1JlcXVlc3RBbGxvd2VkKCkpIHtcbiAgICAgICAgLy8gdGhpcy5yZW1haW5pbmcrKztcbiAgICAgICAgcmVzb2x2ZSgpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLndhaXRpbmcucHVzaChyZXNvbHZlKVxuICAgICAgICBhd2FpdCB0aGlzLnByb2Nlc3NXYWl0aW5nKClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqIFByb2Nlc3MgdGhlIHF1ZXVlIG9mIHJlcXVlc3RzIHdhaXRpbmcgdG8gYmUgaGFuZGxlZC4gKi9cbiAgYXN5bmMgcHJvY2Vzc1dhaXRpbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gSWYgYWxyZWFkeSBwcm9jZXNzaW5nLCB0aGF0IGxvb3Agd2lsbCBoYW5kbGUgYWxsIHdhaXRpbmcgcmVxdWVzdHMuXG4gICAgaWYgKHRoaXMucHJvY2Vzc2luZykgcmV0dXJuXG4gICAgLy8gTWFyayBhcyBwcm9jZXNzaW5nIHNvIG90aGVyIGxvb3BzIGRvbid0IHN0YXJ0XG4gICAgdGhpcy5wcm9jZXNzaW5nID0gdHJ1ZVxuXG4gICAgd2hpbGUgKHRoaXMud2FpdGluZy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLnJlc3QubG9nZ2VyLmRlYnVnKGBbUXVldWVdICR7dGhpcy5xdWV1ZVR5cGV9ICR7dGhpcy51cmx9IHByb2Nlc3Mgd2FpdGluZyB3aGlsZSBsb29wIHJhbi5gKVxuICAgICAgaWYgKHRoaXMuaXNSZXF1ZXN0QWxsb3dlZCgpKSB7XG4gICAgICAgIC8vIFJlc29sdmUgdGhlIG5leHQgaXRlbSBpbiB0aGUgcXVldWVcbiAgICAgICAgdGhpcy53YWl0aW5nLnNoaWZ0KCk/LigpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCBkZWxheSgxMDAwKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1hcmsgYXMgZmFsc2Ugc28gbmV4dCBwZW5kaW5nIHJlcXVlc3QgY2FuIGJlIHRyaWdnZXJlZCBieSBuZXcgbG9vcC5cbiAgICB0aGlzLnByb2Nlc3NpbmcgPSBmYWxzZVxuICB9XG5cbiAgLyoqIFByb2Nlc3MgdGhlIHF1ZXVlIG9mIGFsbCByZXF1ZXN0cyBwZW5kaW5nIHRvIGJlIHNlbnQuICovXG4gIGFzeW5jIHByb2Nlc3NQZW5kaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIElmIGFscmVhZHkgcHJvY2Vzc2luZywgdGhhdCBsb29wIHdpbGwgaGFuZGxlIGFsbCBwZW5kaW5nIHJlcXVlc3RzLlxuICAgIGlmICh0aGlzLnByb2Nlc3NpbmdQZW5kaW5nIHx8ICF0aGlzLnBlbmRpbmcubGVuZ3RoKSByZXR1cm5cblxuICAgIC8vIE1hcmsgYXMgcHJvY2Vzc2luZyBzbyBvdGhlciBsb29wcyBkb24ndCBzdGFydFxuICAgIHRoaXMucHJvY2Vzc2luZ1BlbmRpbmcgPSB0cnVlXG5cbiAgICB3aGlsZSAodGhpcy5wZW5kaW5nLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMucmVzdC5sb2dnZXIuZGVidWcoYFF1ZXVlICR7dGhpcy5xdWV1ZVR5cGV9ICR7dGhpcy51cmx9IHByb2Nlc3MgcGVuZGluZyB3aGlsZSBsb29wIHJhbiB3aXRoICR7dGhpcy5wZW5kaW5nLmxlbmd0aH0uYClcbiAgICAgIGlmICghdGhpcy5maXJzdFJlcXVlc3QgJiYgIXRoaXMuaXNSZXF1ZXN0QWxsb3dlZCgpKSB7XG4gICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KClcbiAgICAgICAgY29uc3QgZnV0dXJlID0gdGhpcy5mcm96ZW5BdCArIHRoaXMuaW50ZXJ2YWxcbiAgICAgICAgYXdhaXQgZGVsYXkoZnV0dXJlID4gbm93ID8gZnV0dXJlIC0gbm93IDogMTAwMClcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVxdWVzdCA9IHRoaXMucGVuZGluZ1swXVxuICAgICAgaWYgKHJlcXVlc3QpIHtcbiAgICAgICAgY29uc3QgYmFzaWNVUkwgPSB0aGlzLnJlc3Quc2ltcGxpZnlVcmwocmVxdWVzdC5yb3V0ZSwgcmVxdWVzdC5tZXRob2QpXG5cbiAgICAgICAgLy8gSWYgdGhpcyB1cmwgaXMgc3RpbGwgcmF0ZSBsaW1pdGVkLCB0cnkgYWdhaW5cbiAgICAgICAgY29uc3QgdXJsUmVzZXRJbiA9IHRoaXMucmVzdC5jaGVja1JhdGVMaW1pdHMoYmFzaWNVUkwsIHRoaXMuaWRlbnRpZmllcilcbiAgICAgICAgaWYgKHVybFJlc2V0SW4pIGF3YWl0IGRlbGF5KHVybFJlc2V0SW4pXG5cbiAgICAgICAgLy8gSUYgQSBCVUNLRVQgRVhJU1RTLCBDSEVDSyBUSEUgQlVDS0VUJ1MgUkFURSBMSU1JVFNcbiAgICAgICAgY29uc3QgYnVja2V0UmVzZXRJbiA9IHJlcXVlc3QuYnVja2V0SWQgPyB0aGlzLnJlc3QuY2hlY2tSYXRlTGltaXRzKHJlcXVlc3QuYnVja2V0SWQsIHRoaXMuaWRlbnRpZmllcikgOiBmYWxzZVxuICAgICAgICBpZiAoYnVja2V0UmVzZXRJbikgYXdhaXQgZGVsYXkoYnVja2V0UmVzZXRJbilcblxuICAgICAgICB0aGlzLmZpcnN0UmVxdWVzdCA9IGZhbHNlXG4gICAgICAgIHRoaXMucmVtYWluaW5nLS1cblxuICAgICAgICBpZiAodGhpcy5yZW1haW5pbmcgPT09IDAgJiYgdGhpcy5pbnRlcnZhbCAhPT0gMCkge1xuICAgICAgICAgIHRoaXMudGltZW91dElkID8/PSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVtYWluaW5nID0gdGhpcy5tYXhcbiAgICAgICAgICAgIHRoaXMudGltZW91dElkID0gdW5kZWZpbmVkXG4gICAgICAgICAgfSwgdGhpcy5pbnRlcnZhbClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSBmcm9tIHF1ZXVlLCB3ZSBhcmUgZXhlY3V0aW5nIGl0LlxuICAgICAgICB0aGlzLnBlbmRpbmcuc2hpZnQoKVxuICAgICAgICAvLyBDaGVjayBpZiB0aGlzIHJlcXVlc3QgaXMgYWJsZSB0byBiZSBtYWRlIGdsb2JhbGx5XG4gICAgICAgIGF3YWl0IHRoaXMucmVzdC5pbnZhbGlkQnVja2V0LndhaXRVbnRpbFJlcXVlc3RBdmFpbGFibGUoKVxuXG4gICAgICAgIGF3YWl0IHRoaXMucmVzdFxuICAgICAgICAgIC5zZW5kUmVxdWVzdChyZXF1ZXN0KVxuICAgICAgICAgIC8vIFNob3VsZCBiZSBoYW5kbGVkIGluIHNlbmRSZXF1ZXN0LCB0aGlzIGNhdGNoIGp1c3QgcHJldmVudHMgYm90cyBmcm9tIGR5aW5nXG4gICAgICAgICAgLmNhdGNoKCgpID0+IG51bGwpXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5yZXN0LmxvZ2dlci5kZWJ1ZyhgUXVldWUgJHt0aGlzLnF1ZXVlVHlwZX0gJHt0aGlzLnVybH0gcHJvY2VzcyBwZW5kaW5nIHdoaWxlIGxvb3AgZXhpdGVkIHdpdGggJHt0aGlzLnBlbmRpbmcubGVuZ3RofS5gKVxuXG4gICAgLy8gTWFyayBhcyBmYWxzZSBzbyBuZXh0IHBlbmRpbmcgcmVxdWVzdCBjYW4gYmUgdHJpZ2dlcmVkIGJ5IG5ldyBsb29wLlxuICAgIHRoaXMucHJvY2Vzc2luZ1BlbmRpbmcgPSBmYWxzZVxuICAgIHRoaXMuY2xlYW51cCgpXG4gIH1cblxuICBoYW5kbGVDb21wbGV0ZWRSZXF1ZXN0KGhlYWRlcnM6IHsgbWF4PzogbnVtYmVyOyBpbnRlcnZhbD86IG51bWJlcjsgcmVtYWluaW5nPzogbnVtYmVyIH0pOiB2b2lkIHtcbiAgICBpZiAoaGVhZGVycy5tYXggPT09IDApIHtcbiAgICAgIHRoaXMucmVtYWluaW5nKytcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmICghdGhpcy5mcm96ZW5BdCkgdGhpcy5mcm96ZW5BdCA9IERhdGUubm93KClcbiAgICBpZiAoaGVhZGVycy5pbnRlcnZhbCAhPT0gdW5kZWZpbmVkKSB0aGlzLmludGVydmFsID0gaGVhZGVycy5pbnRlcnZhbFxuICAgIGlmIChoZWFkZXJzLnJlbWFpbmluZyAhPT0gdW5kZWZpbmVkKSB0aGlzLnJlbWFpbmluZyA9IGhlYWRlcnMucmVtYWluaW5nXG5cbiAgICBpZiAodGhpcy5yZW1haW5pbmcgPD0gMSkge1xuICAgICAgdGhpcy50aW1lb3V0SWQgPz89IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnJlbWFpbmluZyA9IHRoaXMubWF4XG4gICAgICAgIHRoaXMudGltZW91dElkID0gdW5kZWZpbmVkXG4gICAgICB9LCBoZWFkZXJzLmludGVydmFsKVxuICAgIH1cbiAgfVxuXG4gIC8qKiBDaGVja3MgaWYgYSByZXF1ZXN0IGlzIGF2YWlsYWJsZSBhbmQgYWRkcyBpdCB0byB0aGUgcXVldWUuIEFsc28gdHJpZ2dlcnMgcXVldWUgcHJvY2Vzc2luZyBpZiBub3QgYWxyZWFkeSBwcm9jZXNzaW5nLiAqL1xuICBhc3luYyBtYWtlUmVxdWVzdChvcHRpb25zOiBTZW5kUmVxdWVzdE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLndhaXRVbnRpbFJlcXVlc3RBdmFpbGFibGUoKVxuICAgIHRoaXMucGVuZGluZy5wdXNoKG9wdGlvbnMpXG4gICAgdGhpcy5wcm9jZXNzUGVuZGluZygpXG4gIH1cblxuICAvKiogQ2xlYW5zIHVwIHRoZSBxdWV1ZSBieSBjaGVja2luZyBpZiB0aGVyZSBpcyBub3RoaW5nIGxlZnQgYW5kIHJlbW92aW5nIGl0LiAqL1xuICBjbGVhbnVwKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5pc1F1ZXVlQ2xlYXJhYmxlKCkpIHtcbiAgICAgIHRoaXMucHJvY2Vzc1BlbmRpbmcoKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5yZXN0LmxvZ2dlci5kZWJ1ZyhgW1F1ZXVlXSAke3RoaXMucXVldWVUeXBlfSAke3RoaXMudXJsfS4gRGVsYXlpbmcgZGVsZXRlIGZvciAke3RoaXMuZGVsZXRlUXVldWVEZWxheX1tc2ApXG5cbiAgICAvLyBEZWxldGUgaW4gYSBtaW51dGUgZ2l2aW5nIGEgYml0IG9mIHRpbWUgdG8gYWxsb3cgbmV3IHJlcXVlc3RzIHRoYXQgbWF5IHJldXNlIHRoaXMgcXVldWVcbiAgICBjbGVhclRpbWVvdXQodGhpcy5kZWxldGVRdWV1ZVRpbWVvdXQpXG4gICAgdGhpcy5kZWxldGVRdWV1ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICghdGhpcy5pc1F1ZXVlQ2xlYXJhYmxlKCkpIHtcbiAgICAgICAgdGhpcy5yZXN0LmxvZ2dlci5kZWJ1ZyhgW1F1ZXVlXSAke3RoaXMucXVldWVUeXBlfSAke3RoaXMudXJsfS4gaXMgbm90IGNsZWFyYWJsZS4gUmVzdGFydGluZyBwcm9jZXNzaW5nIG9mIHF1ZXVlLmApXG4gICAgICAgIHRoaXMucHJvY2Vzc1BlbmRpbmcoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgdGhpcy5yZXN0LmxvZ2dlci5kZWJ1ZyhgW1F1ZXVlXSAke3RoaXMucXVldWVUeXBlfSAke3RoaXMudXJsfS4gRGVsZXRpbmdgKVxuXG4gICAgICBpZiAodGhpcy50aW1lb3V0SWQpIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRJZClcblxuICAgICAgLy8gTm8gcmVxdWVzdHMgaGF2ZSBiZWVuIHJlcXVlc3RlZCBmb3IgdGhpcyBxdWV1ZSBzbyB3ZSBudWtlIHRoaXMgcXVldWVcbiAgICAgIHRoaXMucmVzdC5xdWV1ZXMuZGVsZXRlKGAke3RoaXMuaWRlbnRpZmllcn0ke3RoaXMudXJsfWApXG4gICAgICB0aGlzLnJlc3QubG9nZ2VyLmRlYnVnKFxuICAgICAgICBgW1F1ZXVlXSAke3RoaXMucXVldWVUeXBlfSAke3RoaXMudXJsfS4gRGVsZXRlZCEgUmVtYWluaW5nOiAoJHt0aGlzLnJlc3QucXVldWVzLnNpemV9KWAsXG4gICAgICAgIFsuLi50aGlzLnJlc3QucXVldWVzLnZhbHVlcygpXS5tYXAoKHF1ZXVlKSA9PiBgJHtxdWV1ZS5xdWV1ZVR5cGV9JHtxdWV1ZS51cmx9YCksXG4gICAgICApXG4gICAgfSwgdGhpcy5kZWxldGVRdWV1ZURlbGF5KVxuICB9XG5cbiAgLyoqIFNpbXBseSBjaGVja3MgaWYgdGhlIHF1ZXVlIGlzIGFibGUgdG8gYmUgY2xlYXJlZCBvciBpdCBoYXMgcmVxdWVzdHMgcGVuZGluZy4gKi9cbiAgaXNRdWV1ZUNsZWFyYWJsZSgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5maXJzdFJlcXVlc3QpIHJldHVybiBmYWxzZVxuICAgIGlmICh0aGlzLndhaXRpbmcubGVuZ3RoID4gMCkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKHRoaXMucGVuZGluZy5sZW5ndGggPiAwKSByZXR1cm4gZmFsc2VcbiAgICBpZiAodGhpcy5wcm9jZXNzaW5nKSByZXR1cm4gZmFsc2VcbiAgICBpZiAodGhpcy5wcm9jZXNzaW5nUGVuZGluZykgcmV0dXJuIGZhbHNlXG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgZ2V0IHF1ZXVlVHlwZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmlkZW50aWZpZXIuc2xpY2UoMCwgdGhpcy5pZGVudGlmaWVyLmluZGV4T2YoJyAnKSlcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXVlT3B0aW9ucyB7XG4gIC8qKiBIb3cgbWFueSByZXF1ZXN0cyBhcmUgcmVtYWluaW5nLiBEZWZhdWx0cyB0byAxICovXG4gIHJlbWFpbmluZz86IG51bWJlclxuICAvKiogTWF4IG51bWJlciBvZiByZXF1ZXN0cyBhbGxvd2VkIGluIHRoaXMgdGhpcy4gRGVmYXVsdHMgdG8gMS4gKi9cbiAgbWF4PzogbnVtYmVyXG4gIC8qKiBUaGUgdGltZSBpbiBtaWxsaXNlY29uZHMgdGhhdCBkaXNjb3JkIGFsbG93cyB0byBtYWtlIHRoZSBtYXggbnVtYmVyIG9mIGludmFsaWQgcmVxdWVzdHMuIERlZmF1bHRzIHRvIDAgKi9cbiAgaW50ZXJ2YWw/OiBudW1iZXJcbiAgLyoqIHRpbWVyIHRvIHJlc2V0IHRvIDAgKi9cbiAgdGltZW91dElkPzogTm9kZUpTLlRpbWVvdXRcbiAgLyoqIFRoZSB1cmwgdGhpcyBxdWV1ZSB3aWxsIGJlIGhhbmRsaW5nLiAqL1xuICB1cmw6IHN0cmluZ1xuICAvKiogVGhlIHRpbWUgaW4gbWlsbGlzZWNvbmRzIHRvIHdhaXQgYmVmb3JlIGRlbGV0aW5nIHRoaXMgcXVldWUgaWYgaXQgaXMgZW1wdHkuIERlZmF1bHRzIHRvIDYwMDAwKG9uZSBtaW51dGUpLiAqL1xuICBkZWxldGVRdWV1ZURlbGF5PzogbnVtYmVyXG4gIC8qKiBUaGUgYmFzZSBrZXkgdGhhdCBpZGVudGlmaWVzIHRoaXMgcXVldWUgaW4gdGhlIHJlc3QgbWFuYWdlciAqL1xuICBpZGVudGlmaWVyOiBzdHJpbmdcbn1cbiJdLCJuYW1lcyI6WyJkZWxheSIsIlF1ZXVlIiwicmVzdCIsIm9wdGlvbnMiLCJyZW1haW5pbmciLCJtYXgiLCJpbnRlcnZhbCIsIndhaXRpbmciLCJwZW5kaW5nIiwicHJvY2Vzc2luZyIsInByb2Nlc3NpbmdQZW5kaW5nIiwiZmlyc3RSZXF1ZXN0IiwiZnJvemVuQXQiLCJkZWxldGVRdWV1ZURlbGF5IiwidXJsIiwiaWRlbnRpZmllciIsInRpbWVvdXRJZCIsImlzUmVxdWVzdEFsbG93ZWQiLCJ3YWl0VW50aWxSZXF1ZXN0QXZhaWxhYmxlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJwdXNoIiwicHJvY2Vzc1dhaXRpbmciLCJsZW5ndGgiLCJsb2dnZXIiLCJkZWJ1ZyIsInF1ZXVlVHlwZSIsInNoaWZ0IiwicHJvY2Vzc1BlbmRpbmciLCJub3ciLCJEYXRlIiwiZnV0dXJlIiwicmVxdWVzdCIsImJhc2ljVVJMIiwic2ltcGxpZnlVcmwiLCJyb3V0ZSIsIm1ldGhvZCIsInVybFJlc2V0SW4iLCJjaGVja1JhdGVMaW1pdHMiLCJidWNrZXRSZXNldEluIiwiYnVja2V0SWQiLCJzZXRUaW1lb3V0IiwidW5kZWZpbmVkIiwiaW52YWxpZEJ1Y2tldCIsInNlbmRSZXF1ZXN0IiwiY2F0Y2giLCJjbGVhbnVwIiwiaGFuZGxlQ29tcGxldGVkUmVxdWVzdCIsImhlYWRlcnMiLCJtYWtlUmVxdWVzdCIsImlzUXVldWVDbGVhcmFibGUiLCJjbGVhclRpbWVvdXQiLCJkZWxldGVRdWV1ZVRpbWVvdXQiLCJxdWV1ZXMiLCJkZWxldGUiLCJzaXplIiwidmFsdWVzIiwibWFwIiwi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