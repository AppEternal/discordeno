import type { BigString, DiscordRole, DiscordRoleColors } from '@discordeno/types'
import type { Bot } from '../bot.js'
import type { Role, RoleColors } from './types.js'
export declare const baseRole: Role
export declare function transformRole(
  bot: Bot,
  payload: DiscordRole,
  extra?: {
    guildId?: BigString
  },
): Role
export declare function transformRoleColors(bot: Bot, payload: DiscordRoleColors): RoleColors
//# sourceMappingURL=role.d.ts.map
