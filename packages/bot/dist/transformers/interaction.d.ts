import { type BigString, type DiscordInteraction, type DiscordInteractionCallback, type DiscordInteractionCallbackResponse, type DiscordInteractionDataOption, type DiscordInteractionDataResolved, type DiscordInteractionResource } from '@discordeno/types';
import type { Bot } from '../bot.js';
import type { CompleteDesiredProperties, DesiredPropertiesBehavior, SetupDesiredProps, TransformersDesiredProperties, TransformProperty } from '../desiredProperties.js';
import type { Interaction, InteractionCallback, InteractionCallbackResponse, InteractionDataOption, InteractionDataResolved, InteractionResource } from './types.js';
export declare const baseInteraction: SetupDesiredProps<Interaction, CompleteDesiredProperties<{}, true>, DesiredPropertiesBehavior.RemoveKey>;
export declare function transformInteraction(bot: Bot, payload: DiscordInteraction, extra?: {
    shardId?: number;
}): Interaction;
export declare function transformInteractionDataOption(bot: Bot, option: DiscordInteractionDataOption): InteractionDataOption;
export declare function transformInteractionDataResolved(bot: Bot, payload: DiscordInteractionDataResolved, extra?: {
    shardId?: number;
    guildId?: BigString;
}): TransformProperty<InteractionDataResolved, TransformersDesiredProperties, DesiredPropertiesBehavior.RemoveKey>;
export declare function transformInteractionCallbackResponse(bot: Bot, payload: DiscordInteractionCallbackResponse, extra?: {
    shardId?: number;
}): InteractionCallbackResponse;
export declare function transformInteractionCallback(bot: Bot, payload: DiscordInteractionCallback): InteractionCallback;
export declare function transformInteractionResource(bot: Bot, payload: DiscordInteractionResource, extra?: {
    shardId?: number;
}): InteractionResource;
//# sourceMappingURL=interaction.d.ts.map