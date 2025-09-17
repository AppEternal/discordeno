import type { BigString, DiscordInviteStageInstance } from '@discordeno/types';
import type { Bot } from '../bot.js';
import type { InviteStageInstance } from './types.js';
export declare function transformInviteStageInstance(bot: Bot, payload: DiscordInviteStageInstance, extra?: {
    guildId?: BigString;
}): InviteStageInstance;
//# sourceMappingURL=stageInviteInstance.d.ts.map