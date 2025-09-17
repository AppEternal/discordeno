import { type PermissionStrings } from '@discordeno/types';
import { ToggleBitfieldBigint } from './ToggleBitfield.js';
export declare class Permissions extends ToggleBitfieldBigint {
    constructor(bits: string | bigint);
    has(permission: PermissionStrings): boolean;
    hasAll(permissions: PermissionStrings[]): boolean;
    missing(permissions: PermissionStrings[]): PermissionStrings[];
}
//# sourceMappingURL=Permissions.d.ts.map