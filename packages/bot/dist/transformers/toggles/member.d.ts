import { type DiscordMember } from '@discordeno/types'
import { ToggleBitfield } from './ToggleBitfield.js'
/** @private This is subject to breaking changes without notices */
export declare const memberFlags: readonly ['didRejoin', 'startedOnboarding', 'bypassesVerification', 'completedOnboarding']
export declare const MemberToggle: {
  /** Whether the user is deafened in voice channels */
  deaf: number
  /** Whether the user is muted in voice channels */
  mute: number
  /** Whether the user has not yet passed the guild's Membership Screening requirements */
  pending: number
  /** Member has left and rejoined the guild */
  didRejoin: number
  /** Member has completed onboarding */
  startedOnboarding: number
  /** Member is exempt from guild verification requirements */
  bypassesVerification: number
  /** Member has started onboarding */
  completedOnboarding: number
  /** Member is a guest and can only access the voice channel they were invited to */
  isGuest: number
  /** Member has started Server Guide new member actions */
  startedHomeActions: number
  /** Member has completed Server Guide new member actions */
  completedHomeActions: number
  /** Member's username, display name, or nickname is blocked by AutoMod */
  automodQuarantinedUsername: number
  /** Member has dismissed the DM settings upsell */
  dmSettingsUpsellAcknowledged: number
  /** Member's guild tag is blocked by AutoMod */
  automodQuarantinedGuildTag: number
}
export declare class MemberToggles extends ToggleBitfield {
  constructor(memberOrTogglesInt: Partial<DiscordMember> | number)
  get flags(): number
  /** Whether the user belongs to an OAuth2 application */
  get deaf(): boolean
  /** Whether the user is muted in voice channels */
  get mute(): boolean
  /** Whether the user has not yet passed the guild's Membership Screening requirements */
  get pending(): boolean
  /** Member has left and rejoined the guild */
  get didRejoin(): boolean
  /** Member has completed onboarding */
  get startedOnboarding(): boolean
  /** Member is exempt from guild verification requirements */
  get bypassesVerification(): boolean
  /** Member has started onboarding */
  get completedOnboarding(): boolean
  /** Member is a guest and can only access the voice channel they were invited to */
  get isGuest(): boolean
  /** Member has started Server Guide new member actions */
  get startedHomeActions(): boolean
  /** Member has completed Server Guide new member actions */
  get completedHomeActions(): boolean
  /** Member's username, display name, or nickname is blocked by AutoMod */
  get automodQuarantinedUsername(): boolean
  /** Member has dismissed the DM settings upsell */
  get dmSettingsUpsellAcknowledged(): boolean
  /** Member's guild tag is blocked by AutoMod */
  get automodQuarantinedGuildTag(): boolean
  /** Checks whether or not the permissions exist in this */
  has(permissions: MemberToggleKeys | MemberToggleKeys[]): boolean
  /** Lists all the toggles for the role and whether or not each is true or false. */
  list(): Record<MemberToggleKeys, boolean>
}
export type MemberToggleKeys = keyof typeof MemberToggle
export type MemberFlagsKeys = (typeof memberFlags)[number]
//# sourceMappingURL=member.d.ts.map
