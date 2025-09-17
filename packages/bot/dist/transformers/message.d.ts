import { type DiscordMessage, type DiscordMessageCall, type DiscordMessageInteractionMetadata, type DiscordMessagePin, type DiscordMessageSnapshot } from '@discordeno/types';
import type { Bot } from '../bot.js';
import type { Message, MessageCall, MessageInteractionMetadata, MessagePin, MessageSnapshot } from './types.js';
export declare const baseMessage: Message;
export declare function transformMessage(bot: Bot, payload: DiscordMessage, extra?: {
    shardId?: number;
}): Message;
export declare function transformMessagePin(bot: Bot, payload: DiscordMessagePin, extra?: {
    shardId?: number;
}): MessagePin;
export declare function transformMessageSnapshot(bot: Bot, payload: DiscordMessageSnapshot, extra?: {
    shardId?: number;
}): MessageSnapshot;
export declare function transformMessageInteractionMetadata(bot: Bot, payload: DiscordMessageInteractionMetadata): MessageInteractionMetadata;
export declare function transformMessageCall(bot: Bot, payload: DiscordMessageCall): MessageCall;
//# sourceMappingURL=message.d.ts.map