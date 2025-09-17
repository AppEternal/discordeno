import { type DiscordGuild } from '@discordeno/types'
import { ToggleBitfieldBigint } from './ToggleBitfield.js'
/** @private This is subject to breaking changes without notices */
export declare const guildFeatureNames: readonly [
  'animatedBanner',
  'animatedIcon',
  'applicationCommandPermissionsV2',
  'autoModeration',
  'banner',
  'community',
  'creatorMonetizableProvisional',
  'creatorStorePage',
  'developerSupportServer',
  'discoverable',
  'featurable',
  'invitesDisabled',
  'inviteSplash',
  'memberVerificationGateEnabled',
  'moreSoundboard',
  'moreStickers',
  'news',
  'partnered',
  'previewEnabled',
  'raidAlertsDisabled',
  'roleIcons',
  'roleSubscriptionsAvailableForPurchase',
  'roleSubscriptionsEnabled',
  'ticketedEventsEnabled',
  'vanityUrl',
  'verified',
  'vipRegions',
  'welcomeScreenEnabled',
  'guestsEnabled',
  'guildTags',
  'enhancedRoleColors',
]
export declare const GuildToggle: {
  /** Whether the bot is the owner of the guild */
  owner: bigint
  /** Whether the server widget is enabled */
  widgetEnabled: bigint
  /** Whether this is considered a large guild */
  large: bigint
  /** Whether this guild is unavailable due to an outage */
  unavailable: bigint
  /** Whether the guild has the boost progress bar enabled */
  premiumProgressBarEnabled: bigint
  /** Whether the guild has access to set an animated guild banner image */
  animatedBanner: bigint
  /** Whether the guild has access to set an animated guild icon */
  animatedIcon: bigint
  /** Whether the guild is using the old permissions configuration behavior */
  applicationCommandPermissionsV2: bigint
  /** Whether the guild has set up auto moderation rules */
  autoModeration: bigint
  /** Whether the guild has access to set a guild banner image */
  banner: bigint
  /** Whether the guild can enable welcome screen, Membership Screening, stage channels and discovery, and receives community updates */
  community: bigint
  /** Whether the guild has enabled monetization. */
  creatorMonetizableProvisional: bigint
  /** Whether the guild has enabled the role subscription promo page. */
  creatorStorePage: bigint
  /** Whether the guild has been set as a support server on the App Directory */
  developerSupportServer: bigint
  /** Whether the guild is able to be discovered in the directory */
  discoverable: bigint
  /** Whether the guild is able to be featured in the directory */
  featurable: bigint
  /** Whether the guild has paused invites, preventing new users from joining */
  invitesDisabled: bigint
  /** Whether the guild has access to set an invite splash background */
  inviteSplash: bigint
  /** Whether the guild has enabled [Membership Screening](https://discord.com/developers/docs/resources/guild#membership-screening-object) */
  memberVerificationGateEnabled: bigint
  /** Whether the guild has more soundboard sound slot */
  moreSoundboard: bigint
  /** Whether the guild has increased custom sticker slots */
  moreStickers: bigint
  /** Whether the guild has access to create news channels */
  news: bigint
  /** Whether the guild is partnered */
  partnered: bigint
  /** Whether the guild can be previewed before joining via Membership Screening or the directory */
  previewEnabled: bigint
  /** Whether the guild has disabled alerts for join raids in the configured safety alerts channel */
  raidAlertsDisabled: bigint
  /** Whether the guild is able to set role icons */
  roleIcons: bigint
  /** Whether the guild has role subscriptions that can be purchased. */
  roleSubscriptionsAvailableForPurchase: bigint
  /** Whether the guild has enabled role subscriptions. */
  roleSubscriptionsEnabled: bigint
  /** Whether the guild has created soundboard sounds. */
  soundboard: bigint
  /** Whether the guild has enabled ticketed events */
  ticketedEventsEnabled: bigint
  /** Whether the guild has access to set a vanity URL */
  vanityUrl: bigint
  /** Whether the guild is verified */
  verified: bigint
  /** Whether the guild has access to set 384 kbps bitrate in voice (previously VIP voice servers) */
  vipRegions: bigint
  /** Whether the guild has enabled the welcome screen */
  welcomeScreenEnabled: bigint
  /** Whether the guild has access to guest invites */
  guestsEnabled: bigint
  /** Whether the guild has access to set guild tags */
  guildTags: bigint
  /** Whether the guild is able to set gradient colors to roles */
  enhancedRoleColors: bigint
}
export declare class GuildToggles extends ToggleBitfieldBigint {
  constructor(guildOrTogglesBigint: DiscordGuild | bigint)
  get features(): GuildFeatureKeys[]
  /** Whether the bot is the owner of the guild */
  get owner(): boolean
  /** Whether the server widget is enabled */
  get widgetEnabled(): boolean
  /** Whether this is considered a large guild */
  get large(): boolean
  /** Whether this guild is unavailable due to an outage */
  get unavailable(): boolean
  /** Whether the guild has the boost progress bar enabled */
  get premiumProgressBarEnabled(): boolean
  /** Whether the guild has access to set an invite splash background */
  get inviteSplash(): boolean
  /** Whether the guild has access to set 384 kbps bitrate in voice (previously VIP voice servers) */
  get vipRegions(): boolean
  /** Whether the guild has access to set a vanity URL */
  get vanityUrl(): boolean
  /** Whether the guild is verified */
  get verified(): boolean
  /** Whether the guild is partnered */
  get partnered(): boolean
  /** Whether the guild can enable welcome screen, Membership Screening, stage channels and discovery, and receives community updates */
  get community(): boolean
  /** Whether the Guild has been set as a support server on the App Directory */
  get developerSupportServer(): boolean
  /** Whether the guild has access to set an animated guild banner image */
  get animatedBanner(): boolean
  /** Whether the guild has access to create news channels */
  get news(): boolean
  /** Whether the guild is able to be discovered in the directory */
  get discoverable(): boolean
  /** Whether the guild is able to be featured in the directory */
  get featurable(): boolean
  /** Whether the guild has access to set an animated guild icon */
  get animatedIcon(): boolean
  /** Whether the guild has access to set a guild banner image */
  get banner(): boolean
  /** Whether the guild has enabled the welcome screen */
  get welcomeScreenEnabled(): boolean
  /** Whether the guild has enabled [Membership Screening](https://discord.com/developers/docs/resources/guild#membership-screening-object) */
  get memberVerificationGateEnabled(): boolean
  /** Whether the guild has more soundboard sound slot */
  get moreSoundboard(): boolean
  /** Whether the guild can be previewed before joining via Membership Screening or the directory */
  get previewEnabled(): boolean
  /** Whether the guild has enabled ticketed events */
  get ticketedEventsEnabled(): boolean
  /** Whether the guild has increased custom sticker slots */
  get moreStickers(): boolean
  /** Whether the guild is able to set role icons */
  get roleIcons(): boolean
  /** Whether the guild has set up auto moderation rules */
  get autoModeration(): boolean
  /** Whether the guild has paused invites, preventing new users from joining */
  get invitesDisabled(): boolean
  /** Whether the guild is using the old permissions configuration behavior */
  get applicationCommandPermissionsV2(): boolean
  /** Whether the guild has enabled monetization. */
  get creatorMonetizableProvisional(): boolean
  /** Whether the guild has enabled the role subscription promo page. */
  get creatorStorePage(): boolean
  /** Whether the guild has disabled alerts for join raids in the configured safety alerts channel */
  get raidAlertsDisabled(): boolean
  /** Whether the guild has role subscriptions that can be purchased. */
  get roleSubscriptionsAvailableForPurchase(): boolean
  /** Whether the guild has enabled role subscriptions. */
  get roleSubscriptionsEnabled(): boolean
  /** Whether the guild has created soundboard sounds. */
  get soundboard(): boolean
  /** Whether the guild has access to guest invites */
  get guestsEnabled(): boolean
  /** Whether the guild has access to set guild tags */
  get guildTags(): boolean
  /** Whether the guild is able to set gradient colors to roles */
  get enhancedRoleColors(): boolean
  /** Checks whether or not the permissions exist in this */
  has(permissions: GuildToggleKeys | GuildToggleKeys[]): boolean
  /** Lists all the toggles for the role and whether or not each is true or false. */
  list(): Record<GuildToggleKeys, boolean>
}
export type GuildToggleKeys = keyof typeof GuildToggle
export type GuildFeatureKeys = (typeof guildFeatureNames)[number]
//# sourceMappingURL=guild.d.ts.map
