import type { DiscordRole } from '@discordeno/types'
import { ToggleBitfield } from './ToggleBitfield.js'
export declare const RoleToggle: {
  /** If this role is showed separately in the user listing */
  hoist: number
  /** Whether this role is managed by an integration */
  managed: number
  /** Whether this role is mentionable */
  mentionable: number
  /** Whether this is the guilds premium subscriber role */
  premiumSubscriber: number
  /** Whether this role is available for purchase. */
  availableForPurchase: number
  /** Whether this role is available for guild connections. */
  guildConnections: number
}
export declare class RoleToggles extends ToggleBitfield {
  constructor(roleOrTogglesInt: DiscordRole | number)
  /** If this role is showed separately in the user listing */
  get hoist(): boolean
  /** Whether this role is managed by an integration */
  get managed(): boolean
  /** Whether this role is mentionable */
  get mentionable(): boolean
  /** Whether this is the guilds premium subscriber role */
  get premiumSubscriber(): boolean
  /** Whether this role is available for purchase. */
  get availableForPurchase(): boolean
  /** Whether this is a guild's linked role. */
  get guildConnections(): boolean
  /** Checks whether or not the permissions exist in this */
  has(permissions: RoleToggleKeys | RoleToggleKeys[]): boolean
  /** Lists all the toggles for the role and whether or not each is true or false. */
  list(): Record<RoleToggleKeys, boolean>
}
export type RoleToggleKeys = keyof typeof RoleToggle
//# sourceMappingURL=role.d.ts.map
