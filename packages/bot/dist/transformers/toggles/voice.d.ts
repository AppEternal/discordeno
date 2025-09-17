import type { DiscordVoiceState } from '@discordeno/types';
import { ToggleBitfield } from './ToggleBitfield.js';
export declare const VoiceStateToggle: {
    /** Whether this user is deafened by the server */
    deaf: number;
    /** Whether this user is muted by the server */
    mute: number;
    /** Whether this user is locally deafened */
    selfDeaf: number;
    /** Whether this user is locally muted */
    selfMute: number;
    /** Whether this user is streaming using "Go Live" */
    selfStream: number;
    /** Whether this user's camera is enabled */
    selfVideo: number;
    /** Whether this user is muted by the current user */
    suppress: number;
};
export declare class VoiceStateToggles extends ToggleBitfield {
    constructor(voiceOrTogglesInt: DiscordVoiceState | number);
    /** Whether this user is deafened by the server */
    get deaf(): boolean;
    /** Whether this user is muted by the server */
    get mute(): boolean;
    /** Whether this user is locally deafened */
    get selfDeaf(): boolean;
    /** Whether this user is locally muted */
    get selfMute(): boolean;
    /** Whether this user is streaming using "Go Live" */
    get selfStream(): boolean;
    /** Whether this user's camera is enabled */
    get selfVideo(): boolean;
    /** Whether this user is muted by the current user */
    get suppress(): boolean;
    /** Checks whether or not the permissions exist in this */
    has(permissions: VoiceStateToggleKeys | VoiceStateToggleKeys[]): boolean;
    /** Lists all the toggles for the role and whether or not each is true or false. */
    list(): Record<VoiceStateToggleKeys, boolean>;
}
export type VoiceStateToggleKeys = keyof typeof VoiceStateToggle;
//# sourceMappingURL=voice.d.ts.map