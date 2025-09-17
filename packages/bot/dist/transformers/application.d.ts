import { type DiscordApplication } from '@discordeno/types'
import type { Bot } from '../bot.js'
import type { Application } from './types.js'
export declare function transformApplication(
  bot: Bot,
  payload: DiscordApplication,
  extra?: {
    shardId?: number
  },
): Application
//# sourceMappingURL=application.d.ts.map
