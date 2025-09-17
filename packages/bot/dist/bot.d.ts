import type { CreateGatewayManagerOptions, GatewayManager } from '@discordeno/gateway'
import type { CreateRestManagerOptions, RestManager } from '@discordeno/rest'
import type { BigString, GatewayDispatchEventNames, GatewayIntents, RecursivePartial } from '@discordeno/types'
import { type logger } from '@discordeno/utils'
import type {
  CompleteDesiredProperties,
  DesiredPropertiesBehavior,
  SetupDesiredProps,
  TransformersDesiredProperties,
  TransformersObjects,
} from './desiredProperties.js'
import type { EventHandlers } from './events.js'
import { type BotGatewayHandler, type GatewayHandlers } from './handlers.js'
import { type BotHelpers } from './helpers.js'
import { type Transformers } from './transformers.js'
/**
 * Create a bot object that will maintain the rest and gateway connection.
 *
 * @param options Configurations options used to manage this bot.
 * @returns Bot
 */
export declare function createBot<
  TProps extends TransformersDesiredProperties,
  TBehavior extends DesiredPropertiesBehavior = DesiredPropertiesBehavior.RemoveKey,
>(options: CreateBotOptions<TProps, TBehavior>): Bot<TProps, TBehavior>
export declare function createBot<
  TProps extends RecursivePartial<TransformersDesiredProperties>,
  TBehavior extends DesiredPropertiesBehavior = DesiredPropertiesBehavior.RemoveKey,
>(options: CreateBotOptions<TProps, TBehavior>): Bot<CompleteDesiredProperties<TProps>, TBehavior>
export interface CreateBotOptions<TProps extends RecursivePartial<TransformersDesiredProperties>, TBehavior extends DesiredPropertiesBehavior> {
  /** The bot's token. */
  token: string
  /** Application Id of the bot incase it is an old bot token. */
  applicationId?: BigString
  /** The bot's intents that will be used to make a connection with discords gateway. */
  intents?: GatewayIntents
  /** Any options you wish to provide to the rest manager. */
  rest?: Omit<CreateRestManagerOptions, 'token'> & Partial<Pick<CreateRestManagerOptions, 'token'>>
  /** Any options you wish to provide to the gateway manager. */
  gateway?: Omit<CreateGatewayManagerOptions, 'token'> & Partial<Pick<CreateGatewayManagerOptions, 'token'>>
  /** The event handlers. */
  events?: Partial<EventHandlers<CompleteDesiredProperties<NoInfer<TProps>>, TBehavior>>
  /** The functions that should transform discord objects to discordeno shaped objects. */
  transformers?: RecursivePartial<Transformers<CompleteDesiredProperties<NoInfer<TProps>>, TBehavior>>
  /** The handler functions that should handle incoming discord payloads from gateway and call an event. */
  handlers?: Partial<Record<GatewayDispatchEventNames, BotGatewayHandler<CompleteDesiredProperties<NoInfer<TProps>>, TBehavior>>>
  /**
   * Set the desired properties for the bot
   */
  desiredProperties: TProps
  /**
   * Set the desired properties behavior for undesired properties
   *
   * @default DesiredPropertiesBehavior.RemoveKey
   */
  desiredPropertiesBehavior?: TBehavior
  /**
   * This factory will be invoked to create the logger for gateway, rest and bot
   *
   * @remarks
   * If not provided the default logger will be used with rest and gateway sharing the same logger
   *
   * This function will be invoked 3 times, one with the name of `REST`, one with `GATEWAY` and the third one with name `BOT`
   */
  loggerFactory?: (name: 'REST' | 'GATEWAY' | 'BOT') => Pick<typeof logger, 'debug' | 'info' | 'warn' | 'error' | 'fatal'>
}
export interface Bot<
  TProps extends TransformersDesiredProperties = TransformersDesiredProperties,
  TBehavior extends DesiredPropertiesBehavior = DesiredPropertiesBehavior.RemoveKey,
> {
  /** The id of the bot. */
  id: bigint
  /** The application id of the bot. This is usually the same as id but in the case of old bots can be different. */
  applicationId: bigint
  /** The rest manager. */
  rest: RestManager
  /** The gateway manager. */
  gateway: GatewayManager
  /** The event handlers. */
  events: Partial<EventHandlers<TProps, TBehavior>>
  /** A logger utility to make it easy to log nice and useful things in the bot code. */
  logger: Pick<typeof logger, 'debug' | 'info' | 'warn' | 'error' | 'fatal'>
  /** The functions that should transform discord objects to discordeno shaped objects. */
  transformers: Transformers<TProps, TBehavior> & {
    $inferredTypes: {
      [K in keyof TransformersObjects]: SetupDesiredProps<TransformersObjects[K], TProps, TBehavior>
    }
  }
  /** The handler functions that should handle incoming discord payloads from gateway and call an event. */
  handlers: GatewayHandlers<TProps, TBehavior>
  helpers: BotHelpers<TProps, TBehavior>
  /** Start the bot connection to the gateway. */
  start: () => Promise<void>
  /** Shuts down all the bot connections to the gateway. */
  shutdown: () => Promise<void>
}
//# sourceMappingURL=bot.d.ts.map
