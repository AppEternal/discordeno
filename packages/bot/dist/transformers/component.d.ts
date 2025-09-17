import { type DiscordMediaGalleryItem, type DiscordMessageComponent, type DiscordUnfurledMediaItem } from '@discordeno/types'
import type { Bot } from '../bot.js'
import type { Component, MediaGalleryItem, UnfurledMediaItem } from './types.js'
export declare function transformComponent(bot: Bot, payload: DiscordMessageComponent): Component
export declare function transformUnfurledMediaItem(bot: Bot, payload: DiscordUnfurledMediaItem): UnfurledMediaItem
export declare function transformMediaGalleryItem(bot: Bot, payload: DiscordMediaGalleryItem): MediaGalleryItem
//# sourceMappingURL=component.d.ts.map
