import type { DiscordChannel } from '@discordeno/types'
import { ToggleBitfield } from './ToggleBitfield.js'
export declare const ChannelToggle: {
  /** Whether the channel is nsfw */
  nsfw: number
  /** When a thread is locked, only users with `MANAGE_THREADS` can unarchive it */
  locked: number
  /** whether non-moderators can add other non-moderators to a thread; only available on private threads */
  invitable: number
  /** Whether the thread is archived */
  archived: number
  /** When a thread is created this will be true on that channel payload for the thread. */
  newlyCreated: number
  /** for group DM channels: whether the channel is managed by an application via the `gdm.join` OAuth2 scope */
  managed: number
}
export declare class ChannelToggles extends ToggleBitfield {
  constructor(channelOrBitfield: DiscordChannel | number)
  /** Whether or not this channel is an nsfw channel. */
  get nsfw(): boolean
  /** Whether or not this thread channel is locked. */
  get locked(): boolean
  /** Whether or not this thread channel is invitable. */
  get invitable(): boolean
  /** Whether or not this thread channel is archived. */
  get archived(): boolean
  /** Whether or not this thread channel is newly created. */
  get newlyCreated(): boolean
  get managed(): boolean
  /** Checks whether or not the permissions exist in this */
  has(permissions: ChannelToggleKeys | ChannelToggleKeys[]): boolean
  /** Lists all the toggles for the role and whether or not each is true or false. */
  list(): Record<ChannelToggleKeys, boolean>
}
export type ChannelToggleKeys = keyof typeof ChannelToggle
//# sourceMappingURL=channel.d.ts.map
