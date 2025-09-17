import type { DiscordGuildOnboarding, DiscordGuildOnboardingPrompt, DiscordGuildOnboardingPromptOption } from '@discordeno/types'
import type { Bot } from '../bot.js'
import type { GuildOnboarding, GuildOnboardingPrompt, GuildOnboardingPromptOption } from './types.js'
export declare function transformGuildOnboarding(bot: Bot, payload: DiscordGuildOnboarding): GuildOnboarding
export declare function transformGuildOnboardingPrompt(bot: Bot, payload: DiscordGuildOnboardingPrompt): GuildOnboardingPrompt
export declare function transformGuildOnboardingPromptOption(bot: Bot, payload: DiscordGuildOnboardingPromptOption): GuildOnboardingPromptOption
//# sourceMappingURL=onboarding.d.ts.map
