import { type DiscordMediaGalleryItem, type DiscordMessageComponent, type DiscordUnfurledMediaItem } from '@discordeno/types';
import type { Bot } from '../../bot.js';
import type { Component, MediaGalleryItem, UnfurledMediaItem } from '../types.js';
export declare function transformComponentToDiscordComponent(bot: Bot, payload: Component): DiscordMessageComponent;
export declare function transformUnfurledMediaItemToDiscordUnfurledMediaItem(bot: Bot, payload: UnfurledMediaItem): DiscordUnfurledMediaItem;
export declare function transformMediaGalleryItemToDiscordMediaGalleryItem(bot: Bot, payload: MediaGalleryItem): DiscordMediaGalleryItem;
//# sourceMappingURL=component.d.ts.map