import type { BigString, DiscordChannel, DiscordForumTag } from '@discordeno/types'
import type { Bot } from '../bot.js'
import type { Channel, ForumTag } from './types.js'
export declare function packOverwrites(allow: string, deny: string, id: string, type: number): bigint
export declare function separateOverwrites(v: bigint): [number, bigint, bigint, bigint]
export declare const baseChannel: Channel
export declare function transformChannel(
  bot: Bot,
  payload: DiscordChannel,
  extra?: {
    guildId?: BigString
  },
): any
export declare function transformForumTag(bot: Bot, payload: DiscordForumTag): ForumTag
//# sourceMappingURL=channel.d.ts.map
