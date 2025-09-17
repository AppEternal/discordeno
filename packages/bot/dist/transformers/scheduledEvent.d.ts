import type { DiscordScheduledEvent, DiscordScheduledEventRecurrenceRule } from '@discordeno/types'
import type { Bot } from '../bot.js'
import type { ScheduledEvent, ScheduledEventRecurrenceRule } from './types.js'
export declare function transformScheduledEvent(bot: Bot, payload: DiscordScheduledEvent): ScheduledEvent
export declare function transformScheduledEventRecurrenceRule(bot: Bot, payload: DiscordScheduledEventRecurrenceRule): ScheduledEventRecurrenceRule
//# sourceMappingURL=scheduledEvent.d.ts.map
