import { type DiscordPresenceUpdate } from '@discordeno/types'
import type { Bot } from '../../bot.js'
import type { PresenceUpdate } from '../types.js'
export declare const reverseStatusTypes: Readonly<{
  readonly 0: 'online'
  readonly 1: 'dnd'
  readonly 2: 'idle'
  readonly 4: 'offline'
}>
export declare function transformPresenceToDiscordPresence(bot: Bot, payload: PresenceUpdate): DiscordPresenceUpdate
//# sourceMappingURL=presence.d.ts.map
