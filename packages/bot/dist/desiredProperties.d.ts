import type { RecursivePartial } from '@discordeno/types'
import type { Collection } from '@discordeno/utils'
import type { Bot } from './bot.js'
import type { InteractionResolvedDataChannel, InteractionResolvedDataMember } from './commandOptionsParser.js'
import type {
  ActivityInstance,
  ActivityLocation,
  Attachment,
  AvatarDecorationData,
  Channel,
  Collectibles,
  Component,
  DefaultReactionEmoji,
  Emoji,
  Entitlement,
  ForumTag,
  Guild,
  GuildOnboarding,
  GuildOnboardingPrompt,
  GuildOnboardingPromptOption,
  IncidentsData,
  Interaction,
  InteractionCallback,
  InteractionCallbackResponse,
  InteractionResource,
  Invite,
  InviteStageInstance,
  Lobby,
  LobbyMember,
  MediaGalleryItem,
  Member,
  Message,
  MessageCall,
  MessageInteraction,
  MessageInteractionMetadata,
  MessagePin,
  MessageReference,
  MessageSnapshot,
  Nameplate,
  Poll,
  PollAnswer,
  PollAnswerCount,
  PollMedia,
  PollResult,
  Role,
  RoleColors,
  ScheduledEvent,
  ScheduledEventRecurrenceRule,
  Sku,
  SoundboardSound,
  StageInstance,
  Sticker,
  Subscription,
  UnfurledMediaItem,
  User,
  UserPrimaryGuild,
  VoiceState,
  Webhook,
} from './transformers/types.js'
/**
 * All the objects that support desired properties
 *
 * @private This is subject to breaking changes at any time
 */
export interface TransformersObjects {
  activityInstance: ActivityInstance
  activityLocation: ActivityLocation
  attachment: Attachment
  avatarDecorationData: AvatarDecorationData
  channel: Channel
  collectibles: Collectibles
  component: Component
  defaultReactionEmoji: DefaultReactionEmoji
  emoji: Emoji
  entitlement: Entitlement
  forumTag: ForumTag
  guild: Guild
  guildOnboarding: GuildOnboarding
  guildOnboardingPrompt: GuildOnboardingPrompt
  guildOnboardingPromptOption: GuildOnboardingPromptOption
  incidentsData: IncidentsData
  interaction: Interaction
  interactionCallback: InteractionCallback
  interactionCallbackResponse: InteractionCallbackResponse
  interactionResource: InteractionResource
  invite: Invite
  inviteStageInstance: InviteStageInstance
  lobby: Lobby
  lobbyMember: LobbyMember
  mediaGalleryItem: MediaGalleryItem
  member: Member
  message: Message
  messageCall: MessageCall
  messageInteraction: MessageInteraction
  messageInteractionMetadata: MessageInteractionMetadata
  messagePin: MessagePin
  messageReference: MessageReference
  messageSnapshot: MessageSnapshot
  nameplate: Nameplate
  poll: Poll
  pollAnswer: PollAnswer
  pollAnswerCount: PollAnswerCount
  pollMedia: PollMedia
  pollResult: PollResult
  role: Role
  roleColors: RoleColors
  scheduledEvent: ScheduledEvent
  scheduledEventRecurrenceRule: ScheduledEventRecurrenceRule
  sku: Sku
  soundboardSound: SoundboardSound
  stageInstance: StageInstance
  sticker: Sticker
  subscription: Subscription
  unfurledMediaItem: UnfurledMediaItem
  user: User
  userPrimaryGuild: UserPrimaryGuild
  voiceState: VoiceState
  webhook: Webhook
}
/**
 * Metadata for typescript to create the correct types for desired properties
 *
 * @private This is subject to breaking changes without notices
 */
export interface TransformersDesiredPropertiesMetadata extends DesiredPropertiesMetadata {
  channel: {
    dependencies: {
      archived: ['toggles']
      invitable: ['toggles']
      locked: ['toggles']
      nsfw: ['toggles']
      newlyCreated: ['toggles']
      managed: ['toggles']
    }
    alwaysPresents: ['toggles', 'internalOverwrites', 'internalThreadMetadata']
  }
  guild: {
    dependencies: {
      threads: ['channels']
      features: ['toggles']
    }
    alwaysPresents: []
  }
  interaction: {
    dependencies: {
      respond: ['type', 'token', 'id']
      edit: ['type', 'token', 'id']
      deferEdit: ['type', 'token', 'id']
      defer: ['type', 'token', 'id']
      delete: ['type', 'token']
    }
    alwaysPresents: ['bot', 'acknowledged']
  }
  member: {
    dependencies: {
      deaf: ['toggles']
      mute: ['toggles']
      pending: ['toggles']
      flags: ['toggles']
      didRejoin: ['toggles']
      startedOnboarding: ['toggles']
      bypassesVerification: ['toggles']
      completedOnboarding: ['toggles']
    }
    alwaysPresents: []
  }
  message: {
    dependencies: {
      crossposted: ['flags']
      ephemeral: ['flags']
      failedToMentionSomeRolesInThread: ['flags']
      hasThread: ['flags']
      isCrosspost: ['flags']
      loading: ['flags']
      mentionedUserIds: ['mentions']
      mentionEveryone: ['bitfield']
      pinned: ['bitfield']
      sourceMessageDeleted: ['flags']
      suppressEmbeds: ['flags']
      suppressNotifications: ['flags']
      timestamp: ['id']
      tts: ['bitfield']
      urgent: ['flags']
    }
    alwaysPresents: ['bitfield', 'flags']
  }
  role: {
    dependencies: {
      hoist: ['toggles']
      managed: ['toggles']
      mentionable: ['toggles']
      premiumSubscriber: ['toggles']
      availableForPurchase: ['toggles']
      guildConnections: ['toggles']
    }
    alwaysPresents: ['internalTags']
  }
  user: {
    dependencies: {
      tag: ['username', 'discriminator']
      bot: ['toggles']
      system: ['toggles']
      mfaEnabled: ['toggles']
      verified: ['toggles']
    }
    alwaysPresents: []
  }
  emoji: {
    dependencies: {
      animated: ['toggles']
      available: ['toggles']
      managed: ['toggles']
      requireColons: ['toggles']
    }
    alwaysPresents: ['toggles']
  }
}
export declare function createDesiredPropertiesObject<T extends RecursivePartial<TransformersDesiredProperties>, TDefault extends boolean = false>(
  desiredProperties: T,
  defaultValue?: TDefault,
): CompleteDesiredProperties<T, TDefault>
/** @private This is subject to breaking changes without notices */
export type KeyByValue<TObj, TValue> = {
  [Key in keyof TObj]: TObj[Key] extends TValue ? Key : never
}[keyof TObj]
/** @private This is subject to breaking changes without notices */
export type Complete<TObj, TDefault> = {
  [K in keyof TObj]-?: undefined extends TObj[K] ? TDefault : Exclude<TObj[K], undefined>
}
/** @private This is subject to breaking changes without notices */
export type JoinTuple<T extends string[], TDelimiter extends string> = T extends readonly [infer F extends string, ...infer R extends string[]]
  ? R['length'] extends 0
    ? F
    : `${F}${TDelimiter}${JoinTuple<R, TDelimiter>}`
  : ''
/** @private This is subject to breaking changes without notices */
export type DesiredPropertiesMetadata = {
  [K in keyof TransformersObjects]: {
    dependencies?: {
      [Key in keyof TransformersObjects[K]]?: (keyof TransformersObjects[K])[]
    }
    alwaysPresents?: (keyof TransformersObjects[K])[]
  }
}
/** @private This is subject to breaking changes without notices */
export type DesirableProperties<
  T extends TransformersObjects[keyof TransformersObjects],
  TKey extends keyof TransformersObjects = KeyByValue<TransformersObjects, T>,
> = Exclude<
  keyof T,
  | keyof TransformersDesiredPropertiesMetadata[TKey]['dependencies']
  | (keyof T extends NonNullable<TransformersDesiredPropertiesMetadata[TKey]['alwaysPresents']>[number]
      ? never
      : NonNullable<TransformersDesiredPropertiesMetadata[TKey]['alwaysPresents']>[number])
>
/** @private This is subject to breaking changes without notices */
export type DesiredPropertiesMapper<T extends TransformersObjects[keyof TransformersObjects]> = {
  [Key in DesirableProperties<T>]: boolean
}
declare const TypeErrorSymbol: unique symbol
/** @private This is subject to breaking changes without notices */
export interface DesiredPropertiesError<T extends string> {
  [TypeErrorSymbol]: T
}
/** @private This is subject to breaking changes without notices */
export type AreDependenciesSatisfied<T, TDependencies extends Record<string, string[]> | undefined, TProps> = {
  [K in keyof T]: IsKeyDesired<T[K], TDependencies, TProps> extends true ? true : false
}
/** @private This is subject to breaking changes without notices */
export type IsKeyDesired<TKey, TDependencies extends Record<string, string[]> | undefined, TProps> = TKey extends keyof TProps
  ? TProps[TKey] extends true
    ? true
    : DesiredPropertiesError<`This property is not set as desired in desiredProperties option in createBot(), so you can't use it. More info here: https://discordeno.js.org/desired-props`>
  : TKey extends keyof TDependencies
    ? AreDependenciesSatisfied<TDependencies[TKey], TDependencies, TProps> extends true[]
      ? true
      : DesiredPropertiesError<`This property depends on the following properties: ${JoinTuple<NonNullable<TDependencies>[TKey], ', '>}. Not all of these props are set as desired in desiredProperties option in createBot(), so you can't use it. More info here: https://discordeno.js.org/desired-props`>
    : true
/** The behavior it should be used when resolving an undesired property */
export declare enum DesiredPropertiesBehavior {
  /** When this behavior is used the key will be missing completely */
  RemoveKey = 0,
  /** When this behavior is used the key will be a string explaining why the property is disabled */
  ChangeType = 1,
}
/** @private This is subject to breaking changes without notices */
export type RemoveKeyIfUndesired<Key, T, TProps extends TransformersDesiredProperties> = IsKeyDesired<
  Key,
  TransformersDesiredPropertiesMetadata[KeyByValue<TransformersObjects, T>]['dependencies'],
  TProps[KeyByValue<TransformersObjects, T>]
> extends true
  ? Key
  : never
/** @private This is subject to breaking changes without notices */
export type GetErrorWhenUndesired<
  Key extends keyof T,
  T,
  TProps extends TransformersDesiredProperties,
  TBehavior extends DesiredPropertiesBehavior,
  TIsDesired = IsKeyDesired<
    Key,
    TransformersDesiredPropertiesMetadata[KeyByValue<TransformersObjects, T>]['dependencies'],
    TProps[KeyByValue<TransformersObjects, T>]
  >,
> = TIsDesired extends true ? TransformProperty<T[Key], TProps, TBehavior> : TIsDesired
/** @private This is subject to breaking changes without notices */
export type IsObject<T> = T extends object ? (T extends Function ? false : true) : false
/**
 * Transform a generic object properties based on the desired properties and behavior for other transformer objects in the object.
 */
export type TransformProperty<T, TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior> = T extends Array<infer U>
  ? TransformProperty<U, TProps, TBehavior>[]
  : T extends Collection<infer U, infer UObj>
    ? Collection<U, TransformProperty<UObj, TProps, TBehavior>>
    : T extends Bot
      ? Bot<TProps, TBehavior>
      : T extends TransformersObjects[keyof TransformersObjects]
        ? SetupDesiredProps<T, TProps, TBehavior>
        : T extends InteractionResolvedDataMember<TransformersDesiredProperties, DesiredPropertiesBehavior>
          ? InteractionResolvedDataMember<TProps, TBehavior>
          : T extends InteractionResolvedDataChannel<TransformersDesiredProperties, DesiredPropertiesBehavior>
            ? InteractionResolvedDataChannel<TProps, TBehavior>
            : IsObject<T> extends true
              ? {
                  [K in keyof T]: TransformProperty<T[K], TProps, TBehavior>
                }
              : T
/**
 * Apply desired properties to a transformer object.
 */
export type SetupDesiredProps<
  T extends TransformersObjects[keyof TransformersObjects],
  TProps extends TransformersDesiredProperties,
  TBehavior extends DesiredPropertiesBehavior = DesiredPropertiesBehavior.RemoveKey,
> = {
  [Key in keyof T as TBehavior extends DesiredPropertiesBehavior.RemoveKey
    ? RemoveKeyIfUndesired<Key, T, TProps>
    : Key]: TBehavior extends DesiredPropertiesBehavior.ChangeType
    ? GetErrorWhenUndesired<Key, T, TProps, TBehavior>
    : TransformProperty<T[Key], TProps, TBehavior>
}
/**
 * The desired properties for each transformer object.
 */
export type TransformersDesiredProperties = {
  [Key in keyof TransformersObjects]: DesiredPropertiesMapper<TransformersObjects[Key]>
}
/** @private This is subject to breaking changes without notices */
export type CompleteDesiredProperties<T extends RecursivePartial<TransformersDesiredProperties>, TTDefault extends boolean = false> = {
  [K in keyof TransformersDesiredProperties]: Complete<Partial<TransformersDesiredProperties[K]> & T[K], TTDefault>
}
export {}
//# sourceMappingURL=desiredProperties.d.ts.map
