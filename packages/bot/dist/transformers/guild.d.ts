import { type DiscordGuild } from '@discordeno/types'
import type { Bot } from '../bot.js'
import type { Guild } from './types.js'
export declare const baseGuild: Guild
export declare function transformGuild(
  bot: Bot,
  payload: DiscordGuild,
  extra?: {
    shardId?: number
  },
): Guild
//# sourceMappingURL=guild.d.ts.map
