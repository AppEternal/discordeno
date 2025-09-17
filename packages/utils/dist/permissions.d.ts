import type { PermissionStrings } from '@discordeno/types';
/** This function converts a bitwise string to permission strings */
export declare function calculatePermissions(permissionBits: bigint): PermissionStrings[];
/** This function converts an array of permissions into the bitwise string. */
export declare function calculateBits(permissions: PermissionStrings[]): string;
//# sourceMappingURL=permissions.d.ts.map