import logger from './logger.js';
import { delay } from './utils.js';
export class LeakyBucket {
    constructor(options){
        /** The amount of requests that have been used up already. */ this.used = 0;
        /** The queue of requests to acquire an available request. Mapped by <shardId, resolve()> */ this.queue = [];
        /** Whether or not the queue is already processing. */ this.processing = false;
        this.max = options?.max ?? 1;
        this.refillAmount = options?.refillAmount ? options.refillAmount > this.max ? this.max : options.refillAmount : 1;
        this.refillInterval = options?.refillInterval ?? 5000;
        this.logger = options?.logger ?? logger;
    }
    /** The amount of requests that still remain. */ get remaining() {
        return this.max < this.used ? 0 : this.max - this.used;
    }
    /** Refills the bucket as needed. */ refillBucket() {
        this.logger.debug(`[LeakyBucket] Timeout for leaky bucket requests executed. Refilling bucket.`);
        // Lower the used amount by the refill amount
        this.used = this.refillAmount > this.used ? 0 : this.used - this.refillAmount;
        // Reset the refillsAt timestamp since it just got refilled
        this.refillsAt = undefined;
        // Reset the timeoutId
        clearTimeout(this.timeoutId);
        this.timeoutId = undefined;
        if (this.used > 0) {
            this.timeoutId = setTimeout(()=>{
                this.refillBucket();
            }, this.refillInterval);
            this.refillsAt = Date.now() + this.refillInterval;
        }
    }
    /** Begin processing the queue. */ async processQueue() {
        this.logger.debug('[LeakyBucket] Processing queue');
        // There is already a queue that is processing
        if (this.processing) return this.logger.debug('[LeakyBucket] Queue is already processing.');
        this.processing = true;
        // Begin going through the queue.
        while(this.queue.length){
            if (this.remaining) {
                this.logger.debug(`[LeakyBucket] Processing queue. Remaining: ${this.remaining} Length: ${this.queue.length}`);
                // Resolves the promise allowing the paused execution of this request to resolve and continue.
                this.queue.shift()?.();
                // A request can be made
                this.used++;
                // Create a new timeout for this request if none exists.
                if (!this.timeoutId) {
                    this.logger.debug(`[LeakyBucket] Creating new timeout for leaky bucket requests.`);
                    this.timeoutId = setTimeout(()=>{
                        this.refillBucket();
                    }, this.refillInterval);
                    // Set the time for when this refill will occur.
                    this.refillsAt = Date.now() + this.refillInterval;
                }
            } else if (this.refillsAt) {
                const now = Date.now();
                // If there is time left until next refill, just delay execution.
                if (this.refillsAt > now) {
                    this.logger.debug(`[LeakyBucket] Delaying execution of leaky bucket requests for ${this.refillsAt - now}ms`);
                    await delay(this.refillsAt - now);
                    this.logger.debug(`[LeakyBucket] Resuming execution`);
                } else {
                    this.logger.debug(`[LeakyBucket] Delaying execution of leaky bucket requests for 1000ms`);
                    await delay(1000);
                }
            }
        }
        // Loop has ended mark false so it can restart later when needed
        this.processing = false;
    }
    /** Pauses the execution until the request is available to be made. */ async acquire(highPriority) {
        return await new Promise((resolve)=>{
            // High priority requests get added to the start of the queue
            if (highPriority) this.queue.unshift(resolve);
            else this.queue.push(resolve);
            // Each request should trigger the queue to be processed.
            void this.processQueue();
        });
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9idWNrZXQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGxvZ2dlciBmcm9tICcuL2xvZ2dlci5qcydcbmltcG9ydCB7IGRlbGF5IH0gZnJvbSAnLi91dGlscy5qcydcblxuZXhwb3J0IGNsYXNzIExlYWt5QnVja2V0IGltcGxlbWVudHMgTGVha3lCdWNrZXRPcHRpb25zIHtcbiAgbWF4OiBudW1iZXJcbiAgcmVmaWxsSW50ZXJ2YWw6IG51bWJlclxuICByZWZpbGxBbW91bnQ6IG51bWJlclxuXG4gIC8qKiBUaGUgYW1vdW50IG9mIHJlcXVlc3RzIHRoYXQgaGF2ZSBiZWVuIHVzZWQgdXAgYWxyZWFkeS4gKi9cbiAgdXNlZDogbnVtYmVyID0gMFxuICAvKiogVGhlIHF1ZXVlIG9mIHJlcXVlc3RzIHRvIGFjcXVpcmUgYW4gYXZhaWxhYmxlIHJlcXVlc3QuIE1hcHBlZCBieSA8c2hhcmRJZCwgcmVzb2x2ZSgpPiAqL1xuICBxdWV1ZTogQXJyYXk8KHZhbHVlOiB2b2lkIHwgUHJvbWlzZUxpa2U8dm9pZD4pID0+IHZvaWQ+ID0gW11cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRoZSBxdWV1ZSBpcyBhbHJlYWR5IHByb2Nlc3NpbmcuICovXG4gIHByb2Nlc3Npbmc6IGJvb2xlYW4gPSBmYWxzZVxuICAvKiogVGhlIHRpbWVvdXQgaWQgZm9yIHRoZSB0aW1lciB0byByZWR1Y2UgdGhlIHVzZWQgYW1vdW50IGJ5IHRoZSByZWZpbGwgYW1vdW50LiAqL1xuICB0aW1lb3V0SWQ/OiBOb2RlSlMuVGltZW91dFxuICAvKiogVGhlIHRpbWVzdGFtcCBpbiBtaWxsaXNlY29uZHMgd2hlbiB0aGUgbmV4dCByZWZpbGwgaXMgc2NoZWR1bGVkLiAqL1xuICByZWZpbGxzQXQ/OiBudW1iZXJcbiAgLyoqIExvZ2dlciB1c2VkIGluIHRoZSBsZWFreSBidWNrZXQgKi9cbiAgbG9nZ2VyOiBQaWNrPHR5cGVvZiBsb2dnZXIsICdkZWJ1ZycgfCAnaW5mbycgfCAnd2FybicgfCAnZXJyb3InIHwgJ2ZhdGFsJz5cblxuICBjb25zdHJ1Y3RvcihvcHRpb25zPzogTGVha3lCdWNrZXRPcHRpb25zKSB7XG4gICAgdGhpcy5tYXggPSBvcHRpb25zPy5tYXggPz8gMVxuICAgIHRoaXMucmVmaWxsQW1vdW50ID0gb3B0aW9ucz8ucmVmaWxsQW1vdW50ID8gKG9wdGlvbnMucmVmaWxsQW1vdW50ID4gdGhpcy5tYXggPyB0aGlzLm1heCA6IG9wdGlvbnMucmVmaWxsQW1vdW50KSA6IDFcbiAgICB0aGlzLnJlZmlsbEludGVydmFsID0gb3B0aW9ucz8ucmVmaWxsSW50ZXJ2YWwgPz8gNTAwMFxuICAgIHRoaXMubG9nZ2VyID0gb3B0aW9ucz8ubG9nZ2VyID8/IGxvZ2dlclxuICB9XG5cbiAgLyoqIFRoZSBhbW91bnQgb2YgcmVxdWVzdHMgdGhhdCBzdGlsbCByZW1haW4uICovXG4gIGdldCByZW1haW5pbmcoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5tYXggPCB0aGlzLnVzZWQgPyAwIDogdGhpcy5tYXggLSB0aGlzLnVzZWRcbiAgfVxuXG4gIC8qKiBSZWZpbGxzIHRoZSBidWNrZXQgYXMgbmVlZGVkLiAqL1xuICByZWZpbGxCdWNrZXQoKTogdm9pZCB7XG4gICAgdGhpcy5sb2dnZXIuZGVidWcoYFtMZWFreUJ1Y2tldF0gVGltZW91dCBmb3IgbGVha3kgYnVja2V0IHJlcXVlc3RzIGV4ZWN1dGVkLiBSZWZpbGxpbmcgYnVja2V0LmApXG4gICAgLy8gTG93ZXIgdGhlIHVzZWQgYW1vdW50IGJ5IHRoZSByZWZpbGwgYW1vdW50XG4gICAgdGhpcy51c2VkID0gdGhpcy5yZWZpbGxBbW91bnQgPiB0aGlzLnVzZWQgPyAwIDogdGhpcy51c2VkIC0gdGhpcy5yZWZpbGxBbW91bnRcbiAgICAvLyBSZXNldCB0aGUgcmVmaWxsc0F0IHRpbWVzdGFtcCBzaW5jZSBpdCBqdXN0IGdvdCByZWZpbGxlZFxuICAgIHRoaXMucmVmaWxsc0F0ID0gdW5kZWZpbmVkXG4gICAgLy8gUmVzZXQgdGhlIHRpbWVvdXRJZFxuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRJZClcbiAgICB0aGlzLnRpbWVvdXRJZCA9IHVuZGVmaW5lZFxuXG4gICAgaWYgKHRoaXMudXNlZCA+IDApIHtcbiAgICAgIHRoaXMudGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMucmVmaWxsQnVja2V0KClcbiAgICAgIH0sIHRoaXMucmVmaWxsSW50ZXJ2YWwpXG4gICAgICB0aGlzLnJlZmlsbHNBdCA9IERhdGUubm93KCkgKyB0aGlzLnJlZmlsbEludGVydmFsXG4gICAgfVxuICB9XG5cbiAgLyoqIEJlZ2luIHByb2Nlc3NpbmcgdGhlIHF1ZXVlLiAqL1xuICBhc3luYyBwcm9jZXNzUXVldWUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ1tMZWFreUJ1Y2tldF0gUHJvY2Vzc2luZyBxdWV1ZScpXG5cbiAgICAvLyBUaGVyZSBpcyBhbHJlYWR5IGEgcXVldWUgdGhhdCBpcyBwcm9jZXNzaW5nXG4gICAgaWYgKHRoaXMucHJvY2Vzc2luZykgcmV0dXJuIHRoaXMubG9nZ2VyLmRlYnVnKCdbTGVha3lCdWNrZXRdIFF1ZXVlIGlzIGFscmVhZHkgcHJvY2Vzc2luZy4nKVxuXG4gICAgdGhpcy5wcm9jZXNzaW5nID0gdHJ1ZVxuXG4gICAgLy8gQmVnaW4gZ29pbmcgdGhyb3VnaCB0aGUgcXVldWUuXG4gICAgd2hpbGUgKHRoaXMucXVldWUubGVuZ3RoKSB7XG4gICAgICBpZiAodGhpcy5yZW1haW5pbmcpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoYFtMZWFreUJ1Y2tldF0gUHJvY2Vzc2luZyBxdWV1ZS4gUmVtYWluaW5nOiAke3RoaXMucmVtYWluaW5nfSBMZW5ndGg6ICR7dGhpcy5xdWV1ZS5sZW5ndGh9YClcbiAgICAgICAgLy8gUmVzb2x2ZXMgdGhlIHByb21pc2UgYWxsb3dpbmcgdGhlIHBhdXNlZCBleGVjdXRpb24gb2YgdGhpcyByZXF1ZXN0IHRvIHJlc29sdmUgYW5kIGNvbnRpbnVlLlxuICAgICAgICB0aGlzLnF1ZXVlLnNoaWZ0KCk/LigpXG4gICAgICAgIC8vIEEgcmVxdWVzdCBjYW4gYmUgbWFkZVxuICAgICAgICB0aGlzLnVzZWQrK1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIG5ldyB0aW1lb3V0IGZvciB0aGlzIHJlcXVlc3QgaWYgbm9uZSBleGlzdHMuXG4gICAgICAgIGlmICghdGhpcy50aW1lb3V0SWQpIHtcbiAgICAgICAgICB0aGlzLmxvZ2dlci5kZWJ1ZyhgW0xlYWt5QnVja2V0XSBDcmVhdGluZyBuZXcgdGltZW91dCBmb3IgbGVha3kgYnVja2V0IHJlcXVlc3RzLmApXG5cbiAgICAgICAgICB0aGlzLnRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZWZpbGxCdWNrZXQoKVxuICAgICAgICAgIH0sIHRoaXMucmVmaWxsSW50ZXJ2YWwpXG4gICAgICAgICAgLy8gU2V0IHRoZSB0aW1lIGZvciB3aGVuIHRoaXMgcmVmaWxsIHdpbGwgb2NjdXIuXG4gICAgICAgICAgdGhpcy5yZWZpbGxzQXQgPSBEYXRlLm5vdygpICsgdGhpcy5yZWZpbGxJbnRlcnZhbFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGlmIGEgcmVmaWxsIGlzIHNjaGVkdWxlZCwgc2luY2Ugd2UgaGF2ZSB1c2VkIHVwIGFsbCBhdmFpbGFibGUgcmVxdWVzdHNcbiAgICAgIGVsc2UgaWYgKHRoaXMucmVmaWxsc0F0KSB7XG4gICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KClcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgdGltZSBsZWZ0IHVudGlsIG5leHQgcmVmaWxsLCBqdXN0IGRlbGF5IGV4ZWN1dGlvbi5cbiAgICAgICAgaWYgKHRoaXMucmVmaWxsc0F0ID4gbm93KSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoYFtMZWFreUJ1Y2tldF0gRGVsYXlpbmcgZXhlY3V0aW9uIG9mIGxlYWt5IGJ1Y2tldCByZXF1ZXN0cyBmb3IgJHt0aGlzLnJlZmlsbHNBdCAtIG5vd31tc2ApXG4gICAgICAgICAgYXdhaXQgZGVsYXkodGhpcy5yZWZpbGxzQXQgLSBub3cpXG4gICAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoYFtMZWFreUJ1Y2tldF0gUmVzdW1pbmcgZXhlY3V0aW9uYClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSByZWZpbGxzQXQgaGFzIHBhc3NlZCBidXQgdGhlIHRpbWVvdXQgZGlkbid0IHlldCBleGVjdXRlIGRlbGF5IHRoZSBleGVjdXRpb25cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoYFtMZWFreUJ1Y2tldF0gRGVsYXlpbmcgZXhlY3V0aW9uIG9mIGxlYWt5IGJ1Y2tldCByZXF1ZXN0cyBmb3IgMTAwMG1zYClcbiAgICAgICAgICBhd2FpdCBkZWxheSgxMDAwKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTG9vcCBoYXMgZW5kZWQgbWFyayBmYWxzZSBzbyBpdCBjYW4gcmVzdGFydCBsYXRlciB3aGVuIG5lZWRlZFxuICAgIHRoaXMucHJvY2Vzc2luZyA9IGZhbHNlXG4gIH1cblxuICAvKiogUGF1c2VzIHRoZSBleGVjdXRpb24gdW50aWwgdGhlIHJlcXVlc3QgaXMgYXZhaWxhYmxlIHRvIGJlIG1hZGUuICovXG4gIGFzeW5jIGFjcXVpcmUoaGlnaFByaW9yaXR5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgLy8gSGlnaCBwcmlvcml0eSByZXF1ZXN0cyBnZXQgYWRkZWQgdG8gdGhlIHN0YXJ0IG9mIHRoZSBxdWV1ZVxuICAgICAgaWYgKGhpZ2hQcmlvcml0eSkgdGhpcy5xdWV1ZS51bnNoaWZ0KHJlc29sdmUpXG4gICAgICAvLyBBbGwgb3RoZXIgcmVxdWVzdHMgZ2V0IHB1c2hlZCB0byB0aGUgZW5kLlxuICAgICAgZWxzZSB0aGlzLnF1ZXVlLnB1c2gocmVzb2x2ZSlcblxuICAgICAgLy8gRWFjaCByZXF1ZXN0IHNob3VsZCB0cmlnZ2VyIHRoZSBxdWV1ZSB0byBiZSBwcm9jZXNzZWQuXG4gICAgICB2b2lkIHRoaXMucHJvY2Vzc1F1ZXVlKClcbiAgICB9KVxuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGVha3lCdWNrZXRPcHRpb25zIHtcbiAgLyoqXG4gICAqIE1heCByZXF1ZXN0cyBhbGxvd2VkIGF0IG9uY2UuXG4gICAqIEBkZWZhdWx0IDFcbiAgICovXG4gIG1heD86IG51bWJlclxuICAvKipcbiAgICogSW50ZXJ2YWwgaW4gbWlsbGlzZWNvbmRzIGJldHdlZW4gcmVmaWxscy5cbiAgICogQGRlZmF1bHQgNTAwMFxuICAgKi9cbiAgcmVmaWxsSW50ZXJ2YWw/OiBudW1iZXJcbiAgLyoqXG4gICAqIEFtb3VudCBvZiByZXF1ZXN0cyB0byByZWZpbGwgYXQgZWFjaCBpbnRlcnZhbC5cbiAgICogQGRlZmF1bHQgMVxuICAgKi9cbiAgcmVmaWxsQW1vdW50PzogbnVtYmVyXG4gIC8qKlxuICAgKiBUaGUgbG9nZ2VyIHRoYXQgdGhlIGxlYWt5IGJ1Y2tldCB3aWxsIHVzZVxuICAgKiBAZGVmYXVsdCBsb2dnZXIgLy8gVGhlIGxvZ2dlciBleHBvcnRlZCBieSBgQGRpc2NvcmRlbm8vdXRpbHNgXG4gICAqL1xuICBsb2dnZXI/OiBQaWNrPHR5cGVvZiBsb2dnZXIsICdkZWJ1ZycgfCAnaW5mbycgfCAnd2FybicgfCAnZXJyb3InIHwgJ2ZhdGFsJz5cbn1cbiJdLCJuYW1lcyI6WyJsb2dnZXIiLCJkZWxheSIsIkxlYWt5QnVja2V0Iiwib3B0aW9ucyIsInVzZWQiLCJxdWV1ZSIsInByb2Nlc3NpbmciLCJtYXgiLCJyZWZpbGxBbW91bnQiLCJyZWZpbGxJbnRlcnZhbCIsInJlbWFpbmluZyIsInJlZmlsbEJ1Y2tldCIsImRlYnVnIiwicmVmaWxsc0F0IiwidW5kZWZpbmVkIiwiY2xlYXJUaW1lb3V0IiwidGltZW91dElkIiwic2V0VGltZW91dCIsIkRhdGUiLCJub3ciLCJwcm9jZXNzUXVldWUiLCJsZW5ndGgiLCJzaGlmdCIsImFjcXVpcmUiLCJoaWdoUHJpb3JpdHkiLCJQcm9taXNlIiwicmVzb2x2ZSIsInVuc2hpZnQiLCJwdXNoIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPQSxZQUFZLGNBQWE7QUFDaEMsU0FBU0MsS0FBSyxRQUFRLGFBQVk7QUFFbEMsT0FBTyxNQUFNQztJQWtCWCxZQUFZQyxPQUE0QixDQUFFO1FBYjFDLDJEQUEyRCxRQUMzREMsT0FBZTtRQUNmLDBGQUEwRixRQUMxRkMsUUFBMEQsRUFBRTtRQUM1RCxvREFBb0QsUUFDcERDLGFBQXNCO1FBU3BCLElBQUksQ0FBQ0MsR0FBRyxHQUFHSixTQUFTSSxPQUFPO1FBQzNCLElBQUksQ0FBQ0MsWUFBWSxHQUFHTCxTQUFTSyxlQUFnQkwsUUFBUUssWUFBWSxHQUFHLElBQUksQ0FBQ0QsR0FBRyxHQUFHLElBQUksQ0FBQ0EsR0FBRyxHQUFHSixRQUFRSyxZQUFZLEdBQUk7UUFDbEgsSUFBSSxDQUFDQyxjQUFjLEdBQUdOLFNBQVNNLGtCQUFrQjtRQUNqRCxJQUFJLENBQUNULE1BQU0sR0FBR0csU0FBU0gsVUFBVUE7SUFDbkM7SUFFQSw4Q0FBOEMsR0FDOUMsSUFBSVUsWUFBb0I7UUFDdEIsT0FBTyxJQUFJLENBQUNILEdBQUcsR0FBRyxJQUFJLENBQUNILElBQUksR0FBRyxJQUFJLElBQUksQ0FBQ0csR0FBRyxHQUFHLElBQUksQ0FBQ0gsSUFBSTtJQUN4RDtJQUVBLGtDQUFrQyxHQUNsQ08sZUFBcUI7UUFDbkIsSUFBSSxDQUFDWCxNQUFNLENBQUNZLEtBQUssQ0FBQyxDQUFDLDJFQUEyRSxDQUFDO1FBQy9GLDZDQUE2QztRQUM3QyxJQUFJLENBQUNSLElBQUksR0FBRyxJQUFJLENBQUNJLFlBQVksR0FBRyxJQUFJLENBQUNKLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQ0EsSUFBSSxHQUFHLElBQUksQ0FBQ0ksWUFBWTtRQUM3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