import type { DiscordGatewayPayload, GatewayDispatchEventNames } from '@discordeno/types'
import type { Bot } from './bot.js'
import type { DesiredPropertiesBehavior, TransformersDesiredProperties } from './desiredProperties.js'
export declare function createBotGatewayHandlers<TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior>(
  options: Partial<GatewayHandlers<TProps, TBehavior>>,
): GatewayHandlers<TProps, TBehavior>
export type GatewayHandlers<TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior> = Record<
  GatewayDispatchEventNames,
  BotGatewayHandler<TProps, TBehavior>
>
export type BotGatewayHandler<TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior> = (
  bot: Bot<TProps, TBehavior>,
  data: DiscordGatewayPayload,
  shardId: number,
) => unknown
//# sourceMappingURL=handlers.d.ts.map
