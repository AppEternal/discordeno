import { type BigString, type GetGuildWidgetImageQuery, type ImageFormat, type ImageSize, StickerFormatTypes } from '@discordeno/types'
/** Help format an image url. */
export declare function formatImageUrl(url: string, size?: ImageSize, format?: ImageFormat): string
/**
 * Get the url for an emoji.
 *
 * @param emojiId The id of the emoji
 * @param animated Whether or not the emoji is animated
 * @param format The format of the image, defaults to png
 * @returns string
 *
 * @remarks
 * The animated parameter is used to specify the animated query parameter valid for webp images or to force the gif if the format is not set to webp.
 */
export declare function emojiUrl(emojiId: BigString, animated?: boolean, format?: ImageFormat): string
/**
 * Builds a URL to a user's avatar stored in the Discord CDN.
 *
 * @param userId - The ID of the user to get the avatar of.
 * @param discriminator - The user's discriminator. (4-digit tag after the hashtag.)
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource.
 */
export declare function avatarUrl(
  userId: BigString,
  discriminator: string,
  options?: {
    avatar: BigString | undefined
    size?: ImageSize
    format?: ImageFormat
  },
): string
export declare function avatarDecorationUrl(avatarDecoration: BigString): string
/**
 * Builds a URL to a user's banner stored in the Discord CDN.
 *
 * @param userId - The ID of the user to get the banner of.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if no banner has not been set.
 */
export declare function bannerUrl(
  userId: BigString,
  options?: {
    banner?: BigString
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
/**
 * Builds a URL to the guild banner stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild to get the link to the banner for.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if no banner has been set.
 */
export declare function guildBannerUrl(
  guildId: BigString,
  options: {
    banner?: BigString
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
/**
 * Builds a URL to the guild icon stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild to get the link to the banner for.
 * @param imageHash - The hash identifying the event cover image.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if no banner has been set.
 */
export declare function guildIconUrl(
  guildId: BigString,
  imageHash: BigString | undefined,
  options?: {
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
/**
 * Builds the URL to a guild splash stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild to get the splash of.
 * @param imageHash - The hash identifying the splash image.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if the guild does not have a splash image set.
 */
export declare function guildSplashUrl(
  guildId: BigString,
  imageHash: BigString | undefined,
  options?: {
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
/**
 * Builds the URL to a guild discovery splash stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild to get the splash of.
 * @param imageHash - The hash identifying the discovery splash image.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if the guild does not have a splash image set.
 */
export declare function guildDiscoverySplashUrl(
  guildId: BigString,
  imageHash: BigString | undefined,
  options?: {
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
/**
 * Builds the URL to a guild scheduled event cover stored in the Discord CDN.
 *
 * @param eventId - The ID of the scheduled event to get the cover of.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`.
 */
export declare function guildScheduledEventCoverUrl(
  eventId: BigString,
  options: {
    cover?: BigString
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
/**
 * Builds a URL to the guild widget image stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild to get the link to the widget image for.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource.
 */
export declare function getWidgetImageUrl(guildId: BigString, options?: GetGuildWidgetImageQuery): string
/**
 * Builds a URL to a member's avatar stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild where the member is
 * @param userId - The ID of the user to get the avatar of.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if no banner has been set.
 */
export declare function memberAvatarUrl(
  guildId: BigString,
  userId: BigString,
  options?: {
    avatar?: BigString
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
/**
 * Builds a URL to a member's banner stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild where the member is
 * @param userId - The ID of the user to get the banner of.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if no banner has been set.
 */
export declare function memberBannerUrl(
  guildId: BigString,
  userId: BigString,
  options?: {
    banner?: BigString
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
/**
 * Builds the URL to an application icon stored in the Discord CDN.
 *
 * @param applicationId - The ID of the application to get the icon of.
 * @param iconHash - The hash identifying the application icon.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`
 */
export declare function applicationIconUrl(
  applicationId: BigString,
  iconHash: BigString | undefined,
  options?: {
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
/**
 * Builds the URL to an application cover stored in the Discord CDN.
 *
 * @param applicationId - The ID of the application to get the cover of.
 * @param coverHash - The hash identifying the application cover.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`.
 */
export declare function applicationCoverUrl(
  applicationId: BigString,
  coverHash: BigString | undefined,
  options?: {
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
/**
 * Builds the URL to an application asset stored in the Discord CDN.
 *
 * @param applicationId - The ID of the application to get the asset of.
 * @param assetId - The id identifying the application asset.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`.
 */
export declare function applicationAssetUrl(
  applicationId: BigString,
  assetId: BigString | undefined,
  options?: {
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
/**
 * Builds the URL to a sticker pack banner stored in the Discord CDN.
 *
 * @param bannerAssetId - The ID of the banner asset for the sticker pack.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`.
 */
export declare function stickerPackBannerUrl(
  bannerAssetId: BigString | undefined,
  options?: {
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
/**
 * Builds the URL to a sticker stored in the Discord CDN.
 *
 * @param stickerId - The ID of the sticker to get the icon of
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`.
 */
export declare function stickerUrl(
  stickerId: BigString | number,
  options?: {
    size?: ImageSize
    format?: ImageFormat
    type?: StickerFormatTypes
  },
): string | undefined
/**
 * Builds the URL to a team icon stored in the Discord CDN.
 *
 * @param teamId - The ID of the team to get the icon of
 * @param iconHash - The hash of the team icon.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`.
 */
export declare function teamIconUrl(
  teamId: BigString,
  iconHash: BigString | undefined,
  options?: {
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
/**
 * Builds the URL to a role icon stored in the Discord CDN.
 *
 * @param roleId - The ID of the role to get the icon of
 * @param iconHash - The hash of the role icon.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`.
 */
export declare function roleIconUrl(
  roleId: BigString,
  iconHash: BigString | undefined,
  options?: {
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
/**
 * Builds the URL to a guild tag badge stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild to get the tag badge of
 * @param badgeHash - The hash identifying the guild tag badge.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if no badge has been set.
 */
export declare function guildTagBadgeUrl(
  guildId: BigString,
  badgeHash: BigString | undefined,
  options?: {
    size?: ImageSize
    format?: ImageFormat
  },
): string | undefined
//# sourceMappingURL=images.d.ts.map
