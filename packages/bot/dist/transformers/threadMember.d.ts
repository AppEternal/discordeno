import type { BigString, DiscordThreadMember, DiscordThreadMemberGuildCreate } from '@discordeno/types'
import type { Bot } from '../bot.js'
import type { ThreadMember, ThreadMemberGuildCreate } from './types.js'
export declare function transformThreadMember(bot: Bot, payload: DiscordThreadMember, extra?: ThreadMemberTransformerExtra): ThreadMember
export interface ThreadMemberTransformerExtra {
  /**
   * Provide this parameter if you want it to be passed down to the `threadMember.member` object (when `withMembers` is set to `true`),
   * since Discord does not include a `guildId` in that payload.
   *
   * This allows you to cache member objects in the member customizer.
   */
  guildId?: BigString
}
export declare function transformThreadMemberGuildCreate(bot: Bot, payload: DiscordThreadMemberGuildCreate): ThreadMemberGuildCreate
//# sourceMappingURL=threadMember.d.ts.map
