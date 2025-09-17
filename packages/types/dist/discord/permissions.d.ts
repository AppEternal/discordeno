/** Types for: https://discord.com/developers/docs/topics/permissions */
/** https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags */
export declare const BitwisePermissionFlags: {
    /** Allows creation of instant invites */
    readonly CREATE_INSTANT_INVITE: bigint;
    /** Allows kicking members */
    readonly KICK_MEMBERS: bigint;
    /** Allows banning members */
    readonly BAN_MEMBERS: bigint;
    /** Allows all permissions and bypasses channel permission overwrites */
    readonly ADMINISTRATOR: bigint;
    /** Allows management and editing of channels */
    readonly MANAGE_CHANNELS: bigint;
    /** Allows management and editing of the guild */
    readonly MANAGE_GUILD: bigint;
    /** Allows for the addition of reactions to messages */
    readonly ADD_REACTIONS: bigint;
    /** Allows for viewing of audit logs */
    readonly VIEW_AUDIT_LOG: bigint;
    /** Allows for using priority speaker in a voice channel */
    readonly PRIORITY_SPEAKER: bigint;
    /** Allows the user to go live */
    readonly STREAM: bigint;
    /** Allows guild members to view a channel, which includes reading messages in text channels and joining voice channels */
    readonly VIEW_CHANNEL: bigint;
    /** Allows for sending messages in a channel. (does not allow sending messages in threads) */
    readonly SEND_MESSAGES: bigint;
    /** Allows for sending of /tts messages */
    readonly SEND_TTS_MESSAGES: bigint;
    /** Allows for deletion of other users messages */
    readonly MANAGE_MESSAGES: bigint;
    /** Links sent by users with this permission will be auto-embedded */
    readonly EMBED_LINKS: bigint;
    /** Allows for uploading images and files */
    readonly ATTACH_FILES: bigint;
    /** Allows for reading of message history */
    readonly READ_MESSAGE_HISTORY: bigint;
    /** Allows for using the \@everyone tag to notify all users in a channel, and the \@here tag to notify all online users in a channel */
    readonly MENTION_EVERYONE: bigint;
    /** Allows the usage of custom emojis from other servers */
    readonly USE_EXTERNAL_EMOJIS: bigint;
    /** Allows for viewing guild insights */
    readonly VIEW_GUILD_INSIGHTS: bigint;
    /** Allows for joining of a voice channel */
    readonly CONNECT: bigint;
    /** Allows for speaking in a voice channel */
    readonly SPEAK: bigint;
    /** Allows for muting members in a voice channel */
    readonly MUTE_MEMBERS: bigint;
    /** Allows for deafening of members in a voice channel */
    readonly DEAFEN_MEMBERS: bigint;
    /** Allows for moving of members between voice channels */
    readonly MOVE_MEMBERS: bigint;
    /** Allows for using voice-activity-detection in a voice channel */
    readonly USE_VAD: bigint;
    /** Allows for modification of own nickname */
    readonly CHANGE_NICKNAME: bigint;
    /** Allows for modification of other users nicknames */
    readonly MANAGE_NICKNAMES: bigint;
    /** Allows management and editing of roles */
    readonly MANAGE_ROLES: bigint;
    /** Allows management and editing of webhooks */
    readonly MANAGE_WEBHOOKS: bigint;
    /** Allows for editing and deleting emojis, stickers, and soundboard sounds created by all users */
    readonly MANAGE_GUILD_EXPRESSIONS: bigint;
    /** Allows members to use application commands in text channels */
    readonly USE_SLASH_COMMANDS: bigint;
    /** Allows for requesting to speak in stage channels. */
    readonly REQUEST_TO_SPEAK: bigint;
    /** Allows for editing and deleting scheduled events created by all users */
    readonly MANAGE_EVENTS: bigint;
    /** Allows for deleting and archiving threads, and viewing all private threads */
    readonly MANAGE_THREADS: bigint;
    /** Allows for creating public and announcement threads */
    readonly CREATE_PUBLIC_THREADS: bigint;
    /** Allows for creating private threads */
    readonly CREATE_PRIVATE_THREADS: bigint;
    /** Allows the usage of custom stickers from other servers */
    readonly USE_EXTERNAL_STICKERS: bigint;
    /** Allows for sending messages in threads */
    readonly SEND_MESSAGES_IN_THREADS: bigint;
    /** Allows for launching activities (applications with the `EMBEDDED` flag) in a voice channel. */
    readonly USE_EMBEDDED_ACTIVITIES: bigint;
    /** Allows for timing out users to prevent them from sending or reacting to messages in chat and threads, and from speaking in voice and stage channels */
    readonly MODERATE_MEMBERS: bigint;
    /** Allows for viewing role subscription insights. */
    readonly VIEW_CREATOR_MONETIZATION_ANALYTICS: bigint;
    /** Allows for using soundboard in a voice channel. */
    readonly USE_SOUNDBOARD: bigint;
    /** Allows for creating emojis, stickers, and soundboard sounds, and editing and deleting those created by the current user */
    readonly CREATE_GUILD_EXPRESSIONS: bigint;
    /** Allows for creating scheduled events, and editing and deleting those created by the current user */
    readonly CREATE_EVENTS: bigint;
    /** Allows the usage of custom soundboards sounds from other servers */
    readonly USE_EXTERNAL_SOUNDS: bigint;
    /** Allows sending voice messages */
    readonly SEND_VOICE_MESSAGES: bigint;
    /** Allows sending polls */
    readonly SEND_POLLS: bigint;
    /** Allows user-installed apps to send public responses. When disabled, users will still be allowed to use their apps but the responses will be ephemeral. This only applies to apps not also installed to the server. */
    readonly USE_EXTERNAL_APPS: bigint;
    /** Allows pinning and unpinning messages */
    readonly PIN_MESSAGES: bigint;
};
/** https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags */
export type PermissionStrings = keyof typeof BitwisePermissionFlags;
/** https://discord.com/developers/docs/topics/permissions#role-object-role-structure */
export interface DiscordRole {
    /** Role id */
    id: string;
    /** Role name */
    name: string;
    /**
     * RGB color value, default: 0
     * @deprecated the {@link colors} field is recommended for use instead of this field
     */
    color: number;
    /** The role's color */
    colors: DiscordRoleColors;
    /** If this role is showed separately in the user listing */
    hoist: boolean;
    /** the role emoji hash */
    icon?: string;
    /** role unicode emoji */
    unicode_emoji?: string;
    /** Position of this role (roles with the same position are sorted by id) */
    position: number;
    /** Permission bit set */
    permissions: string;
    /** Whether this role is managed by an integration */
    managed: boolean;
    /** Whether this role is mentionable */
    mentionable: boolean;
    /** The tags this role has */
    tags?: DiscordRoleTags;
    /** Role flags combined as a bitfield */
    flags: RoleFlags;
}
/** https://discord.com/developers/docs/topics/permissions#role-object-role-tags-structure */
export interface DiscordRoleTags {
    /** The id of the bot this role belongs to */
    bot_id?: string;
    /** The id of the integration this role belongs to */
    integration_id?: string;
    /** Whether this is the guild's premium subscriber role */
    premium_subscriber?: null;
    /** Id of this role's subscription sku and listing. */
    subscription_listing_id?: string;
    /** Whether this role is available for purchase. */
    available_for_purchase?: null;
    /** Whether this is a guild's linked role */
    guild_connections?: null;
}
/** https://discord.com/developers/docs/topics/permissions#role-object-role-colors-object */
export interface DiscordRoleColors {
    /** The primary color for the role */
    primary_color: number;
    /** The secondary color for the role, this will make the role a gradient between the other provided colors */
    secondary_color: number | null;
    /** The tertiary color for the role, this will turn the gradient into a holographic style */
    tertiary_color: number | null;
}
/** https://discord.com/developers/docs/topics/permissions#role-object-role-flags */
export declare enum RoleFlags {
    None = 0,
    /** Role can be selected by members in an onboarding prompt */
    InPrompt = 1
}
//# sourceMappingURL=permissions.d.ts.map