import type { CreateRestManagerOptions, RestManager } from './types.js'
export declare const DISCORD_API_VERSION = 10
export declare const DISCORD_API_URL = 'https://discord.com/api'
export declare const AUDIT_LOG_REASON_HEADER = 'x-audit-log-reason'
export declare const RATE_LIMIT_REMAINING_HEADER = 'x-ratelimit-remaining'
export declare const RATE_LIMIT_RESET_AFTER_HEADER = 'x-ratelimit-reset-after'
export declare const RATE_LIMIT_GLOBAL_HEADER = 'x-ratelimit-global'
export declare const RATE_LIMIT_BUCKET_HEADER = 'x-ratelimit-bucket'
export declare const RATE_LIMIT_LIMIT_HEADER = 'x-ratelimit-limit'
export declare const RATE_LIMIT_SCOPE_HEADER = 'x-ratelimit-scope'
export declare function createRestManager(options: CreateRestManagerOptions): RestManager
//# sourceMappingURL=manager.d.ts.map
