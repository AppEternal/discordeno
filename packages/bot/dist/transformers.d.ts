import type {
  AllowedMentions,
  BigString,
  DiscordActivity,
  DiscordActivityInstance,
  DiscordActivityLocation,
  DiscordAllowedMentions,
  DiscordApplication,
  DiscordApplicationCommand,
  DiscordApplicationCommandOption,
  DiscordApplicationCommandOptionChoice,
  DiscordAttachment,
  DiscordAuditLogEntry,
  DiscordAutoModerationActionExecution,
  DiscordAutoModerationRule,
  DiscordAvatarDecorationData,
  DiscordChannel,
  DiscordCollectibles,
  DiscordDefaultReactionEmoji,
  DiscordEmbed,
  DiscordEmoji,
  DiscordEntitlement,
  DiscordForumTag,
  DiscordGetGatewayBot,
  DiscordGuild,
  DiscordGuildApplicationCommandPermissions,
  DiscordGuildOnboarding,
  DiscordGuildOnboardingPrompt,
  DiscordGuildOnboardingPromptOption,
  DiscordGuildWidget,
  DiscordGuildWidgetSettings,
  DiscordIncidentsData,
  DiscordIntegrationCreateUpdate,
  DiscordInteraction,
  DiscordInteractionCallback,
  DiscordInteractionCallbackResponse,
  DiscordInteractionDataOption,
  DiscordInteractionDataResolved,
  DiscordInteractionResource,
  DiscordInviteCreate,
  DiscordInviteMetadata,
  DiscordInviteStageInstance,
  DiscordLobby,
  DiscordLobbyMember,
  DiscordMediaGalleryItem,
  DiscordMember,
  DiscordMessage,
  DiscordMessageCall,
  DiscordMessageComponent,
  DiscordMessageInteractionMetadata,
  DiscordMessagePin,
  DiscordMessageSnapshot,
  DiscordNameplate,
  DiscordPoll,
  DiscordPollMedia,
  DiscordPresenceUpdate,
  DiscordRole,
  DiscordRoleColors,
  DiscordScheduledEvent,
  DiscordScheduledEventRecurrenceRule,
  DiscordSku,
  DiscordSoundboardSound,
  DiscordStageInstance,
  DiscordSticker,
  DiscordStickerPack,
  DiscordSubscription,
  DiscordTeam,
  DiscordTemplate,
  DiscordThreadMember,
  DiscordThreadMemberGuildCreate,
  DiscordUnfurledMediaItem,
  DiscordUser,
  DiscordUserPrimaryGuild,
  DiscordVoiceRegion,
  DiscordVoiceState,
  DiscordWebhook,
  DiscordWelcomeScreen,
  RecursivePartial,
} from '@discordeno/types'
import type { Bot } from './bot.js'
import {
  type DesiredPropertiesBehavior,
  type SetupDesiredProps,
  type TransformersDesiredProperties,
  type TransformersObjects,
  type TransformProperty,
} from './desiredProperties.js'
import { type ThreadMemberTransformerExtra } from './transformers/threadMember.js'
import type {
  Activity,
  ActivityInstance,
  ActivityLocation,
  Application,
  ApplicationCommand,
  ApplicationCommandOption,
  ApplicationCommandOptionChoice,
  Attachment,
  AuditLogEntry,
  AutoModerationActionExecution,
  AutoModerationRule,
  AvatarDecorationData,
  Channel,
  Collectibles,
  Component,
  DefaultReactionEmoji,
  Embed,
  Emoji,
  Entitlement,
  ForumTag,
  GetGatewayBot,
  Guild,
  GuildApplicationCommandPermissions,
  GuildOnboarding,
  GuildOnboardingPrompt,
  GuildOnboardingPromptOption,
  GuildWidget,
  GuildWidgetSettings,
  IncidentsData,
  Integration,
  Interaction,
  InteractionCallback,
  InteractionCallbackResponse,
  InteractionDataOption,
  InteractionDataResolved,
  InteractionResource,
  Invite,
  InviteStageInstance,
  Lobby,
  LobbyMember,
  MediaGalleryItem,
  Member,
  Message,
  MessageCall,
  MessageInteractionMetadata,
  MessagePin,
  MessageSnapshot,
  Nameplate,
  Poll,
  PollMedia,
  PresenceUpdate,
  Role,
  RoleColors,
  ScheduledEvent,
  ScheduledEventRecurrenceRule,
  Sku,
  SoundboardSound,
  StageInstance,
  Sticker,
  StickerPack,
  Subscription,
  Team,
  Template,
  ThreadMember,
  ThreadMemberGuildCreate,
  UnfurledMediaItem,
  User,
  UserPrimaryGuild,
  VoiceRegion,
  VoiceState,
  Webhook,
  WelcomeScreen,
} from './transformers/types.js'
export type TransformerFunctions<TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior> = {
  activity: TransformerFunction<TProps, TBehavior, DiscordActivity, Activity, {}, 'unchanged'>
  activityInstance: TransformerFunction<TProps, TBehavior, DiscordActivityInstance, ActivityInstance>
  activityLocation: TransformerFunction<TProps, TBehavior, DiscordActivityLocation, ActivityLocation>
  application: TransformerFunction<
    TProps,
    TBehavior,
    DiscordApplication,
    Application,
    {
      shardId?: number
    },
    'unchanged'
  >
  applicationCommand: TransformerFunction<TProps, TBehavior, DiscordApplicationCommand, ApplicationCommand, {}, 'unchanged'>
  applicationCommandOption: TransformerFunction<TProps, TBehavior, DiscordApplicationCommandOption, ApplicationCommandOption, {}, 'unchanged'>
  applicationCommandOptionChoice: TransformerFunction<
    TProps,
    TBehavior,
    DiscordApplicationCommandOptionChoice,
    ApplicationCommandOptionChoice,
    {},
    'unchanged'
  >
  applicationCommandPermission: TransformerFunction<
    TProps,
    TBehavior,
    DiscordGuildApplicationCommandPermissions,
    GuildApplicationCommandPermissions,
    {},
    'unchanged'
  >
  attachment: TransformerFunction<TProps, TBehavior, DiscordAttachment, Attachment>
  auditLogEntry: TransformerFunction<TProps, TBehavior, DiscordAuditLogEntry, AuditLogEntry, {}, 'unchanged'>
  automodActionExecution: TransformerFunction<TProps, TBehavior, DiscordAutoModerationActionExecution, AutoModerationActionExecution, {}, 'unchanged'>
  automodRule: TransformerFunction<TProps, TBehavior, DiscordAutoModerationRule, AutoModerationRule, {}, 'unchanged'>
  avatarDecorationData: TransformerFunction<TProps, TBehavior, DiscordAvatarDecorationData, AvatarDecorationData>
  channel: TransformerFunction<
    TProps,
    TBehavior,
    DiscordChannel,
    Channel,
    {
      guildId?: BigString
    }
  >
  collectibles: TransformerFunction<TProps, TBehavior, DiscordCollectibles, Collectibles>
  component: TransformerFunction<TProps, TBehavior, DiscordMessageComponent, Component, {}, 'unchanged'>
  defaultReactionEmoji: TransformerFunction<TProps, TBehavior, DiscordDefaultReactionEmoji, DefaultReactionEmoji>
  embed: TransformerFunction<TProps, TBehavior, DiscordEmbed, Embed, {}, 'unchanged'>
  emoji: TransformerFunction<TProps, TBehavior, DiscordEmoji, Emoji>
  entitlement: TransformerFunction<TProps, TBehavior, DiscordEntitlement, Entitlement>
  forumTag: TransformerFunction<TProps, TBehavior, DiscordForumTag, ForumTag>
  gatewayBot: TransformerFunction<TProps, TBehavior, DiscordGetGatewayBot, GetGatewayBot, {}, 'unchanged'>
  guild: TransformerFunction<
    TProps,
    TBehavior,
    DiscordGuild,
    Guild,
    {
      shardId?: number
    }
  >
  guildOnboarding: TransformerFunction<TProps, TBehavior, DiscordGuildOnboarding, GuildOnboarding>
  guildOnboardingPrompt: TransformerFunction<TProps, TBehavior, DiscordGuildOnboardingPrompt, GuildOnboardingPrompt>
  guildOnboardingPromptOption: TransformerFunction<TProps, TBehavior, DiscordGuildOnboardingPromptOption, GuildOnboardingPromptOption>
  incidentsData: TransformerFunction<TProps, TBehavior, DiscordIncidentsData, IncidentsData>
  integration: TransformerFunction<TProps, TBehavior, DiscordIntegrationCreateUpdate, Integration, {}, 'unchanged'>
  interaction: TransformerFunction<
    TProps,
    TBehavior,
    DiscordInteraction,
    Interaction,
    {
      shardId?: number
    }
  >
  interactionCallback: TransformerFunction<TProps, TBehavior, DiscordInteractionCallback, InteractionCallback>
  interactionCallbackResponse: TransformerFunction<
    TProps,
    TBehavior,
    DiscordInteractionCallbackResponse,
    InteractionCallbackResponse,
    {
      shardId?: number
    }
  >
  interactionDataOptions: TransformerFunction<TProps, TBehavior, DiscordInteractionDataOption, InteractionDataOption, {}, 'unchanged'>
  interactionDataResolved: TransformerFunction<
    TProps,
    TBehavior,
    DiscordInteractionDataResolved,
    InteractionDataResolved,
    {
      shardId?: number
      guildId?: BigString
    },
    'transform'
  >
  interactionResource: TransformerFunction<
    TProps,
    TBehavior,
    DiscordInteractionResource,
    InteractionResource,
    {
      shardId?: number
    }
  >
  invite: TransformerFunction<
    TProps,
    TBehavior,
    DiscordInviteCreate | DiscordInviteMetadata,
    Invite,
    {
      shardId?: number
    }
  >
  inviteStageInstance: TransformerFunction<
    TProps,
    TBehavior,
    DiscordInviteStageInstance,
    InviteStageInstance,
    {
      guildId?: BigString
    }
  >
  lobby: TransformerFunction<TProps, TBehavior, DiscordLobby, Lobby>
  lobbyMember: TransformerFunction<TProps, TBehavior, DiscordLobbyMember, LobbyMember>
  mediaGalleryItem: TransformerFunction<TProps, TBehavior, DiscordMediaGalleryItem, MediaGalleryItem, {}, 'unchanged'>
  member: TransformerFunction<
    TProps,
    TBehavior,
    DiscordMember,
    Member,
    {
      guildId?: BigString
      userId?: BigString
    }
  >
  message: TransformerFunction<
    TProps,
    TBehavior,
    DiscordMessage,
    Message,
    {
      shardId?: number
    }
  >
  messageCall: TransformerFunction<TProps, TBehavior, DiscordMessageCall, MessageCall>
  messageInteractionMetadata: TransformerFunction<TProps, TBehavior, DiscordMessageInteractionMetadata, MessageInteractionMetadata>
  messagePin: TransformerFunction<
    TProps,
    TBehavior,
    DiscordMessagePin,
    MessagePin,
    {
      shardId?: number
    }
  >
  messageSnapshot: TransformerFunction<
    TProps,
    TBehavior,
    DiscordMessageSnapshot,
    MessageSnapshot,
    {
      shardId?: number
    }
  >
  nameplate: TransformerFunction<TProps, TBehavior, DiscordNameplate, Nameplate>
  poll: TransformerFunction<TProps, TBehavior, DiscordPoll, Poll>
  pollMedia: TransformerFunction<TProps, TBehavior, DiscordPollMedia, PollMedia>
  presence: TransformerFunction<TProps, TBehavior, DiscordPresenceUpdate, PresenceUpdate, {}, 'unchanged'>
  role: TransformerFunction<
    TProps,
    TBehavior,
    DiscordRole,
    Role,
    {
      guildId?: BigString
    }
  >
  roleColors: TransformerFunction<TProps, TBehavior, DiscordRoleColors, RoleColors>
  scheduledEvent: TransformerFunction<TProps, TBehavior, DiscordScheduledEvent, ScheduledEvent>
  scheduledEventRecurrenceRule: TransformerFunction<TProps, TBehavior, DiscordScheduledEventRecurrenceRule, ScheduledEventRecurrenceRule>
  sku: TransformerFunction<TProps, TBehavior, DiscordSku, Sku>
  soundboardSound: TransformerFunction<TProps, TBehavior, DiscordSoundboardSound, SoundboardSound>
  stageInstance: TransformerFunction<TProps, TBehavior, DiscordStageInstance, StageInstance>
  sticker: TransformerFunction<TProps, TBehavior, DiscordSticker, Sticker>
  stickerPack: TransformerFunction<TProps, TBehavior, DiscordStickerPack, StickerPack, {}, 'unchanged'>
  subscription: TransformerFunction<TProps, TBehavior, DiscordSubscription, Subscription>
  team: TransformerFunction<TProps, TBehavior, DiscordTeam, Team, {}, 'unchanged'>
  template: TransformerFunction<TProps, TBehavior, DiscordTemplate, Template, {}, 'unchanged'>
  threadMember: TransformerFunction<TProps, TBehavior, DiscordThreadMember, ThreadMember, ThreadMemberTransformerExtra, 'unchanged'>
  threadMemberGuildCreate: TransformerFunction<TProps, TBehavior, DiscordThreadMemberGuildCreate, ThreadMemberGuildCreate, {}, 'unchanged'>
  unfurledMediaItem: TransformerFunction<TProps, TBehavior, DiscordUnfurledMediaItem, UnfurledMediaItem, {}, 'unchanged'>
  user: TransformerFunction<TProps, TBehavior, DiscordUser, User>
  userPrimaryGuild: TransformerFunction<TProps, TBehavior, DiscordUserPrimaryGuild, UserPrimaryGuild>
  voiceRegion: TransformerFunction<TProps, TBehavior, DiscordVoiceRegion, VoiceRegion, {}, 'unchanged'>
  voiceState: TransformerFunction<
    TProps,
    TBehavior,
    DiscordVoiceState,
    VoiceState,
    {
      guildId?: BigString
    }
  >
  webhook: TransformerFunction<TProps, TBehavior, DiscordWebhook, Webhook>
  welcomeScreen: TransformerFunction<TProps, TBehavior, DiscordWelcomeScreen, WelcomeScreen, {}, 'unchanged'>
  widget: TransformerFunction<TProps, TBehavior, DiscordGuildWidget, GuildWidget, {}, 'unchanged'>
  widgetSettings: TransformerFunction<TProps, TBehavior, DiscordGuildWidgetSettings, GuildWidgetSettings, {}, 'unchanged'>
}
export type Transformers<TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior> = TransformerFunctions<
  TProps,
  TBehavior
> & {
  customizers: TransformerCustomizers<TProps, TBehavior>
  desiredProperties: TransformersDesiredProperties
  reverse: {
    activity: (bot: Bot<TProps, TBehavior>, payload: Activity) => DiscordActivity
    allowedMentions: (bot: Bot<TProps, TBehavior>, payload: AllowedMentions) => DiscordAllowedMentions
    application: (bot: Bot<TProps, TBehavior>, payload: Application) => DiscordApplication
    applicationCommand: (bot: Bot<TProps, TBehavior>, payload: ApplicationCommand) => DiscordApplicationCommand
    applicationCommandOption: (bot: Bot<TProps, TBehavior>, payload: ApplicationCommandOption) => DiscordApplicationCommandOption
    applicationCommandOptionChoice: (bot: Bot<TProps, TBehavior>, payload: ApplicationCommandOptionChoice) => DiscordApplicationCommandOptionChoice
    attachment: (bot: Bot<TProps, TBehavior>, payload: SetupDesiredProps<Attachment, TProps, TBehavior>) => DiscordAttachment
    component: (bot: Bot<TProps, TBehavior>, payload: Component) => DiscordMessageComponent
    embed: (bot: Bot<TProps, TBehavior>, payload: Embed) => DiscordEmbed
    mediaGalleryItem: (bot: Bot<TProps, TBehavior>, payload: MediaGalleryItem) => DiscordMediaGalleryItem
    member: (bot: Bot<TProps, TBehavior>, payload: SetupDesiredProps<Member, TProps, TBehavior>) => DiscordMember
    snowflake: (snowflake: BigString) => string
    team: (bot: Bot<TProps, TBehavior>, payload: Team) => DiscordTeam
    unfurledMediaItem: (bot: Bot<TProps, TBehavior>, payload: UnfurledMediaItem) => DiscordUnfurledMediaItem
    user: (bot: Bot<TProps, TBehavior>, payload: SetupDesiredProps<User, TProps, TBehavior>) => DiscordUser
  }
  snowflake: (snowflake: BigString) => bigint
}
export declare function createTransformers<TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior>(
  options: RecursivePartial<Transformers<TProps, TBehavior>>,
): Transformers<TProps, TBehavior>
export type TransformerFunction<
  TProps extends TransformersDesiredProperties,
  TBehavior extends DesiredPropertiesBehavior,
  TPayload,
  TTransformed,
  TExtra = {},
  TKind extends 'desired-props' | 'transform' | 'unchanged' = 'desired-props',
> = (
  bot: Bot<TProps, TBehavior>,
  payload: TPayload,
  extra?: TExtra,
) => TKind extends 'desired-props'
  ? TTransformed extends TransformersObjects[keyof TransformersObjects]
    ? SetupDesiredProps<TTransformed, TProps, TBehavior>
    : 'ERROR: Invalid transformer kind'
  : TKind extends 'transform'
    ? TransformProperty<TTransformed, TProps, TBehavior>
    : TTransformed
export type TransformerCustomizerFunction<
  TProps extends TransformersDesiredProperties,
  TBehavior extends DesiredPropertiesBehavior,
  TPayload,
  TTransformed,
  TExtra = {},
> = (bot: Bot<TProps, TBehavior>, payload: TPayload, transformed: TTransformed, extra?: TExtra) => any
export type TransformerCustomizers<TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior> = {
  [K in keyof TransformerFunctions<TProps, TBehavior>]: TransformerFunctions<TProps, TBehavior>[K] extends TransformerFunction<
    TProps,
    TBehavior,
    infer TPayload,
    infer _TTransformed,
    infer TExtra,
    infer _TKind
  >
    ? TransformerCustomizerFunction<TProps, TBehavior, TPayload, ReturnType<Transformers<TProps, TBehavior>[K]>, BigStringsToBigints<TExtra>>
    : 'ERROR: Invalid transformer found'
}
export type BigStringsToBigints<T> = {
  [K in keyof T]: BigString extends T[K] ? bigint : T[K]
}
//# sourceMappingURL=transformers.d.ts.map
