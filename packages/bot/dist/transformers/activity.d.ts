import type { DiscordActivity, DiscordActivityInstance, DiscordActivityLocation } from '@discordeno/types';
import type { Bot } from '../bot.js';
import type { Activity, ActivityInstance, ActivityLocation } from './types.js';
export declare function transformActivity(bot: Bot, payload: DiscordActivity): Activity;
export declare function transformActivityInstance(bot: Bot, payload: DiscordActivityInstance): ActivityInstance;
export declare function transformActivityLocation(bot: Bot, payload: DiscordActivityLocation): ActivityLocation;
//# sourceMappingURL=activity.d.ts.map