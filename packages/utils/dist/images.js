import { StickerFormatTypes } from '@discordeno/types'
import { iconBigintToHash } from './hash.js'
/** Help format an image url. */ export function formatImageUrl(url, size = 128, format) {
  return `${url}.${format ?? (url.includes('/a_') ? 'gif' : 'webp')}?size=${size}`
}
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
 */ export function emojiUrl(emojiId, animated = false, format = 'png') {
  return `https://cdn.discordapp.com/emojis/${emojiId}.${animated ? (format === 'webp' ? 'webp' : 'gif') : format}${animated && format === 'webp' ? '?animated=true' : ''}`
}
/**
 * Builds a URL to a user's avatar stored in the Discord CDN.
 *
 * @param userId - The ID of the user to get the avatar of.
 * @param discriminator - The user's discriminator. (4-digit tag after the hashtag.)
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource.
 */ export function avatarUrl(userId, discriminator, options) {
  return options?.avatar
    ? formatImageUrl(
        `https://cdn.discordapp.com/avatars/${userId}/${typeof options.avatar === 'string' ? options.avatar : iconBigintToHash(options.avatar)}`,
        options?.size ?? 128,
        options?.format,
      )
    : `https://cdn.discordapp.com/embed/avatars/${discriminator === '0' ? (BigInt(userId) >> BigInt(22)) % BigInt(6) : Number(discriminator) % 5}.png`
}
export function avatarDecorationUrl(avatarDecoration) {
  return `https://cdn.discordapp.com/avatar-decoration-presets/${typeof avatarDecoration === 'string' ? avatarDecoration : iconBigintToHash(avatarDecoration)}.png`
}
/**
 * Builds a URL to a user's banner stored in the Discord CDN.
 *
 * @param userId - The ID of the user to get the banner of.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if no banner has not been set.
 */ export function bannerUrl(userId, options) {
  return options?.banner
    ? formatImageUrl(
        `https://cdn.discordapp.com/banners/${userId}/${typeof options.banner === 'string' ? options.banner : iconBigintToHash(options.banner)}`,
        options?.size ?? 128,
        options?.format,
      )
    : undefined
}
/**
 * Builds a URL to the guild banner stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild to get the link to the banner for.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if no banner has been set.
 */ export function guildBannerUrl(guildId, options) {
  return options.banner
    ? formatImageUrl(
        `https://cdn.discordapp.com/banners/${guildId}/${typeof options.banner === 'string' ? options.banner : iconBigintToHash(options.banner)}`,
        options.size ?? 128,
        options.format,
      )
    : undefined
}
/**
 * Builds a URL to the guild icon stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild to get the link to the banner for.
 * @param imageHash - The hash identifying the event cover image.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if no banner has been set.
 */ export function guildIconUrl(guildId, imageHash, options) {
  return imageHash
    ? formatImageUrl(
        `https://cdn.discordapp.com/icons/${guildId}/${typeof imageHash === 'string' ? imageHash : iconBigintToHash(imageHash)}`,
        options?.size ?? 128,
        options?.format,
      )
    : undefined
}
/**
 * Builds the URL to a guild splash stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild to get the splash of.
 * @param imageHash - The hash identifying the splash image.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if the guild does not have a splash image set.
 */ export function guildSplashUrl(guildId, imageHash, options) {
  return imageHash
    ? formatImageUrl(
        `https://cdn.discordapp.com/splashes/${guildId}/${typeof imageHash === 'string' ? imageHash : iconBigintToHash(imageHash)}`,
        options?.size ?? 128,
        options?.format,
      )
    : undefined
}
/**
 * Builds the URL to a guild discovery splash stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild to get the splash of.
 * @param imageHash - The hash identifying the discovery splash image.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if the guild does not have a splash image set.
 */ export function guildDiscoverySplashUrl(guildId, imageHash, options) {
  return imageHash
    ? formatImageUrl(
        `https://cdn.discordapp.com/discovery-splashes/${guildId}/${typeof imageHash === 'string' ? imageHash : iconBigintToHash(imageHash)}`,
        options?.size ?? 128,
        options?.format,
      )
    : undefined
}
/**
 * Builds the URL to a guild scheduled event cover stored in the Discord CDN.
 *
 * @param eventId - The ID of the scheduled event to get the cover of.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`.
 */ export function guildScheduledEventCoverUrl(eventId, options) {
  return options.cover
    ? formatImageUrl(
        `https://cdn.discordapp.com/guild-events/${eventId}/${typeof options.cover === 'string' ? options.cover : iconBigintToHash(options.cover)}`,
        options.size ?? 128,
        options.format,
      )
    : undefined
}
/**
 * Builds a URL to the guild widget image stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild to get the link to the widget image for.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource.
 */ export function getWidgetImageUrl(guildId, options) {
  let url = `https://discordapp.com/api/guilds/${guildId}/widget.png`
  if (options?.style) {
    url += `?style=${options.style}`
  }
  return url
}
/**
 * Builds a URL to a member's avatar stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild where the member is
 * @param userId - The ID of the user to get the avatar of.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if no banner has been set.
 */ export function memberAvatarUrl(guildId, userId, options) {
  return options?.avatar
    ? formatImageUrl(
        `https://cdn.discordapp.com/guilds/${guildId}/users/${userId}/avatars/${typeof options.avatar === 'string' ? options.avatar : iconBigintToHash(options.avatar)}`,
        options?.size ?? 128,
        options?.format,
      )
    : undefined
}
/**
 * Builds a URL to a member's banner stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild where the member is
 * @param userId - The ID of the user to get the banner of.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if no banner has been set.
 */ export function memberBannerUrl(guildId, userId, options) {
  return options?.banner
    ? formatImageUrl(
        `https://cdn.discordapp.com/guilds/${guildId}/users/${userId}/banners/${typeof options.banner === 'string' ? options.banner : iconBigintToHash(options.banner)}`,
        options?.size ?? 128,
        options?.format,
      )
    : undefined
}
/**
 * Builds the URL to an application icon stored in the Discord CDN.
 *
 * @param applicationId - The ID of the application to get the icon of.
 * @param iconHash - The hash identifying the application icon.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`
 */ export function applicationIconUrl(applicationId, iconHash, options) {
  return iconHash
    ? formatImageUrl(
        `https://cdn.discordapp.com/app-icons/${applicationId}/${typeof iconHash === 'string' ? iconHash : iconBigintToHash(iconHash)}`,
        options?.size ?? 128,
        options?.format,
      )
    : undefined
}
/**
 * Builds the URL to an application cover stored in the Discord CDN.
 *
 * @param applicationId - The ID of the application to get the cover of.
 * @param coverHash - The hash identifying the application cover.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`.
 */ export function applicationCoverUrl(applicationId, coverHash, options) {
  return coverHash
    ? formatImageUrl(
        `https://cdn.discordapp.com/app-icons/${applicationId}/${typeof coverHash === 'string' ? coverHash : iconBigintToHash(coverHash)}`,
        options?.size ?? 128,
        options?.format,
      )
    : undefined
}
/**
 * Builds the URL to an application asset stored in the Discord CDN.
 *
 * @param applicationId - The ID of the application to get the asset of.
 * @param assetId - The id identifying the application asset.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`.
 */ export function applicationAssetUrl(applicationId, assetId, options) {
  return assetId
    ? formatImageUrl(
        `https://cdn.discordapp.com/app-icons/${applicationId}/${typeof assetId === 'string' ? assetId : iconBigintToHash(assetId)}`,
        options?.size ?? 128,
        options?.format,
      )
    : undefined
}
/**
 * Builds the URL to a sticker pack banner stored in the Discord CDN.
 *
 * @param bannerAssetId - The ID of the banner asset for the sticker pack.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`.
 */ export function stickerPackBannerUrl(bannerAssetId, options) {
  return bannerAssetId
    ? formatImageUrl(
        `https://cdn.discordapp.com/app-assets/710982414301790216/store/${typeof bannerAssetId === 'string' ? bannerAssetId : iconBigintToHash(bannerAssetId)}`,
        options?.size ?? 128,
        options?.format,
      )
    : undefined
}
/**
 * Builds the URL to a sticker stored in the Discord CDN.
 *
 * @param stickerId - The ID of the sticker to get the icon of
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`.
 */ export function stickerUrl(stickerId, options) {
  if (!stickerId) return
  const url =
    options?.type === StickerFormatTypes.Gif
      ? `https://media.discordapp.net/stickers/${stickerId}`
      : `https://cdn.discordapp.com/stickers/${stickerId}`
  return formatImageUrl(url, options?.size ?? 128, options?.format)
}
/**
 * Builds the URL to a team icon stored in the Discord CDN.
 *
 * @param teamId - The ID of the team to get the icon of
 * @param iconHash - The hash of the team icon.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`.
 */ export function teamIconUrl(teamId, iconHash, options) {
  return iconHash
    ? formatImageUrl(
        `https://cdn.discordapp.com/team-icons/${teamId}/store/${typeof iconHash === 'string' ? iconHash : iconBigintToHash(iconHash)}`,
        options?.size ?? 128,
        options?.format,
      )
    : undefined
}
/**
 * Builds the URL to a role icon stored in the Discord CDN.
 *
 * @param roleId - The ID of the role to get the icon of
 * @param iconHash - The hash of the role icon.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined`.
 */ export function roleIconUrl(roleId, iconHash, options) {
  return iconHash
    ? formatImageUrl(
        `https://cdn.discordapp.com/role-icons/${roleId}/${typeof iconHash === 'string' ? iconHash : iconBigintToHash(iconHash)}`,
        options?.size ?? 128,
        options?.format,
      )
    : undefined
}
/**
 * Builds the URL to a guild tag badge stored in the Discord CDN.
 *
 * @param guildId - The ID of the guild to get the tag badge of
 * @param badgeHash - The hash identifying the guild tag badge.
 * @param options - The parameters for the building of the URL.
 * @returns The link to the resource or `undefined` if no badge has been set.
 */ export function guildTagBadgeUrl(guildId, badgeHash, options) {
  if (badgeHash === undefined) return undefined
  return formatImageUrl(`https://cdn.discordapp.com/guild-tag-badges/${guildId}/${badgeHash}`, options?.size ?? 128, options?.format)
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbWFnZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdHlwZSBCaWdTdHJpbmcsIHR5cGUgR2V0R3VpbGRXaWRnZXRJbWFnZVF1ZXJ5LCB0eXBlIEltYWdlRm9ybWF0LCB0eXBlIEltYWdlU2l6ZSwgU3RpY2tlckZvcm1hdFR5cGVzIH0gZnJvbSAnQGRpc2NvcmRlbm8vdHlwZXMnXG5pbXBvcnQgeyBpY29uQmlnaW50VG9IYXNoIH0gZnJvbSAnLi9oYXNoLmpzJ1xuXG4vKiogSGVscCBmb3JtYXQgYW4gaW1hZ2UgdXJsLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEltYWdlVXJsKHVybDogc3RyaW5nLCBzaXplOiBJbWFnZVNpemUgPSAxMjgsIGZvcm1hdD86IEltYWdlRm9ybWF0KTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke3VybH0uJHtmb3JtYXQgPz8gKHVybC5pbmNsdWRlcygnL2FfJykgPyAnZ2lmJyA6ICd3ZWJwJyl9P3NpemU9JHtzaXplfWBcbn1cblxuLyoqXG4gKiBHZXQgdGhlIHVybCBmb3IgYW4gZW1vamkuXG4gKlxuICogQHBhcmFtIGVtb2ppSWQgVGhlIGlkIG9mIHRoZSBlbW9qaVxuICogQHBhcmFtIGFuaW1hdGVkIFdoZXRoZXIgb3Igbm90IHRoZSBlbW9qaSBpcyBhbmltYXRlZFxuICogQHBhcmFtIGZvcm1hdCBUaGUgZm9ybWF0IG9mIHRoZSBpbWFnZSwgZGVmYXVsdHMgdG8gcG5nXG4gKiBAcmV0dXJucyBzdHJpbmdcbiAqXG4gKiBAcmVtYXJrc1xuICogVGhlIGFuaW1hdGVkIHBhcmFtZXRlciBpcyB1c2VkIHRvIHNwZWNpZnkgdGhlIGFuaW1hdGVkIHF1ZXJ5IHBhcmFtZXRlciB2YWxpZCBmb3Igd2VicCBpbWFnZXMgb3IgdG8gZm9yY2UgdGhlIGdpZiBpZiB0aGUgZm9ybWF0IGlzIG5vdCBzZXQgdG8gd2VicC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtb2ppVXJsKGVtb2ppSWQ6IEJpZ1N0cmluZywgYW5pbWF0ZWQgPSBmYWxzZSwgZm9ybWF0OiBJbWFnZUZvcm1hdCA9ICdwbmcnKTogc3RyaW5nIHtcbiAgcmV0dXJuIGBodHRwczovL2Nkbi5kaXNjb3JkYXBwLmNvbS9lbW9qaXMvJHtlbW9qaUlkfS4ke2FuaW1hdGVkID8gKGZvcm1hdCA9PT0gJ3dlYnAnID8gJ3dlYnAnIDogJ2dpZicpIDogZm9ybWF0fSR7YW5pbWF0ZWQgJiYgZm9ybWF0ID09PSAnd2VicCcgPyAnP2FuaW1hdGVkPXRydWUnIDogJyd9YFxufVxuXG4vKipcbiAqIEJ1aWxkcyBhIFVSTCB0byBhIHVzZXIncyBhdmF0YXIgc3RvcmVkIGluIHRoZSBEaXNjb3JkIENETi5cbiAqXG4gKiBAcGFyYW0gdXNlcklkIC0gVGhlIElEIG9mIHRoZSB1c2VyIHRvIGdldCB0aGUgYXZhdGFyIG9mLlxuICogQHBhcmFtIGRpc2NyaW1pbmF0b3IgLSBUaGUgdXNlcidzIGRpc2NyaW1pbmF0b3IuICg0LWRpZ2l0IHRhZyBhZnRlciB0aGUgaGFzaHRhZy4pXG4gKiBAcGFyYW0gb3B0aW9ucyAtIFRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgYnVpbGRpbmcgb2YgdGhlIFVSTC5cbiAqIEByZXR1cm5zIFRoZSBsaW5rIHRvIHRoZSByZXNvdXJjZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF2YXRhclVybChcbiAgdXNlcklkOiBCaWdTdHJpbmcsXG4gIGRpc2NyaW1pbmF0b3I6IHN0cmluZyxcbiAgb3B0aW9ucz86IHtcbiAgICBhdmF0YXI6IEJpZ1N0cmluZyB8IHVuZGVmaW5lZFxuICAgIHNpemU/OiBJbWFnZVNpemVcbiAgICBmb3JtYXQ/OiBJbWFnZUZvcm1hdFxuICB9LFxuKTogc3RyaW5nIHtcbiAgcmV0dXJuIG9wdGlvbnM/LmF2YXRhclxuICAgID8gZm9ybWF0SW1hZ2VVcmwoXG4gICAgICAgIGBodHRwczovL2Nkbi5kaXNjb3JkYXBwLmNvbS9hdmF0YXJzLyR7dXNlcklkfS8ke3R5cGVvZiBvcHRpb25zLmF2YXRhciA9PT0gJ3N0cmluZycgPyBvcHRpb25zLmF2YXRhciA6IGljb25CaWdpbnRUb0hhc2gob3B0aW9ucy5hdmF0YXIpfWAsXG4gICAgICAgIG9wdGlvbnM/LnNpemUgPz8gMTI4LFxuICAgICAgICBvcHRpb25zPy5mb3JtYXQsXG4gICAgICApXG4gICAgOiBgaHR0cHM6Ly9jZG4uZGlzY29yZGFwcC5jb20vZW1iZWQvYXZhdGFycy8ke2Rpc2NyaW1pbmF0b3IgPT09ICcwJyA/IChCaWdJbnQodXNlcklkKSA+PiBCaWdJbnQoMjIpKSAlIEJpZ0ludCg2KSA6IE51bWJlcihkaXNjcmltaW5hdG9yKSAlIDV9LnBuZ2Bcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGF2YXRhckRlY29yYXRpb25VcmwoYXZhdGFyRGVjb3JhdGlvbjogQmlnU3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGBodHRwczovL2Nkbi5kaXNjb3JkYXBwLmNvbS9hdmF0YXItZGVjb3JhdGlvbi1wcmVzZXRzLyR7XG4gICAgdHlwZW9mIGF2YXRhckRlY29yYXRpb24gPT09ICdzdHJpbmcnID8gYXZhdGFyRGVjb3JhdGlvbiA6IGljb25CaWdpbnRUb0hhc2goYXZhdGFyRGVjb3JhdGlvbilcbiAgfS5wbmdgXG59XG5cbi8qKlxuICogQnVpbGRzIGEgVVJMIHRvIGEgdXNlcidzIGJhbm5lciBzdG9yZWQgaW4gdGhlIERpc2NvcmQgQ0ROLlxuICpcbiAqIEBwYXJhbSB1c2VySWQgLSBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gZ2V0IHRoZSBiYW5uZXIgb2YuXG4gKiBAcGFyYW0gb3B0aW9ucyAtIFRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgYnVpbGRpbmcgb2YgdGhlIFVSTC5cbiAqIEByZXR1cm5zIFRoZSBsaW5rIHRvIHRoZSByZXNvdXJjZSBvciBgdW5kZWZpbmVkYCBpZiBubyBiYW5uZXIgaGFzIG5vdCBiZWVuIHNldC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJhbm5lclVybChcbiAgdXNlcklkOiBCaWdTdHJpbmcsXG4gIG9wdGlvbnM/OiB7XG4gICAgYmFubmVyPzogQmlnU3RyaW5nXG4gICAgc2l6ZT86IEltYWdlU2l6ZVxuICAgIGZvcm1hdD86IEltYWdlRm9ybWF0XG4gIH0sXG4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICByZXR1cm4gb3B0aW9ucz8uYmFubmVyXG4gICAgPyBmb3JtYXRJbWFnZVVybChcbiAgICAgICAgYGh0dHBzOi8vY2RuLmRpc2NvcmRhcHAuY29tL2Jhbm5lcnMvJHt1c2VySWR9LyR7dHlwZW9mIG9wdGlvbnMuYmFubmVyID09PSAnc3RyaW5nJyA/IG9wdGlvbnMuYmFubmVyIDogaWNvbkJpZ2ludFRvSGFzaChvcHRpb25zLmJhbm5lcil9YCxcbiAgICAgICAgb3B0aW9ucz8uc2l6ZSA/PyAxMjgsXG4gICAgICAgIG9wdGlvbnM/LmZvcm1hdCxcbiAgICAgIClcbiAgICA6IHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIEJ1aWxkcyBhIFVSTCB0byB0aGUgZ3VpbGQgYmFubmVyIHN0b3JlZCBpbiB0aGUgRGlzY29yZCBDRE4uXG4gKlxuICogQHBhcmFtIGd1aWxkSWQgLSBUaGUgSUQgb2YgdGhlIGd1aWxkIHRvIGdldCB0aGUgbGluayB0byB0aGUgYmFubmVyIGZvci5cbiAqIEBwYXJhbSBvcHRpb25zIC0gVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBidWlsZGluZyBvZiB0aGUgVVJMLlxuICogQHJldHVybnMgVGhlIGxpbmsgdG8gdGhlIHJlc291cmNlIG9yIGB1bmRlZmluZWRgIGlmIG5vIGJhbm5lciBoYXMgYmVlbiBzZXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBndWlsZEJhbm5lclVybChcbiAgZ3VpbGRJZDogQmlnU3RyaW5nLFxuICBvcHRpb25zOiB7XG4gICAgYmFubmVyPzogQmlnU3RyaW5nXG4gICAgc2l6ZT86IEltYWdlU2l6ZVxuICAgIGZvcm1hdD86IEltYWdlRm9ybWF0XG4gIH0sXG4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICByZXR1cm4gb3B0aW9ucy5iYW5uZXJcbiAgICA/IGZvcm1hdEltYWdlVXJsKFxuICAgICAgICBgaHR0cHM6Ly9jZG4uZGlzY29yZGFwcC5jb20vYmFubmVycy8ke2d1aWxkSWR9LyR7dHlwZW9mIG9wdGlvbnMuYmFubmVyID09PSAnc3RyaW5nJyA/IG9wdGlvbnMuYmFubmVyIDogaWNvbkJpZ2ludFRvSGFzaChvcHRpb25zLmJhbm5lcil9YCxcbiAgICAgICAgb3B0aW9ucy5zaXplID8/IDEyOCxcbiAgICAgICAgb3B0aW9ucy5mb3JtYXQsXG4gICAgICApXG4gICAgOiB1bmRlZmluZWRcbn1cblxuLyoqXG4gKiBCdWlsZHMgYSBVUkwgdG8gdGhlIGd1aWxkIGljb24gc3RvcmVkIGluIHRoZSBEaXNjb3JkIENETi5cbiAqXG4gKiBAcGFyYW0gZ3VpbGRJZCAtIFRoZSBJRCBvZiB0aGUgZ3VpbGQgdG8gZ2V0IHRoZSBsaW5rIHRvIHRoZSBiYW5uZXIgZm9yLlxuICogQHBhcmFtIGltYWdlSGFzaCAtIFRoZSBoYXNoIGlkZW50aWZ5aW5nIHRoZSBldmVudCBjb3ZlciBpbWFnZS5cbiAqIEBwYXJhbSBvcHRpb25zIC0gVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBidWlsZGluZyBvZiB0aGUgVVJMLlxuICogQHJldHVybnMgVGhlIGxpbmsgdG8gdGhlIHJlc291cmNlIG9yIGB1bmRlZmluZWRgIGlmIG5vIGJhbm5lciBoYXMgYmVlbiBzZXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBndWlsZEljb25VcmwoXG4gIGd1aWxkSWQ6IEJpZ1N0cmluZyxcbiAgaW1hZ2VIYXNoOiBCaWdTdHJpbmcgfCB1bmRlZmluZWQsXG4gIG9wdGlvbnM/OiB7XG4gICAgc2l6ZT86IEltYWdlU2l6ZVxuICAgIGZvcm1hdD86IEltYWdlRm9ybWF0XG4gIH0sXG4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICByZXR1cm4gaW1hZ2VIYXNoXG4gICAgPyBmb3JtYXRJbWFnZVVybChcbiAgICAgICAgYGh0dHBzOi8vY2RuLmRpc2NvcmRhcHAuY29tL2ljb25zLyR7Z3VpbGRJZH0vJHt0eXBlb2YgaW1hZ2VIYXNoID09PSAnc3RyaW5nJyA/IGltYWdlSGFzaCA6IGljb25CaWdpbnRUb0hhc2goaW1hZ2VIYXNoKX1gLFxuICAgICAgICBvcHRpb25zPy5zaXplID8/IDEyOCxcbiAgICAgICAgb3B0aW9ucz8uZm9ybWF0LFxuICAgICAgKVxuICAgIDogdW5kZWZpbmVkXG59XG5cbi8qKlxuICogQnVpbGRzIHRoZSBVUkwgdG8gYSBndWlsZCBzcGxhc2ggc3RvcmVkIGluIHRoZSBEaXNjb3JkIENETi5cbiAqXG4gKiBAcGFyYW0gZ3VpbGRJZCAtIFRoZSBJRCBvZiB0aGUgZ3VpbGQgdG8gZ2V0IHRoZSBzcGxhc2ggb2YuXG4gKiBAcGFyYW0gaW1hZ2VIYXNoIC0gVGhlIGhhc2ggaWRlbnRpZnlpbmcgdGhlIHNwbGFzaCBpbWFnZS5cbiAqIEBwYXJhbSBvcHRpb25zIC0gVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBidWlsZGluZyBvZiB0aGUgVVJMLlxuICogQHJldHVybnMgVGhlIGxpbmsgdG8gdGhlIHJlc291cmNlIG9yIGB1bmRlZmluZWRgIGlmIHRoZSBndWlsZCBkb2VzIG5vdCBoYXZlIGEgc3BsYXNoIGltYWdlIHNldC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGd1aWxkU3BsYXNoVXJsKFxuICBndWlsZElkOiBCaWdTdHJpbmcsXG4gIGltYWdlSGFzaDogQmlnU3RyaW5nIHwgdW5kZWZpbmVkLFxuICBvcHRpb25zPzoge1xuICAgIHNpemU/OiBJbWFnZVNpemVcbiAgICBmb3JtYXQ/OiBJbWFnZUZvcm1hdFxuICB9LFxuKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIGltYWdlSGFzaFxuICAgID8gZm9ybWF0SW1hZ2VVcmwoXG4gICAgICAgIGBodHRwczovL2Nkbi5kaXNjb3JkYXBwLmNvbS9zcGxhc2hlcy8ke2d1aWxkSWR9LyR7dHlwZW9mIGltYWdlSGFzaCA9PT0gJ3N0cmluZycgPyBpbWFnZUhhc2ggOiBpY29uQmlnaW50VG9IYXNoKGltYWdlSGFzaCl9YCxcbiAgICAgICAgb3B0aW9ucz8uc2l6ZSA/PyAxMjgsXG4gICAgICAgIG9wdGlvbnM/LmZvcm1hdCxcbiAgICAgIClcbiAgICA6IHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIEJ1aWxkcyB0aGUgVVJMIHRvIGEgZ3VpbGQgZGlzY292ZXJ5IHNwbGFzaCBzdG9yZWQgaW4gdGhlIERpc2NvcmQgQ0ROLlxuICpcbiAqIEBwYXJhbSBndWlsZElkIC0gVGhlIElEIG9mIHRoZSBndWlsZCB0byBnZXQgdGhlIHNwbGFzaCBvZi5cbiAqIEBwYXJhbSBpbWFnZUhhc2ggLSBUaGUgaGFzaCBpZGVudGlmeWluZyB0aGUgZGlzY292ZXJ5IHNwbGFzaCBpbWFnZS5cbiAqIEBwYXJhbSBvcHRpb25zIC0gVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBidWlsZGluZyBvZiB0aGUgVVJMLlxuICogQHJldHVybnMgVGhlIGxpbmsgdG8gdGhlIHJlc291cmNlIG9yIGB1bmRlZmluZWRgIGlmIHRoZSBndWlsZCBkb2VzIG5vdCBoYXZlIGEgc3BsYXNoIGltYWdlIHNldC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGd1aWxkRGlzY292ZXJ5U3BsYXNoVXJsKFxuICBndWlsZElkOiBCaWdTdHJpbmcsXG4gIGltYWdlSGFzaDogQmlnU3RyaW5nIHwgdW5kZWZpbmVkLFxuICBvcHRpb25zPzoge1xuICAgIHNpemU/OiBJbWFnZVNpemVcbiAgICBmb3JtYXQ/OiBJbWFnZUZvcm1hdFxuICB9LFxuKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIGltYWdlSGFzaFxuICAgID8gZm9ybWF0SW1hZ2VVcmwoXG4gICAgICAgIGBodHRwczovL2Nkbi5kaXNjb3JkYXBwLmNvbS9kaXNjb3Zlcnktc3BsYXNoZXMvJHtndWlsZElkfS8ke3R5cGVvZiBpbWFnZUhhc2ggPT09ICdzdHJpbmcnID8gaW1hZ2VIYXNoIDogaWNvbkJpZ2ludFRvSGFzaChpbWFnZUhhc2gpfWAsXG4gICAgICAgIG9wdGlvbnM/LnNpemUgPz8gMTI4LFxuICAgICAgICBvcHRpb25zPy5mb3JtYXQsXG4gICAgICApXG4gICAgOiB1bmRlZmluZWRcbn1cblxuLyoqXG4gKiBCdWlsZHMgdGhlIFVSTCB0byBhIGd1aWxkIHNjaGVkdWxlZCBldmVudCBjb3ZlciBzdG9yZWQgaW4gdGhlIERpc2NvcmQgQ0ROLlxuICpcbiAqIEBwYXJhbSBldmVudElkIC0gVGhlIElEIG9mIHRoZSBzY2hlZHVsZWQgZXZlbnQgdG8gZ2V0IHRoZSBjb3ZlciBvZi5cbiAqIEBwYXJhbSBvcHRpb25zIC0gVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBidWlsZGluZyBvZiB0aGUgVVJMLlxuICogQHJldHVybnMgVGhlIGxpbmsgdG8gdGhlIHJlc291cmNlIG9yIGB1bmRlZmluZWRgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3VpbGRTY2hlZHVsZWRFdmVudENvdmVyVXJsKFxuICBldmVudElkOiBCaWdTdHJpbmcsXG4gIG9wdGlvbnM6IHtcbiAgICBjb3Zlcj86IEJpZ1N0cmluZ1xuICAgIHNpemU/OiBJbWFnZVNpemVcbiAgICBmb3JtYXQ/OiBJbWFnZUZvcm1hdFxuICB9LFxuKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIG9wdGlvbnMuY292ZXJcbiAgICA/IGZvcm1hdEltYWdlVXJsKFxuICAgICAgICBgaHR0cHM6Ly9jZG4uZGlzY29yZGFwcC5jb20vZ3VpbGQtZXZlbnRzLyR7ZXZlbnRJZH0vJHt0eXBlb2Ygb3B0aW9ucy5jb3ZlciA9PT0gJ3N0cmluZycgPyBvcHRpb25zLmNvdmVyIDogaWNvbkJpZ2ludFRvSGFzaChvcHRpb25zLmNvdmVyKX1gLFxuICAgICAgICBvcHRpb25zLnNpemUgPz8gMTI4LFxuICAgICAgICBvcHRpb25zLmZvcm1hdCxcbiAgICAgIClcbiAgICA6IHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIEJ1aWxkcyBhIFVSTCB0byB0aGUgZ3VpbGQgd2lkZ2V0IGltYWdlIHN0b3JlZCBpbiB0aGUgRGlzY29yZCBDRE4uXG4gKlxuICogQHBhcmFtIGd1aWxkSWQgLSBUaGUgSUQgb2YgdGhlIGd1aWxkIHRvIGdldCB0aGUgbGluayB0byB0aGUgd2lkZ2V0IGltYWdlIGZvci5cbiAqIEBwYXJhbSBvcHRpb25zIC0gVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBidWlsZGluZyBvZiB0aGUgVVJMLlxuICogQHJldHVybnMgVGhlIGxpbmsgdG8gdGhlIHJlc291cmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0V2lkZ2V0SW1hZ2VVcmwoZ3VpbGRJZDogQmlnU3RyaW5nLCBvcHRpb25zPzogR2V0R3VpbGRXaWRnZXRJbWFnZVF1ZXJ5KTogc3RyaW5nIHtcbiAgbGV0IHVybCA9IGBodHRwczovL2Rpc2NvcmRhcHAuY29tL2FwaS9ndWlsZHMvJHtndWlsZElkfS93aWRnZXQucG5nYFxuXG4gIGlmIChvcHRpb25zPy5zdHlsZSkge1xuICAgIHVybCArPSBgP3N0eWxlPSR7b3B0aW9ucy5zdHlsZX1gXG4gIH1cblxuICByZXR1cm4gdXJsXG59XG5cbi8qKlxuICogQnVpbGRzIGEgVVJMIHRvIGEgbWVtYmVyJ3MgYXZhdGFyIHN0b3JlZCBpbiB0aGUgRGlzY29yZCBDRE4uXG4gKlxuICogQHBhcmFtIGd1aWxkSWQgLSBUaGUgSUQgb2YgdGhlIGd1aWxkIHdoZXJlIHRoZSBtZW1iZXIgaXNcbiAqIEBwYXJhbSB1c2VySWQgLSBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gZ2V0IHRoZSBhdmF0YXIgb2YuXG4gKiBAcGFyYW0gb3B0aW9ucyAtIFRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgYnVpbGRpbmcgb2YgdGhlIFVSTC5cbiAqIEByZXR1cm5zIFRoZSBsaW5rIHRvIHRoZSByZXNvdXJjZSBvciBgdW5kZWZpbmVkYCBpZiBubyBiYW5uZXIgaGFzIGJlZW4gc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVtYmVyQXZhdGFyVXJsKFxuICBndWlsZElkOiBCaWdTdHJpbmcsXG4gIHVzZXJJZDogQmlnU3RyaW5nLFxuICBvcHRpb25zPzoge1xuICAgIGF2YXRhcj86IEJpZ1N0cmluZ1xuICAgIHNpemU/OiBJbWFnZVNpemVcbiAgICBmb3JtYXQ/OiBJbWFnZUZvcm1hdFxuICB9LFxuKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIG9wdGlvbnM/LmF2YXRhclxuICAgID8gZm9ybWF0SW1hZ2VVcmwoXG4gICAgICAgIGBodHRwczovL2Nkbi5kaXNjb3JkYXBwLmNvbS9ndWlsZHMvJHtndWlsZElkfS91c2Vycy8ke3VzZXJJZH0vYXZhdGFycy8ke1xuICAgICAgICAgIHR5cGVvZiBvcHRpb25zLmF2YXRhciA9PT0gJ3N0cmluZycgPyBvcHRpb25zLmF2YXRhciA6IGljb25CaWdpbnRUb0hhc2gob3B0aW9ucy5hdmF0YXIpXG4gICAgICAgIH1gLFxuICAgICAgICBvcHRpb25zPy5zaXplID8/IDEyOCxcbiAgICAgICAgb3B0aW9ucz8uZm9ybWF0LFxuICAgICAgKVxuICAgIDogdW5kZWZpbmVkXG59XG5cbi8qKlxuICogQnVpbGRzIGEgVVJMIHRvIGEgbWVtYmVyJ3MgYmFubmVyIHN0b3JlZCBpbiB0aGUgRGlzY29yZCBDRE4uXG4gKlxuICogQHBhcmFtIGd1aWxkSWQgLSBUaGUgSUQgb2YgdGhlIGd1aWxkIHdoZXJlIHRoZSBtZW1iZXIgaXNcbiAqIEBwYXJhbSB1c2VySWQgLSBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gZ2V0IHRoZSBiYW5uZXIgb2YuXG4gKiBAcGFyYW0gb3B0aW9ucyAtIFRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgYnVpbGRpbmcgb2YgdGhlIFVSTC5cbiAqIEByZXR1cm5zIFRoZSBsaW5rIHRvIHRoZSByZXNvdXJjZSBvciBgdW5kZWZpbmVkYCBpZiBubyBiYW5uZXIgaGFzIGJlZW4gc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVtYmVyQmFubmVyVXJsKFxuICBndWlsZElkOiBCaWdTdHJpbmcsXG4gIHVzZXJJZDogQmlnU3RyaW5nLFxuICBvcHRpb25zPzoge1xuICAgIGJhbm5lcj86IEJpZ1N0cmluZ1xuICAgIHNpemU/OiBJbWFnZVNpemVcbiAgICBmb3JtYXQ/OiBJbWFnZUZvcm1hdFxuICB9LFxuKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIG9wdGlvbnM/LmJhbm5lclxuICAgID8gZm9ybWF0SW1hZ2VVcmwoXG4gICAgICAgIGBodHRwczovL2Nkbi5kaXNjb3JkYXBwLmNvbS9ndWlsZHMvJHtndWlsZElkfS91c2Vycy8ke3VzZXJJZH0vYmFubmVycy8ke1xuICAgICAgICAgIHR5cGVvZiBvcHRpb25zLmJhbm5lciA9PT0gJ3N0cmluZycgPyBvcHRpb25zLmJhbm5lciA6IGljb25CaWdpbnRUb0hhc2gob3B0aW9ucy5iYW5uZXIpXG4gICAgICAgIH1gLFxuICAgICAgICBvcHRpb25zPy5zaXplID8/IDEyOCxcbiAgICAgICAgb3B0aW9ucz8uZm9ybWF0LFxuICAgICAgKVxuICAgIDogdW5kZWZpbmVkXG59XG5cbi8qKlxuICogQnVpbGRzIHRoZSBVUkwgdG8gYW4gYXBwbGljYXRpb24gaWNvbiBzdG9yZWQgaW4gdGhlIERpc2NvcmQgQ0ROLlxuICpcbiAqIEBwYXJhbSBhcHBsaWNhdGlvbklkIC0gVGhlIElEIG9mIHRoZSBhcHBsaWNhdGlvbiB0byBnZXQgdGhlIGljb24gb2YuXG4gKiBAcGFyYW0gaWNvbkhhc2ggLSBUaGUgaGFzaCBpZGVudGlmeWluZyB0aGUgYXBwbGljYXRpb24gaWNvbi5cbiAqIEBwYXJhbSBvcHRpb25zIC0gVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBidWlsZGluZyBvZiB0aGUgVVJMLlxuICogQHJldHVybnMgVGhlIGxpbmsgdG8gdGhlIHJlc291cmNlIG9yIGB1bmRlZmluZWRgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBsaWNhdGlvbkljb25VcmwoXG4gIGFwcGxpY2F0aW9uSWQ6IEJpZ1N0cmluZyxcbiAgaWNvbkhhc2g6IEJpZ1N0cmluZyB8IHVuZGVmaW5lZCxcbiAgb3B0aW9ucz86IHtcbiAgICBzaXplPzogSW1hZ2VTaXplXG4gICAgZm9ybWF0PzogSW1hZ2VGb3JtYXRcbiAgfSxcbik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBpY29uSGFzaFxuICAgID8gZm9ybWF0SW1hZ2VVcmwoXG4gICAgICAgIGBodHRwczovL2Nkbi5kaXNjb3JkYXBwLmNvbS9hcHAtaWNvbnMvJHthcHBsaWNhdGlvbklkfS8ke3R5cGVvZiBpY29uSGFzaCA9PT0gJ3N0cmluZycgPyBpY29uSGFzaCA6IGljb25CaWdpbnRUb0hhc2goaWNvbkhhc2gpfWAsXG4gICAgICAgIG9wdGlvbnM/LnNpemUgPz8gMTI4LFxuICAgICAgICBvcHRpb25zPy5mb3JtYXQsXG4gICAgICApXG4gICAgOiB1bmRlZmluZWRcbn1cblxuLyoqXG4gKiBCdWlsZHMgdGhlIFVSTCB0byBhbiBhcHBsaWNhdGlvbiBjb3ZlciBzdG9yZWQgaW4gdGhlIERpc2NvcmQgQ0ROLlxuICpcbiAqIEBwYXJhbSBhcHBsaWNhdGlvbklkIC0gVGhlIElEIG9mIHRoZSBhcHBsaWNhdGlvbiB0byBnZXQgdGhlIGNvdmVyIG9mLlxuICogQHBhcmFtIGNvdmVySGFzaCAtIFRoZSBoYXNoIGlkZW50aWZ5aW5nIHRoZSBhcHBsaWNhdGlvbiBjb3Zlci5cbiAqIEBwYXJhbSBvcHRpb25zIC0gVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBidWlsZGluZyBvZiB0aGUgVVJMLlxuICogQHJldHVybnMgVGhlIGxpbmsgdG8gdGhlIHJlc291cmNlIG9yIGB1bmRlZmluZWRgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbGljYXRpb25Db3ZlclVybChcbiAgYXBwbGljYXRpb25JZDogQmlnU3RyaW5nLFxuICBjb3Zlckhhc2g6IEJpZ1N0cmluZyB8IHVuZGVmaW5lZCxcbiAgb3B0aW9ucz86IHtcbiAgICBzaXplPzogSW1hZ2VTaXplXG4gICAgZm9ybWF0PzogSW1hZ2VGb3JtYXRcbiAgfSxcbik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBjb3Zlckhhc2hcbiAgICA/IGZvcm1hdEltYWdlVXJsKFxuICAgICAgICBgaHR0cHM6Ly9jZG4uZGlzY29yZGFwcC5jb20vYXBwLWljb25zLyR7YXBwbGljYXRpb25JZH0vJHt0eXBlb2YgY292ZXJIYXNoID09PSAnc3RyaW5nJyA/IGNvdmVySGFzaCA6IGljb25CaWdpbnRUb0hhc2goY292ZXJIYXNoKX1gLFxuICAgICAgICBvcHRpb25zPy5zaXplID8/IDEyOCxcbiAgICAgICAgb3B0aW9ucz8uZm9ybWF0LFxuICAgICAgKVxuICAgIDogdW5kZWZpbmVkXG59XG5cbi8qKlxuICogQnVpbGRzIHRoZSBVUkwgdG8gYW4gYXBwbGljYXRpb24gYXNzZXQgc3RvcmVkIGluIHRoZSBEaXNjb3JkIENETi5cbiAqXG4gKiBAcGFyYW0gYXBwbGljYXRpb25JZCAtIFRoZSBJRCBvZiB0aGUgYXBwbGljYXRpb24gdG8gZ2V0IHRoZSBhc3NldCBvZi5cbiAqIEBwYXJhbSBhc3NldElkIC0gVGhlIGlkIGlkZW50aWZ5aW5nIHRoZSBhcHBsaWNhdGlvbiBhc3NldC5cbiAqIEBwYXJhbSBvcHRpb25zIC0gVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBidWlsZGluZyBvZiB0aGUgVVJMLlxuICogQHJldHVybnMgVGhlIGxpbmsgdG8gdGhlIHJlc291cmNlIG9yIGB1bmRlZmluZWRgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbGljYXRpb25Bc3NldFVybChcbiAgYXBwbGljYXRpb25JZDogQmlnU3RyaW5nLFxuICBhc3NldElkOiBCaWdTdHJpbmcgfCB1bmRlZmluZWQsXG4gIG9wdGlvbnM/OiB7XG4gICAgc2l6ZT86IEltYWdlU2l6ZVxuICAgIGZvcm1hdD86IEltYWdlRm9ybWF0XG4gIH0sXG4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICByZXR1cm4gYXNzZXRJZFxuICAgID8gZm9ybWF0SW1hZ2VVcmwoXG4gICAgICAgIGBodHRwczovL2Nkbi5kaXNjb3JkYXBwLmNvbS9hcHAtaWNvbnMvJHthcHBsaWNhdGlvbklkfS8ke3R5cGVvZiBhc3NldElkID09PSAnc3RyaW5nJyA/IGFzc2V0SWQgOiBpY29uQmlnaW50VG9IYXNoKGFzc2V0SWQpfWAsXG4gICAgICAgIG9wdGlvbnM/LnNpemUgPz8gMTI4LFxuICAgICAgICBvcHRpb25zPy5mb3JtYXQsXG4gICAgICApXG4gICAgOiB1bmRlZmluZWRcbn1cblxuLyoqXG4gKiBCdWlsZHMgdGhlIFVSTCB0byBhIHN0aWNrZXIgcGFjayBiYW5uZXIgc3RvcmVkIGluIHRoZSBEaXNjb3JkIENETi5cbiAqXG4gKiBAcGFyYW0gYmFubmVyQXNzZXRJZCAtIFRoZSBJRCBvZiB0aGUgYmFubmVyIGFzc2V0IGZvciB0aGUgc3RpY2tlciBwYWNrLlxuICogQHBhcmFtIG9wdGlvbnMgLSBUaGUgcGFyYW1ldGVycyBmb3IgdGhlIGJ1aWxkaW5nIG9mIHRoZSBVUkwuXG4gKiBAcmV0dXJucyBUaGUgbGluayB0byB0aGUgcmVzb3VyY2Ugb3IgYHVuZGVmaW5lZGAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGlja2VyUGFja0Jhbm5lclVybChcbiAgYmFubmVyQXNzZXRJZDogQmlnU3RyaW5nIHwgdW5kZWZpbmVkLFxuICBvcHRpb25zPzoge1xuICAgIHNpemU/OiBJbWFnZVNpemVcbiAgICBmb3JtYXQ/OiBJbWFnZUZvcm1hdFxuICB9LFxuKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIGJhbm5lckFzc2V0SWRcbiAgICA/IGZvcm1hdEltYWdlVXJsKFxuICAgICAgICBgaHR0cHM6Ly9jZG4uZGlzY29yZGFwcC5jb20vYXBwLWFzc2V0cy83MTA5ODI0MTQzMDE3OTAyMTYvc3RvcmUvJHtcbiAgICAgICAgICB0eXBlb2YgYmFubmVyQXNzZXRJZCA9PT0gJ3N0cmluZycgPyBiYW5uZXJBc3NldElkIDogaWNvbkJpZ2ludFRvSGFzaChiYW5uZXJBc3NldElkKVxuICAgICAgICB9YCxcbiAgICAgICAgb3B0aW9ucz8uc2l6ZSA/PyAxMjgsXG4gICAgICAgIG9wdGlvbnM/LmZvcm1hdCxcbiAgICAgIClcbiAgICA6IHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIEJ1aWxkcyB0aGUgVVJMIHRvIGEgc3RpY2tlciBzdG9yZWQgaW4gdGhlIERpc2NvcmQgQ0ROLlxuICpcbiAqIEBwYXJhbSBzdGlja2VySWQgLSBUaGUgSUQgb2YgdGhlIHN0aWNrZXIgdG8gZ2V0IHRoZSBpY29uIG9mXG4gKiBAcGFyYW0gb3B0aW9ucyAtIFRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgYnVpbGRpbmcgb2YgdGhlIFVSTC5cbiAqIEByZXR1cm5zIFRoZSBsaW5rIHRvIHRoZSByZXNvdXJjZSBvciBgdW5kZWZpbmVkYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0aWNrZXJVcmwoXG4gIHN0aWNrZXJJZDogQmlnU3RyaW5nIHwgbnVtYmVyLFxuICBvcHRpb25zPzoge1xuICAgIHNpemU/OiBJbWFnZVNpemVcbiAgICBmb3JtYXQ/OiBJbWFnZUZvcm1hdFxuICAgIHR5cGU/OiBTdGlja2VyRm9ybWF0VHlwZXNcbiAgfSxcbik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGlmICghc3RpY2tlcklkKSByZXR1cm5cblxuICBjb25zdCB1cmwgPVxuICAgIG9wdGlvbnM/LnR5cGUgPT09IFN0aWNrZXJGb3JtYXRUeXBlcy5HaWZcbiAgICAgID8gYGh0dHBzOi8vbWVkaWEuZGlzY29yZGFwcC5uZXQvc3RpY2tlcnMvJHtzdGlja2VySWR9YFxuICAgICAgOiBgaHR0cHM6Ly9jZG4uZGlzY29yZGFwcC5jb20vc3RpY2tlcnMvJHtzdGlja2VySWR9YFxuXG4gIHJldHVybiBmb3JtYXRJbWFnZVVybCh1cmwsIG9wdGlvbnM/LnNpemUgPz8gMTI4LCBvcHRpb25zPy5mb3JtYXQpXG59XG5cbi8qKlxuICogQnVpbGRzIHRoZSBVUkwgdG8gYSB0ZWFtIGljb24gc3RvcmVkIGluIHRoZSBEaXNjb3JkIENETi5cbiAqXG4gKiBAcGFyYW0gdGVhbUlkIC0gVGhlIElEIG9mIHRoZSB0ZWFtIHRvIGdldCB0aGUgaWNvbiBvZlxuICogQHBhcmFtIGljb25IYXNoIC0gVGhlIGhhc2ggb2YgdGhlIHRlYW0gaWNvbi5cbiAqIEBwYXJhbSBvcHRpb25zIC0gVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBidWlsZGluZyBvZiB0aGUgVVJMLlxuICogQHJldHVybnMgVGhlIGxpbmsgdG8gdGhlIHJlc291cmNlIG9yIGB1bmRlZmluZWRgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGVhbUljb25VcmwoXG4gIHRlYW1JZDogQmlnU3RyaW5nLFxuICBpY29uSGFzaDogQmlnU3RyaW5nIHwgdW5kZWZpbmVkLFxuICBvcHRpb25zPzoge1xuICAgIHNpemU/OiBJbWFnZVNpemVcbiAgICBmb3JtYXQ/OiBJbWFnZUZvcm1hdFxuICB9LFxuKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIGljb25IYXNoXG4gICAgPyBmb3JtYXRJbWFnZVVybChcbiAgICAgICAgYGh0dHBzOi8vY2RuLmRpc2NvcmRhcHAuY29tL3RlYW0taWNvbnMvJHt0ZWFtSWR9L3N0b3JlLyR7dHlwZW9mIGljb25IYXNoID09PSAnc3RyaW5nJyA/IGljb25IYXNoIDogaWNvbkJpZ2ludFRvSGFzaChpY29uSGFzaCl9YCxcbiAgICAgICAgb3B0aW9ucz8uc2l6ZSA/PyAxMjgsXG4gICAgICAgIG9wdGlvbnM/LmZvcm1hdCxcbiAgICAgIClcbiAgICA6IHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIEJ1aWxkcyB0aGUgVVJMIHRvIGEgcm9sZSBpY29uIHN0b3JlZCBpbiB0aGUgRGlzY29yZCBDRE4uXG4gKlxuICogQHBhcmFtIHJvbGVJZCAtIFRoZSBJRCBvZiB0aGUgcm9sZSB0byBnZXQgdGhlIGljb24gb2ZcbiAqIEBwYXJhbSBpY29uSGFzaCAtIFRoZSBoYXNoIG9mIHRoZSByb2xlIGljb24uXG4gKiBAcGFyYW0gb3B0aW9ucyAtIFRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgYnVpbGRpbmcgb2YgdGhlIFVSTC5cbiAqIEByZXR1cm5zIFRoZSBsaW5rIHRvIHRoZSByZXNvdXJjZSBvciBgdW5kZWZpbmVkYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJvbGVJY29uVXJsKFxuICByb2xlSWQ6IEJpZ1N0cmluZyxcbiAgaWNvbkhhc2g6IEJpZ1N0cmluZyB8IHVuZGVmaW5lZCxcbiAgb3B0aW9ucz86IHtcbiAgICBzaXplPzogSW1hZ2VTaXplXG4gICAgZm9ybWF0PzogSW1hZ2VGb3JtYXRcbiAgfSxcbik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIHJldHVybiBpY29uSGFzaFxuICAgID8gZm9ybWF0SW1hZ2VVcmwoXG4gICAgICAgIGBodHRwczovL2Nkbi5kaXNjb3JkYXBwLmNvbS9yb2xlLWljb25zLyR7cm9sZUlkfS8ke3R5cGVvZiBpY29uSGFzaCA9PT0gJ3N0cmluZycgPyBpY29uSGFzaCA6IGljb25CaWdpbnRUb0hhc2goaWNvbkhhc2gpfWAsXG4gICAgICAgIG9wdGlvbnM/LnNpemUgPz8gMTI4LFxuICAgICAgICBvcHRpb25zPy5mb3JtYXQsXG4gICAgICApXG4gICAgOiB1bmRlZmluZWRcbn1cblxuLyoqXG4gKiBCdWlsZHMgdGhlIFVSTCB0byBhIGd1aWxkIHRhZyBiYWRnZSBzdG9yZWQgaW4gdGhlIERpc2NvcmQgQ0ROLlxuICpcbiAqIEBwYXJhbSBndWlsZElkIC0gVGhlIElEIG9mIHRoZSBndWlsZCB0byBnZXQgdGhlIHRhZyBiYWRnZSBvZlxuICogQHBhcmFtIGJhZGdlSGFzaCAtIFRoZSBoYXNoIGlkZW50aWZ5aW5nIHRoZSBndWlsZCB0YWcgYmFkZ2UuXG4gKiBAcGFyYW0gb3B0aW9ucyAtIFRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgYnVpbGRpbmcgb2YgdGhlIFVSTC5cbiAqIEByZXR1cm5zIFRoZSBsaW5rIHRvIHRoZSByZXNvdXJjZSBvciBgdW5kZWZpbmVkYCBpZiBubyBiYWRnZSBoYXMgYmVlbiBzZXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBndWlsZFRhZ0JhZGdlVXJsKFxuICBndWlsZElkOiBCaWdTdHJpbmcsXG4gIGJhZGdlSGFzaDogQmlnU3RyaW5nIHwgdW5kZWZpbmVkLFxuICBvcHRpb25zPzoge1xuICAgIHNpemU/OiBJbWFnZVNpemVcbiAgICBmb3JtYXQ/OiBJbWFnZUZvcm1hdFxuICB9LFxuKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgaWYgKGJhZGdlSGFzaCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdW5kZWZpbmVkXG5cbiAgcmV0dXJuIGZvcm1hdEltYWdlVXJsKGBodHRwczovL2Nkbi5kaXNjb3JkYXBwLmNvbS9ndWlsZC10YWctYmFkZ2VzLyR7Z3VpbGRJZH0vJHtiYWRnZUhhc2h9YCwgb3B0aW9ucz8uc2l6ZSA/PyAxMjgsIG9wdGlvbnM/LmZvcm1hdClcbn1cbiJdLCJuYW1lcyI6WyJTdGlja2VyRm9ybWF0VHlwZXMiLCJpY29uQmlnaW50VG9IYXNoIiwiZm9ybWF0SW1hZ2VVcmwiLCJ1cmwiLCJzaXplIiwiZm9ybWF0IiwiaW5jbHVkZXMiLCJlbW9qaVVybCIsImVtb2ppSWQiLCJhbmltYXRlZCIsImF2YXRhclVybCIsInVzZXJJZCIsImRpc2NyaW1pbmF0b3IiLCJvcHRpb25zIiwiYXZhdGFyIiwiQmlnSW50IiwiTnVtYmVyIiwiYXZhdGFyRGVjb3JhdGlvblVybCIsImF2YXRhckRlY29yYXRpb24iLCJiYW5uZXJVcmwiLCJiYW5uZXIiLCJ1bmRlZmluZWQiLCJndWlsZEJhbm5lclVybCIsImd1aWxkSWQiLCJndWlsZEljb25VcmwiLCJpbWFnZUhhc2giLCJndWlsZFNwbGFzaFVybCIsImd1aWxkRGlzY292ZXJ5U3BsYXNoVXJsIiwiZ3VpbGRTY2hlZHVsZWRFdmVudENvdmVyVXJsIiwiZXZlbnRJZCIsImNvdmVyIiwiZ2V0V2lkZ2V0SW1hZ2VVcmwiLCJzdHlsZSIsIm1lbWJlckF2YXRhclVybCIsIm1lbWJlckJhbm5lclVybCIsImFwcGxpY2F0aW9uSWNvblVybCIsImFwcGxpY2F0aW9uSWQiLCJpY29uSGFzaCIsImFwcGxpY2F0aW9uQ292ZXJVcmwiLCJjb3Zlckhhc2giLCJhcHBsaWNhdGlvbkFzc2V0VXJsIiwiYXNzZXRJZCIsInN0aWNrZXJQYWNrQmFubmVyVXJsIiwiYmFubmVyQXNzZXRJZCIsInN0aWNrZXJVcmwiLCJzdGlja2VySWQiLCJ0eXBlIiwiR2lmIiwidGVhbUljb25VcmwiLCJ0ZWFt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
