import type { DiscordDefaultReactionEmoji, DiscordEmoji } from '@discordeno/types';
import type { Bot } from '../bot.js';
import type { DefaultReactionEmoji, Emoji } from './types.js';
export declare const baseEmoji: Emoji;
export declare function transformEmoji(bot: Bot, payload: DiscordEmoji): Emoji;
export declare function transformDefaultReactionEmoji(bot: Bot, payload: DiscordDefaultReactionEmoji): DefaultReactionEmoji;
//# sourceMappingURL=emoji.d.ts.map