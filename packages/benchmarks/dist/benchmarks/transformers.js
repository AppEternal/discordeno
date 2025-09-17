import {
  ApplicationFlags,
  ButtonStyles,
  createBot,
  InteractionTypes,
  iconHashToBigInt,
  MemberToggles,
  MessageActivityTypes,
  MessageComponentTypes,
  MessageTypes,
  PremiumTypes,
  StickerFormatTypes,
  TeamMembershipStates,
  TextStyles,
  UserFlags,
} from '@discordeno/bot'
import { memoryBenchmark } from '../utils/memoryBenchmark.js'
export const CHANNEL_MENTION_REGEX = /<#[0-9]+>/g
const MESSAGE_SIZE = 20000
const bot = createBot({
  token: process.env.DISCORD_TOKEN ?? ' ',
  applicationId: 1n,
  events: {},
  desiredProperties: {
    message: {
      activity: true,
      application: true,
      applicationId: true,
      attachments: true,
      author: true,
      channelId: true,
      components: true,
      content: true,
      editedTimestamp: true,
      embeds: true,
      guildId: true,
      id: true,
      member: true,
      mentionedChannelIds: true,
      mentionedRoleIds: true,
      mentions: true,
      nonce: true,
      reactions: true,
      stickerItems: true,
      thread: true,
      type: true,
      webhookId: true,
    },
    messageInteraction: {
      id: true,
      member: true,
      name: true,
      user: true,
      type: true,
    },
    messageReference: {
      channelId: true,
      guildId: true,
      messageId: true,
    },
  },
})
const URL = 'https://discordeno.js.org/'
const IMAGE_HASH = '5fff867ae5f666fcd0626bd84f5e69c0'
const GUILD_ID = '785384884197392384'
const USER = {
  accent_color: 0,
  avatar: IMAGE_HASH,
  banner: IMAGE_HASH,
  bot: true,
  discriminator: '1234',
  email: 'discordeno@discordeno.com',
  flags: UserFlags.BotHttpInteractions,
  id: GUILD_ID,
  locale: 'en',
  mfa_enabled: true,
  premium_type: PremiumTypes.Nitro,
  public_flags: UserFlags.BotHttpInteractions,
  system: true,
  username: 'skillz',
  verified: true,
}
const MEMBER = {
  nick: 'John',
  roles: ['111111111111111111', '222222222222222222', '333333333333333333'],
  joined_at: '2022-01-01T00:00:00.000Z',
  premium_since: '2022-02-01T00:00:00.000Z',
  deaf: false,
  mute: true,
  pending: false,
  permissions: '2147483647',
}
console.log('before the bench')
await memoryBenchmark(
  '[transformer] message cache check',
  () => ({
    cache: [],
  }),
  (object, event) => object.cache.push(bot.transformers.message(bot, event)), // function specify how to add event to the object/ run the object
  [...new Array(MESSAGE_SIZE)].map(() => ({
    activity: {
      party_id: 'party_id',
      type: MessageActivityTypes.Join,
    },
    application: {
      bot_public: true,
      bot_require_code_grant: true,
      cover_image: IMAGE_HASH,
      custom_install_url: 'https://google.com',
      description: 'discordeno is the best lib ever',
      flags: ApplicationFlags.GatewayGuildMembers,
      guild_id: GUILD_ID,
      icon: IMAGE_HASH,
      id: GUILD_ID,
      install_params: {
        permissions: '8',
        scopes: ['identify'],
      },
      name: 'skillz',
      owner: USER,
      primary_sku_id: GUILD_ID,
      privacy_policy_url: 'https://discordeno.js.org',
      role_connections_verification_url: 'https://discordeno.js.org',
      rpc_origins: [],
      slug: 'discordeno',
      tags: ['discordeno', 'discordeno', 'discordeno', 'discordeno', 'discordeno'],
      team: {
        icon: IMAGE_HASH,
        id: GUILD_ID,
        members: [
          {
            membership_state: TeamMembershipStates.Accepted,
            permissions: ['*'],
            team_id: GUILD_ID,
            user: USER,
          },
          {
            membership_state: TeamMembershipStates.Accepted,
            permissions: ['*'],
            team_id: GUILD_ID,
            user: USER,
          },
        ],
        name: 'discordeno',
        owner_user_id: GUILD_ID,
      },
      terms_of_service_url: 'https://discordeno.js.org',
      verify_key: IMAGE_HASH,
    },
    application_id: GUILD_ID,
    attachments: [
      {
        content_type: 'application/json',
        description: 'discordeno discordeno discordeno',
        ephemeral: true,
        filename: 'discordeno',
        height: 100,
        id: GUILD_ID,
        proxy_url: 'https://discordeno.js.org',
        size: 100,
        url: 'https://discordeno.js.org',
        width: 100,
      },
      {
        content_type: 'application/json',
        description: 'discordeno discordeno discordeno',
        ephemeral: true,
        filename: 'discordeno',
        height: 100,
        id: GUILD_ID,
        proxy_url: 'https://discordeno.js.org',
        size: 100,
        url: 'https://discordeno.js.org',
        width: 100,
      },
    ],
    author: USER,
    channel_id: GUILD_ID,
    components: [
      {
        type: 1,
        components: [
          {
            custom_id: GUILD_ID,
            disabled: true,
            emoji: {
              animated: true,
              id: GUILD_ID,
              name: 'discordeno',
            },
            label: 'discordeno',
            style: ButtonStyles.Danger,
            type: MessageComponentTypes.Button,
            url: 'https://discordeno.js.org',
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: MessageComponentTypes.TextInput,
            custom_id: 'discordeno',
            label: 'discordeno',
            max_length: 100,
            min_length: 100,
            placeholder: 'discordeno',
            required: true,
            style: TextStyles.Paragraph,
            value: 'discordeno',
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: MessageComponentTypes.StringSelect,
            custom_id: 'discordeno',
            max_values: 100,
            min_values: 100,
            options: [
              {
                default: true,
                description: 'idk idk idk',
                emoji: {
                  animated: true,
                  id: GUILD_ID,
                  name: 'discordeno',
                },
                label: 'discordeno',
                value: 'discordeno',
              },
            ],
            placeholder: 'discordeno',
          },
        ],
      },
    ],
    content: 'discordeno',
    edited_timestamp: new Date().toISOString(),
    embeds: [
      {
        author: {
          icon_url: URL,
          name: 'discordeno',
          proxy_icon_url: URL,
          url: URL,
        },
        color: 0,
        description: 'discordeno',
        fields: [
          {
            name: 'discordeno',
            value: 'discordeno',
            inline: true,
          },
          {
            name: 'discordeno',
            value: 'discordeno',
            inline: true,
          },
        ],
        footer: {
          icon_url: URL,
          proxy_icon_url: URL,
          text: 'discordeno',
        },
        image: {
          height: 100,
          width: 100,
          proxy_url: URL,
          url: URL,
        },
        provider: {
          name: 'discordeno',
          url: URL,
        },
        thumbnail: {
          height: 100,
          width: 100,
          proxy_url: URL,
          url: URL,
        },
        timestamp: new Date().toISOString(),
        title: 'discordeno',
        type: 'rich',
        url: URL,
        video: {
          height: 100,
          width: 100,
          proxy_url: URL,
          url: URL,
        },
      },
    ],
    flags: 64,
    guild_id: GUILD_ID,
    id: GUILD_ID,
    interaction: {
      id: GUILD_ID,
      name: 'discordeno',
      type: InteractionTypes.ApplicationCommand,
      user: USER,
      member: MEMBER,
    },
    member: MEMBER,
    mention_channels: [
      {
        guild_id: GUILD_ID,
        id: GUILD_ID,
        name: 'discordeno',
        type: 0,
      },
    ],
    mention_roles: ['111111111111111111', '222222222222222222'],
    mention_everyone: false,
    mentions: [USER, USER, USER],
    message_reference: {
      message_id: GUILD_ID,
      channel_id: GUILD_ID,
      guild_id: GUILD_ID,
      fail_if_not_exists: true,
    },
    nonce: 'discordeno',
    pinned: true,
    position: 100,
    reactions: [
      {
        count: 100,
        emoji: {
          animated: true,
          id: GUILD_ID,
          name: 'discordeno',
        },
        me: true,
        me_burst: false,
        count_details: {
          normal: 100,
          burst: 0,
        },
        burst_colors: [],
      },
    ],
    sticker_items: [
      {
        format_type: StickerFormatTypes.APng,
        id: GUILD_ID,
        name: 'discordeno',
      },
    ],
    thread: {
      id: '987654321098765432',
      name: 'My Thread',
      type: 11,
      guild_id: '123456789012345678',
      parent_id: '876543210987654321',
      owner_id: '111111111111111111',
      message_count: 10,
      member_count: 5,
      created_timestamp: 1651388000,
      last_message_id: '876543210987654321',
      applied_tags: ['discordeno'],
      default_thread_rate_limit_per_user: 100,
      member: {
        flags: 100,
        id: GUILD_ID,
        join_timestamp: new Date().toISOString(),
        user_id: GUILD_ID,
      },
    },
    timestamp: new Date().toISOString(),
    tts: true,
    type: MessageTypes.Default,
    webhook_id: GUILD_ID,
  })),
  {
    times: 1,
    log: false,
    table: false,
  },
)
console.log('after the bench')
function oldtransformMessage(bot, payload) {
  const guildId = payload.guild_id ? bot.transformers.snowflake(payload.guild_id) : undefined
  const userId = bot.transformers.snowflake(payload.author.id)
  const message = {
    // UNTRANSFORMED STUFF HERE
    content: payload.content ?? '',
    isFromBot: payload.author.bot ?? false,
    tag: `${payload.author.username}#${payload.author.discriminator}`,
    timestamp: Date.parse(payload.timestamp),
    editedTimestamp: payload.edited_timestamp ? Date.parse(payload.edited_timestamp) : undefined,
    bitfield: (payload.tts ? 1n : 0n) | (payload.mention_everyone ? 2n : 0n) | (payload.pinned ? 4n : 0n),
    attachments: payload.attachments?.map((attachment) => bot.transformers.attachment(bot, attachment)),
    embeds: payload.embeds?.map((embed) => bot.transformers.embed(bot, embed)),
    reactions: payload.reactions?.map((reaction) => ({
      me: reaction.me,
      count: reaction.count,
      // @ts-expect-error: TODO: Deal with partials
      emoji: bot.transformers.emoji(bot, reaction.emoji),
    })),
    type: payload.type,
    activity: payload.activity
      ? {
          type: payload.activity.type,
          partyId: payload.activity.party_id,
        }
      : undefined,
    application: payload.application,
    flags: payload.flags,
    interaction: payload.interaction
      ? {
          id: bot.transformers.snowflake(payload.interaction.id),
          type: payload.interaction.type,
          name: payload.interaction.name,
          user: bot.transformers.user(bot, payload.interaction.user),
          member: payload.interaction.member
            ? {
                id: userId,
                guildId,
                nick: payload.interaction.member.nick ?? undefined,
                roles: payload.interaction.member.roles?.map((id) => bot.transformers.snowflake(id)),
                joinedAt: payload.interaction.member.joined_at ? Date.parse(payload.interaction.member.joined_at) : undefined,
                premiumSince: payload.interaction.member.premium_since ? Date.parse(payload.interaction.member.premium_since) : undefined,
                toggles: new MemberToggles(payload.interaction.member),
                avatar: payload.interaction.member.avatar ? iconHashToBigInt(payload.interaction.member.avatar) : undefined,
                permissions: payload.interaction.member.permissions ? bot.transformers.snowflake(payload.interaction.member.permissions) : undefined,
                communicationDisabledUntil: payload.interaction.member.communication_disabled_until
                  ? Date.parse(payload.interaction.member.communication_disabled_until)
                  : undefined,
              }
            : undefined,
        }
      : undefined,
    thread: payload.thread
      ? bot.transformers.channel(bot, payload.thread, {
          guildId,
        })
      : undefined,
    components: payload.components?.map((component) => bot.transformers.component(bot, component)),
    stickerItems: payload.sticker_items?.map((sticker) => ({
      id: bot.transformers.snowflake(sticker.id),
      name: sticker.name,
      formatType: sticker.format_type,
    })),
    // TRANSFORMED STUFF BELOW
    id: bot.transformers.snowflake(payload.id),
    guildId,
    channelId: bot.transformers.snowflake(payload.channel_id),
    webhookId: payload.webhook_id ? bot.transformers.snowflake(payload.webhook_id) : undefined,
    authorId: userId,
    applicationId: payload.application_id ? bot.transformers.snowflake(payload.application_id) : undefined,
    messageReference: payload.message_reference
      ? {
          messageId: payload.message_reference.message_id ? bot.transformers.snowflake(payload.message_reference.message_id) : undefined,
          channelId: payload.message_reference.channel_id ? bot.transformers.snowflake(payload.message_reference.channel_id) : undefined,
          guildId: payload.message_reference.guild_id ? bot.transformers.snowflake(payload.message_reference.guild_id) : undefined,
        }
      : undefined,
    mentionedUserIds: payload.mentions ? payload.mentions.map((m) => bot.transformers.snowflake(m.id)) : [],
    mentionedRoleIds: payload.mention_roles ? payload.mention_roles.map((id) => bot.transformers.snowflake(id)) : [],
    mentionedChannelIds: [
      // Keep any ids tht discord sends
      ...(payload.mention_channels ?? []).map((m) => bot.transformers.snowflake(m.id)),
      // Add any other ids that can be validated in a channel mention format
      ...(payload.content?.match(CHANNEL_MENTION_REGEX) ?? []).map(
        (
          text, // converts the <#123> into 123
        ) => bot.transformers.snowflake(text.substring(2, text.length - 1)),
      ),
    ],
    // @ts-expect-error: partials
    member: payload.member && guildId ? bot.transformers.member(bot, payload.member, guildId, userId) : undefined,
    nonce: payload.nonce,
  }
  return message
}
await memoryBenchmark(
  '[transformer] old message cache check',
  () => ({
    cache: [],
  }),
  (object, event) => object.cache.push(oldtransformMessage(bot, event)), // function specify how to add event to the object/ run the object
  [...new Array(MESSAGE_SIZE)].map(() => ({
    activity: {
      party_id: 'party_id',
      type: MessageActivityTypes.Join,
    },
    application: {
      bot_public: true,
      bot_require_code_grant: true,
      cover_image: IMAGE_HASH,
      custom_install_url: 'https://google.com',
      description: 'discordeno is the best lib ever',
      flags: ApplicationFlags.GatewayGuildMembers,
      guild_id: GUILD_ID,
      icon: IMAGE_HASH,
      id: GUILD_ID,
      install_params: {
        permissions: '8',
        scopes: ['identify'],
      },
      name: 'skillz',
      owner: USER,
      primary_sku_id: GUILD_ID,
      privacy_policy_url: 'https://discordeno.js.org',
      role_connections_verification_url: 'https://discordeno.js.org',
      rpc_origins: [],
      slug: 'discordeno',
      tags: ['discordeno', 'discordeno', 'discordeno', 'discordeno', 'discordeno'],
      team: {
        icon: IMAGE_HASH,
        id: GUILD_ID,
        members: [
          {
            membership_state: TeamMembershipStates.Accepted,
            permissions: ['*'],
            team_id: GUILD_ID,
            user: USER,
          },
          {
            membership_state: TeamMembershipStates.Accepted,
            permissions: ['*'],
            team_id: GUILD_ID,
            user: USER,
          },
        ],
        name: 'discordeno',
        owner_user_id: GUILD_ID,
      },
      terms_of_service_url: 'https://discordeno.js.org',
      verify_key: IMAGE_HASH,
    },
    application_id: GUILD_ID,
    attachments: [
      {
        content_type: 'application/json',
        description: 'discordeno discordeno discordeno',
        ephemeral: true,
        filename: 'discordeno',
        height: 100,
        id: GUILD_ID,
        proxy_url: 'https://discordeno.js.org',
        size: 100,
        url: 'https://discordeno.js.org',
        width: 100,
      },
      {
        content_type: 'application/json',
        description: 'discordeno discordeno discordeno',
        ephemeral: true,
        filename: 'discordeno',
        height: 100,
        id: GUILD_ID,
        proxy_url: 'https://discordeno.js.org',
        size: 100,
        url: 'https://discordeno.js.org',
        width: 100,
      },
    ],
    author: USER,
    channel_id: GUILD_ID,
    components: [
      {
        type: 1,
        components: [
          {
            custom_id: GUILD_ID,
            disabled: true,
            emoji: {
              animated: true,
              id: GUILD_ID,
              name: 'discordeno',
            },
            label: 'discordeno',
            style: ButtonStyles.Danger,
            type: MessageComponentTypes.Button,
            url: 'https://discordeno.js.org',
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: MessageComponentTypes.TextInput,
            custom_id: 'discordeno',
            label: 'discordeno',
            max_length: 100,
            min_length: 100,
            placeholder: 'discordeno',
            required: true,
            style: TextStyles.Paragraph,
            value: 'discordeno',
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: MessageComponentTypes.StringSelect,
            custom_id: 'discordeno',
            max_values: 100,
            min_values: 100,
            options: [
              {
                default: true,
                description: 'idk idk idk',
                emoji: {
                  animated: true,
                  id: GUILD_ID,
                  name: 'discordeno',
                },
                label: 'discordeno',
                value: 'discordeno',
              },
            ],
            placeholder: 'discordeno',
          },
        ],
      },
    ],
    content: 'discordeno',
    edited_timestamp: new Date().toISOString(),
    embeds: [
      {
        author: {
          icon_url: URL,
          name: 'discordeno',
          proxy_icon_url: URL,
          url: URL,
        },
        color: 0,
        description: 'discordeno',
        fields: [
          {
            name: 'discordeno',
            value: 'discordeno',
            inline: true,
          },
          {
            name: 'discordeno',
            value: 'discordeno',
            inline: true,
          },
        ],
        footer: {
          icon_url: URL,
          proxy_icon_url: URL,
          text: 'discordeno',
        },
        image: {
          height: 100,
          width: 100,
          proxy_url: URL,
          url: URL,
        },
        provider: {
          name: 'discordeno',
          url: URL,
        },
        thumbnail: {
          height: 100,
          width: 100,
          proxy_url: URL,
          url: URL,
        },
        timestamp: new Date().toISOString(),
        title: 'discordeno',
        type: 'rich',
        url: URL,
        video: {
          height: 100,
          width: 100,
          proxy_url: URL,
          url: URL,
        },
      },
    ],
    flags: 64,
    guild_id: GUILD_ID,
    id: GUILD_ID,
    interaction: {
      id: GUILD_ID,
      name: 'discordeno',
      type: InteractionTypes.ApplicationCommand,
      user: USER,
      member: MEMBER,
    },
    member: MEMBER,
    mention_channels: [
      {
        guild_id: GUILD_ID,
        id: GUILD_ID,
        name: 'discordeno',
        type: 0,
      },
    ],
    mention_roles: ['111111111111111111', '222222222222222222'],
    mention_everyone: false,
    mentions: [USER, USER, USER],
    message_reference: {
      message_id: GUILD_ID,
      channel_id: GUILD_ID,
      guild_id: GUILD_ID,
      fail_if_not_exists: true,
    },
    nonce: 'discordeno',
    pinned: true,
    position: 100,
    reactions: [
      {
        count: 100,
        emoji: {
          animated: true,
          id: GUILD_ID,
          name: 'discordeno',
        },
        me: true,
        me_burst: false,
        count_details: {
          normal: 100,
          burst: 0,
        },
        burst_colors: [],
      },
    ],
    sticker_items: [
      {
        format_type: StickerFormatTypes.APng,
        id: GUILD_ID,
        name: 'discordeno',
      },
    ],
    thread: {
      id: '987654321098765432',
      name: 'My Thread',
      type: 11,
      guild_id: '123456789012345678',
      parent_id: '876543210987654321',
      owner_id: '111111111111111111',
      message_count: 10,
      member_count: 5,
      created_timestamp: 1651388000,
      last_message_id: '876543210987654321',
      applied_tags: ['discordeno'],
      default_thread_rate_limit_per_user: 100,
      member: {
        flags: 100,
        id: GUILD_ID,
        join_timestamp: new Date().toISOString(),
        user_id: GUILD_ID,
      },
    },
    timestamp: new Date().toISOString(),
    tts: true,
    type: MessageTypes.Default,
    webhook_id: GUILD_ID,
  })),
  {
    times: 1,
    log: false,
    table: false,
  },
)

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9iZW5jaG1hcmtzL3RyYW5zZm9ybWVycy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBBcHBsaWNhdGlvbkZsYWdzLFxuICB0eXBlIEJvdCxcbiAgQnV0dG9uU3R5bGVzLFxuICBjcmVhdGVCb3QsXG4gIHR5cGUgRGlzY29yZE1lc3NhZ2UsXG4gIEludGVyYWN0aW9uVHlwZXMsXG4gIGljb25IYXNoVG9CaWdJbnQsXG4gIE1lbWJlclRvZ2dsZXMsXG4gIE1lc3NhZ2VBY3Rpdml0eVR5cGVzLFxuICBNZXNzYWdlQ29tcG9uZW50VHlwZXMsXG4gIE1lc3NhZ2VUeXBlcyxcbiAgUHJlbWl1bVR5cGVzLFxuICBTdGlja2VyRm9ybWF0VHlwZXMsXG4gIFRlYW1NZW1iZXJzaGlwU3RhdGVzLFxuICBUZXh0U3R5bGVzLFxuICBVc2VyRmxhZ3MsXG59IGZyb20gJ0BkaXNjb3JkZW5vL2JvdCdcbmltcG9ydCB7IG1lbW9yeUJlbmNobWFyayB9IGZyb20gJy4uL3V0aWxzL21lbW9yeUJlbmNobWFyay5qcydcblxuZXhwb3J0IGNvbnN0IENIQU5ORUxfTUVOVElPTl9SRUdFWCA9IC88I1swLTldKz4vZ1xuXG5jb25zdCBNRVNTQUdFX1NJWkUgPSAyMDAwMFxuXG5jb25zdCBib3QgPSBjcmVhdGVCb3Qoe1xuICB0b2tlbjogcHJvY2Vzcy5lbnYuRElTQ09SRF9UT0tFTiA/PyAnICcsXG4gIGFwcGxpY2F0aW9uSWQ6IDFuLFxuICBldmVudHM6IHt9LFxuICBkZXNpcmVkUHJvcGVydGllczoge1xuICAgIG1lc3NhZ2U6IHtcbiAgICAgIGFjdGl2aXR5OiB0cnVlLFxuICAgICAgYXBwbGljYXRpb246IHRydWUsXG4gICAgICBhcHBsaWNhdGlvbklkOiB0cnVlLFxuICAgICAgYXR0YWNobWVudHM6IHRydWUsXG4gICAgICBhdXRob3I6IHRydWUsXG4gICAgICBjaGFubmVsSWQ6IHRydWUsXG4gICAgICBjb21wb25lbnRzOiB0cnVlLFxuICAgICAgY29udGVudDogdHJ1ZSxcbiAgICAgIGVkaXRlZFRpbWVzdGFtcDogdHJ1ZSxcbiAgICAgIGVtYmVkczogdHJ1ZSxcbiAgICAgIGd1aWxkSWQ6IHRydWUsXG4gICAgICBpZDogdHJ1ZSxcbiAgICAgIG1lbWJlcjogdHJ1ZSxcbiAgICAgIG1lbnRpb25lZENoYW5uZWxJZHM6IHRydWUsXG4gICAgICBtZW50aW9uZWRSb2xlSWRzOiB0cnVlLFxuICAgICAgbWVudGlvbnM6IHRydWUsXG4gICAgICBub25jZTogdHJ1ZSxcbiAgICAgIHJlYWN0aW9uczogdHJ1ZSxcbiAgICAgIHN0aWNrZXJJdGVtczogdHJ1ZSxcbiAgICAgIHRocmVhZDogdHJ1ZSxcbiAgICAgIHR5cGU6IHRydWUsXG4gICAgICB3ZWJob29rSWQ6IHRydWUsXG4gICAgfSxcbiAgICBtZXNzYWdlSW50ZXJhY3Rpb246IHtcbiAgICAgIGlkOiB0cnVlLFxuICAgICAgbWVtYmVyOiB0cnVlLFxuICAgICAgbmFtZTogdHJ1ZSxcbiAgICAgIHVzZXI6IHRydWUsXG4gICAgICB0eXBlOiB0cnVlLFxuICAgIH0sXG4gICAgbWVzc2FnZVJlZmVyZW5jZToge1xuICAgICAgY2hhbm5lbElkOiB0cnVlLFxuICAgICAgZ3VpbGRJZDogdHJ1ZSxcbiAgICAgIG1lc3NhZ2VJZDogdHJ1ZSxcbiAgICB9LFxuICB9LFxufSlcblxuY29uc3QgVVJMID0gJ2h0dHBzOi8vZGlzY29yZGVuby5qcy5vcmcvJ1xuY29uc3QgSU1BR0VfSEFTSCA9ICc1ZmZmODY3YWU1ZjY2NmZjZDA2MjZiZDg0ZjVlNjljMCdcbmNvbnN0IEdVSUxEX0lEID0gJzc4NTM4NDg4NDE5NzM5MjM4NCdcbmNvbnN0IFVTRVIgPSB7XG4gIGFjY2VudF9jb2xvcjogMCxcbiAgYXZhdGFyOiBJTUFHRV9IQVNILFxuICBiYW5uZXI6IElNQUdFX0hBU0gsXG4gIGJvdDogdHJ1ZSxcbiAgZGlzY3JpbWluYXRvcjogJzEyMzQnLFxuICBlbWFpbDogJ2Rpc2NvcmRlbm9AZGlzY29yZGVuby5jb20nLFxuICBmbGFnczogVXNlckZsYWdzLkJvdEh0dHBJbnRlcmFjdGlvbnMsXG4gIGlkOiBHVUlMRF9JRCxcbiAgbG9jYWxlOiAnZW4nLFxuICBtZmFfZW5hYmxlZDogdHJ1ZSxcbiAgcHJlbWl1bV90eXBlOiBQcmVtaXVtVHlwZXMuTml0cm8sXG4gIHB1YmxpY19mbGFnczogVXNlckZsYWdzLkJvdEh0dHBJbnRlcmFjdGlvbnMsXG4gIHN5c3RlbTogdHJ1ZSxcbiAgdXNlcm5hbWU6ICdza2lsbHonLFxuICB2ZXJpZmllZDogdHJ1ZSxcbn1cbmNvbnN0IE1FTUJFUiA9IHtcbiAgbmljazogJ0pvaG4nLFxuICByb2xlczogWycxMTExMTExMTExMTExMTExMTEnLCAnMjIyMjIyMjIyMjIyMjIyMjIyJywgJzMzMzMzMzMzMzMzMzMzMzMzMyddLFxuICBqb2luZWRfYXQ6ICcyMDIyLTAxLTAxVDAwOjAwOjAwLjAwMFonLFxuICBwcmVtaXVtX3NpbmNlOiAnMjAyMi0wMi0wMVQwMDowMDowMC4wMDBaJyxcbiAgZGVhZjogZmFsc2UsXG4gIG11dGU6IHRydWUsXG4gIHBlbmRpbmc6IGZhbHNlLFxuICBwZXJtaXNzaW9uczogJzIxNDc0ODM2NDcnLFxufVxuXG5jb25zb2xlLmxvZygnYmVmb3JlIHRoZSBiZW5jaCcpXG5hd2FpdCBtZW1vcnlCZW5jaG1hcmsoXG4gICdbdHJhbnNmb3JtZXJdIG1lc3NhZ2UgY2FjaGUgY2hlY2snLFxuICAoKSA9PiAoe1xuICAgIGNhY2hlOiBbXSBhcyBhbnlbXSxcbiAgfSksIC8vIGZ1bmN0aW9uIHJldHVybnMgYSBuZXcgaW5zdGFuY2Ugb2Ygb2JqZWN0IHdhbnRlZCB0byB0ZXN0IHdpdGhcbiAgKG9iamVjdCwgZXZlbnQ6IERpc2NvcmRNZXNzYWdlKSA9PiBvYmplY3QuY2FjaGUucHVzaChib3QudHJhbnNmb3JtZXJzLm1lc3NhZ2UoYm90LCBldmVudCkpLFxuICAvLyBmdW5jdGlvbiBzcGVjaWZ5IGhvdyB0byBhZGQgZXZlbnQgdG8gdGhlIG9iamVjdC8gcnVuIHRoZSBvYmplY3RcbiAgWy4uLm5ldyBBcnJheShNRVNTQUdFX1NJWkUpXS5tYXAoXG4gICAgKCkgPT5cbiAgICAgICh7XG4gICAgICAgIGFjdGl2aXR5OiB7XG4gICAgICAgICAgcGFydHlfaWQ6ICdwYXJ0eV9pZCcsXG4gICAgICAgICAgdHlwZTogTWVzc2FnZUFjdGl2aXR5VHlwZXMuSm9pbixcbiAgICAgICAgfSxcbiAgICAgICAgYXBwbGljYXRpb246IHtcbiAgICAgICAgICBib3RfcHVibGljOiB0cnVlLFxuICAgICAgICAgIGJvdF9yZXF1aXJlX2NvZGVfZ3JhbnQ6IHRydWUsXG4gICAgICAgICAgY292ZXJfaW1hZ2U6IElNQUdFX0hBU0gsXG4gICAgICAgICAgY3VzdG9tX2luc3RhbGxfdXJsOiAnaHR0cHM6Ly9nb29nbGUuY29tJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ2Rpc2NvcmRlbm8gaXMgdGhlIGJlc3QgbGliIGV2ZXInLFxuICAgICAgICAgIGZsYWdzOiBBcHBsaWNhdGlvbkZsYWdzLkdhdGV3YXlHdWlsZE1lbWJlcnMsXG4gICAgICAgICAgZ3VpbGRfaWQ6IEdVSUxEX0lELFxuICAgICAgICAgIGljb246IElNQUdFX0hBU0gsXG4gICAgICAgICAgaWQ6IEdVSUxEX0lELFxuICAgICAgICAgIGluc3RhbGxfcGFyYW1zOiB7XG4gICAgICAgICAgICBwZXJtaXNzaW9uczogJzgnLFxuICAgICAgICAgICAgc2NvcGVzOiBbJ2lkZW50aWZ5J10sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBuYW1lOiAnc2tpbGx6JyxcbiAgICAgICAgICBvd25lcjogVVNFUixcbiAgICAgICAgICBwcmltYXJ5X3NrdV9pZDogR1VJTERfSUQsXG4gICAgICAgICAgcHJpdmFjeV9wb2xpY3lfdXJsOiAnaHR0cHM6Ly9kaXNjb3JkZW5vLmpzLm9yZycsXG4gICAgICAgICAgcm9sZV9jb25uZWN0aW9uc192ZXJpZmljYXRpb25fdXJsOiAnaHR0cHM6Ly9kaXNjb3JkZW5vLmpzLm9yZycsXG4gICAgICAgICAgcnBjX29yaWdpbnM6IFtdLFxuICAgICAgICAgIHNsdWc6ICdkaXNjb3JkZW5vJyxcbiAgICAgICAgICB0YWdzOiBbJ2Rpc2NvcmRlbm8nLCAnZGlzY29yZGVubycsICdkaXNjb3JkZW5vJywgJ2Rpc2NvcmRlbm8nLCAnZGlzY29yZGVubyddLFxuICAgICAgICAgIHRlYW06IHtcbiAgICAgICAgICAgIGljb246IElNQUdFX0hBU0gsXG4gICAgICAgICAgICBpZDogR1VJTERfSUQsXG4gICAgICAgICAgICBtZW1iZXJzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZW1iZXJzaGlwX3N0YXRlOiBUZWFtTWVtYmVyc2hpcFN0YXRlcy5BY2NlcHRlZCxcbiAgICAgICAgICAgICAgICBwZXJtaXNzaW9uczogWycqJ10sXG4gICAgICAgICAgICAgICAgdGVhbV9pZDogR1VJTERfSUQsXG4gICAgICAgICAgICAgICAgdXNlcjogVVNFUixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lbWJlcnNoaXBfc3RhdGU6IFRlYW1NZW1iZXJzaGlwU3RhdGVzLkFjY2VwdGVkLFxuICAgICAgICAgICAgICAgIHBlcm1pc3Npb25zOiBbJyonXSxcbiAgICAgICAgICAgICAgICB0ZWFtX2lkOiBHVUlMRF9JRCxcbiAgICAgICAgICAgICAgICB1c2VyOiBVU0VSLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIG5hbWU6ICdkaXNjb3JkZW5vJyxcbiAgICAgICAgICAgIG93bmVyX3VzZXJfaWQ6IEdVSUxEX0lELFxuICAgICAgICAgIH0sXG4gICAgICAgICAgdGVybXNfb2Zfc2VydmljZV91cmw6ICdodHRwczovL2Rpc2NvcmRlbm8uanMub3JnJyxcbiAgICAgICAgICB2ZXJpZnlfa2V5OiBJTUFHRV9IQVNILFxuICAgICAgICB9LFxuICAgICAgICBhcHBsaWNhdGlvbl9pZDogR1VJTERfSUQsXG4gICAgICAgIGF0dGFjaG1lbnRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgY29udGVudF90eXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2Rpc2NvcmRlbm8gZGlzY29yZGVubyBkaXNjb3JkZW5vJyxcbiAgICAgICAgICAgIGVwaGVtZXJhbDogdHJ1ZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICBoZWlnaHQ6IDEwMCxcbiAgICAgICAgICAgIGlkOiBHVUlMRF9JRCxcbiAgICAgICAgICAgIHByb3h5X3VybDogJ2h0dHBzOi8vZGlzY29yZGVuby5qcy5vcmcnLFxuICAgICAgICAgICAgc2l6ZTogMTAwLFxuICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9kaXNjb3JkZW5vLmpzLm9yZycsXG4gICAgICAgICAgICB3aWR0aDogMTAwLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgY29udGVudF90eXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2Rpc2NvcmRlbm8gZGlzY29yZGVubyBkaXNjb3JkZW5vJyxcbiAgICAgICAgICAgIGVwaGVtZXJhbDogdHJ1ZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICBoZWlnaHQ6IDEwMCxcbiAgICAgICAgICAgIGlkOiBHVUlMRF9JRCxcbiAgICAgICAgICAgIHByb3h5X3VybDogJ2h0dHBzOi8vZGlzY29yZGVuby5qcy5vcmcnLFxuICAgICAgICAgICAgc2l6ZTogMTAwLFxuICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9kaXNjb3JkZW5vLmpzLm9yZycsXG4gICAgICAgICAgICB3aWR0aDogMTAwLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGF1dGhvcjogVVNFUixcbiAgICAgICAgY2hhbm5lbF9pZDogR1VJTERfSUQsXG4gICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAxLFxuICAgICAgICAgICAgY29tcG9uZW50czogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3VzdG9tX2lkOiBHVUlMRF9JRCxcbiAgICAgICAgICAgICAgICBkaXNhYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBlbW9qaToge1xuICAgICAgICAgICAgICAgICAgYW5pbWF0ZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICBpZDogR1VJTERfSUQsXG4gICAgICAgICAgICAgICAgICBuYW1lOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBsYWJlbDogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICAgICAgICAgIHN0eWxlOiBCdXR0b25TdHlsZXMuRGFuZ2VyLFxuICAgICAgICAgICAgICAgIHR5cGU6IE1lc3NhZ2VDb21wb25lbnRUeXBlcy5CdXR0b24sXG4gICAgICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9kaXNjb3JkZW5vLmpzLm9yZycsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogMSxcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IE1lc3NhZ2VDb21wb25lbnRUeXBlcy5UZXh0SW5wdXQsXG4gICAgICAgICAgICAgICAgY3VzdG9tX2lkOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgbGFiZWw6ICdkaXNjb3JkZW5vJyxcbiAgICAgICAgICAgICAgICBtYXhfbGVuZ3RoOiAxMDAsXG4gICAgICAgICAgICAgICAgbWluX2xlbmd0aDogMTAwLFxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgc3R5bGU6IFRleHRTdHlsZXMuUGFyYWdyYXBoLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogMSxcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IE1lc3NhZ2VDb21wb25lbnRUeXBlcy5TdHJpbmdTZWxlY3QsXG4gICAgICAgICAgICAgICAgY3VzdG9tX2lkOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgbWF4X3ZhbHVlczogMTAwLFxuICAgICAgICAgICAgICAgIG1pbl92YWx1ZXM6IDEwMCxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaWRrIGlkayBpZGsnLFxuICAgICAgICAgICAgICAgICAgICBlbW9qaToge1xuICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgIGlkOiBHVUlMRF9JRCxcbiAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6ICdkaXNjb3JkZW5vJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgY29udGVudDogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICBlZGl0ZWRfdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIGVtYmVkczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGF1dGhvcjoge1xuICAgICAgICAgICAgICBpY29uX3VybDogVVJMLFxuICAgICAgICAgICAgICBuYW1lOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgIHByb3h5X2ljb25fdXJsOiBVUkwsXG4gICAgICAgICAgICAgIHVybDogVVJMLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbG9yOiAwLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdkaXNjb3JkZW5vJyxcbiAgICAgICAgICAgIGZpZWxkczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgaW5saW5lOiB0cnVlLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgaW5saW5lOiB0cnVlLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGZvb3Rlcjoge1xuICAgICAgICAgICAgICBpY29uX3VybDogVVJMLFxuICAgICAgICAgICAgICBwcm94eV9pY29uX3VybDogVVJMLFxuICAgICAgICAgICAgICB0ZXh0OiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1hZ2U6IHtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAxMDAsXG4gICAgICAgICAgICAgIHdpZHRoOiAxMDAsXG4gICAgICAgICAgICAgIHByb3h5X3VybDogVVJMLFxuICAgICAgICAgICAgICB1cmw6IFVSTCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm92aWRlcjoge1xuICAgICAgICAgICAgICBuYW1lOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgIHVybDogVVJMLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRodW1ibmFpbDoge1xuICAgICAgICAgICAgICBoZWlnaHQ6IDEwMCxcbiAgICAgICAgICAgICAgd2lkdGg6IDEwMCxcbiAgICAgICAgICAgICAgcHJveHlfdXJsOiBVUkwsXG4gICAgICAgICAgICAgIHVybDogVVJMLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgdGl0bGU6ICdkaXNjb3JkZW5vJyxcbiAgICAgICAgICAgIHR5cGU6ICdyaWNoJyxcbiAgICAgICAgICAgIHVybDogVVJMLFxuICAgICAgICAgICAgdmlkZW86IHtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAxMDAsXG4gICAgICAgICAgICAgIHdpZHRoOiAxMDAsXG4gICAgICAgICAgICAgIHByb3h5X3VybDogVVJMLFxuICAgICAgICAgICAgICB1cmw6IFVSTCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6IDY0LFxuICAgICAgICBndWlsZF9pZDogR1VJTERfSUQsXG4gICAgICAgIGlkOiBHVUlMRF9JRCxcbiAgICAgICAgaW50ZXJhY3Rpb246IHtcbiAgICAgICAgICBpZDogR1VJTERfSUQsXG4gICAgICAgICAgbmFtZTogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICAgIHR5cGU6IEludGVyYWN0aW9uVHlwZXMuQXBwbGljYXRpb25Db21tYW5kLFxuICAgICAgICAgIHVzZXI6IFVTRVIsXG4gICAgICAgICAgbWVtYmVyOiBNRU1CRVIsXG4gICAgICAgIH0sXG4gICAgICAgIG1lbWJlcjogTUVNQkVSLFxuICAgICAgICBtZW50aW9uX2NoYW5uZWxzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZ3VpbGRfaWQ6IEdVSUxEX0lELFxuICAgICAgICAgICAgaWQ6IEdVSUxEX0lELFxuICAgICAgICAgICAgbmFtZTogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICAgICAgdHlwZTogMCxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBtZW50aW9uX3JvbGVzOiBbJzExMTExMTExMTExMTExMTExMScsICcyMjIyMjIyMjIyMjIyMjIyMjInXSxcbiAgICAgICAgbWVudGlvbl9ldmVyeW9uZTogZmFsc2UsXG4gICAgICAgIG1lbnRpb25zOiBbVVNFUiwgVVNFUiwgVVNFUl0sXG4gICAgICAgIG1lc3NhZ2VfcmVmZXJlbmNlOiB7XG4gICAgICAgICAgbWVzc2FnZV9pZDogR1VJTERfSUQsXG4gICAgICAgICAgY2hhbm5lbF9pZDogR1VJTERfSUQsXG4gICAgICAgICAgZ3VpbGRfaWQ6IEdVSUxEX0lELFxuICAgICAgICAgIGZhaWxfaWZfbm90X2V4aXN0czogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgbm9uY2U6ICdkaXNjb3JkZW5vJyxcbiAgICAgICAgcGlubmVkOiB0cnVlLFxuICAgICAgICBwb3NpdGlvbjogMTAwLFxuICAgICAgICByZWFjdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb3VudDogMTAwLFxuICAgICAgICAgICAgZW1vamk6IHtcbiAgICAgICAgICAgICAgYW5pbWF0ZWQ6IHRydWUsXG4gICAgICAgICAgICAgIGlkOiBHVUlMRF9JRCxcbiAgICAgICAgICAgICAgbmFtZTogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1lOiB0cnVlLFxuICAgICAgICAgICAgbWVfYnVyc3Q6IGZhbHNlLFxuICAgICAgICAgICAgY291bnRfZGV0YWlsczoge1xuICAgICAgICAgICAgICBub3JtYWw6IDEwMCxcbiAgICAgICAgICAgICAgYnVyc3Q6IDAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYnVyc3RfY29sb3JzOiBbXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBzdGlja2VyX2l0ZW1zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZm9ybWF0X3R5cGU6IFN0aWNrZXJGb3JtYXRUeXBlcy5BUG5nLFxuICAgICAgICAgICAgaWQ6IEdVSUxEX0lELFxuICAgICAgICAgICAgbmFtZTogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHRocmVhZDoge1xuICAgICAgICAgIGlkOiAnOTg3NjU0MzIxMDk4NzY1NDMyJyxcbiAgICAgICAgICBuYW1lOiAnTXkgVGhyZWFkJyxcbiAgICAgICAgICB0eXBlOiAxMSxcbiAgICAgICAgICBndWlsZF9pZDogJzEyMzQ1Njc4OTAxMjM0NTY3OCcsXG4gICAgICAgICAgcGFyZW50X2lkOiAnODc2NTQzMjEwOTg3NjU0MzIxJyxcbiAgICAgICAgICBvd25lcl9pZDogJzExMTExMTExMTExMTExMTExMScsXG4gICAgICAgICAgbWVzc2FnZV9jb3VudDogMTAsXG4gICAgICAgICAgbWVtYmVyX2NvdW50OiA1LFxuICAgICAgICAgIGNyZWF0ZWRfdGltZXN0YW1wOiAxNjUxMzg4MDAwLFxuICAgICAgICAgIGxhc3RfbWVzc2FnZV9pZDogJzg3NjU0MzIxMDk4NzY1NDMyMScsXG4gICAgICAgICAgYXBwbGllZF90YWdzOiBbJ2Rpc2NvcmRlbm8nXSxcbiAgICAgICAgICBkZWZhdWx0X3RocmVhZF9yYXRlX2xpbWl0X3Blcl91c2VyOiAxMDAsXG4gICAgICAgICAgbWVtYmVyOiB7XG4gICAgICAgICAgICBmbGFnczogMTAwLFxuICAgICAgICAgICAgaWQ6IEdVSUxEX0lELFxuICAgICAgICAgICAgam9pbl90aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIHVzZXJfaWQ6IEdVSUxEX0lELFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICB0dHM6IHRydWUsXG4gICAgICAgIHR5cGU6IE1lc3NhZ2VUeXBlcy5EZWZhdWx0LFxuICAgICAgICB3ZWJob29rX2lkOiBHVUlMRF9JRCxcbiAgICAgIH0pIGFzIHVua25vd24gYXMgRGlzY29yZE1lc3NhZ2UsXG4gICksIC8vIGFycmF5IG9mIGV2ZW50IHRvIHRlc3Qgd2l0aFxuICB7IHRpbWVzOiAxLCBsb2c6IGZhbHNlLCB0YWJsZTogZmFsc2UgfSxcbilcbmNvbnNvbGUubG9nKCdhZnRlciB0aGUgYmVuY2gnKVxuXG5mdW5jdGlvbiBvbGR0cmFuc2Zvcm1NZXNzYWdlKGJvdDogQm90LCBwYXlsb2FkOiBEaXNjb3JkTWVzc2FnZSk6IGFueSB7XG4gIGNvbnN0IGd1aWxkSWQgPSBwYXlsb2FkLmd1aWxkX2lkID8gYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2UocGF5bG9hZC5ndWlsZF9pZCkgOiB1bmRlZmluZWRcbiAgY29uc3QgdXNlcklkID0gYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2UocGF5bG9hZC5hdXRob3IuaWQpXG5cbiAgY29uc3QgbWVzc2FnZSA9IHtcbiAgICAvLyBVTlRSQU5TRk9STUVEIFNUVUZGIEhFUkVcbiAgICBjb250ZW50OiBwYXlsb2FkLmNvbnRlbnQgPz8gJycsXG4gICAgaXNGcm9tQm90OiBwYXlsb2FkLmF1dGhvci5ib3QgPz8gZmFsc2UsXG4gICAgdGFnOiBgJHtwYXlsb2FkLmF1dGhvci51c2VybmFtZX0jJHtwYXlsb2FkLmF1dGhvci5kaXNjcmltaW5hdG9yfWAsXG4gICAgdGltZXN0YW1wOiBEYXRlLnBhcnNlKHBheWxvYWQudGltZXN0YW1wKSxcbiAgICBlZGl0ZWRUaW1lc3RhbXA6IHBheWxvYWQuZWRpdGVkX3RpbWVzdGFtcCA/IERhdGUucGFyc2UocGF5bG9hZC5lZGl0ZWRfdGltZXN0YW1wKSA6IHVuZGVmaW5lZCxcbiAgICBiaXRmaWVsZDogKHBheWxvYWQudHRzID8gMW4gOiAwbikgfCAocGF5bG9hZC5tZW50aW9uX2V2ZXJ5b25lID8gMm4gOiAwbikgfCAocGF5bG9hZC5waW5uZWQgPyA0biA6IDBuKSxcbiAgICBhdHRhY2htZW50czogcGF5bG9hZC5hdHRhY2htZW50cz8ubWFwKChhdHRhY2htZW50KSA9PiBib3QudHJhbnNmb3JtZXJzLmF0dGFjaG1lbnQoYm90LCBhdHRhY2htZW50KSksXG4gICAgZW1iZWRzOiBwYXlsb2FkLmVtYmVkcz8ubWFwKChlbWJlZCkgPT4gYm90LnRyYW5zZm9ybWVycy5lbWJlZChib3QsIGVtYmVkKSksXG4gICAgcmVhY3Rpb25zOiBwYXlsb2FkLnJlYWN0aW9ucz8ubWFwKChyZWFjdGlvbikgPT4gKHtcbiAgICAgIG1lOiByZWFjdGlvbi5tZSxcbiAgICAgIGNvdW50OiByZWFjdGlvbi5jb3VudCxcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3I6IFRPRE86IERlYWwgd2l0aCBwYXJ0aWFsc1xuICAgICAgZW1vamk6IGJvdC50cmFuc2Zvcm1lcnMuZW1vamkoYm90LCByZWFjdGlvbi5lbW9qaSksXG4gICAgfSkpLFxuICAgIHR5cGU6IHBheWxvYWQudHlwZSxcbiAgICBhY3Rpdml0eTogcGF5bG9hZC5hY3Rpdml0eVxuICAgICAgPyB7XG4gICAgICAgICAgdHlwZTogcGF5bG9hZC5hY3Rpdml0eS50eXBlLFxuICAgICAgICAgIHBhcnR5SWQ6IHBheWxvYWQuYWN0aXZpdHkucGFydHlfaWQsXG4gICAgICAgIH1cbiAgICAgIDogdW5kZWZpbmVkLFxuICAgIGFwcGxpY2F0aW9uOiBwYXlsb2FkLmFwcGxpY2F0aW9uLFxuICAgIGZsYWdzOiBwYXlsb2FkLmZsYWdzLFxuICAgIGludGVyYWN0aW9uOiBwYXlsb2FkLmludGVyYWN0aW9uXG4gICAgICA/IHtcbiAgICAgICAgICBpZDogYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2UocGF5bG9hZC5pbnRlcmFjdGlvbi5pZCksXG4gICAgICAgICAgdHlwZTogcGF5bG9hZC5pbnRlcmFjdGlvbi50eXBlLFxuICAgICAgICAgIG5hbWU6IHBheWxvYWQuaW50ZXJhY3Rpb24ubmFtZSxcbiAgICAgICAgICB1c2VyOiBib3QudHJhbnNmb3JtZXJzLnVzZXIoYm90LCBwYXlsb2FkLmludGVyYWN0aW9uLnVzZXIpLFxuICAgICAgICAgIG1lbWJlcjogcGF5bG9hZC5pbnRlcmFjdGlvbi5tZW1iZXJcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgIGlkOiB1c2VySWQsXG4gICAgICAgICAgICAgICAgZ3VpbGRJZCxcbiAgICAgICAgICAgICAgICBuaWNrOiBwYXlsb2FkLmludGVyYWN0aW9uLm1lbWJlci5uaWNrID8/IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICByb2xlczogcGF5bG9hZC5pbnRlcmFjdGlvbi5tZW1iZXIucm9sZXM/Lm1hcCgoaWQpID0+IGJvdC50cmFuc2Zvcm1lcnMuc25vd2ZsYWtlKGlkKSksXG4gICAgICAgICAgICAgICAgam9pbmVkQXQ6IHBheWxvYWQuaW50ZXJhY3Rpb24ubWVtYmVyLmpvaW5lZF9hdCA/IERhdGUucGFyc2UocGF5bG9hZC5pbnRlcmFjdGlvbi5tZW1iZXIuam9pbmVkX2F0KSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBwcmVtaXVtU2luY2U6IHBheWxvYWQuaW50ZXJhY3Rpb24ubWVtYmVyLnByZW1pdW1fc2luY2UgPyBEYXRlLnBhcnNlKHBheWxvYWQuaW50ZXJhY3Rpb24ubWVtYmVyLnByZW1pdW1fc2luY2UpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIHRvZ2dsZXM6IG5ldyBNZW1iZXJUb2dnbGVzKHBheWxvYWQuaW50ZXJhY3Rpb24ubWVtYmVyKSxcbiAgICAgICAgICAgICAgICBhdmF0YXI6IHBheWxvYWQuaW50ZXJhY3Rpb24ubWVtYmVyLmF2YXRhciA/IGljb25IYXNoVG9CaWdJbnQocGF5bG9hZC5pbnRlcmFjdGlvbi5tZW1iZXIuYXZhdGFyKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBwZXJtaXNzaW9uczogcGF5bG9hZC5pbnRlcmFjdGlvbi5tZW1iZXIucGVybWlzc2lvbnMgPyBib3QudHJhbnNmb3JtZXJzLnNub3dmbGFrZShwYXlsb2FkLmludGVyYWN0aW9uLm1lbWJlci5wZXJtaXNzaW9ucykgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgY29tbXVuaWNhdGlvbkRpc2FibGVkVW50aWw6IHBheWxvYWQuaW50ZXJhY3Rpb24ubWVtYmVyLmNvbW11bmljYXRpb25fZGlzYWJsZWRfdW50aWxcbiAgICAgICAgICAgICAgICAgID8gRGF0ZS5wYXJzZShwYXlsb2FkLmludGVyYWN0aW9uLm1lbWJlci5jb21tdW5pY2F0aW9uX2Rpc2FibGVkX3VudGlsKVxuICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICB9XG4gICAgICA6IHVuZGVmaW5lZCxcbiAgICB0aHJlYWQ6IHBheWxvYWQudGhyZWFkID8gYm90LnRyYW5zZm9ybWVycy5jaGFubmVsKGJvdCwgcGF5bG9hZC50aHJlYWQsIHsgZ3VpbGRJZCB9KSA6IHVuZGVmaW5lZCxcbiAgICBjb21wb25lbnRzOiBwYXlsb2FkLmNvbXBvbmVudHM/Lm1hcCgoY29tcG9uZW50KSA9PiBib3QudHJhbnNmb3JtZXJzLmNvbXBvbmVudChib3QsIGNvbXBvbmVudCkpLFxuICAgIHN0aWNrZXJJdGVtczogcGF5bG9hZC5zdGlja2VyX2l0ZW1zPy5tYXAoKHN0aWNrZXIpID0+ICh7XG4gICAgICBpZDogYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2Uoc3RpY2tlci5pZCksXG4gICAgICBuYW1lOiBzdGlja2VyLm5hbWUsXG4gICAgICBmb3JtYXRUeXBlOiBzdGlja2VyLmZvcm1hdF90eXBlLFxuICAgIH0pKSxcblxuICAgIC8vIFRSQU5TRk9STUVEIFNUVUZGIEJFTE9XXG4gICAgaWQ6IGJvdC50cmFuc2Zvcm1lcnMuc25vd2ZsYWtlKHBheWxvYWQuaWQpLFxuICAgIGd1aWxkSWQsXG4gICAgY2hhbm5lbElkOiBib3QudHJhbnNmb3JtZXJzLnNub3dmbGFrZShwYXlsb2FkLmNoYW5uZWxfaWQpLFxuICAgIHdlYmhvb2tJZDogcGF5bG9hZC53ZWJob29rX2lkID8gYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2UocGF5bG9hZC53ZWJob29rX2lkKSA6IHVuZGVmaW5lZCxcbiAgICBhdXRob3JJZDogdXNlcklkLFxuICAgIGFwcGxpY2F0aW9uSWQ6IHBheWxvYWQuYXBwbGljYXRpb25faWQgPyBib3QudHJhbnNmb3JtZXJzLnNub3dmbGFrZShwYXlsb2FkLmFwcGxpY2F0aW9uX2lkKSA6IHVuZGVmaW5lZCxcbiAgICBtZXNzYWdlUmVmZXJlbmNlOiBwYXlsb2FkLm1lc3NhZ2VfcmVmZXJlbmNlXG4gICAgICA/IHtcbiAgICAgICAgICBtZXNzYWdlSWQ6IHBheWxvYWQubWVzc2FnZV9yZWZlcmVuY2UubWVzc2FnZV9pZCA/IGJvdC50cmFuc2Zvcm1lcnMuc25vd2ZsYWtlKHBheWxvYWQubWVzc2FnZV9yZWZlcmVuY2UubWVzc2FnZV9pZCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgY2hhbm5lbElkOiBwYXlsb2FkLm1lc3NhZ2VfcmVmZXJlbmNlLmNoYW5uZWxfaWQgPyBib3QudHJhbnNmb3JtZXJzLnNub3dmbGFrZShwYXlsb2FkLm1lc3NhZ2VfcmVmZXJlbmNlLmNoYW5uZWxfaWQpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGd1aWxkSWQ6IHBheWxvYWQubWVzc2FnZV9yZWZlcmVuY2UuZ3VpbGRfaWQgPyBib3QudHJhbnNmb3JtZXJzLnNub3dmbGFrZShwYXlsb2FkLm1lc3NhZ2VfcmVmZXJlbmNlLmd1aWxkX2lkKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgfVxuICAgICAgOiB1bmRlZmluZWQsXG4gICAgbWVudGlvbmVkVXNlcklkczogcGF5bG9hZC5tZW50aW9ucyA/IHBheWxvYWQubWVudGlvbnMubWFwKChtKSA9PiBib3QudHJhbnNmb3JtZXJzLnNub3dmbGFrZShtLmlkKSkgOiBbXSxcbiAgICBtZW50aW9uZWRSb2xlSWRzOiBwYXlsb2FkLm1lbnRpb25fcm9sZXMgPyBwYXlsb2FkLm1lbnRpb25fcm9sZXMubWFwKChpZCkgPT4gYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2UoaWQpKSA6IFtdLFxuICAgIG1lbnRpb25lZENoYW5uZWxJZHM6IFtcbiAgICAgIC8vIEtlZXAgYW55IGlkcyB0aHQgZGlzY29yZCBzZW5kc1xuICAgICAgLi4uKHBheWxvYWQubWVudGlvbl9jaGFubmVscyA/PyBbXSkubWFwKChtKSA9PiBib3QudHJhbnNmb3JtZXJzLnNub3dmbGFrZShtLmlkKSksXG4gICAgICAvLyBBZGQgYW55IG90aGVyIGlkcyB0aGF0IGNhbiBiZSB2YWxpZGF0ZWQgaW4gYSBjaGFubmVsIG1lbnRpb24gZm9ybWF0XG4gICAgICAuLi4ocGF5bG9hZC5jb250ZW50Py5tYXRjaChDSEFOTkVMX01FTlRJT05fUkVHRVgpID8/IFtdKS5tYXAoKHRleHQpID0+XG4gICAgICAgIC8vIGNvbnZlcnRzIHRoZSA8IzEyMz4gaW50byAxMjNcbiAgICAgICAgYm90LnRyYW5zZm9ybWVycy5zbm93Zmxha2UodGV4dC5zdWJzdHJpbmcoMiwgdGV4dC5sZW5ndGggLSAxKSksXG4gICAgICApLFxuICAgIF0sXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvcjogcGFydGlhbHNcbiAgICBtZW1iZXI6IHBheWxvYWQubWVtYmVyICYmIGd1aWxkSWQgPyBib3QudHJhbnNmb3JtZXJzLm1lbWJlcihib3QsIHBheWxvYWQubWVtYmVyLCBndWlsZElkLCB1c2VySWQpIDogdW5kZWZpbmVkLFxuICAgIG5vbmNlOiBwYXlsb2FkLm5vbmNlLFxuICB9XG5cbiAgcmV0dXJuIG1lc3NhZ2Vcbn1cblxuYXdhaXQgbWVtb3J5QmVuY2htYXJrKFxuICAnW3RyYW5zZm9ybWVyXSBvbGQgbWVzc2FnZSBjYWNoZSBjaGVjaycsXG4gICgpID0+ICh7XG4gICAgY2FjaGU6IFtdIGFzIGFueVtdLFxuICB9KSwgLy8gZnVuY3Rpb24gcmV1dHJuIGEgbmV3IGluc3RhbmNlIG9mIG9iamVjdCB3YW50ZWQgdG8gdGVzdCB3aXRoXG4gIChvYmplY3QsIGV2ZW50OiBEaXNjb3JkTWVzc2FnZSkgPT4gb2JqZWN0LmNhY2hlLnB1c2gob2xkdHJhbnNmb3JtTWVzc2FnZShib3QgYXMgQm90LCBldmVudCkpLFxuICAvLyBmdW5jdGlvbiBzcGVjaWZ5IGhvdyB0byBhZGQgZXZlbnQgdG8gdGhlIG9iamVjdC8gcnVuIHRoZSBvYmplY3RcbiAgWy4uLm5ldyBBcnJheShNRVNTQUdFX1NJWkUpXS5tYXAoXG4gICAgKCkgPT5cbiAgICAgICh7XG4gICAgICAgIGFjdGl2aXR5OiB7XG4gICAgICAgICAgcGFydHlfaWQ6ICdwYXJ0eV9pZCcsXG4gICAgICAgICAgdHlwZTogTWVzc2FnZUFjdGl2aXR5VHlwZXMuSm9pbixcbiAgICAgICAgfSxcbiAgICAgICAgYXBwbGljYXRpb246IHtcbiAgICAgICAgICBib3RfcHVibGljOiB0cnVlLFxuICAgICAgICAgIGJvdF9yZXF1aXJlX2NvZGVfZ3JhbnQ6IHRydWUsXG4gICAgICAgICAgY292ZXJfaW1hZ2U6IElNQUdFX0hBU0gsXG4gICAgICAgICAgY3VzdG9tX2luc3RhbGxfdXJsOiAnaHR0cHM6Ly9nb29nbGUuY29tJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ2Rpc2NvcmRlbm8gaXMgdGhlIGJlc3QgbGliIGV2ZXInLFxuICAgICAgICAgIGZsYWdzOiBBcHBsaWNhdGlvbkZsYWdzLkdhdGV3YXlHdWlsZE1lbWJlcnMsXG4gICAgICAgICAgZ3VpbGRfaWQ6IEdVSUxEX0lELFxuICAgICAgICAgIGljb246IElNQUdFX0hBU0gsXG4gICAgICAgICAgaWQ6IEdVSUxEX0lELFxuICAgICAgICAgIGluc3RhbGxfcGFyYW1zOiB7XG4gICAgICAgICAgICBwZXJtaXNzaW9uczogJzgnLFxuICAgICAgICAgICAgc2NvcGVzOiBbJ2lkZW50aWZ5J10sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBuYW1lOiAnc2tpbGx6JyxcbiAgICAgICAgICBvd25lcjogVVNFUixcbiAgICAgICAgICBwcmltYXJ5X3NrdV9pZDogR1VJTERfSUQsXG4gICAgICAgICAgcHJpdmFjeV9wb2xpY3lfdXJsOiAnaHR0cHM6Ly9kaXNjb3JkZW5vLmpzLm9yZycsXG4gICAgICAgICAgcm9sZV9jb25uZWN0aW9uc192ZXJpZmljYXRpb25fdXJsOiAnaHR0cHM6Ly9kaXNjb3JkZW5vLmpzLm9yZycsXG4gICAgICAgICAgcnBjX29yaWdpbnM6IFtdLFxuICAgICAgICAgIHNsdWc6ICdkaXNjb3JkZW5vJyxcbiAgICAgICAgICB0YWdzOiBbJ2Rpc2NvcmRlbm8nLCAnZGlzY29yZGVubycsICdkaXNjb3JkZW5vJywgJ2Rpc2NvcmRlbm8nLCAnZGlzY29yZGVubyddLFxuICAgICAgICAgIHRlYW06IHtcbiAgICAgICAgICAgIGljb246IElNQUdFX0hBU0gsXG4gICAgICAgICAgICBpZDogR1VJTERfSUQsXG4gICAgICAgICAgICBtZW1iZXJzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtZW1iZXJzaGlwX3N0YXRlOiBUZWFtTWVtYmVyc2hpcFN0YXRlcy5BY2NlcHRlZCxcbiAgICAgICAgICAgICAgICBwZXJtaXNzaW9uczogWycqJ10sXG4gICAgICAgICAgICAgICAgdGVhbV9pZDogR1VJTERfSUQsXG4gICAgICAgICAgICAgICAgdXNlcjogVVNFUixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1lbWJlcnNoaXBfc3RhdGU6IFRlYW1NZW1iZXJzaGlwU3RhdGVzLkFjY2VwdGVkLFxuICAgICAgICAgICAgICAgIHBlcm1pc3Npb25zOiBbJyonXSxcbiAgICAgICAgICAgICAgICB0ZWFtX2lkOiBHVUlMRF9JRCxcbiAgICAgICAgICAgICAgICB1c2VyOiBVU0VSLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIG5hbWU6ICdkaXNjb3JkZW5vJyxcbiAgICAgICAgICAgIG93bmVyX3VzZXJfaWQ6IEdVSUxEX0lELFxuICAgICAgICAgIH0sXG4gICAgICAgICAgdGVybXNfb2Zfc2VydmljZV91cmw6ICdodHRwczovL2Rpc2NvcmRlbm8uanMub3JnJyxcbiAgICAgICAgICB2ZXJpZnlfa2V5OiBJTUFHRV9IQVNILFxuICAgICAgICB9LFxuICAgICAgICBhcHBsaWNhdGlvbl9pZDogR1VJTERfSUQsXG4gICAgICAgIGF0dGFjaG1lbnRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgY29udGVudF90eXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2Rpc2NvcmRlbm8gZGlzY29yZGVubyBkaXNjb3JkZW5vJyxcbiAgICAgICAgICAgIGVwaGVtZXJhbDogdHJ1ZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICBoZWlnaHQ6IDEwMCxcbiAgICAgICAgICAgIGlkOiBHVUlMRF9JRCxcbiAgICAgICAgICAgIHByb3h5X3VybDogJ2h0dHBzOi8vZGlzY29yZGVuby5qcy5vcmcnLFxuICAgICAgICAgICAgc2l6ZTogMTAwLFxuICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9kaXNjb3JkZW5vLmpzLm9yZycsXG4gICAgICAgICAgICB3aWR0aDogMTAwLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgY29udGVudF90eXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2Rpc2NvcmRlbm8gZGlzY29yZGVubyBkaXNjb3JkZW5vJyxcbiAgICAgICAgICAgIGVwaGVtZXJhbDogdHJ1ZSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICBoZWlnaHQ6IDEwMCxcbiAgICAgICAgICAgIGlkOiBHVUlMRF9JRCxcbiAgICAgICAgICAgIHByb3h5X3VybDogJ2h0dHBzOi8vZGlzY29yZGVuby5qcy5vcmcnLFxuICAgICAgICAgICAgc2l6ZTogMTAwLFxuICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9kaXNjb3JkZW5vLmpzLm9yZycsXG4gICAgICAgICAgICB3aWR0aDogMTAwLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGF1dGhvcjogVVNFUixcbiAgICAgICAgY2hhbm5lbF9pZDogR1VJTERfSUQsXG4gICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAxLFxuICAgICAgICAgICAgY29tcG9uZW50czogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3VzdG9tX2lkOiBHVUlMRF9JRCxcbiAgICAgICAgICAgICAgICBkaXNhYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBlbW9qaToge1xuICAgICAgICAgICAgICAgICAgYW5pbWF0ZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICBpZDogR1VJTERfSUQsXG4gICAgICAgICAgICAgICAgICBuYW1lOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBsYWJlbDogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICAgICAgICAgIHN0eWxlOiBCdXR0b25TdHlsZXMuRGFuZ2VyLFxuICAgICAgICAgICAgICAgIHR5cGU6IE1lc3NhZ2VDb21wb25lbnRUeXBlcy5CdXR0b24sXG4gICAgICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9kaXNjb3JkZW5vLmpzLm9yZycsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogMSxcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IE1lc3NhZ2VDb21wb25lbnRUeXBlcy5UZXh0SW5wdXQsXG4gICAgICAgICAgICAgICAgY3VzdG9tX2lkOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgbGFiZWw6ICdkaXNjb3JkZW5vJyxcbiAgICAgICAgICAgICAgICBtYXhfbGVuZ3RoOiAxMDAsXG4gICAgICAgICAgICAgICAgbWluX2xlbmd0aDogMTAwLFxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgc3R5bGU6IFRleHRTdHlsZXMuUGFyYWdyYXBoLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogMSxcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IE1lc3NhZ2VDb21wb25lbnRUeXBlcy5TdHJpbmdTZWxlY3QsXG4gICAgICAgICAgICAgICAgY3VzdG9tX2lkOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgbWF4X3ZhbHVlczogMTAwLFxuICAgICAgICAgICAgICAgIG1pbl92YWx1ZXM6IDEwMCxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnaWRrIGlkayBpZGsnLFxuICAgICAgICAgICAgICAgICAgICBlbW9qaToge1xuICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgIGlkOiBHVUlMRF9JRCxcbiAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6ICdkaXNjb3JkZW5vJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgY29udGVudDogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICBlZGl0ZWRfdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIGVtYmVkczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGF1dGhvcjoge1xuICAgICAgICAgICAgICBpY29uX3VybDogVVJMLFxuICAgICAgICAgICAgICBuYW1lOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgIHByb3h5X2ljb25fdXJsOiBVUkwsXG4gICAgICAgICAgICAgIHVybDogVVJMLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbG9yOiAwLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdkaXNjb3JkZW5vJyxcbiAgICAgICAgICAgIGZpZWxkczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgaW5saW5lOiB0cnVlLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgICAgaW5saW5lOiB0cnVlLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGZvb3Rlcjoge1xuICAgICAgICAgICAgICBpY29uX3VybDogVVJMLFxuICAgICAgICAgICAgICBwcm94eV9pY29uX3VybDogVVJMLFxuICAgICAgICAgICAgICB0ZXh0OiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1hZ2U6IHtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAxMDAsXG4gICAgICAgICAgICAgIHdpZHRoOiAxMDAsXG4gICAgICAgICAgICAgIHByb3h5X3VybDogVVJMLFxuICAgICAgICAgICAgICB1cmw6IFVSTCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm92aWRlcjoge1xuICAgICAgICAgICAgICBuYW1lOiAnZGlzY29yZGVubycsXG4gICAgICAgICAgICAgIHVybDogVVJMLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRodW1ibmFpbDoge1xuICAgICAgICAgICAgICBoZWlnaHQ6IDEwMCxcbiAgICAgICAgICAgICAgd2lkdGg6IDEwMCxcbiAgICAgICAgICAgICAgcHJveHlfdXJsOiBVUkwsXG4gICAgICAgICAgICAgIHVybDogVVJMLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgdGl0bGU6ICdkaXNjb3JkZW5vJyxcbiAgICAgICAgICAgIHR5cGU6ICdyaWNoJyxcbiAgICAgICAgICAgIHVybDogVVJMLFxuICAgICAgICAgICAgdmlkZW86IHtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAxMDAsXG4gICAgICAgICAgICAgIHdpZHRoOiAxMDAsXG4gICAgICAgICAgICAgIHByb3h5X3VybDogVVJMLFxuICAgICAgICAgICAgICB1cmw6IFVSTCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZmxhZ3M6IDY0LFxuICAgICAgICBndWlsZF9pZDogR1VJTERfSUQsXG4gICAgICAgIGlkOiBHVUlMRF9JRCxcbiAgICAgICAgaW50ZXJhY3Rpb246IHtcbiAgICAgICAgICBpZDogR1VJTERfSUQsXG4gICAgICAgICAgbmFtZTogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICAgIHR5cGU6IEludGVyYWN0aW9uVHlwZXMuQXBwbGljYXRpb25Db21tYW5kLFxuICAgICAgICAgIHVzZXI6IFVTRVIsXG4gICAgICAgICAgbWVtYmVyOiBNRU1CRVIsXG4gICAgICAgIH0sXG4gICAgICAgIG1lbWJlcjogTUVNQkVSLFxuICAgICAgICBtZW50aW9uX2NoYW5uZWxzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZ3VpbGRfaWQ6IEdVSUxEX0lELFxuICAgICAgICAgICAgaWQ6IEdVSUxEX0lELFxuICAgICAgICAgICAgbmFtZTogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICAgICAgdHlwZTogMCxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBtZW50aW9uX3JvbGVzOiBbJzExMTExMTExMTExMTExMTExMScsICcyMjIyMjIyMjIyMjIyMjIyMjInXSxcbiAgICAgICAgbWVudGlvbl9ldmVyeW9uZTogZmFsc2UsXG4gICAgICAgIG1lbnRpb25zOiBbVVNFUiwgVVNFUiwgVVNFUl0sXG4gICAgICAgIG1lc3NhZ2VfcmVmZXJlbmNlOiB7XG4gICAgICAgICAgbWVzc2FnZV9pZDogR1VJTERfSUQsXG4gICAgICAgICAgY2hhbm5lbF9pZDogR1VJTERfSUQsXG4gICAgICAgICAgZ3VpbGRfaWQ6IEdVSUxEX0lELFxuICAgICAgICAgIGZhaWxfaWZfbm90X2V4aXN0czogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgbm9uY2U6ICdkaXNjb3JkZW5vJyxcbiAgICAgICAgcGlubmVkOiB0cnVlLFxuICAgICAgICBwb3NpdGlvbjogMTAwLFxuICAgICAgICByZWFjdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb3VudDogMTAwLFxuICAgICAgICAgICAgZW1vamk6IHtcbiAgICAgICAgICAgICAgYW5pbWF0ZWQ6IHRydWUsXG4gICAgICAgICAgICAgIGlkOiBHVUlMRF9JRCxcbiAgICAgICAgICAgICAgbmFtZTogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1lOiB0cnVlLFxuICAgICAgICAgICAgbWVfYnVyc3Q6IGZhbHNlLFxuICAgICAgICAgICAgY291bnRfZGV0YWlsczoge1xuICAgICAgICAgICAgICBub3JtYWw6IDEwMCxcbiAgICAgICAgICAgICAgYnVyc3Q6IDAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYnVyc3RfY29sb3JzOiBbXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBzdGlja2VyX2l0ZW1zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZm9ybWF0X3R5cGU6IFN0aWNrZXJGb3JtYXRUeXBlcy5BUG5nLFxuICAgICAgICAgICAgaWQ6IEdVSUxEX0lELFxuICAgICAgICAgICAgbmFtZTogJ2Rpc2NvcmRlbm8nLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHRocmVhZDoge1xuICAgICAgICAgIGlkOiAnOTg3NjU0MzIxMDk4NzY1NDMyJyxcbiAgICAgICAgICBuYW1lOiAnTXkgVGhyZWFkJyxcbiAgICAgICAgICB0eXBlOiAxMSxcbiAgICAgICAgICBndWlsZF9pZDogJzEyMzQ1Njc4OTAxMjM0NTY3OCcsXG4gICAgICAgICAgcGFyZW50X2lkOiAnODc2NTQzMjEwOTg3NjU0MzIxJyxcbiAgICAgICAgICBvd25lcl9pZDogJzExMTExMTExMTExMTExMTExMScsXG4gICAgICAgICAgbWVzc2FnZV9jb3VudDogMTAsXG4gICAgICAgICAgbWVtYmVyX2NvdW50OiA1LFxuICAgICAgICAgIGNyZWF0ZWRfdGltZXN0YW1wOiAxNjUxMzg4MDAwLFxuICAgICAgICAgIGxhc3RfbWVzc2FnZV9pZDogJzg3NjU0MzIxMDk4NzY1NDMyMScsXG4gICAgICAgICAgYXBwbGllZF90YWdzOiBbJ2Rpc2NvcmRlbm8nXSxcbiAgICAgICAgICBkZWZhdWx0X3RocmVhZF9yYXRlX2xpbWl0X3Blcl91c2VyOiAxMDAsXG4gICAgICAgICAgbWVtYmVyOiB7XG4gICAgICAgICAgICBmbGFnczogMTAwLFxuICAgICAgICAgICAgaWQ6IEdVSUxEX0lELFxuICAgICAgICAgICAgam9pbl90aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIHVzZXJfaWQ6IEdVSUxEX0lELFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICB0dHM6IHRydWUsXG4gICAgICAgIHR5cGU6IE1lc3NhZ2VUeXBlcy5EZWZhdWx0LFxuICAgICAgICB3ZWJob29rX2lkOiBHVUlMRF9JRCxcbiAgICAgIH0pIGFzIHVua25vd24gYXMgRGlzY29yZE1lc3NhZ2UsXG4gICksIC8vIGFycmF5IG9mIGV2ZW50IHRvIHRlc3Qgd2l0aFxuICB7IHRpbWVzOiAxLCBsb2c6IGZhbHNlLCB0YWJsZTogZmFsc2UgfSxcbilcbiJdLCJuYW1lcyI6WyJBcHBsaWNhdGlvbkZsYWdzIiwiQnV0dG9uU3R5bGVzIiwiY3JlYXRlQm90IiwiSW50ZXJhY3Rpb25UeXBlcyIsImljb25IYXNoVG9CaWdJbnQiLCJNZW1iZXJUb2dnbGVzIiwiTWVzc2FnZUFjdGl2aXR5VHlwZXMiLCJNZXNzYWdlQ29tcG9uZW50VHlwZXMiLCJNZXNzYWdlVHlwZXMiLCJQcmVtaXVtVHlwZXMiLCJTdGlja2VyRm9ybWF0VHlwZXMiLCJUZWFtTWVtYmVyc2hpcFN0YXRlcyIsIlRleHRTdHlsZXMiLCJVc2VyRmxhZ3MiLCJtZW1vcnlCZW5jaG1hcmsiLCJDSEFOTkVMX01FTlRJT05fUkVHRVgiLCJNRVNTQUdFX1NJWkUiLCJib3QiLCJ0b2tlbiIsInByb2Nlc3MiLCJlbnYiLCJESVNDT1JEX1RPS0VOIiwiYXBwbGljYXRpb25JZCIsImV2ZW50cyIsImRlc2lyZWRQcm9wZXJ0aWVzIiwibWVzc2FnZSIsImFjdGl2aXR5IiwiYXBwbGljYXRpb24iLCJhdHRhY2htZW50cyIsImF1dGhvciIsImNoYW5uZWxJZCIsImNvbXBvbmVudHMiLCJjb250ZW50IiwiZWRpdGVkVGltZXN0YW1wIiwiZW1iZWRzIiwiZ3VpbGRJZCIsImlkIiwibWVtYmVyIiwibWVudGlvbmVkQ2hhbm5lbElkcyIsIm1lbnRpb25lZFJvbGVJZHMiLCJtZW50aW9ucyIsIm5vbmNlIiwicmVhY3Rpb25zIiwic3RpY2tlckl0ZW1zIiwidGhyZWFkIiwidHlwZSIsIndlYmhvb2tJZCIsIm1lc3NhZ2VJbnRlcmFjdGlvbiIsIm5hbWUiLCJ1c2VyIiwibWVzc2FnZVJlZmVyZW5jZSIsIm1lc3NhZ2VJZCIsIlVSTCIsIklNQUdFX0hBU0giLCJHVUlMRF9JRCIsIlVTRVIiLCJhY2NlbnRfY29sb3IiLCJhdmF0YXIiLCJiYW5uZXIiLCJkaXNjcmltaW5hdG9yIiwiZW1haWwiLCJmbGFncyIsIkJvdEh0dHBJbnRlcmFjdGlvbnMiLCJsb2NhbGUiLCJtZmFfZW5hYmxlZCIsInByZW1pdW1fdHlwZSIsIk5pdHJvIiwicHVibGljX2ZsYWdzIiwic3lzdGVtIiwidXNlcm5hbWUiLCJ2ZXJpZmllZCIsIk1FTUJFUiIsIm5pY2siLCJyb2xlcyIsImpvaW5lZF9hdCIsInByZW1pdW1fc2luY2UiLCJkZWFmIiwibXV0ZSIsInBlbmRpbmciLCJwZXJtaXNzaW9ucyIsImNvbnNvbGUiLCJsb2ciLCJjYWNoZSIsIm9iamVjdCIsImV2ZW50IiwicHVzaCIsInRyYW5zZm9ybWVycyIsIkFycmF5IiwibWFwIiwicGFydHlfaWQiLCJKb2luIiwiYm90X3B1YmxpYyIsImJvdF9yZXF1aXJlX2NvZGVfZ3JhbnQiLCJjb3Zlcl9pbWFnZSIsImN1c3RvbV9pbnN0YWxsX3VybCIsImRlc2NyaXB0aW9uIiwiR2F0ZXdheUd1aWxkTWVtYmVycyIsImd1aWxkX2lkIiwiaWNvbiIsImluc3RhbGxfcGFyYW1zIiwic2NvcGVzIiwib3duZXIiLCJwcmltYXJ5X3NrdV9pZCIsInByaXZhY3lfcG9saWN5X3VybCIsInJvbGVfY29ubmVjdGlvbnNfdmVyaWZpY2F0aW9uX3VybCIsInJwY19vcmlnaW5zIiwic2x1ZyIsInRhZ3MiLCJ0ZWFtIiwibWVtYmVycyIsIm1lbWJlcnNoaXBfc3RhdGUiLCJBY2NlcHRlZCIsInRlYW1faWQiLCJvd25lcl91c2VyX2lkIiwidGVybXNfb2Zfc2VydmljZV91cmwiLCJ2ZXJpZnlfa2V5IiwiYXBwbGljYXRpb25faWQiLCJjb250ZW50X3R5cGUiLCJlcGhlbWVyYWwiLCJmaWxlbmFtZSIsImhlaWdodCIsInByb3h5X3VybCIsInNpemUiLCJ1cmwiLCJ3aWR0aCIsImNoYW5uZWxfaWQiLCJjdXN0b21faWQiLCJkaXNhYmxlZCIsImVtb2ppIiwiYW5pbWF0ZWQiLCJsYWJlbCIsInN0eWxlIiwiRGFuZ2VyIiwiQnV0dG9uIiwiVGV4dElucHV0IiwibWF4X2xlbmd0aCIsIm1pbl9sZW5ndGgiLCJwbGFjZWhvbGRlciIsInJlcXVpcmVkIiwiUGFyYWdyYXBoIiwidmFsdWUiLCJTdHJpbmdTZWxlY3QiLCJtYXhfdmFsdWVzIiwibWluX3ZhbHVlcyIsIm9wdGlvbnMiLCJkZWZhdWx0IiwiZWRpdGVkX3RpbWVzdGFtcCIsIkRhdGUiLCJ0b0lTT1N0cmluZyIsImljb25fdXJsIiwicHJveHlfaWNvbl91cmwiLCJjb2xvciIsImZpZWxkcyIsImlubGluZSIsImZvb3RlciIsInRleHQiLCJpbWFnZSIsInByb3ZpZGVyIiwidGh1bWJuYWlsIiwidGltZXN0YW1wIiwidGl0bGUiLCJ2aWRlbyIsImludGVyYWN0aW9uIiwiQXBwbGljYXRpb25Db21tYW5kIiwibWVudGlvbl9jaGFubmVscyIsIm1lbnRpb25fcm9sZXMiLCJtZW50aW9uX2V2ZXJ5b25lIiwibWVzc2FnZV9yZWZlcmVuY2UiLCJtZXNzYWdlX2lkIiwiZmFpbF9pZl9ub3RfZXhpc3RzIiwicGlubmVkIiwicG9zaXRpb24iLCJjb3VudCIsIm1lIiwibWVfYnVyc3QiLCJjb3VudF9kZXRhaWxzIiwibm9ybWFsIiwiYnVyc3QiLCJidXJzdF9jb2xvcnMiLCJzdGlja2VyX2l0ZW1zIiwiZm9ybWF0X3R5cGUiLCJBUG5nIiwicGFyZW50X2lkIiwib3duZXJfaWQiLCJtZXNzYWdlX2NvdW50IiwibWVtYmVyX2NvdW50IiwiY3JlYXRlZF90aW1lc3RhbXAiLCJsYXN0X21lc3NhZ2VfaWQiLCJhcHBsaWVkX3RhZ3MiLCJkZWZhdWx0X3RocmVhZF9yYXRlX2xpbWl0X3Blcl91c2VyIiwiam9pbl90aW1lc3RhbXAiLCJ1c2VyX2lkIiwidHRzIiwiRGVmYXVsdCIsIndlYmhvb2tfaWQiLCJ0aW1lcyIsInRhYmxlIiwib2xkdHJhbnNmb3JtTWVzc2FnZSIsInBheWxvYWQiLCJzbm93Zmxha2UiLCJ1bmRlZmluZWQiLCJ1c2VySWQiLCJpc0Zyb21Cb3QiLCJ0YWciLCJwYXJzZSIsImJpdGZpZWxkIiwiYXR0YWNobWVudCIsImVtYmVkIiwicmVhY3Rpb24iLCJwYXJ0eUlkIiwiam9pbmVkQXQiLCJwcmVtaXVtU2luY2UiLCJ0b2dnbGVzIiwiY29tbXVuaWNhdGlvbkRpc2FibGVkVW50aWwiLCJjb21tdW5pY2F0aW9uX2Rpc2FibGVkX3VudGlsIiwiY2hhbm5lbCIsImNvbXBvbmVudCIsInN0aWNrZXIiLCJmb3JtYXRUeXBlIiwiYXV0aG9ySWQiLCJtZW50aW9uZWRVc2VySWRzIiwibSIsIm1hdGNoIiwic3Vic3RyaW5nIiwibGVuZ3RoIl0sIm1hcHBpbmdzIjoiQUFBQSxTQUNFQSxnQkFBZ0IsRUFFaEJDLFlBQVksRUFDWkMsU0FBUyxFQUVUQyxnQkFBZ0IsRUFDaEJDLGdCQUFnQixFQUNoQkMsYUFBYSxFQUNiQyxvQkFBb0IsRUFDcEJDLHFCQUFxQixFQUNyQkMsWUFBWSxFQUNaQyxZQUFZLEVB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
