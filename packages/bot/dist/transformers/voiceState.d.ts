import type { BigString, DiscordVoiceState } from '@discordeno/types'
import type { Bot } from '../bot.js'
import type { VoiceState } from './types.js'
export declare function transformVoiceState(
  bot: Bot,
  payload: DiscordVoiceState,
  extra?: {
    guildId?: BigString
  },
): VoiceState
//# sourceMappingURL=voiceState.d.ts.map
