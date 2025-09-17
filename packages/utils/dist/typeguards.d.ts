import type {
  DiscordInviteCreate,
  DiscordInviteMetadata,
  GetMessagesAfter,
  GetMessagesAround,
  GetMessagesBefore,
  GetMessagesLimit,
  GetMessagesOptions,
} from '@discordeno/types'
export declare function isGetMessagesAfter(options: GetMessagesOptions): options is GetMessagesAfter
export declare function isGetMessagesBefore(options: GetMessagesOptions): options is GetMessagesBefore
export declare function isGetMessagesAround(options: GetMessagesOptions): options is GetMessagesAround
export declare function isGetMessagesLimit(options: GetMessagesOptions): options is GetMessagesLimit
export declare function isInviteWithMetadata(options: DiscordInviteCreate | DiscordInviteMetadata): options is DiscordInviteMetadata
//# sourceMappingURL=typeguards.d.ts.map
