import type { DiscordCollectibles, DiscordNameplate, DiscordUser, DiscordUserPrimaryGuild } from '@discordeno/types';
import type { Bot } from '../bot.js';
import type { Collectibles, Nameplate, User, UserPrimaryGuild } from './types.js';
export declare const baseUser: User;
export declare function transformUser(bot: Bot, payload: DiscordUser): User;
export declare function transformCollectibles(bot: Bot, payload: DiscordCollectibles): Collectibles;
export declare function transformNameplate(bot: Bot, payload: DiscordNameplate): Nameplate;
export declare function transformUserPrimaryGuild(bot: Bot, payload: DiscordUserPrimaryGuild): UserPrimaryGuild;
//# sourceMappingURL=user.d.ts.map