import type { DiscordMember, DiscordUser } from '@discordeno/types';
import type { Bot } from '../../bot.js';
export declare function transformUserToDiscordUser(bot: Bot, payload: typeof bot.transformers.$inferredTypes.user): DiscordUser;
export declare function transformMemberToDiscordMember(bot: Bot, payload: typeof bot.transformers.$inferredTypes.member): DiscordMember;
//# sourceMappingURL=member.d.ts.map