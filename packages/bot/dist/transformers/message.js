import { DiscordApplicationIntegrationType, MessageFlags } from '@discordeno/types';
import { snowflakeToTimestamp } from '@discordeno/utils';
import { CHANNEL_MENTION_REGEX } from '../constants.js';
import { ToggleBitfield } from './toggles/ToggleBitfield.js';
const EMPTY_STRING = '';
export const baseMessage = {
    // This allows typescript to still check for type errors on functions below
    ...undefined,
    get crossposted () {
        return this.flags?.contains(MessageFlags.Crossposted) ?? false;
    },
    set crossposted (value){
        if (!this.flags) return;
        if (value) this.flags.add(MessageFlags.Crossposted);
        else this.flags.remove(MessageFlags.Crossposted);
    },
    get ephemeral () {
        return this.flags?.contains(MessageFlags.Ephemeral) ?? false;
    },
    set ephemeral (value){
        if (!this.flags) return;
        if (value) this.flags.add(MessageFlags.Ephemeral);
        else this.flags.remove(MessageFlags.Ephemeral);
    },
    get failedToMentionSomeRolesInThread () {
        return this.flags?.contains(MessageFlags.FailedToMentionSomeRolesInThread) ?? false;
    },
    set failedToMentionSomeRolesInThread (value){
        if (!this.flags) return;
        if (value) this.flags.add(MessageFlags.FailedToMentionSomeRolesInThread);
        else this.flags.remove(MessageFlags.FailedToMentionSomeRolesInThread);
    },
    get hasThread () {
        return this.flags?.contains(MessageFlags.HasThread) ?? false;
    },
    set hasThread (value){
        if (!this.flags) return;
        if (value) this.flags.add(MessageFlags.HasThread);
        else this.flags.remove(MessageFlags.HasThread);
    },
    get isCrosspost () {
        return this.flags?.contains(MessageFlags.IsCrosspost) ?? false;
    },
    set isCrosspost (value){
        if (!this.flags) return;
        if (value) this.flags.add(MessageFlags.IsCrosspost);
        else this.flags.remove(MessageFlags.IsCrosspost);
    },
    get loading () {
        return this.flags?.contains(MessageFlags.Loading) ?? false;
    },
    set loading (value){
        if (!this.flags) return;
        if (value) this.flags.add(MessageFlags.Loading);
        else this.flags.remove(MessageFlags.Loading);
    },
    get mentionedUserIds () {
        return this.mentions?.map((user)=>user.id) ?? [];
    },
    get mentionEveryone () {
        return this.bitfield?.contains(2) ?? false;
    },
    set mentionEveryone (value){
        if (!this.bitfield) return;
        if (value) this.bitfield.add(2);
        else this.bitfield.remove(2);
    },
    get pinned () {
        return this.bitfield?.contains(3) ?? false;
    },
    set pinned (value){
        if (!this.bitfield) return;
        if (value) this.bitfield.add(3);
        else this.bitfield.remove(3);
    },
    get sourceMessageDeleted () {
        return this.flags?.contains(MessageFlags.SourceMessageDeleted) ?? false;
    },
    set sourceMessageDeleted (value){
        if (!this.flags) return;
        if (value) this.flags.add(MessageFlags.SourceMessageDeleted);
        else this.flags.remove(MessageFlags.SourceMessageDeleted);
    },
    get suppressEmbeds () {
        return this.flags?.contains(MessageFlags.SuppressEmbeds) ?? false;
    },
    set suppressEmbeds (value){
        if (!this.flags) return;
        if (value) this.flags.add(MessageFlags.SuppressEmbeds);
        else this.flags.remove(MessageFlags.SuppressEmbeds);
    },
    get suppressNotifications () {
        return this.flags?.contains(MessageFlags.SuppressNotifications) ?? false;
    },
    set suppressNotifications (value){
        if (!this.flags) return;
        if (value) this.flags.add(MessageFlags.SuppressNotifications);
        else this.flags.remove(MessageFlags.SuppressNotifications);
    },
    get timestamp () {
        return this.id ? snowflakeToTimestamp(this.id) : 0;
    },
    get tts () {
        return this.bitfield?.contains(1) ?? false;
    },
    set tts (value){
        if (!this.bitfield) return;
        if (value) this.bitfield.add(1);
        else this.bitfield.remove(1);
    },
    get urgent () {
        return this.flags?.contains(MessageFlags.Urgent) ?? false;
    },
    set urgent (value){
        if (!this.flags) return;
        if (value) this.flags.add(MessageFlags.Urgent);
        else this.flags.remove(MessageFlags.Urgent);
    }
};
export function transformMessage(bot, payload, extra) {
    const guildId = payload.guild_id ? bot.transformers.snowflake(payload.guild_id) : undefined;
    const userId = payload.author?.id ? bot.transformers.snowflake(payload.author.id) : undefined;
    const message = Object.create(baseMessage);
    message.bitfield = new ToggleBitfield();
    message.flags = new ToggleBitfield(payload.flags);
    const props = bot.transformers.desiredProperties.message;
    if (props.author && payload.author) message.author = bot.transformers.user(bot, payload.author);
    if (props.application && payload.application) // @ts-expect-error TODO: Partials
    message.application = bot.transformers.application(bot, payload.application, {
        shardId: extra?.shardId
    });
    if (props.applicationId && payload.application_id) message.applicationId = bot.transformers.snowflake(payload.application_id);
    if (props.attachments && payload.attachments?.length) message.attachments = payload.attachments.map((attachment)=>bot.transformers.attachment(bot, attachment));
    if (props.channelId && payload.channel_id) message.channelId = bot.transformers.snowflake(payload.channel_id);
    if (props.components && payload.components?.length) message.components = payload.components.map((comp)=>bot.transformers.component(bot, comp));
    if (props.content) message.content = payload.content ?? EMPTY_STRING;
    if (props.editedTimestamp && payload.edited_timestamp) message.editedTimestamp = Date.parse(payload.edited_timestamp);
    if (props.embeds && payload.embeds?.length) message.embeds = payload.embeds.map((embed)=>bot.transformers.embed(bot, embed));
    if (props.guildId && guildId) message.guildId = guildId;
    if (props.id && payload.id) message.id = bot.transformers.snowflake(payload.id);
    if (props.interactionMetadata && payload.interaction_metadata) message.interactionMetadata = bot.transformers.messageInteractionMetadata(bot, payload.interaction_metadata);
    if (props.interaction && payload.interaction) {
        const interaction = {};
        const messageInteractionProps = bot.transformers.desiredProperties.messageInteraction;
        if (messageInteractionProps.id) {
            interaction.id = bot.transformers.snowflake(payload.interaction.id);
        }
        if (messageInteractionProps.member && payload.interaction.member) {
            // @ts-expect-error TODO: partial - check why this is partial and handle as needed
            interaction.member = bot.transformers.member(bot, payload.interaction.member, {
                guildId,
                userId: payload.interaction.user.id
            });
        }
        if (messageInteractionProps.name) {
            interaction.name = payload.interaction.name;
        }
        if (messageInteractionProps.type) {
            interaction.type = payload.interaction.type;
        }
        if (messageInteractionProps.user) {
            interaction.user = bot.transformers.user(bot, payload.interaction.user);
        }
        message.interaction = interaction;
    }
    if (props.member && guildId && userId && payload.member) // @ts-expect-error TODO: partial
    message.member = bot.transformers.member(bot, payload.member, {
        guildId,
        userId
    });
    if (payload.mention_everyone) message.mentionEveryone = true;
    if (props.mentionedChannelIds && payload.mention_channels?.length) {
        message.mentionedChannelIds = [
            // Keep any ids tht discord sends
            ...(payload.mention_channels ?? []).map((m)=>bot.transformers.snowflake(m.id)),
            // Add any other ids that can be validated in a channel mention format
            ...(payload.content?.match(CHANNEL_MENTION_REGEX) ?? []).map((text)=>// converts the <#123> into 123
                bot.transformers.snowflake(text.substring(2, text.length - 1)))
        ];
    }
    if (props.mentionedRoleIds && payload.mention_roles?.length) message.mentionedRoleIds = payload.mention_roles.map((id)=>bot.transformers.snowflake(id));
    if (props.mentions && payload.mentions?.length) message.mentions = payload.mentions.map((user)=>bot.transformers.user(bot, user));
    if (props.messageReference && payload.message_reference) {
        const reference = {};
        const messageReferenceProps = bot.transformers.desiredProperties.messageReference;
        if (messageReferenceProps.channelId && payload.message_reference.channel_id) {
            reference.channelId = bot.transformers.snowflake(payload.message_reference.channel_id);
        }
        if (messageReferenceProps.guildId && payload.message_reference.guild_id) {
            reference.guildId = bot.transformers.snowflake(payload.message_reference.guild_id);
        }
        if (messageReferenceProps.messageId && payload.message_reference.message_id) {
            reference.messageId = bot.transformers.snowflake(payload.message_reference.message_id);
        }
        message.messageReference = reference;
    }
    if (props.referencedMessage && payload.referenced_message) message.referencedMessage = bot.transformers.message(bot, payload.referenced_message, {
        shardId: extra?.shardId
    });
    if (props.messageSnapshots && payload.message_snapshots) message.messageSnapshots = payload.message_snapshots.map((snap)=>bot.transformers.messageSnapshot(bot, snap, {
            shardId: extra?.shardId
        }));
    if (props.nonce && payload.nonce) message.nonce = payload.nonce;
    if (payload.pinned) message.pinned = true;
    if (props.reactions && payload.reactions?.length) {
        message.reactions = payload.reactions.map((reaction)=>({
                me: reaction.me,
                meBurst: reaction.me_burst,
                count: reaction.count,
                countDetails: {
                    burst: reaction.count_details.burst,
                    normal: reaction.count_details.normal
                },
                // @ts-expect-error TODO: Deal with partials
                emoji: bot.transformers.emoji(bot, reaction.emoji),
                burstColors: reaction.burst_colors
            }));
    }
    if (props.stickerItems && payload.sticker_items?.length) message.stickerItems = payload.sticker_items.map((item)=>({
            id: bot.transformers.snowflake(item.id),
            name: item.name,
            formatType: item.format_type
        }));
    if (payload.tts) message.tts = true;
    if (props.thread && payload.thread) message.thread = bot.transformers.channel(bot, payload.thread, {
        guildId
    });
    if (props.type) message.type = payload.type;
    if (props.webhookId && payload.webhook_id) message.webhookId = bot.transformers.snowflake(payload.webhook_id);
    if (props.poll && payload.poll) message.poll = bot.transformers.poll(bot, payload.poll);
    if (props.call && payload.call) message.call = bot.transformers.messageCall(bot, payload.call);
    return bot.transformers.customizers.message(bot, payload, message, extra);
}
export function transformMessagePin(bot, payload, extra) {
    const props = bot.transformers.desiredProperties.messagePin;
    const messagePin = {};
    if (props.pinnedAt && payload.pinned_at) messagePin.pinnedAt = Date.parse(payload.pinned_at);
    if (props.message && payload.message) messagePin.message = bot.transformers.message(bot, payload.message, {
        shardId: extra?.shardId
    });
    return bot.transformers.customizers.messagePin(bot, payload, messagePin, extra);
}
export function transformMessageSnapshot(bot, payload, extra) {
    const props = bot.transformers.desiredProperties.messageSnapshot;
    const messageSnapshot = {};
    if (props.message && payload.message) // @ts-expect-error TODO: Partials
    messageSnapshot.message = bot.transformers.message(bot, payload.message, {
        shardId: extra?.shardId
    });
    return bot.transformers.customizers.messageSnapshot(bot, payload, messageSnapshot, extra);
}
export function transformMessageInteractionMetadata(bot, payload) {
    const props = bot.transformers.desiredProperties.messageInteractionMetadata;
    const metadata = {};
    if (props.id) metadata.id = bot.transformers.snowflake(payload.id);
    if (props.authorizingIntegrationOwners) {
        metadata.authorizingIntegrationOwners = {};
        if (payload.authorizing_integration_owners['0']) metadata.authorizingIntegrationOwners[DiscordApplicationIntegrationType.GuildInstall] = bot.transformers.snowflake(payload.authorizing_integration_owners['0']);
        if (payload.authorizing_integration_owners['1']) metadata.authorizingIntegrationOwners[DiscordApplicationIntegrationType.UserInstall] = bot.transformers.snowflake(payload.authorizing_integration_owners['1']);
    }
    if (props.originalResponseMessageId && payload.original_response_message_id) metadata.originalResponseMessageId = bot.transformers.snowflake(payload.original_response_message_id);
    if (props.type) metadata.type = payload.type;
    if (props.user && payload.user) metadata.user = bot.transformers.user(bot, payload.user);
    // Application command metadata
    if ('target_user' in payload) {
        if (props.targetUser && payload.target_user) metadata.targetUser = bot.transformers.user(bot, payload.target_user);
        if (props.targetMessageId && payload.target_message_id) metadata.targetMessageId = bot.transformers.snowflake(payload.target_message_id);
    }
    // Message component metadata
    if ('interacted_message_id' in payload) {
        if (props.interactedMessageId && payload.interacted_message_id) metadata.interactedMessageId = bot.transformers.snowflake(payload.interacted_message_id);
    }
    // Modal submit metadata
    if ('triggering_interaction_metadata' in payload) {
        if (props.triggeringInteractionMetadata && payload.triggering_interaction_metadata) metadata.triggeringInteractionMetadata = bot.transformers.messageInteractionMetadata(bot, payload.triggering_interaction_metadata);
    }
    return bot.transformers.customizers.messageInteractionMetadata(bot, payload, metadata);
}
export function transformMessageCall(bot, payload) {
    const call = {};
    const props = bot.transformers.desiredProperties.messageCall;
    if (props.participants && payload.participants) call.participants = payload.participants.map((x)=>bot.transformers.snowflake(x));
    if (props.endedTimestamp && payload.ended_timestamp) call.endedTimestamp = Date.parse(payload.ended_timestamp);
    return bot.transformers.customizers.messageCall(bot, payload, call);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvbWVzc2FnZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBEaXNjb3JkQXBwbGljYXRpb25JbnRlZ3JhdGlvblR5cGUsXG4gIHR5cGUgRGlzY29yZE1lc3NhZ2UsXG4gIHR5cGUgRGlzY29yZE1lc3NhZ2VDYWxsLFxuICB0eXBlIERpc2NvcmRNZXNzYWdlSW50ZXJhY3Rpb25NZXRhZGF0YSxcbiAgdHlwZSBEaXNjb3JkTWVzc2FnZVBpbixcbiAgdHlwZSBEaXNjb3JkTWVzc2FnZVNuYXBzaG90LFxuICBNZXNzYWdlRmxhZ3MsXG59IGZyb20gJ0BkaXNjb3JkZW5vL3R5cGVzJ1xuaW1wb3J0IHsgc25vd2ZsYWtlVG9UaW1lc3RhbXAgfSBmcm9tICdAZGlzY29yZGVuby91dGlscydcbmltcG9ydCB0eXBlIHsgQm90IH0gZnJvbSAnLi4vYm90LmpzJ1xuaW1wb3J0IHsgQ0hBTk5FTF9NRU5USU9OX1JFR0VYIH0gZnJvbSAnLi4vY29uc3RhbnRzLmpzJ1xuaW1wb3J0IHR5cGUgeyBEZXNpcmVkUHJvcGVydGllc0JlaGF2aW9yLCBTZXR1cERlc2lyZWRQcm9wcywgVHJhbnNmb3JtZXJzRGVzaXJlZFByb3BlcnRpZXMgfSBmcm9tICcuLi9kZXNpcmVkUHJvcGVydGllcy5qcydcbmltcG9ydCB7IFRvZ2dsZUJpdGZpZWxkIH0gZnJvbSAnLi90b2dnbGVzL1RvZ2dsZUJpdGZpZWxkLmpzJ1xuaW1wb3J0IHR5cGUgeyBNZXNzYWdlLCBNZXNzYWdlQ2FsbCwgTWVzc2FnZUludGVyYWN0aW9uLCBNZXNzYWdlSW50ZXJhY3Rpb25NZXRhZGF0YSwgTWVzc2FnZVBpbiwgTWVzc2FnZVNuYXBzaG90IH0gZnJvbSAnLi90eXBlcy5qcydcblxuY29uc3QgRU1QVFlfU1RSSU5HID0gJydcblxuZXhwb3J0IGNvbnN0IGJhc2VNZXNzYWdlOiBNZXNzYWdlID0ge1xuICAvLyBUaGlzIGFsbG93cyB0eXBlc2NyaXB0IHRvIHN0aWxsIGNoZWNrIGZvciB0eXBlIGVycm9ycyBvbiBmdW5jdGlvbnMgYmVsb3dcbiAgLi4uKHVuZGVmaW5lZCBhcyB1bmtub3duIGFzIE1lc3NhZ2UpLFxuXG4gIGdldCBjcm9zc3Bvc3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5mbGFncz8uY29udGFpbnMoTWVzc2FnZUZsYWdzLkNyb3NzcG9zdGVkKSA/PyBmYWxzZVxuICB9LFxuICBzZXQgY3Jvc3Nwb3N0ZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICBpZiAoIXRoaXMuZmxhZ3MpIHJldHVyblxuICAgIGlmICh2YWx1ZSkgdGhpcy5mbGFncy5hZGQoTWVzc2FnZUZsYWdzLkNyb3NzcG9zdGVkKVxuICAgIGVsc2UgdGhpcy5mbGFncy5yZW1vdmUoTWVzc2FnZUZsYWdzLkNyb3NzcG9zdGVkKVxuICB9LFxuICBnZXQgZXBoZW1lcmFsKCkge1xuICAgIHJldHVybiB0aGlzLmZsYWdzPy5jb250YWlucyhNZXNzYWdlRmxhZ3MuRXBoZW1lcmFsKSA/PyBmYWxzZVxuICB9LFxuICBzZXQgZXBoZW1lcmFsKHZhbHVlOiBib29sZWFuKSB7XG4gICAgaWYgKCF0aGlzLmZsYWdzKSByZXR1cm5cbiAgICBpZiAodmFsdWUpIHRoaXMuZmxhZ3MuYWRkKE1lc3NhZ2VGbGFncy5FcGhlbWVyYWwpXG4gICAgZWxzZSB0aGlzLmZsYWdzLnJlbW92ZShNZXNzYWdlRmxhZ3MuRXBoZW1lcmFsKVxuICB9LFxuICBnZXQgZmFpbGVkVG9NZW50aW9uU29tZVJvbGVzSW5UaHJlYWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZmxhZ3M/LmNvbnRhaW5zKE1lc3NhZ2VGbGFncy5GYWlsZWRUb01lbnRpb25Tb21lUm9sZXNJblRocmVhZCkgPz8gZmFsc2VcbiAgfSxcbiAgc2V0IGZhaWxlZFRvTWVudGlvblNvbWVSb2xlc0luVGhyZWFkKHZhbHVlOiBib29sZWFuKSB7XG4gICAgaWYgKCF0aGlzLmZsYWdzKSByZXR1cm5cbiAgICBpZiAodmFsdWUpIHRoaXMuZmxhZ3MuYWRkKE1lc3NhZ2VGbGFncy5GYWlsZWRUb01lbnRpb25Tb21lUm9sZXNJblRocmVhZClcbiAgICBlbHNlIHRoaXMuZmxhZ3MucmVtb3ZlKE1lc3NhZ2VGbGFncy5GYWlsZWRUb01lbnRpb25Tb21lUm9sZXNJblRocmVhZClcbiAgfSxcbiAgZ2V0IGhhc1RocmVhZCgpIHtcbiAgICByZXR1cm4gdGhpcy5mbGFncz8uY29udGFpbnMoTWVzc2FnZUZsYWdzLkhhc1RocmVhZCkgPz8gZmFsc2VcbiAgfSxcbiAgc2V0IGhhc1RocmVhZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICghdGhpcy5mbGFncykgcmV0dXJuXG4gICAgaWYgKHZhbHVlKSB0aGlzLmZsYWdzLmFkZChNZXNzYWdlRmxhZ3MuSGFzVGhyZWFkKVxuICAgIGVsc2UgdGhpcy5mbGFncy5yZW1vdmUoTWVzc2FnZUZsYWdzLkhhc1RocmVhZClcbiAgfSxcbiAgZ2V0IGlzQ3Jvc3Nwb3N0KCkge1xuICAgIHJldHVybiB0aGlzLmZsYWdzPy5jb250YWlucyhNZXNzYWdlRmxhZ3MuSXNDcm9zc3Bvc3QpID8/IGZhbHNlXG4gIH0sXG4gIHNldCBpc0Nyb3NzcG9zdCh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICghdGhpcy5mbGFncykgcmV0dXJuXG4gICAgaWYgKHZhbHVlKSB0aGlzLmZsYWdzLmFkZChNZXNzYWdlRmxhZ3MuSXNDcm9zc3Bvc3QpXG4gICAgZWxzZSB0aGlzLmZsYWdzLnJlbW92ZShNZXNzYWdlRmxhZ3MuSXNDcm9zc3Bvc3QpXG4gIH0sXG4gIGdldCBsb2FkaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmZsYWdzPy5jb250YWlucyhNZXNzYWdlRmxhZ3MuTG9hZGluZykgPz8gZmFsc2VcbiAgfSxcbiAgc2V0IGxvYWRpbmcodmFsdWU6IGJvb2xlYW4pIHtcbiAgICBpZiAoIXRoaXMuZmxhZ3MpIHJldHVyblxuICAgIGlmICh2YWx1ZSkgdGhpcy5mbGFncy5hZGQoTWVzc2FnZUZsYWdzLkxvYWRpbmcpXG4gICAgZWxzZSB0aGlzLmZsYWdzLnJlbW92ZShNZXNzYWdlRmxhZ3MuTG9hZGluZylcbiAgfSxcbiAgZ2V0IG1lbnRpb25lZFVzZXJJZHMoKSB7XG4gICAgcmV0dXJuIHRoaXMubWVudGlvbnM/Lm1hcCgodXNlcikgPT4gdXNlci5pZCkgPz8gW11cbiAgfSxcbiAgZ2V0IG1lbnRpb25FdmVyeW9uZSgpIHtcbiAgICByZXR1cm4gdGhpcy5iaXRmaWVsZD8uY29udGFpbnMoMikgPz8gZmFsc2VcbiAgfSxcbiAgc2V0IG1lbnRpb25FdmVyeW9uZSh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICghdGhpcy5iaXRmaWVsZCkgcmV0dXJuXG4gICAgaWYgKHZhbHVlKSB0aGlzLmJpdGZpZWxkLmFkZCgyKVxuICAgIGVsc2UgdGhpcy5iaXRmaWVsZC5yZW1vdmUoMilcbiAgfSxcbiAgZ2V0IHBpbm5lZCgpIHtcbiAgICByZXR1cm4gdGhpcy5iaXRmaWVsZD8uY29udGFpbnMoMykgPz8gZmFsc2VcbiAgfSxcbiAgc2V0IHBpbm5lZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICghdGhpcy5iaXRmaWVsZCkgcmV0dXJuXG4gICAgaWYgKHZhbHVlKSB0aGlzLmJpdGZpZWxkLmFkZCgzKVxuICAgIGVsc2UgdGhpcy5iaXRmaWVsZC5yZW1vdmUoMylcbiAgfSxcbiAgZ2V0IHNvdXJjZU1lc3NhZ2VEZWxldGVkKCkge1xuICAgIHJldHVybiB0aGlzLmZsYWdzPy5jb250YWlucyhNZXNzYWdlRmxhZ3MuU291cmNlTWVzc2FnZURlbGV0ZWQpID8/IGZhbHNlXG4gIH0sXG4gIHNldCBzb3VyY2VNZXNzYWdlRGVsZXRlZCh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlmICghdGhpcy5mbGFncykgcmV0dXJuXG4gICAgaWYgKHZhbHVlKSB0aGlzLmZsYWdzLmFkZChNZXNzYWdlRmxhZ3MuU291cmNlTWVzc2FnZURlbGV0ZWQpXG4gICAgZWxzZSB0aGlzLmZsYWdzLnJlbW92ZShNZXNzYWdlRmxhZ3MuU291cmNlTWVzc2FnZURlbGV0ZWQpXG4gIH0sXG4gIGdldCBzdXBwcmVzc0VtYmVkcygpIHtcbiAgICByZXR1cm4gdGhpcy5mbGFncz8uY29udGFpbnMoTWVzc2FnZUZsYWdzLlN1cHByZXNzRW1iZWRzKSA/PyBmYWxzZVxuICB9LFxuICBzZXQgc3VwcHJlc3NFbWJlZHModmFsdWU6IGJvb2xlYW4pIHtcbiAgICBpZiAoIXRoaXMuZmxhZ3MpIHJldHVyblxuICAgIGlmICh2YWx1ZSkgdGhpcy5mbGFncy5hZGQoTWVzc2FnZUZsYWdzLlN1cHByZXNzRW1iZWRzKVxuICAgIGVsc2UgdGhpcy5mbGFncy5yZW1vdmUoTWVzc2FnZUZsYWdzLlN1cHByZXNzRW1iZWRzKVxuICB9LFxuICBnZXQgc3VwcHJlc3NOb3RpZmljYXRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLmZsYWdzPy5jb250YWlucyhNZXNzYWdlRmxhZ3MuU3VwcHJlc3NOb3RpZmljYXRpb25zKSA/PyBmYWxzZVxuICB9LFxuICBzZXQgc3VwcHJlc3NOb3RpZmljYXRpb25zKHZhbHVlOiBib29sZWFuKSB7XG4gICAgaWYgKCF0aGlzLmZsYWdzKSByZXR1cm5cbiAgICBpZiAodmFsdWUpIHRoaXMuZmxhZ3MuYWRkKE1lc3NhZ2VGbGFncy5TdXBwcmVzc05vdGlmaWNhdGlvbnMpXG4gICAgZWxzZSB0aGlzLmZsYWdzLnJlbW92ZShNZXNzYWdlRmxhZ3MuU3VwcHJlc3NOb3RpZmljYXRpb25zKVxuICB9LFxuICBnZXQgdGltZXN0YW1wKCkge1xuICAgIHJldHVybiB0aGlzLmlkID8gc25vd2ZsYWtlVG9UaW1lc3RhbXAodGhpcy5pZCkgOiAwXG4gIH0sXG4gIGdldCB0dHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYml0ZmllbGQ/LmNvbnRhaW5zKDEpID8/IGZhbHNlXG4gIH0sXG4gIHNldCB0dHModmFsdWU6IGJvb2xlYW4pIHtcbiAgICBpZiAoIXRoaXMuYml0ZmllbGQpIHJldHVyblxuICAgIGlmICh2YWx1ZSkgdGhpcy5iaXRmaWVsZC5hZGQoMSlcbiAgICBlbHNlIHRoaXMuYml0ZmllbGQucmVtb3ZlKDEpXG4gIH0sXG4gIGdldCB1cmdlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZmxhZ3M/LmNvbnRhaW5zKE1lc3NhZ2VGbGFncy5VcmdlbnQpID8/IGZhbHNlXG4gIH0sXG4gIHNldCB1cmdlbnQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICBpZiAoIXRoaXMuZmxhZ3MpIHJldHVyblxuICAgIGlmICh2YWx1ZSkgdGhpcy5mbGFncy5hZGQoTWVzc2FnZUZsYWdzLlVyZ2VudClcbiAgICBlbHNlIHRoaXMuZmxhZ3MucmVtb3ZlKE1lc3NhZ2VGbGFncy5VcmdlbnQpXG4gIH0sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2Zvcm1NZXNzYWdlKGJvdDogQm90LCBwYXlsb2FkOiBEaXNjb3JkTWVzc2FnZSwgZXh0cmE/OiB7IHNoYXJkSWQ/OiBudW1iZXIgfSk6IE1lc3NhZ2Uge1xuICBjb25zdCBndWlsZElkID0gcGF5bG9hZC5ndWlsZF9pZCA/IGJvdC50cmFuc2Zvcm1lcnMuc25vd2ZsYWtlKHBheWxvYWQuZ3VpbGRfaWQpIDogdW5kZWZpbmVkXG4gIGNvbnN0IHVzZXJJZCA9IHBheWxvYWQuYXV0aG9yPy5pZCA/IGJvdC50cmFuc2Zvcm1lcnMuc25vd2ZsYWtlKHBheWxvYWQuYXV0aG9yLmlkKSA6IHVuZGVmaW5lZFxuXG4gIGNvbnN0IG1lc3NhZ2U6IFNldHVwRGVzaXJlZFByb3BzPE1lc3NhZ2UsIFRyYW5zZm9ybWVyc0Rlc2lyZWRQcm9wZXJ0aWVzLCBEZXNpcmVkUHJvcGVydGllc0JlaGF2aW9yPiA9IE9iamVjdC5jcmVhdGUoYmFzZU1lc3NhZ2UpXG4gIG1lc3NhZ2UuYml0ZmllbGQgPSBuZXcgVG9nZ2xlQml0ZmllbGQoKVxuICBtZXNzYWdlLmZsYWdzID0gbmV3IFRvZ2dsZUJpdGZpZWxkKHBheWxvYWQuZmxhZ3MpXG5cbiAgY29uc3QgcHJvcHMgPSBib3QudHJhbnNmb3JtZXJzLmRlc2lyZWRQcm9wZXJ0aWVzLm1lc3NhZ2VcblxuICBpZiAocHJvcHMuYXV0aG9yICYmIHBheWxvYWQuYXV0aG9yKSBtZXNzYWdlLmF1dGhvciA9IGJvdC50cmFuc2Zvcm1lcnMudXNlcihib3QsIHBheWxvYWQuYXV0aG9yKVxuICBpZiAocHJvcHMuYXBwbGljYXRpb24gJiYgcGF5bG9hZC5hcHBsaWNhdGlvbilcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE86IFBhcnRpYWxzXG4gICAgbWVzc2FnZS5hcHBsaWNhdGlvbiA9IGJvdC50cmFuc2Zvcm1lcnMuYXBwbGljYXRpb24oYm90LCBwYXlsb2FkLmFwcGxpY2F0aW9uLCB7IHNoYXJkSWQ6IGV4dHJhPy5zaGFyZElkIH0pXG4gIGlmIChwcm9wcy5hcHBsaWNhdGlvbklkICYmIHBheWxvYWQuYXBwbGljYXRpb25faWQpIG1lc3NhZ2UuYXBwbGljYXRpb25JZCA9IGJvdC50cmFuc2Zvcm1lcnMuc25vd2ZsYWtlKHBheWxvYWQuYXBwbGljYXRpb25faWQpXG4gIGlmIChwcm9wcy5hdHRhY2htZW50cyAmJiBwYXlsb2FkLmF0dGFjaG1lbnRzPy5sZW5ndGgpXG4gICAgbWVzc2FnZS5hdHRhY2htZW50cyA9IHBheWxvYWQuYXR0YWNobWVudHMubWFwKChhdHRhY2htZW50KSA9PiBib3QudHJhbnNmb3JtZXJzLmF0dGFjaG1lbnQoYm90LCBhdHRhY2htZW50KSlcbiAgaWYgKHByb3BzLmNoYW5uZWxJZCAmJiBwYXlsb2FkLmNoYW5uZWxfaWQpIG1lc3NhZ2UuY2hhbm5lbElkID0gYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2UocGF5bG9hZC5jaGFubmVsX2lkKVxuICBpZiAocHJvcHMuY29tcG9uZW50cyAmJiBwYXlsb2FkLmNvbXBvbmVudHM/Lmxlbmd0aCkgbWVzc2FnZS5jb21wb25lbnRzID0gcGF5bG9hZC5jb21wb25lbnRzLm1hcCgoY29tcCkgPT4gYm90LnRyYW5zZm9ybWVycy5jb21wb25lbnQoYm90LCBjb21wKSlcbiAgaWYgKHByb3BzLmNvbnRlbnQpIG1lc3NhZ2UuY29udGVudCA9IHBheWxvYWQuY29udGVudCA/PyBFTVBUWV9TVFJJTkdcbiAgaWYgKHByb3BzLmVkaXRlZFRpbWVzdGFtcCAmJiBwYXlsb2FkLmVkaXRlZF90aW1lc3RhbXApIG1lc3NhZ2UuZWRpdGVkVGltZXN0YW1wID0gRGF0ZS5wYXJzZShwYXlsb2FkLmVkaXRlZF90aW1lc3RhbXApXG4gIGlmIChwcm9wcy5lbWJlZHMgJiYgcGF5bG9hZC5lbWJlZHM/Lmxlbmd0aCkgbWVzc2FnZS5lbWJlZHMgPSBwYXlsb2FkLmVtYmVkcy5tYXAoKGVtYmVkKSA9PiBib3QudHJhbnNmb3JtZXJzLmVtYmVkKGJvdCwgZW1iZWQpKVxuICBpZiAocHJvcHMuZ3VpbGRJZCAmJiBndWlsZElkKSBtZXNzYWdlLmd1aWxkSWQgPSBndWlsZElkXG4gIGlmIChwcm9wcy5pZCAmJiBwYXlsb2FkLmlkKSBtZXNzYWdlLmlkID0gYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2UocGF5bG9hZC5pZClcbiAgaWYgKHByb3BzLmludGVyYWN0aW9uTWV0YWRhdGEgJiYgcGF5bG9hZC5pbnRlcmFjdGlvbl9tZXRhZGF0YSlcbiAgICBtZXNzYWdlLmludGVyYWN0aW9uTWV0YWRhdGEgPSBib3QudHJhbnNmb3JtZXJzLm1lc3NhZ2VJbnRlcmFjdGlvbk1ldGFkYXRhKGJvdCwgcGF5bG9hZC5pbnRlcmFjdGlvbl9tZXRhZGF0YSlcbiAgaWYgKHByb3BzLmludGVyYWN0aW9uICYmIHBheWxvYWQuaW50ZXJhY3Rpb24pIHtcbiAgICBjb25zdCBpbnRlcmFjdGlvbiA9IHt9IGFzIFNldHVwRGVzaXJlZFByb3BzPE1lc3NhZ2VJbnRlcmFjdGlvbiwgVHJhbnNmb3JtZXJzRGVzaXJlZFByb3BlcnRpZXMsIERlc2lyZWRQcm9wZXJ0aWVzQmVoYXZpb3I+XG4gICAgY29uc3QgbWVzc2FnZUludGVyYWN0aW9uUHJvcHMgPSBib3QudHJhbnNmb3JtZXJzLmRlc2lyZWRQcm9wZXJ0aWVzLm1lc3NhZ2VJbnRlcmFjdGlvblxuXG4gICAgaWYgKG1lc3NhZ2VJbnRlcmFjdGlvblByb3BzLmlkKSB7XG4gICAgICBpbnRlcmFjdGlvbi5pZCA9IGJvdC50cmFuc2Zvcm1lcnMuc25vd2ZsYWtlKHBheWxvYWQuaW50ZXJhY3Rpb24uaWQpXG4gICAgfVxuICAgIGlmIChtZXNzYWdlSW50ZXJhY3Rpb25Qcm9wcy5tZW1iZXIgJiYgcGF5bG9hZC5pbnRlcmFjdGlvbi5tZW1iZXIpIHtcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgVE9ETzogcGFydGlhbCAtIGNoZWNrIHdoeSB0aGlzIGlzIHBhcnRpYWwgYW5kIGhhbmRsZSBhcyBuZWVkZWRcbiAgICAgIGludGVyYWN0aW9uLm1lbWJlciA9IGJvdC50cmFuc2Zvcm1lcnMubWVtYmVyKGJvdCwgcGF5bG9hZC5pbnRlcmFjdGlvbi5tZW1iZXIsIHsgZ3VpbGRJZCwgdXNlcklkOiBwYXlsb2FkLmludGVyYWN0aW9uLnVzZXIuaWQgfSlcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2VJbnRlcmFjdGlvblByb3BzLm5hbWUpIHtcbiAgICAgIGludGVyYWN0aW9uLm5hbWUgPSBwYXlsb2FkLmludGVyYWN0aW9uLm5hbWVcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2VJbnRlcmFjdGlvblByb3BzLnR5cGUpIHtcbiAgICAgIGludGVyYWN0aW9uLnR5cGUgPSBwYXlsb2FkLmludGVyYWN0aW9uLnR5cGVcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2VJbnRlcmFjdGlvblByb3BzLnVzZXIpIHtcbiAgICAgIGludGVyYWN0aW9uLnVzZXIgPSBib3QudHJhbnNmb3JtZXJzLnVzZXIoYm90LCBwYXlsb2FkLmludGVyYWN0aW9uLnVzZXIpXG4gICAgfVxuXG4gICAgbWVzc2FnZS5pbnRlcmFjdGlvbiA9IGludGVyYWN0aW9uXG4gIH1cbiAgaWYgKHByb3BzLm1lbWJlciAmJiBndWlsZElkICYmIHVzZXJJZCAmJiBwYXlsb2FkLm1lbWJlcilcbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE86IHBhcnRpYWxcbiAgICBtZXNzYWdlLm1lbWJlciA9IGJvdC50cmFuc2Zvcm1lcnMubWVtYmVyKGJvdCwgcGF5bG9hZC5tZW1iZXIsIHsgZ3VpbGRJZCwgdXNlcklkIH0pXG4gIGlmIChwYXlsb2FkLm1lbnRpb25fZXZlcnlvbmUpIG1lc3NhZ2UubWVudGlvbkV2ZXJ5b25lID0gdHJ1ZVxuICBpZiAocHJvcHMubWVudGlvbmVkQ2hhbm5lbElkcyAmJiBwYXlsb2FkLm1lbnRpb25fY2hhbm5lbHM/Lmxlbmd0aCkge1xuICAgIG1lc3NhZ2UubWVudGlvbmVkQ2hhbm5lbElkcyA9IFtcbiAgICAgIC8vIEtlZXAgYW55IGlkcyB0aHQgZGlzY29yZCBzZW5kc1xuICAgICAgLi4uKHBheWxvYWQubWVudGlvbl9jaGFubmVscyA/PyBbXSkubWFwKChtKSA9PiBib3QudHJhbnNmb3JtZXJzLnNub3dmbGFrZShtLmlkKSksXG4gICAgICAvLyBBZGQgYW55IG90aGVyIGlkcyB0aGF0IGNhbiBiZSB2YWxpZGF0ZWQgaW4gYSBjaGFubmVsIG1lbnRpb24gZm9ybWF0XG4gICAgICAuLi4ocGF5bG9hZC5jb250ZW50Py5tYXRjaChDSEFOTkVMX01FTlRJT05fUkVHRVgpID8/IFtdKS5tYXAoKHRleHQpID0+XG4gICAgICAgIC8vIGNvbnZlcnRzIHRoZSA8IzEyMz4gaW50byAxMjNcbiAgICAgICAgYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2UodGV4dC5zdWJzdHJpbmcoMiwgdGV4dC5sZW5ndGggLSAxKSksXG4gICAgICApLFxuICAgIF1cbiAgfVxuICBpZiAocHJvcHMubWVudGlvbmVkUm9sZUlkcyAmJiBwYXlsb2FkLm1lbnRpb25fcm9sZXM/Lmxlbmd0aClcbiAgICBtZXNzYWdlLm1lbnRpb25lZFJvbGVJZHMgPSBwYXlsb2FkLm1lbnRpb25fcm9sZXMubWFwKChpZCkgPT4gYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2UoaWQpKVxuICBpZiAocHJvcHMubWVudGlvbnMgJiYgcGF5bG9hZC5tZW50aW9ucz8ubGVuZ3RoKSBtZXNzYWdlLm1lbnRpb25zID0gcGF5bG9hZC5tZW50aW9ucy5tYXAoKHVzZXIpID0+IGJvdC50cmFuc2Zvcm1lcnMudXNlcihib3QsIHVzZXIpKVxuICBpZiAocHJvcHMubWVzc2FnZVJlZmVyZW5jZSAmJiBwYXlsb2FkLm1lc3NhZ2VfcmVmZXJlbmNlKSB7XG4gICAgY29uc3QgcmVmZXJlbmNlID0ge30gYXMgTm9uTnVsbGFibGU8TWVzc2FnZVsnbWVzc2FnZVJlZmVyZW5jZSddPlxuICAgIGNvbnN0IG1lc3NhZ2VSZWZlcmVuY2VQcm9wcyA9IGJvdC50cmFuc2Zvcm1lcnMuZGVzaXJlZFByb3BlcnRpZXMubWVzc2FnZVJlZmVyZW5jZVxuXG4gICAgaWYgKG1lc3NhZ2VSZWZlcmVuY2VQcm9wcy5jaGFubmVsSWQgJiYgcGF5bG9hZC5tZXNzYWdlX3JlZmVyZW5jZS5jaGFubmVsX2lkKSB7XG4gICAgICByZWZlcmVuY2UuY2hhbm5lbElkID0gYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2UocGF5bG9hZC5tZXNzYWdlX3JlZmVyZW5jZS5jaGFubmVsX2lkKVxuICAgIH1cbiAgICBpZiAobWVzc2FnZVJlZmVyZW5jZVByb3BzLmd1aWxkSWQgJiYgcGF5bG9hZC5tZXNzYWdlX3JlZmVyZW5jZS5ndWlsZF9pZCkge1xuICAgICAgcmVmZXJlbmNlLmd1aWxkSWQgPSBib3QudHJhbnNmb3JtZXJzLnNub3dmbGFrZShwYXlsb2FkLm1lc3NhZ2VfcmVmZXJlbmNlLmd1aWxkX2lkKVxuICAgIH1cbiAgICBpZiAobWVzc2FnZVJlZmVyZW5jZVByb3BzLm1lc3NhZ2VJZCAmJiBwYXlsb2FkLm1lc3NhZ2VfcmVmZXJlbmNlLm1lc3NhZ2VfaWQpIHtcbiAgICAgIHJlZmVyZW5jZS5tZXNzYWdlSWQgPSBib3QudHJhbnNmb3JtZXJzLnNub3dmbGFrZShwYXlsb2FkLm1lc3NhZ2VfcmVmZXJlbmNlLm1lc3NhZ2VfaWQpXG4gICAgfVxuXG4gICAgbWVzc2FnZS5tZXNzYWdlUmVmZXJlbmNlID0gcmVmZXJlbmNlXG4gIH1cbiAgaWYgKHByb3BzLnJlZmVyZW5jZWRNZXNzYWdlICYmIHBheWxvYWQucmVmZXJlbmNlZF9tZXNzYWdlKVxuICAgIG1lc3NhZ2UucmVmZXJlbmNlZE1lc3NhZ2UgPSBib3QudHJhbnNmb3JtZXJzLm1lc3NhZ2UoYm90LCBwYXlsb2FkLnJlZmVyZW5jZWRfbWVzc2FnZSwgeyBzaGFyZElkOiBleHRyYT8uc2hhcmRJZCB9KVxuICBpZiAocHJvcHMubWVzc2FnZVNuYXBzaG90cyAmJiBwYXlsb2FkLm1lc3NhZ2Vfc25hcHNob3RzKVxuICAgIG1lc3NhZ2UubWVzc2FnZVNuYXBzaG90cyA9IHBheWxvYWQubWVzc2FnZV9zbmFwc2hvdHMubWFwKChzbmFwKSA9PiBib3QudHJhbnNmb3JtZXJzLm1lc3NhZ2VTbmFwc2hvdChib3QsIHNuYXAsIHsgc2hhcmRJZDogZXh0cmE/LnNoYXJkSWQgfSkpXG4gIGlmIChwcm9wcy5ub25jZSAmJiBwYXlsb2FkLm5vbmNlKSBtZXNzYWdlLm5vbmNlID0gcGF5bG9hZC5ub25jZVxuICBpZiAocGF5bG9hZC5waW5uZWQpIG1lc3NhZ2UucGlubmVkID0gdHJ1ZVxuICBpZiAocHJvcHMucmVhY3Rpb25zICYmIHBheWxvYWQucmVhY3Rpb25zPy5sZW5ndGgpIHtcbiAgICBtZXNzYWdlLnJlYWN0aW9ucyA9IHBheWxvYWQucmVhY3Rpb25zLm1hcCgocmVhY3Rpb24pID0+ICh7XG4gICAgICBtZTogcmVhY3Rpb24ubWUsXG4gICAgICBtZUJ1cnN0OiByZWFjdGlvbi5tZV9idXJzdCxcbiAgICAgIGNvdW50OiByZWFjdGlvbi5jb3VudCxcbiAgICAgIGNvdW50RGV0YWlsczoge1xuICAgICAgICBidXJzdDogcmVhY3Rpb24uY291bnRfZGV0YWlscy5idXJzdCxcbiAgICAgICAgbm9ybWFsOiByZWFjdGlvbi5jb3VudF9kZXRhaWxzLm5vcm1hbCxcbiAgICAgIH0sXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFRPRE86IERlYWwgd2l0aCBwYXJ0aWFsc1xuICAgICAgZW1vamk6IGJvdC50cmFuc2Zvcm1lcnMuZW1vamkoYm90LCByZWFjdGlvbi5lbW9qaSksXG4gICAgICBidXJzdENvbG9yczogcmVhY3Rpb24uYnVyc3RfY29sb3JzLFxuICAgIH0pKVxuICB9XG4gIGlmIChwcm9wcy5zdGlja2VySXRlbXMgJiYgcGF5bG9hZC5zdGlja2VyX2l0ZW1zPy5sZW5ndGgpXG4gICAgbWVzc2FnZS5zdGlja2VySXRlbXMgPSBwYXlsb2FkLnN0aWNrZXJfaXRlbXMubWFwKChpdGVtKSA9PiAoe1xuICAgICAgaWQ6IGJvdC50cmFuc2Zvcm1lcnMuc25vd2ZsYWtlKGl0ZW0uaWQpLFxuICAgICAgbmFtZTogaXRlbS5uYW1lLFxuICAgICAgZm9ybWF0VHlwZTogaXRlbS5mb3JtYXRfdHlwZSxcbiAgICB9KSlcbiAgaWYgKHBheWxvYWQudHRzKSBtZXNzYWdlLnR0cyA9IHRydWVcbiAgaWYgKHByb3BzLnRocmVhZCAmJiBwYXlsb2FkLnRocmVhZCkgbWVzc2FnZS50aHJlYWQgPSBib3QudHJhbnNmb3JtZXJzLmNoYW5uZWwoYm90LCBwYXlsb2FkLnRocmVhZCwgeyBndWlsZElkIH0pXG4gIGlmIChwcm9wcy50eXBlKSBtZXNzYWdlLnR5cGUgPSBwYXlsb2FkLnR5cGVcbiAgaWYgKHByb3BzLndlYmhvb2tJZCAmJiBwYXlsb2FkLndlYmhvb2tfaWQpIG1lc3NhZ2Uud2ViaG9va0lkID0gYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2UocGF5bG9hZC53ZWJob29rX2lkKVxuICBpZiAocHJvcHMucG9sbCAmJiBwYXlsb2FkLnBvbGwpIG1lc3NhZ2UucG9sbCA9IGJvdC50cmFuc2Zvcm1lcnMucG9sbChib3QsIHBheWxvYWQucG9sbClcbiAgaWYgKHByb3BzLmNhbGwgJiYgcGF5bG9hZC5jYWxsKSBtZXNzYWdlLmNhbGwgPSBib3QudHJhbnNmb3JtZXJzLm1lc3NhZ2VDYWxsKGJvdCwgcGF5bG9hZC5jYWxsKVxuXG4gIHJldHVybiBib3QudHJhbnNmb3JtZXJzLmN1c3RvbWl6ZXJzLm1lc3NhZ2UoYm90LCBwYXlsb2FkLCBtZXNzYWdlLCBleHRyYSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybU1lc3NhZ2VQaW4oYm90OiBCb3QsIHBheWxvYWQ6IERpc2NvcmRNZXNzYWdlUGluLCBleHRyYT86IHsgc2hhcmRJZD86IG51bWJlciB9KTogTWVzc2FnZVBpbiB7XG4gIGNvbnN0IHByb3BzID0gYm90LnRyYW5zZm9ybWVycy5kZXNpcmVkUHJvcGVydGllcy5tZXNzYWdlUGluXG4gIGNvbnN0IG1lc3NhZ2VQaW4gPSB7fSBhcyBTZXR1cERlc2lyZWRQcm9wczxNZXNzYWdlUGluLCBUcmFuc2Zvcm1lcnNEZXNpcmVkUHJvcGVydGllcywgRGVzaXJlZFByb3BlcnRpZXNCZWhhdmlvcj5cblxuICBpZiAocHJvcHMucGlubmVkQXQgJiYgcGF5bG9hZC5waW5uZWRfYXQpIG1lc3NhZ2VQaW4ucGlubmVkQXQgPSBEYXRlLnBhcnNlKHBheWxvYWQucGlubmVkX2F0KVxuICBpZiAocHJvcHMubWVzc2FnZSAmJiBwYXlsb2FkLm1lc3NhZ2UpIG1lc3NhZ2VQaW4ubWVzc2FnZSA9IGJvdC50cmFuc2Zvcm1lcnMubWVzc2FnZShib3QsIHBheWxvYWQubWVzc2FnZSwgeyBzaGFyZElkOiBleHRyYT8uc2hhcmRJZCB9KVxuXG4gIHJldHVybiBib3QudHJhbnNmb3JtZXJzLmN1c3RvbWl6ZXJzLm1lc3NhZ2VQaW4oYm90LCBwYXlsb2FkLCBtZXNzYWdlUGluLCBleHRyYSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybU1lc3NhZ2VTbmFwc2hvdChib3Q6IEJvdCwgcGF5bG9hZDogRGlzY29yZE1lc3NhZ2VTbmFwc2hvdCwgZXh0cmE/OiB7IHNoYXJkSWQ/OiBudW1iZXIgfSk6IE1lc3NhZ2VTbmFwc2hvdCB7XG4gIGNvbnN0IHByb3BzID0gYm90LnRyYW5zZm9ybWVycy5kZXNpcmVkUHJvcGVydGllcy5tZXNzYWdlU25hcHNob3RcbiAgY29uc3QgbWVzc2FnZVNuYXBzaG90ID0ge30gYXMgU2V0dXBEZXNpcmVkUHJvcHM8TWVzc2FnZVNuYXBzaG90LCBUcmFuc2Zvcm1lcnNEZXNpcmVkUHJvcGVydGllcywgRGVzaXJlZFByb3BlcnRpZXNCZWhhdmlvcj5cblxuICBpZiAocHJvcHMubWVzc2FnZSAmJiBwYXlsb2FkLm1lc3NhZ2UpXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvciBUT0RPOiBQYXJ0aWFsc1xuICAgIG1lc3NhZ2VTbmFwc2hvdC5tZXNzYWdlID0gYm90LnRyYW5zZm9ybWVycy5tZXNzYWdlKGJvdCwgcGF5bG9hZC5tZXNzYWdlLCB7IHNoYXJkSWQ6IGV4dHJhPy5zaGFyZElkIH0pIGFzIE1lc3NhZ2VcblxuICByZXR1cm4gYm90LnRyYW5zZm9ybWVycy5jdXN0b21pemVycy5tZXNzYWdlU25hcHNob3QoYm90LCBwYXlsb2FkLCBtZXNzYWdlU25hcHNob3QsIGV4dHJhKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtTWVzc2FnZUludGVyYWN0aW9uTWV0YWRhdGEoYm90OiBCb3QsIHBheWxvYWQ6IERpc2NvcmRNZXNzYWdlSW50ZXJhY3Rpb25NZXRhZGF0YSk6IE1lc3NhZ2VJbnRlcmFjdGlvbk1ldGFkYXRhIHtcbiAgY29uc3QgcHJvcHMgPSBib3QudHJhbnNmb3JtZXJzLmRlc2lyZWRQcm9wZXJ0aWVzLm1lc3NhZ2VJbnRlcmFjdGlvbk1ldGFkYXRhXG4gIGNvbnN0IG1ldGFkYXRhID0ge30gYXMgU2V0dXBEZXNpcmVkUHJvcHM8TWVzc2FnZUludGVyYWN0aW9uTWV0YWRhdGEsIFRyYW5zZm9ybWVyc0Rlc2lyZWRQcm9wZXJ0aWVzLCBEZXNpcmVkUHJvcGVydGllc0JlaGF2aW9yPlxuXG4gIGlmIChwcm9wcy5pZCkgbWV0YWRhdGEuaWQgPSBib3QudHJhbnNmb3JtZXJzLnNub3dmbGFrZShwYXlsb2FkLmlkKVxuICBpZiAocHJvcHMuYXV0aG9yaXppbmdJbnRlZ3JhdGlvbk93bmVycykge1xuICAgIG1ldGFkYXRhLmF1dGhvcml6aW5nSW50ZWdyYXRpb25Pd25lcnMgPSB7fVxuICAgIGlmIChwYXlsb2FkLmF1dGhvcml6aW5nX2ludGVncmF0aW9uX293bmVyc1snMCddKVxuICAgICAgbWV0YWRhdGEuYXV0aG9yaXppbmdJbnRlZ3JhdGlvbk93bmVyc1tEaXNjb3JkQXBwbGljYXRpb25JbnRlZ3JhdGlvblR5cGUuR3VpbGRJbnN0YWxsXSA9IGJvdC50cmFuc2Zvcm1lcnMuc25vd2ZsYWtlKFxuICAgICAgICBwYXlsb2FkLmF1dGhvcml6aW5nX2ludGVncmF0aW9uX293bmVyc1snMCddLFxuICAgICAgKVxuICAgIGlmIChwYXlsb2FkLmF1dGhvcml6aW5nX2ludGVncmF0aW9uX293bmVyc1snMSddKVxuICAgICAgbWV0YWRhdGEuYXV0aG9yaXppbmdJbnRlZ3JhdGlvbk93bmVyc1tEaXNjb3JkQXBwbGljYXRpb25JbnRlZ3JhdGlvblR5cGUuVXNlckluc3RhbGxdID0gYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2UoXG4gICAgICAgIHBheWxvYWQuYXV0aG9yaXppbmdfaW50ZWdyYXRpb25fb3duZXJzWycxJ10sXG4gICAgICApXG4gIH1cbiAgaWYgKHByb3BzLm9yaWdpbmFsUmVzcG9uc2VNZXNzYWdlSWQgJiYgcGF5bG9hZC5vcmlnaW5hbF9yZXNwb25zZV9tZXNzYWdlX2lkKVxuICAgIG1ldGFkYXRhLm9yaWdpbmFsUmVzcG9uc2VNZXNzYWdlSWQgPSBib3QudHJhbnNmb3JtZXJzLnNub3dmbGFrZShwYXlsb2FkLm9yaWdpbmFsX3Jlc3BvbnNlX21lc3NhZ2VfaWQpXG4gIGlmIChwcm9wcy50eXBlKSBtZXRhZGF0YS50eXBlID0gcGF5bG9hZC50eXBlXG4gIGlmIChwcm9wcy51c2VyICYmIHBheWxvYWQudXNlcikgbWV0YWRhdGEudXNlciA9IGJvdC50cmFuc2Zvcm1lcnMudXNlcihib3QsIHBheWxvYWQudXNlcilcbiAgLy8gQXBwbGljYXRpb24gY29tbWFuZCBtZXRhZGF0YVxuICBpZiAoJ3RhcmdldF91c2VyJyBpbiBwYXlsb2FkKSB7XG4gICAgaWYgKHByb3BzLnRhcmdldFVzZXIgJiYgcGF5bG9hZC50YXJnZXRfdXNlcikgbWV0YWRhdGEudGFyZ2V0VXNlciA9IGJvdC50cmFuc2Zvcm1lcnMudXNlcihib3QsIHBheWxvYWQudGFyZ2V0X3VzZXIpXG4gICAgaWYgKHByb3BzLnRhcmdldE1lc3NhZ2VJZCAmJiBwYXlsb2FkLnRhcmdldF9tZXNzYWdlX2lkKSBtZXRhZGF0YS50YXJnZXRNZXNzYWdlSWQgPSBib3QudHJhbnNmb3JtZXJzLnNub3dmbGFrZShwYXlsb2FkLnRhcmdldF9tZXNzYWdlX2lkKVxuICB9XG4gIC8vIE1lc3NhZ2UgY29tcG9uZW50IG1ldGFkYXRhXG4gIGlmICgnaW50ZXJhY3RlZF9tZXNzYWdlX2lkJyBpbiBwYXlsb2FkKSB7XG4gICAgaWYgKHByb3BzLmludGVyYWN0ZWRNZXNzYWdlSWQgJiYgcGF5bG9hZC5pbnRlcmFjdGVkX21lc3NhZ2VfaWQpXG4gICAgICBtZXRhZGF0YS5pbnRlcmFjdGVkTWVzc2FnZUlkID0gYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2UocGF5bG9hZC5pbnRlcmFjdGVkX21lc3NhZ2VfaWQpXG4gIH1cbiAgLy8gTW9kYWwgc3VibWl0IG1ldGFkYXRhXG4gIGlmICgndHJpZ2dlcmluZ19pbnRlcmFjdGlvbl9tZXRhZGF0YScgaW4gcGF5bG9hZCkge1xuICAgIGlmIChwcm9wcy50cmlnZ2VyaW5nSW50ZXJhY3Rpb25NZXRhZGF0YSAmJiBwYXlsb2FkLnRyaWdnZXJpbmdfaW50ZXJhY3Rpb25fbWV0YWRhdGEpXG4gICAgICBtZXRhZGF0YS50cmlnZ2VyaW5nSW50ZXJhY3Rpb25NZXRhZGF0YSA9IGJvdC50cmFuc2Zvcm1lcnMubWVzc2FnZUludGVyYWN0aW9uTWV0YWRhdGEoYm90LCBwYXlsb2FkLnRyaWdnZXJpbmdfaW50ZXJhY3Rpb25fbWV0YWRhdGEpXG4gIH1cblxuICByZXR1cm4gYm90LnRyYW5zZm9ybWVycy5jdXN0b21pemVycy5tZXNzYWdlSW50ZXJhY3Rpb25NZXRhZGF0YShib3QsIHBheWxvYWQsIG1ldGFkYXRhKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtTWVzc2FnZUNhbGwoYm90OiBCb3QsIHBheWxvYWQ6IERpc2NvcmRNZXNzYWdlQ2FsbCk6IE1lc3NhZ2VDYWxsIHtcbiAgY29uc3QgY2FsbCA9IHt9IGFzIFNldHVwRGVzaXJlZFByb3BzPE1lc3NhZ2VDYWxsLCBUcmFuc2Zvcm1lcnNEZXNpcmVkUHJvcGVydGllcywgRGVzaXJlZFByb3BlcnRpZXNCZWhhdmlvcj5cbiAgY29uc3QgcHJvcHMgPSBib3QudHJhbnNmb3JtZXJzLmRlc2lyZWRQcm9wZXJ0aWVzLm1lc3NhZ2VDYWxsXG5cbiAgaWYgKHByb3BzLnBhcnRpY2lwYW50cyAmJiBwYXlsb2FkLnBhcnRpY2lwYW50cykgY2FsbC5wYXJ0aWNpcGFudHMgPSBwYXlsb2FkLnBhcnRpY2lwYW50cy5tYXAoKHgpID0+IGJvdC50cmFuc2Zvcm1lcnMuc25vd2ZsYWtlKHgpKVxuICBpZiAocHJvcHMuZW5kZWRUaW1lc3RhbXAgJiYgcGF5bG9hZC5lbmRlZF90aW1lc3RhbXApIGNhbGwuZW5kZWRUaW1lc3RhbXAgPSBEYXRlLnBhcnNlKHBheWxvYWQuZW5kZWRfdGltZXN0YW1wKVxuXG4gIHJldHVybiBib3QudHJhbnNmb3JtZXJzLmN1c3RvbWl6ZXJzLm1lc3NhZ2VDYWxsKGJvdCwgcGF5bG9hZCwgY2FsbClcbn1cbiJdLCJuYW1lcyI6WyJEaXNjb3JkQXBwbGljYXRpb25JbnRlZ3JhdGlvblR5cGUiLCJNZXNzYWdlRmxhZ3MiLCJzbm93Zmxha2VUb1RpbWVzdGFtcCIsIkNIQU5ORUxfTUVOVElPTl9SRUdFWCIsIlRvZ2dsZUJpdGZpZWxkIiwiRU1QVFlfU1RSSU5HIiwiYmFzZU1lc3NhZ2UiLCJ1bmRlZmluZWQiLCJjcm9zc3Bvc3RlZCIsImZsYWdzIiwiY29udGFpbnMiLCJDcm9zc3Bvc3RlZCIsInZhbHVlIiwiYWRkIiwicmVtb3ZlIiwiZXBoZW1lcmFsIiwiRXBoZW1lcmFsIiwiZmFpbGVkVG9NZW50aW9uU29tZVJvbGVzSW5UaHJlYWQiLCJGYWlsZWRUb01lbnRpb25Tb21lUm9sZXNJblRocmVhZCIsImhhc1RocmVhZCIsIkhhc1RocmVhZCIsImlzQ3Jvc3Nwb3N0IiwiSXNDcm9zc3Bvc3QiLCJsb2FkaW5nIiwiTG9hZGluZyIsIm1lbnRpb25lZFVzZXJJZHMiLCJtZW50aW9ucyIsIm1hcCIsInVzZXIiLCJpZCIsIm1lbnRpb25FdmVyeW9uZSIsImJpdGZpZWxkIiwicGlubmVkIiwic291cmNlTWVzc2FnZURlbGV0ZWQiLCJTb3VyY2VNZXNzYWdlRGVsZXRlZCIsInN1cHByZXNzRW1iZWRzIiwiU3VwcHJlc3NFbWJlZHMiLCJzdXBwcmVzc05vdGlmaWNhdGlvbnMiLCJTdXBwcmVzc05vdGlmaWNhdGlvbnMiLCJ0aW1lc3RhbXAiLCJ0dHMiLCJ1cmdlbnQiLCJVcmdlbnQiLCJ0cmFuc2Zvcm1NZXNzYWdlIiwiYm90IiwicGF5bG9hZCIsImV4dHJhIiwiZ3VpbGRJZCIsImd1aWxkX2lkIiwidHJhbnNmb3JtZXJzIiwic25vd2ZsYWtlIiwidXNlcklkIiwiYXV0aG9yIiwibWVzc2FnZSIsIk9iamVjdCIsImNyZWF0ZSIsInByb3BzIiwiZGVzaXJlZFByb3BlcnRpZXMiLCJhcHBsaWNhdGlvbiIsInNoYXJkSWQiLCJhcHBsaWNhdGlvbklkIiwiYXBwbGljYXRpb25faWQiLCJhdHRhY2htZW50cyIsImxlbmd0aCIsImF0dGFjaG1lbnQiLCJjaGFubmVsSWQiLCJjaGFubmVsX2lkIiwiY29tcG9uZW50cyIsImNvbXAiLCJjb21wb25lbnQiLCJjb250ZW50IiwiZWRpdGVkVGltZXN0YW1wIiwiZWRpdGVkX3RpbWVzdGFtcCIsIkRhdGUiLCJwYXJzZSIsImVtYmVkcyIsImVtYmVkIiwiaW50ZXJhY3Rpb25NZXRhZGF0YSIsImludGVyYWN0aW9uX21ldGFkYXRhIiwibWVzc2FnZUludGVyYWN0aW9uTWV0YWRhdGEiLCJpbnRlcmFjdGlvbiIsIm1lc3NhZ2VJbnRlcmFjdGlvblByb3BzIiwibWVzc2FnZUludGVyYWN0aW9uIiwibWVtYmVyIiwibmFtZSIsInR5cGUiLCJtZW50aW9uX2V2ZXJ5b25lIiwibWVudGlvbmVkQ2hhbm5lbElkcyIsIm1lbnRpb25fY2hhbm5lbHMiLCJtIiwibWF0Y2giLCJ0ZXh0Iiwic3Vic3RyaW5nIiwibWVudGlvbmVkUm9sZUlkcyIsIm1lbnRpb25fcm9sZXMiLCJtZXNzYWdlUmVmZXJlbmNlIiwibWVzc2FnZV9yZWZlcmVuY2UiLCJyZWZlcmVuY2UiLCJtZXNzYWdlUmVmZXJlbmNlUHJvcHMiLCJtZXNzYWdlSWQiLCJtZXNzYWdlX2lkIiwicmVmZXJlbmNlZE1lc3NhZ2UiLCJyZWZlcmVuY2VkX21lc3NhZ2UiLCJtZXNzYWdlU25hcHNob3RzIiwibWVzc2FnZV9zbmFwc2hvdHMiLCJzbmFwIiwibWVzc2FnZVNuYXBzaG90Iiwibm9uY2UiLCJyZWFjdGlvbnMiLCJyZWFjdGlvbiIsIm1lIiwibWVCdXJzdCIsIm1lX2J1cnN0IiwiY291bnQiLCJjb3VudERldGFpbHMiLCJidXJzdCIsImNvdW50X2RldGFpbHMiLCJub3JtYWwiLCJlbW9qaSIsImJ1cnN0Q29sb3JzIiwiYnVyc3RfY29sb3JzIiwic3RpY2tlckl0ZW1zIiwic3RpY2tlcl9pdGVtcyIsIml0ZW0iLCJmb3JtYXRUeXBlIiwiZm9ybWF0X3R5cGUiLCJ0aHJlYWQiLCJjaGFubmVsIiwid2ViaG9va0lkIiwid2ViaG9va19pZCIsInBvbGwiLCJjYWxsIiwibWVzc2FnZUNhbGwiLCJjdXN0b21pemVycyIsInRyYW5zZm9ybU1lc3NhZ2VQaW4iLCJtZXNzYWdlUGluIiwicGlubmVkQXQiLCJwaW5uZWRfYXQiLCJ0cmFuc2Zvcm1NZXNzYWdlU25hcHNob3QiLCJ0cmFuc2Zvcm1NZXNzYWdlSW50ZXJhY3Rpb25NZXRhZGF0YSIsIm1ldGFkYXRhIiwiYXV0aG9yaXppbmdJbnRlZ3JhdGlvbk93bmVycyIsImF1dGhvcml6aW5nX2ludGVncmF0aW9uX293bmVycyIsIkd1aWxkSW5zdGFsbCIsIlVzZXJJbnN0YWxsIiwib3JpZ2luYWxSZXNwb25zZU1lc3NhZ2VJZCIsIm9yaWdpbmFsX3Jlc3BvbnNlX21lc3NhZ2VfaWQiLCJ0YXJnZXRVc2VyIiwidGFyZ2V0X3VzZXIiLCJ0YXJnZXRNZXNzYWdlSWQiLCJ0YXJnZXRfbWVzc2FnZV9pZCIsImludGVyYWN0ZWRNZXNzYWdlSWQiLCJpbnRlcmFjdGVkX21lc3NhZ2VfaWQiLCJ0cmlnZ2VyaW5nSW50ZXJhY3Rpb25NZXRhZGF0YSIsInRyaWdnZXJpbmdfaW50ZXJhY3Rpb25fbWV0YWRhdGEiLCJ0cmFuc2Zvcm1NZXNzYWdlQ2FsbCIsInBhcnRpY2lwYW50cyIsIngiLCJlbmRlZFRpbWVzdGFtcCIsImVuZGVkX3RpbWVzdGFtcCJdLCJtYXBwaW5ncyI6IkFBQUEsU0FDRUEsaUNBQWlDLEVBTWpDQyxZQUFZLFFBQ1Asb0JBQW1CO0FBQzFCLFNBQVNDLG9CQUFvQixRQUFRLG9CQUFtQjtBQUV4RCxTQUFTQyxxQkFBcUIsUUFBUSxrQkFBaUI7QUFFdkQsU0FBU0MsY0FBYyxRQUFRLDhCQUE2QjtBQUc1RCxNQUFNQyxlQUFlO0FBRXJCLE9BQU8sTUFBTUMsY0FBdUI7SUFDbEMsMkVBQTJFO0lBQzNFLEdBQUlDLFNBQVM7SUFFYixJQUFJQyxlQUFjO1FBQ2hCLE9BQU8sSUFBSSxDQUFDQyxLQUFLLEVBQUVDLFNBQVNULGFBQWFVLFdBQVcsS0FBSztJQUMzRDtJQUNBLElBQUlILGFBQVlJLE1BQWdCO1FBQzlCLElBQUksQ0FBQyxJQUFJLENBQUNILEtBQUssRUFBRTtRQUNqQixJQUFJRyxPQUFPLElBQUksQ0FBQ0gsS0FBSyxDQUFDSSxHQUFHLENBQUNaLGFBQWFVLFdBQVc7YUFDN0MsSUFBSSxDQUFDRixLQUFLLENBQUNLLE1BQU0sQ0FBQ2IsYUFBYVUsV0FBVztJQUNqRDtJQUNBLElBQUlJLGFBQVk7UUFDZCxPQUFPLElBQUksQ0FBQ04sS0FBSyxFQUFFQyxTQUFTVCxhQUFhZSxTQUFTLEtBQUs7SUFDekQ7SUFDQSxJQUFJRCxXQUFVSCxNQUFnQjtRQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDSCxLQUFLLEVBQUU7UUFDakIsSUFBSUcsT0FBTyxJQUFJLENBQUNILEtBQUssQ0FBQ0ksR0FBRyxDQUFDWixhQUFhZSxTQUFTO2FBQzNDLElBQUksQ0FBQ1AsS0FBSyxD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