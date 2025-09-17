import type { BigString, DiscordMember } from '@discordeno/types';
import type { Bot } from '../bot.js';
import type { Member } from './types.js';
export declare const baseMember: Member;
export declare function transformMember(bot: Bot, payload: DiscordMember, extra?: {
    guildId?: BigString;
    userId?: BigString;
}): Member;
//# sourceMappingURL=member.d.ts.map