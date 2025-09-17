import type { DiscordPoll, DiscordPollMedia } from '@discordeno/types';
import type { Bot } from '../bot.js';
import type { Poll, PollMedia } from './types.js';
export declare function transformPoll(bot: Bot, payload: DiscordPoll): Poll;
export declare function transformPollMedia(bot: Bot, payload: DiscordPollMedia): PollMedia;
//# sourceMappingURL=poll.d.ts.map