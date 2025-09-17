import type { DesiredPropertiesBehavior, SetupDesiredProps, TransformersDesiredProperties } from './desiredProperties.js'
import type { Attachment, Channel, Interaction, InteractionDataOption, Member, Role, User } from './transformers/types.js'
export declare function commandOptionsParser<
  TProps extends TransformersDesiredProperties & {
    interaction: {
      data: true
    }
  },
  TBehavior extends DesiredPropertiesBehavior,
>(__interaction: SetupDesiredProps<Interaction, TProps, TBehavior>, options?: InteractionDataOption[]): ParsedInteractionOption<TProps, TBehavior>
export interface ParsedInteractionOption<TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior> {
  [key: string]: InteractionResolvedData<TProps, TBehavior>
}
export type InteractionResolvedData<TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior> =
  | string
  | number
  | boolean
  | InteractionResolvedDataUser<TProps, TBehavior>
  | InteractionResolvedDataChannel<TProps, TBehavior>
  | SetupDesiredProps<Role, TProps, TBehavior>
  | SetupDesiredProps<Attachment, TProps, TBehavior>
  | ParsedInteractionOption<TProps, TBehavior>
export interface InteractionResolvedDataUser<TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior> {
  user: SetupDesiredProps<User, TProps, TBehavior>
  member: InteractionResolvedDataMember<TProps, TBehavior>
}
export type InteractionResolvedDataChannel<TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior> = Pick<
  SetupDesiredProps<Channel, TProps, TBehavior>,
  Extract<
    keyof SetupDesiredProps<Channel, TProps, TBehavior>,
    | 'id'
    | 'name'
    | 'type'
    | 'permissions'
    | 'lastMessageId'
    | 'lastPinTimestamp'
    | 'nsfw'
    | 'parentId'
    | 'guildId'
    | 'flags'
    | 'rateLimitPerUser'
    | 'topic'
    | 'position'
    | 'threadMetadata'
  >
>
export type InteractionResolvedDataMember<TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior> = Omit<
  SetupDesiredProps<Member, TProps, TBehavior>,
  'user' | 'deaf' | 'mute'
>
/** @deprecated Use {@link InteractionResolvedDataUser} */
export interface InteractionResolvedUser {
  user: User
  member: InteractionResolvedMember
}
/** @deprecated Use {@link InteractionResolvedDataChannel} */
export type InteractionResolvedChannel = Pick<
  Channel,
  | 'id'
  | 'name'
  | 'type'
  | 'permissions'
  | 'lastMessageId'
  | 'lastPinTimestamp'
  | 'nsfw'
  | 'parentId'
  | 'guildId'
  | 'flags'
  | 'rateLimitPerUser'
  | 'topic'
  | 'position'
  | 'threadMetadata'
>
/** @deprecated Use {@link InteractionResolvedDataMember} */
export type InteractionResolvedMember = Omit<Member, 'user' | 'deaf' | 'mute'>
//# sourceMappingURL=commandOptionsParser.d.ts.map
