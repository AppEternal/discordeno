import type { DiscordLobby, DiscordLobbyMember } from '@discordeno/types';
import type { Bot } from '../bot.js';
import type { Lobby, LobbyMember } from './types.js';
export declare function transformLobby(bot: Bot, payload: DiscordLobby): Lobby;
export declare function transformLobbyMember(bot: Bot, payload: DiscordLobbyMember): LobbyMember;
//# sourceMappingURL=lobby.d.ts.map