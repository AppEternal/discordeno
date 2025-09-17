import type { DiscordInviteCreate, DiscordInviteMetadata } from '@discordeno/types';
import type { Bot } from '../bot.js';
import type { Invite } from './types.js';
export declare function transformInvite(bot: Bot, payload: DiscordInviteCreate | DiscordInviteMetadata, extra?: {
    shardId?: number;
}): Invite;
//# sourceMappingURL=invite.d.ts.map