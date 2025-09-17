import { isGetMessagesAfter, isGetMessagesAround, isGetMessagesBefore, isGetMessagesLimit } from '@discordeno/utils';
export function createRoutes() {
    return {
        webhooks: {
            id: (webhookId)=>{
                return `/webhooks/${webhookId}`;
            },
            message: (webhookId, token, messageId, options)=>{
                let url = `/webhooks/${webhookId}/${token}/messages/${messageId}?`;
                if (options) {
                    if (options.threadId) url += `thread_id=${options.threadId}`;
                    if (options.withComponents) url += `&with_components=${options.withComponents}`;
                }
                return url;
            },
            webhook: (webhookId, token, options)=>{
                let url = `/webhooks/${webhookId}/${token}?`;
                if (options) {
                    if (options?.wait !== undefined) url += `wait=${options.wait.toString()}`;
                    if (options.threadId) url += `&thread_id=${options.threadId}`;
                    if (options.withComponents) url += `&with_components=${options.withComponents}`;
                }
                return url;
            }
        },
        // Channel Endpoints
        channels: {
            bulk: (channelId)=>{
                return `/channels/${channelId}/messages/bulk-delete`;
            },
            dm: ()=>{
                return '/users/@me/channels';
            },
            dmRecipient: (channelId, userId)=>{
                return `/channels/${channelId}/recipients/${userId}`;
            },
            pin: (channelId, messageId)=>{
                return `/channels/${channelId}/pins/${messageId}`;
            },
            pins: (channelId)=>{
                return `/channels/${channelId}/pins`;
            },
            messagePins: (channelId, options)=>{
                let url = `/channels/${channelId}/messages/pins?`;
                if (options) {
                    if (options.before) url += `before=${options.before}`;
                    if (options.limit) url += `&limit=${options.limit}`;
                }
                return url;
            },
            messagePin: (channelId, messageId)=>{
                return `/channels/${channelId}/messages/pins/${messageId}`;
            },
            reactions: {
                bot: (channelId, messageId, emoji)=>{
                    return `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`;
                },
                user: (channelId, messageId, emoji, userId)=>{
                    return `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/${userId}`;
                },
                all: (channelId, messageId)=>{
                    return `/channels/${channelId}/messages/${messageId}/reactions`;
                },
                emoji: (channelId, messageId, emoji, options)=>{
                    let url = `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}?`;
                    if (options) {
                        if (options.type) url += `type=${options.type}`;
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        if (options.after) url += `&after=${options.after}`;
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        if (options.limit) url += `&limit=${options.limit}`;
                    }
                    return url;
                },
                message: (channelId, messageId, emoji, options)=>{
                    let url = `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}?`;
                    if (options) {
                        if (options.after) url += `after=${options.after}`;
                        if (options.limit) url += `&limit=${options.limit}`;
                    }
                    return url;
                }
            },
            webhooks: (channelId)=>{
                return `/channels/${channelId}/webhooks`;
            },
            channel: (channelId)=>{
                return `/channels/${channelId}`;
            },
            follow: (channelId)=>{
                return `/channels/${channelId}/followers`;
            },
            forum: (channelId)=>{
                return `/channels/${channelId}/threads`;
            },
            invites: (channelId)=>{
                return `/channels/${channelId}/invites`;
            },
            message: (channelId, messageId)=>{
                return `/channels/${channelId}/messages/${messageId}`;
            },
            messages: (channelId, options)=>{
                let url = `/channels/${channelId}/messages?`;
                if (options) {
                    if (isGetMessagesAfter(options) && options.after) {
                        url += `after=${options.after}`;
                    }
                    if (isGetMessagesBefore(options) && options.before) {
                        url += `&before=${options.before}`;
                    }
                    if (isGetMessagesAround(options) && options.around) {
                        url += `&around=${options.around}`;
                    }
                    if (isGetMessagesLimit(options) && options.limit) {
                        url += `&limit=${options.limit}`;
                    }
                }
                return url;
            },
            overwrite: (channelId, overwriteId)=>{
                return `/channels/${channelId}/permissions/${overwriteId}`;
            },
            crosspost: (channelId, messageId)=>{
                return `/channels/${channelId}/messages/${messageId}/crosspost`;
            },
            stages: ()=>{
                return '/stage-instances';
            },
            stage: (channelId)=>{
                return `/stage-instances/${channelId}`;
            },
            // Thread Endpoints
            threads: {
                message: (channelId, messageId)=>{
                    return `/channels/${channelId}/messages/${messageId}/threads`;
                },
                all: (channelId)=>{
                    return `/channels/${channelId}/threads`;
                },
                active: (guildId)=>{
                    return `/guilds/${guildId}/threads/active`;
                },
                members: (channelId, options)=>{
                    let url = `/channels/${channelId}/thread-members?`;
                    if (options) {
                        if (options.withMember) url += `with_member=${options.withMember}`;
                        if (options.limit) url += `&limit=${options.limit}`;
                        if (options.after) url += `&after=${options.after}`;
                    }
                    return url;
                },
                me: (channelId)=>{
                    return `/channels/${channelId}/thread-members/@me`;
                },
                getUser (channelId, userId, options) {
                    let url = `/channels/${channelId}/thread-members/${userId}?`;
                    if (options) {
                        if (options.withMember) url += `with_member=${options.withMember}`;
                    }
                    return url;
                },
                user: (channelId, userId)=>{
                    return `/channels/${channelId}/thread-members/${userId}`;
                },
                archived: (channelId)=>{
                    return `/channels/${channelId}/threads/archived`;
                },
                public: (channelId, options)=>{
                    let url = `/channels/${channelId}/threads/archived/public?`;
                    if (options) {
                        if (options.before) {
                            url += `before=${new Date(options.before).toISOString()}`;
                        }
                        if (options.limit) url += `&limit=${options.limit}`;
                    }
                    return url;
                },
                private: (channelId, options)=>{
                    let url = `/channels/${channelId}/threads/archived/private?`;
                    if (options) {
                        if (options.before) {
                            url += `before=${new Date(options.before).toISOString()}`;
                        }
                        if (options.limit) url += `&limit=${options.limit}`;
                    }
                    return url;
                },
                joined: (channelId, options)=>{
                    let url = `/channels/${channelId}/users/@me/threads/archived/private?`;
                    if (options) {
                        if (options.before) {
                            url += `before=${new Date(options.before).toISOString()}`;
                        }
                        if (options.limit) url += `&limit=${options.limit}`;
                    }
                    return url;
                }
            },
            typing: (channelId)=>{
                return `/channels/${channelId}/typing`;
            },
            polls: {
                votes: (channelId, messageId, answerId, options)=>{
                    let url = `/channels/${channelId}/polls/${messageId}/answers/${answerId}?`;
                    if (options) {
                        if (options.after) url += `after=${options.after}`;
                        if (options.limit) url += `&limit=${options.limit}`;
                    }
                    return url;
                },
                expire: (channelId, messageId)=>{
                    return `/channels/${channelId}/polls/${messageId}/expire`;
                }
            }
        },
        // Guild Endpoints
        guilds: {
            all: ()=>{
                return '/guilds';
            },
            userGuilds: (options)=>{
                let url = '/users/@me/guilds?';
                if (options) {
                    if (options.after) url += `after=${options.after}`;
                    if (options.before) url += `&before=${options.before}`;
                    if (options.limit) url += `&limit=${options.limit}`;
                    if (options.withCounts) url += `&with_counts=${options.withCounts}`;
                }
                return url;
            },
            auditlogs: (guildId, options)=>{
                let url = `/guilds/${guildId}/audit-logs?`;
                if (options) {
                    if (options.actionType) url += `action_type=${options.actionType}`;
                    if (options.before) url += `&before=${options.before}`;
                    if (options.after) url += `&after=${options.after}`;
                    if (options.limit) url += `&limit=${options.limit}`;
                    if (options.userId) url += `&user_id=${options.userId}`;
                }
                return url;
            },
            automod: {
                rule: (guildId, ruleId)=>{
                    return `/guilds/${guildId}/auto-moderation/rules/${ruleId}`;
                },
                rules: (guildId)=>{
                    return `/guilds/${guildId}/auto-moderation/rules`;
                }
            },
            channels: (guildId)=>{
                return `/guilds/${guildId}/channels`;
            },
            emoji: (guildId, emojiId)=>{
                return `/guilds/${guildId}/emojis/${emojiId}`;
            },
            emojis: (guildId)=>{
                return `/guilds/${guildId}/emojis`;
            },
            events: {
                events: (guildId, withUserCount)=>{
                    let url = `/guilds/${guildId}/scheduled-events?`;
                    if (withUserCount !== undefined) {
                        url += `with_user_count=${withUserCount.toString()}`;
                    }
                    return url;
                },
                event: (guildId, eventId, withUserCount)=>{
                    let url = `/guilds/${guildId}/scheduled-events/${eventId}`;
                    if (withUserCount !== undefined) {
                        url += `with_user_count=${withUserCount.toString()}`;
                    }
                    return url;
                },
                users: (guildId, eventId, options)=>{
                    let url = `/guilds/${guildId}/scheduled-events/${eventId}/users?`;
                    if (options) {
                        if (options.limit !== undefined) url += `limit=${options.limit}`;
                        if (options.withMember !== undefined) {
                            url += `&with_member=${options.withMember.toString()}`;
                        }
                        if (options.after !== undefined) url += `&after=${options.after}`;
                        if (options.before !== undefined) url += `&before=${options.before}`;
                    }
                    return url;
                }
            },
            guild (guildId, withCounts) {
                let url = `/guilds/${guildId}?`;
                if (withCounts !== undefined) {
                    url += `with_counts=${withCounts.toString()}`;
                }
                return url;
            },
            integration (guildId, integrationId) {
                return `/guilds/${guildId}/integrations/${integrationId}`;
            },
            integrations: (guildId)=>{
                return `/guilds/${guildId}/integrations?include_applications=true`;
            },
            invite (inviteCode, options) {
                let url = `/invites/${inviteCode}?`;
                if (options) {
                    if (options.withCounts !== undefined) {
                        url += `with_counts=${options.withCounts.toString()}`;
                    }
                    if (options.scheduledEventId) {
                        url += `&guild_scheduled_event_id=${options.scheduledEventId}`;
                    }
                }
                return url;
            },
            invites: (guildId)=>{
                return `/guilds/${guildId}/invites`;
            },
            leave: (guildId)=>{
                return `/users/@me/guilds/${guildId}`;
            },
            members: {
                ban: (guildId, userId)=>{
                    return `/guilds/${guildId}/bans/${userId}`;
                },
                bans: (guildId, options)=>{
                    let url = `/guilds/${guildId}/bans?`;
                    if (options) {
                        if (options.limit) url += `limit=${options.limit}`;
                        if (options.after) url += `&after=${options.after}`;
                        if (options.before) url += `&before=${options.before}`;
                    }
                    return url;
                },
                bulkBan: (guildId)=>{
                    return `/guilds/${guildId}/bulk-ban`;
                },
                bot: (guildId)=>{
                    return `/guilds/${guildId}/members/@me`;
                },
                member: (guildId, userId)=>{
                    return `/guilds/${guildId}/members/${userId}`;
                },
                currentMember: (guildId)=>{
                    return `/users/@me/guilds/${guildId}/member`;
                },
                members: (guildId, options)=>{
                    let url = `/guilds/${guildId}/members?`;
                    if (options !== undefined) {
                        if (options.limit) url += `limit=${options.limit}`;
                        if (options.after) url += `&after=${options.after}`;
                    }
                    return url;
                },
                search: (guildId, query, options)=>{
                    let url = `/guilds/${guildId}/members/search?query=${encodeURIComponent(query)}`;
                    if (options) {
                        if (options.limit !== undefined) url += `&limit=${options.limit}`;
                    }
                    return url;
                },
                prune: (guildId, options)=>{
                    let url = `/guilds/${guildId}/prune?`;
                    if (options) {
                        if (options.days) url += `days=${options.days}`;
                        if (Array.isArray(options.includeRoles)) {
                            url += `&include_roles=${options.includeRoles.join(',')}`;
                        } else if (options.includeRoles) {
                            url += `&include_roles=${options.includeRoles}`;
                        }
                    }
                    return url;
                }
            },
            preview: (guildId)=>{
                return `/guilds/${guildId}/preview`;
            },
            prune: (guildId, options)=>{
                let url = `/guilds/${guildId}/prune?`;
                if (options) {
                    if (options.days) url += `days=${options.days}`;
                    if (Array.isArray(options.includeRoles)) {
                        url += `&include_roles=${options.includeRoles.join(',')}`;
                    } else if (options.includeRoles) {
                        url += `&include_roles=${options.includeRoles}`;
                    }
                }
                return url;
            },
            roles: {
                one: (guildId, roleId)=>{
                    return `/guilds/${guildId}/roles/${roleId}`;
                },
                all: (guildId)=>{
                    return `/guilds/${guildId}/roles`;
                },
                member: (guildId, memberId, roleId)=>{
                    return `/guilds/${guildId}/members/${memberId}/roles/${roleId}`;
                }
            },
            stickers: (guildId)=>{
                return `/guilds/${guildId}/stickers`;
            },
            sticker: (guildId, stickerId)=>{
                return `/guilds/${guildId}/stickers/${stickerId}`;
            },
            voice: (guildId, userId)=>{
                return `/guilds/${guildId}/voice-states/${userId ?? '@me'}`;
            },
            templates: {
                code: (code)=>{
                    return `/guilds/templates/${code}`;
                },
                guild: (guildId, code)=>{
                    return `/guilds/${guildId}/templates/${code}`;
                },
                all: (guildId)=>{
                    return `/guilds/${guildId}/templates`;
                }
            },
            vanity: (guildId)=>{
                return `/guilds/${guildId}/vanity-url`;
            },
            regions: (guildId)=>{
                return `/guilds/${guildId}/regions`;
            },
            webhooks: (guildId)=>{
                return `/guilds/${guildId}/webhooks`;
            },
            welcome: (guildId)=>{
                return `/guilds/${guildId}/welcome-screen`;
            },
            widget: (guildId)=>{
                return `/guilds/${guildId}/widget`;
            },
            widgetJson: (guildId)=>{
                return `/guilds/${guildId}/widget.json`;
            },
            onboarding: (guildId)=>{
                return `/guilds/${guildId}/onboarding`;
            },
            incidentActions: (guildId)=>{
                return `/guilds/${guildId}/incident-actions`;
            }
        },
        sticker: (stickerId)=>{
            return `/stickers/${stickerId}`;
        },
        regions: ()=>{
            return '/voice/regions';
        },
        // Interaction Endpoints
        interactions: {
            commands: {
                // Application Endpoints
                commands: (applicationId, withLocalizations)=>{
                    let url = `/applications/${applicationId}/commands?`;
                    if (withLocalizations !== undefined) {
                        url += `with_localizations=${withLocalizations.toString()}`;
                    }
                    return url;
                },
                guilds: {
                    all (applicationId, guildId, withLocalizations) {
                        let url = `/applications/${applicationId}/guilds/${guildId}/commands?`;
                        if (withLocalizations !== undefined) {
                            url += `with_localizations=${withLocalizations.toString()}`;
                        }
                        return url;
                    },
                    one (applicationId, guildId, commandId) {
                        return `/applications/${applicationId}/guilds/${guildId}/commands/${commandId}`;
                    }
                },
                permissions: (applicationId, guildId)=>{
                    return `/applications/${applicationId}/guilds/${guildId}/commands/permissions`;
                },
                permission: (applicationId, guildId, commandId)=>{
                    return `/applications/${applicationId}/guilds/${guildId}/commands/${commandId}/permissions`;
                },
                command: (applicationId, commandId, withLocalizations)=>{
                    let url = `/applications/${applicationId}/commands/${commandId}?`;
                    if (withLocalizations !== undefined) {
                        url += `withLocalizations=${withLocalizations.toString()}`;
                    }
                    return url;
                }
            },
            responses: {
                // Interaction Endpoints
                callback: (interactionId, token, options)=>{
                    return `/interactions/${interactionId}/${token}/callback?with_response=${!!options?.withResponse}`;
                },
                original: (interactionId, token)=>{
                    return `/webhooks/${interactionId}/${token}/messages/@original`;
                },
                message: (applicationId, token, messageId)=>{
                    return `/webhooks/${applicationId}/${token}/messages/${messageId}`;
                }
            }
        },
        // OAuth2 endpoints
        oauth2: {
            tokenExchange: ()=>{
                return '/oauth2/token';
            },
            tokenRevoke: ()=>{
                return '/oauth2/token/revoke';
            },
            currentAuthorization: ()=>{
                return '/oauth2/@me';
            },
            application: ()=>{
                return '/oauth2/applications/@me';
            },
            connections: ()=>{
                return '/users/@me/connections';
            },
            roleConnections: (applicationId)=>{
                return `/users/@me/applications/${applicationId}/role-connection`;
            }
        },
        monetization: {
            entitlements: (applicationId, options)=>{
                let url = `/applications/${applicationId}/entitlements?`;
                if (options) {
                    if (options.after) url += `after=${options.after}`;
                    if (options.before) url += `&before=${options.before}`;
                    if (options.excludeEnded) url += `&exclude_ended=${options.excludeEnded}`;
                    if (options.guildId) url += `&guild_id=${options.guildId}`;
                    if (options.limit) url += `&limit=${options.limit}`;
                    if (options.skuIds) url += `&sku_ids=${options.skuIds.join(',')}`;
                    if (options.userId) url += `&user_id=${options.userId}`;
                }
                return url;
            },
            entitlement: (applicationId, entitlementId)=>{
                return `/applications/${applicationId}/entitlements/${entitlementId}`;
            },
            consumeEntitlement: (applicationId, entitlementId)=>{
                return `/applications/${applicationId}/entitlements/${entitlementId}/consume`;
            },
            skus: (applicationId)=>{
                return `/applications/${applicationId}/skus`;
            },
            subscription: (skuId, subscriptionId)=>{
                return `/skus/${skuId}/subscriptions/${subscriptionId}`;
            },
            subscriptions: (skuId, options)=>{
                let url = `/skus/${skuId}/subscriptions?`;
                if (options) {
                    if (options.after) url += `after=${options.after}`;
                    if (options.before) url += `&before=${options.before}`;
                    if (options.userId) url += `&user_id=${options.userId}`;
                    if (options.limit) url += `&limit=${options.limit}`;
                }
                return url;
            }
        },
        soundboard: {
            sendSound: (channelId)=>{
                return `/channels/${channelId}`;
            },
            listDefault: ()=>{
                return `/soundboard-default-sounds`;
            },
            guildSounds: (guildId)=>{
                return `/guilds/${guildId}/soundboard-sounds`;
            },
            guildSound: (guildId, soundId)=>{
                return `/guilds/${guildId}/soundboard-sounds/${soundId}`;
            }
        },
        lobby: {
            create: ()=>{
                return '/lobbies';
            },
            lobby: (lobbyId)=>{
                return `/lobbies/${lobbyId}`;
            },
            member: (lobbyId, userId)=>{
                return `/lobbies/${lobbyId}/members/${userId}`;
            },
            leave: (lobbyId)=>{
                return `/lobbies/${lobbyId}/members/@me`;
            },
            link: (lobbyId)=>{
                return `/lobbies/${lobbyId}/channel-linking`;
            }
        },
        applicationEmoji (applicationId, emojiId) {
            return `/applications/${applicationId}/emojis/${emojiId}`;
        },
        applicationEmojis (applicationId) {
            return `/applications/${applicationId}/emojis`;
        },
        applicationRoleConnectionMetadata (applicationId) {
            return `/applications/${applicationId}/role-connections/metadata`;
        },
        // User endpoints
        user (userId) {
            return `/users/${userId}`;
        },
        application () {
            return '/applications/@me';
        },
        applicationActivityInstance (applicationId, instanceId) {
            return `/applications/${applicationId}/activity-instances/${instanceId}`;
        },
        currentUser () {
            return '/users/@me';
        },
        gatewayBot () {
            return '/gateway/bot';
        },
        stickerPack (stickerPackId) {
            return `/sticker-packs/${stickerPackId}`;
        },
        stickerPacks () {
            return '/sticker-packs';
        }
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9yb3V0ZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBHZXRNZXNzYWdlc09wdGlvbnMsIEdldFNjaGVkdWxlZEV2ZW50VXNlcnMgfSBmcm9tICdAZGlzY29yZGVuby90eXBlcydcbmltcG9ydCB7IGlzR2V0TWVzc2FnZXNBZnRlciwgaXNHZXRNZXNzYWdlc0Fyb3VuZCwgaXNHZXRNZXNzYWdlc0JlZm9yZSwgaXNHZXRNZXNzYWdlc0xpbWl0IH0gZnJvbSAnQGRpc2NvcmRlbm8vdXRpbHMnXG5pbXBvcnQgdHlwZSB7IFJlc3RSb3V0ZXMgfSBmcm9tICcuL3R5cGluZ3Mvcm91dGVzLmpzJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUm91dGVzKCk6IFJlc3RSb3V0ZXMge1xuICByZXR1cm4ge1xuICAgIHdlYmhvb2tzOiB7XG4gICAgICBpZDogKHdlYmhvb2tJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC93ZWJob29rcy8ke3dlYmhvb2tJZH1gXG4gICAgICB9LFxuICAgICAgbWVzc2FnZTogKHdlYmhvb2tJZCwgdG9rZW4sIG1lc3NhZ2VJZCwgb3B0aW9ucykgPT4ge1xuICAgICAgICBsZXQgdXJsID0gYC93ZWJob29rcy8ke3dlYmhvb2tJZH0vJHt0b2tlbn0vbWVzc2FnZXMvJHttZXNzYWdlSWR9P2BcblxuICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgIGlmIChvcHRpb25zLnRocmVhZElkKSB1cmwgKz0gYHRocmVhZF9pZD0ke29wdGlvbnMudGhyZWFkSWR9YFxuICAgICAgICAgIGlmIChvcHRpb25zLndpdGhDb21wb25lbnRzKSB1cmwgKz0gYCZ3aXRoX2NvbXBvbmVudHM9JHtvcHRpb25zLndpdGhDb21wb25lbnRzfWBcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1cmxcbiAgICAgIH0sXG4gICAgICB3ZWJob29rOiAod2ViaG9va0lkLCB0b2tlbiwgb3B0aW9ucykgPT4ge1xuICAgICAgICBsZXQgdXJsID0gYC93ZWJob29rcy8ke3dlYmhvb2tJZH0vJHt0b2tlbn0/YFxuXG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnM/LndhaXQgIT09IHVuZGVmaW5lZCkgdXJsICs9IGB3YWl0PSR7b3B0aW9ucy53YWl0LnRvU3RyaW5nKCl9YFxuICAgICAgICAgIGlmIChvcHRpb25zLnRocmVhZElkKSB1cmwgKz0gYCZ0aHJlYWRfaWQ9JHtvcHRpb25zLnRocmVhZElkfWBcbiAgICAgICAgICBpZiAob3B0aW9ucy53aXRoQ29tcG9uZW50cykgdXJsICs9IGAmd2l0aF9jb21wb25lbnRzPSR7b3B0aW9ucy53aXRoQ29tcG9uZW50c31gXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdXJsXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICAvLyBDaGFubmVsIEVuZHBvaW50c1xuICAgIGNoYW5uZWxzOiB7XG4gICAgICBidWxrOiAoY2hhbm5lbElkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2NoYW5uZWxzLyR7Y2hhbm5lbElkfS9tZXNzYWdlcy9idWxrLWRlbGV0ZWBcbiAgICAgIH0sXG4gICAgICBkbTogKCkgPT4ge1xuICAgICAgICByZXR1cm4gJy91c2Vycy9AbWUvY2hhbm5lbHMnXG4gICAgICB9LFxuICAgICAgZG1SZWNpcGllbnQ6IChjaGFubmVsSWQsIHVzZXJJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC9jaGFubmVscy8ke2NoYW5uZWxJZH0vcmVjaXBpZW50cy8ke3VzZXJJZH1gXG4gICAgICB9LFxuICAgICAgcGluOiAoY2hhbm5lbElkLCBtZXNzYWdlSWQpID0+IHtcbiAgICAgICAgcmV0dXJuIGAvY2hhbm5lbHMvJHtjaGFubmVsSWR9L3BpbnMvJHttZXNzYWdlSWR9YFxuICAgICAgfSxcbiAgICAgIHBpbnM6IChjaGFubmVsSWQpID0+IHtcbiAgICAgICAgcmV0dXJuIGAvY2hhbm5lbHMvJHtjaGFubmVsSWR9L3BpbnNgXG4gICAgICB9LFxuICAgICAgbWVzc2FnZVBpbnM6IChjaGFubmVsSWQsIG9wdGlvbnMpID0+IHtcbiAgICAgICAgbGV0IHVybCA9IGAvY2hhbm5lbHMvJHtjaGFubmVsSWR9L21lc3NhZ2VzL3BpbnM/YFxuXG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMuYmVmb3JlKSB1cmwgKz0gYGJlZm9yZT0ke29wdGlvbnMuYmVmb3JlfWBcbiAgICAgICAgICBpZiAob3B0aW9ucy5saW1pdCkgdXJsICs9IGAmbGltaXQ9JHtvcHRpb25zLmxpbWl0fWBcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1cmxcbiAgICAgIH0sXG4gICAgICBtZXNzYWdlUGluOiAoY2hhbm5lbElkLCBtZXNzYWdlSWQpID0+IHtcbiAgICAgICAgcmV0dXJuIGAvY2hhbm5lbHMvJHtjaGFubmVsSWR9L21lc3NhZ2VzL3BpbnMvJHttZXNzYWdlSWR9YFxuICAgICAgfSxcbiAgICAgIHJlYWN0aW9uczoge1xuICAgICAgICBib3Q6IChjaGFubmVsSWQsIG1lc3NhZ2VJZCwgZW1vamkpID0+IHtcbiAgICAgICAgICByZXR1cm4gYC9jaGFubmVscy8ke2NoYW5uZWxJZH0vbWVzc2FnZXMvJHttZXNzYWdlSWR9L3JlYWN0aW9ucy8ke2VuY29kZVVSSUNvbXBvbmVudChlbW9qaSl9L0BtZWBcbiAgICAgICAgfSxcbiAgICAgICAgdXNlcjogKGNoYW5uZWxJZCwgbWVzc2FnZUlkLCBlbW9qaSwgdXNlcklkKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGAvY2hhbm5lbHMvJHtjaGFubmVsSWR9L21lc3NhZ2VzLyR7bWVzc2FnZUlkfS9yZWFjdGlvbnMvJHtlbmNvZGVVUklDb21wb25lbnQoZW1vamkpfS8ke3VzZXJJZH1gXG4gICAgICAgIH0sXG4gICAgICAgIGFsbDogKGNoYW5uZWxJZCwgbWVzc2FnZUlkKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGAvY2hhbm5lbHMvJHtjaGFubmVsSWR9L21lc3NhZ2VzLyR7bWVzc2FnZUlkfS9yZWFjdGlvbnNgXG4gICAgICAgIH0sXG4gICAgICAgIGVtb2ppOiAoY2hhbm5lbElkLCBtZXNzYWdlSWQsIGVtb2ppLCBvcHRpb25zKSA9PiB7XG4gICAgICAgICAgbGV0IHVybCA9IGAvY2hhbm5lbHMvJHtjaGFubmVsSWR9L21lc3NhZ2VzLyR7bWVzc2FnZUlkfS9yZWFjdGlvbnMvJHtlbmNvZGVVUklDb21wb25lbnQoZW1vamkpfT9gXG5cbiAgICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMudHlwZSkgdXJsICs9IGB0eXBlPSR7b3B0aW9ucy50eXBlfWBcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvcmVzdHJpY3QtdGVtcGxhdGUtZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFmdGVyKSB1cmwgKz0gYCZhZnRlcj0ke29wdGlvbnMuYWZ0ZXJ9YFxuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9yZXN0cmljdC10ZW1wbGF0ZS1leHByZXNzaW9uc1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMubGltaXQpIHVybCArPSBgJmxpbWl0PSR7b3B0aW9ucy5saW1pdH1gXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHVybFxuICAgICAgICB9LFxuICAgICAgICBtZXNzYWdlOiAoY2hhbm5lbElkLCBtZXNzYWdlSWQsIGVtb2ppLCBvcHRpb25zKSA9PiB7XG4gICAgICAgICAgbGV0IHVybCA9IGAvY2hhbm5lbHMvJHtjaGFubmVsSWR9L21lc3NhZ2VzLyR7bWVzc2FnZUlkfS9yZWFjdGlvbnMvJHtlbmNvZGVVUklDb21wb25lbnQoZW1vamkpfT9gXG5cbiAgICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYWZ0ZXIpIHVybCArPSBgYWZ0ZXI9JHtvcHRpb25zLmFmdGVyfWBcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmxpbWl0KSB1cmwgKz0gYCZsaW1pdD0ke29wdGlvbnMubGltaXR9YFxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB1cmxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB3ZWJob29rczogKGNoYW5uZWxJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC9jaGFubmVscy8ke2NoYW5uZWxJZH0vd2ViaG9va3NgXG4gICAgICB9LFxuXG4gICAgICBjaGFubmVsOiAoY2hhbm5lbElkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2NoYW5uZWxzLyR7Y2hhbm5lbElkfWBcbiAgICAgIH0sXG5cbiAgICAgIGZvbGxvdzogKGNoYW5uZWxJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC9jaGFubmVscy8ke2NoYW5uZWxJZH0vZm9sbG93ZXJzYFxuICAgICAgfSxcblxuICAgICAgZm9ydW06IChjaGFubmVsSWQpID0+IHtcbiAgICAgICAgcmV0dXJuIGAvY2hhbm5lbHMvJHtjaGFubmVsSWR9L3RocmVhZHNgXG4gICAgICB9LFxuXG4gICAgICBpbnZpdGVzOiAoY2hhbm5lbElkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2NoYW5uZWxzLyR7Y2hhbm5lbElkfS9pbnZpdGVzYFxuICAgICAgfSxcblxuICAgICAgbWVzc2FnZTogKGNoYW5uZWxJZCwgbWVzc2FnZUlkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2NoYW5uZWxzLyR7Y2hhbm5lbElkfS9tZXNzYWdlcy8ke21lc3NhZ2VJZH1gXG4gICAgICB9LFxuXG4gICAgICBtZXNzYWdlczogKGNoYW5uZWxJZCwgb3B0aW9ucz86IEdldE1lc3NhZ2VzT3B0aW9ucykgPT4ge1xuICAgICAgICBsZXQgdXJsID0gYC9jaGFubmVscy8ke2NoYW5uZWxJZH0vbWVzc2FnZXM/YFxuXG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKGlzR2V0TWVzc2FnZXNBZnRlcihvcHRpb25zKSAmJiBvcHRpb25zLmFmdGVyKSB7XG4gICAgICAgICAgICB1cmwgKz0gYGFmdGVyPSR7b3B0aW9ucy5hZnRlcn1gXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpc0dldE1lc3NhZ2VzQmVmb3JlKG9wdGlvbnMpICYmIG9wdGlvbnMuYmVmb3JlKSB7XG4gICAgICAgICAgICB1cmwgKz0gYCZiZWZvcmU9JHtvcHRpb25zLmJlZm9yZX1gXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpc0dldE1lc3NhZ2VzQXJvdW5kKG9wdGlvbnMpICYmIG9wdGlvbnMuYXJvdW5kKSB7XG4gICAgICAgICAgICB1cmwgKz0gYCZhcm91bmQ9JHtvcHRpb25zLmFyb3VuZH1gXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpc0dldE1lc3NhZ2VzTGltaXQob3B0aW9ucykgJiYgb3B0aW9ucy5saW1pdCkge1xuICAgICAgICAgICAgdXJsICs9IGAmbGltaXQ9JHtvcHRpb25zLmxpbWl0fWBcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdXJsXG4gICAgICB9LFxuXG4gICAgICBvdmVyd3JpdGU6IChjaGFubmVsSWQsIG92ZXJ3cml0ZUlkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2NoYW5uZWxzLyR7Y2hhbm5lbElkfS9wZXJtaXNzaW9ucy8ke292ZXJ3cml0ZUlkfWBcbiAgICAgIH0sXG5cbiAgICAgIGNyb3NzcG9zdDogKGNoYW5uZWxJZCwgbWVzc2FnZUlkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2NoYW5uZWxzLyR7Y2hhbm5lbElkfS9tZXNzYWdlcy8ke21lc3NhZ2VJZH0vY3Jvc3Nwb3N0YFxuICAgICAgfSxcblxuICAgICAgc3RhZ2VzOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiAnL3N0YWdlLWluc3RhbmNlcydcbiAgICAgIH0sXG5cbiAgICAgIHN0YWdlOiAoY2hhbm5lbElkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL3N0YWdlLWluc3RhbmNlcy8ke2NoYW5uZWxJZH1gXG4gICAgICB9LFxuXG4gICAgICAvLyBUaHJlYWQgRW5kcG9pbnRzXG4gICAgICB0aHJlYWRzOiB7XG4gICAgICAgIG1lc3NhZ2U6IChjaGFubmVsSWQsIG1lc3NhZ2VJZCkgPT4ge1xuICAgICAgICAgIHJldHVybiBgL2NoYW5uZWxzLyR7Y2hhbm5lbElkfS9tZXNzYWdlcy8ke21lc3NhZ2VJZH0vdGhyZWFkc2BcbiAgICAgICAgfSxcbiAgICAgICAgYWxsOiAoY2hhbm5lbElkKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGAvY2hhbm5lbHMvJHtjaGFubmVsSWR9L3RocmVhZHNgXG4gICAgICAgIH0sXG4gICAgICAgIGFjdGl2ZTogKGd1aWxkSWQpID0+IHtcbiAgICAgICAgICByZXR1cm4gYC9ndWlsZHMvJHtndWlsZElkfS90aHJlYWRzL2FjdGl2ZWBcbiAgICAgICAgfSxcbiAgICAgICAgbWVtYmVyczogKGNoYW5uZWxJZCwgb3B0aW9ucykgPT4ge1xuICAgICAgICAgIGxldCB1cmwgPSBgL2NoYW5uZWxzLyR7Y2hhbm5lbElkfS90aHJlYWQtbWVtYmVycz9gXG5cbiAgICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMud2l0aE1lbWJlcikgdXJsICs9IGB3aXRoX21lbWJlcj0ke29wdGlvbnMud2l0aE1lbWJlcn1gXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5saW1pdCkgdXJsICs9IGAmbGltaXQ9JHtvcHRpb25zLmxpbWl0fWBcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFmdGVyKSB1cmwgKz0gYCZhZnRlcj0ke29wdGlvbnMuYWZ0ZXJ9YFxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB1cmxcbiAgICAgICAgfSxcbiAgICAgICAgbWU6IChjaGFubmVsSWQpID0+IHtcbiAgICAgICAgICByZXR1cm4gYC9jaGFubmVscy8ke2NoYW5uZWxJZH0vdGhyZWFkLW1lbWJlcnMvQG1lYFxuICAgICAgICB9LFxuICAgICAgICBnZXRVc2VyKGNoYW5uZWxJZCwgdXNlcklkLCBvcHRpb25zKSB7XG4gICAgICAgICAgbGV0IHVybCA9IGAvY2hhbm5lbHMvJHtjaGFubmVsSWR9L3RocmVhZC1tZW1iZXJzLyR7dXNlcklkfT9gXG5cbiAgICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMud2l0aE1lbWJlcikgdXJsICs9IGB3aXRoX21lbWJlcj0ke29wdGlvbnMud2l0aE1lbWJlcn1gXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHVybFxuICAgICAgICB9LFxuICAgICAgICB1c2VyOiAoY2hhbm5lbElkLCB1c2VySWQpID0+IHtcbiAgICAgICAgICByZXR1cm4gYC9jaGFubmVscy8ke2NoYW5uZWxJZH0vdGhyZWFkLW1lbWJlcnMvJHt1c2VySWR9YFxuICAgICAgICB9LFxuICAgICAgICBhcmNoaXZlZDogKGNoYW5uZWxJZCkgPT4ge1xuICAgICAgICAgIHJldHVybiBgL2NoYW5uZWxzLyR7Y2hhbm5lbElkfS90aHJlYWRzL2FyY2hpdmVkYFxuICAgICAgICB9LFxuICAgICAgICBwdWJsaWM6IChjaGFubmVsSWQsIG9wdGlvbnMpID0+IHtcbiAgICAgICAgICBsZXQgdXJsID0gYC9jaGFubmVscy8ke2NoYW5uZWxJZH0vdGhyZWFkcy9hcmNoaXZlZC9wdWJsaWM/YFxuXG4gICAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmJlZm9yZSkge1xuICAgICAgICAgICAgICB1cmwgKz0gYGJlZm9yZT0ke25ldyBEYXRlKG9wdGlvbnMuYmVmb3JlKS50b0lTT1N0cmluZygpfWBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmxpbWl0KSB1cmwgKz0gYCZsaW1pdD0ke29wdGlvbnMubGltaXR9YFxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB1cmxcbiAgICAgICAgfSxcbiAgICAgICAgcHJpdmF0ZTogKGNoYW5uZWxJZCwgb3B0aW9ucykgPT4ge1xuICAgICAgICAgIGxldCB1cmwgPSBgL2NoYW5uZWxzLyR7Y2hhbm5lbElkfS90aHJlYWRzL2FyY2hpdmVkL3ByaXZhdGU/YFxuXG4gICAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmJlZm9yZSkge1xuICAgICAgICAgICAgICB1cmwgKz0gYGJlZm9yZT0ke25ldyBEYXRlKG9wdGlvbnMuYmVmb3JlKS50b0lTT1N0cmluZygpfWBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmxpbWl0KSB1cmwgKz0gYCZsaW1pdD0ke29wdGlvbnMubGltaXR9YFxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB1cmxcbiAgICAgICAgfSxcbiAgICAgICAgam9pbmVkOiAoY2hhbm5lbElkLCBvcHRpb25zKSA9PiB7XG4gICAgICAgICAgbGV0IHVybCA9IGAvY2hhbm5lbHMvJHtjaGFubmVsSWR9L3VzZXJzL0BtZS90aHJlYWRzL2FyY2hpdmVkL3ByaXZhdGU/YFxuXG4gICAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmJlZm9yZSkge1xuICAgICAgICAgICAgICB1cmwgKz0gYGJlZm9yZT0ke25ldyBEYXRlKG9wdGlvbnMuYmVmb3JlKS50b0lTT1N0cmluZygpfWBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmxpbWl0KSB1cmwgKz0gYCZsaW1pdD0ke29wdGlvbnMubGltaXR9YFxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB1cmxcbiAgICAgICAgfSxcbiAgICAgIH0sXG5cbiAgICAgIHR5cGluZzogKGNoYW5uZWxJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC9jaGFubmVscy8ke2NoYW5uZWxJZH0vdHlwaW5nYFxuICAgICAgfSxcblxuICAgICAgcG9sbHM6IHtcbiAgICAgICAgdm90ZXM6IChjaGFubmVsSWQsIG1lc3NhZ2VJZCwgYW5zd2VySWQsIG9wdGlvbnMpID0+IHtcbiAgICAgICAgICBsZXQgdXJsID0gYC9jaGFubmVscy8ke2NoYW5uZWxJZH0vcG9sbHMvJHttZXNzYWdlSWR9L2Fuc3dlcnMvJHthbnN3ZXJJZH0/YFxuXG4gICAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFmdGVyKSB1cmwgKz0gYGFmdGVyPSR7b3B0aW9ucy5hZnRlcn1gXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5saW1pdCkgdXJsICs9IGAmbGltaXQ9JHtvcHRpb25zLmxpbWl0fWBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdXJsXG4gICAgICAgIH0sXG4gICAgICAgIGV4cGlyZTogKGNoYW5uZWxJZCwgbWVzc2FnZUlkKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGAvY2hhbm5lbHMvJHtjaGFubmVsSWR9L3BvbGxzLyR7bWVzc2FnZUlkfS9leHBpcmVgXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICAvLyBHdWlsZCBFbmRwb2ludHNcbiAgICBndWlsZHM6IHtcbiAgICAgIGFsbDogKCkgPT4ge1xuICAgICAgICByZXR1cm4gJy9ndWlsZHMnXG4gICAgICB9LFxuICAgICAgdXNlckd1aWxkczogKG9wdGlvbnMpID0+IHtcbiAgICAgICAgbGV0IHVybCA9ICcvdXNlcnMvQG1lL2d1aWxkcz8nXG5cbiAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICBpZiAob3B0aW9ucy5hZnRlcikgdXJsICs9IGBhZnRlcj0ke29wdGlvbnMuYWZ0ZXJ9YFxuICAgICAgICAgIGlmIChvcHRpb25zLmJlZm9yZSkgdXJsICs9IGAmYmVmb3JlPSR7b3B0aW9ucy5iZWZvcmV9YFxuICAgICAgICAgIGlmIChvcHRpb25zLmxpbWl0KSB1cmwgKz0gYCZsaW1pdD0ke29wdGlvbnMubGltaXR9YFxuICAgICAgICAgIGlmIChvcHRpb25zLndpdGhDb3VudHMpIHVybCArPSBgJndpdGhfY291bnRzPSR7b3B0aW9ucy53aXRoQ291bnRzfWBcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1cmxcbiAgICAgIH0sXG4gICAgICBhdWRpdGxvZ3M6IChndWlsZElkLCBvcHRpb25zKSA9PiB7XG4gICAgICAgIGxldCB1cmwgPSBgL2d1aWxkcy8ke2d1aWxkSWR9L2F1ZGl0LWxvZ3M/YFxuXG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMuYWN0aW9uVHlwZSkgdXJsICs9IGBhY3Rpb25fdHlwZT0ke29wdGlvbnMuYWN0aW9uVHlwZX1gXG4gICAgICAgICAgaWYgKG9wdGlvbnMuYmVmb3JlKSB1cmwgKz0gYCZiZWZvcmU9JHtvcHRpb25zLmJlZm9yZX1gXG4gICAgICAgICAgaWYgKG9wdGlvbnMuYWZ0ZXIpIHVybCArPSBgJmFmdGVyPSR7b3B0aW9ucy5hZnRlcn1gXG4gICAgICAgICAgaWYgKG9wdGlvbnMubGltaXQpIHVybCArPSBgJmxpbWl0PSR7b3B0aW9ucy5saW1pdH1gXG4gICAgICAgICAgaWYgKG9wdGlvbnMudXNlcklkKSB1cmwgKz0gYCZ1c2VyX2lkPSR7b3B0aW9ucy51c2VySWR9YFxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVybFxuICAgICAgfSxcbiAgICAgIGF1dG9tb2Q6IHtcbiAgICAgICAgcnVsZTogKGd1aWxkSWQsIHJ1bGVJZCkgPT4ge1xuICAgICAgICAgIHJldHVybiBgL2d1aWxkcy8ke2d1aWxkSWR9L2F1dG8tbW9kZXJhdGlvbi9ydWxlcy8ke3J1bGVJZH1gXG4gICAgICAgIH0sXG4gICAgICAgIHJ1bGVzOiAoZ3VpbGRJZCkgPT4ge1xuICAgICAgICAgIHJldHVybiBgL2d1aWxkcy8ke2d1aWxkSWR9L2F1dG8tbW9kZXJhdGlvbi9ydWxlc2BcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBjaGFubmVsczogKGd1aWxkSWQpID0+IHtcbiAgICAgICAgcmV0dXJuIGAvZ3VpbGRzLyR7Z3VpbGRJZH0vY2hhbm5lbHNgXG4gICAgICB9LFxuICAgICAgZW1vamk6IChndWlsZElkLCBlbW9qaUlkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2d1aWxkcy8ke2d1aWxkSWR9L2Vtb2ppcy8ke2Vtb2ppSWR9YFxuICAgICAgfSxcbiAgICAgIGVtb2ppczogKGd1aWxkSWQpID0+IHtcbiAgICAgICAgcmV0dXJuIGAvZ3VpbGRzLyR7Z3VpbGRJZH0vZW1vamlzYFxuICAgICAgfSxcbiAgICAgIGV2ZW50czoge1xuICAgICAgICBldmVudHM6IChndWlsZElkLCB3aXRoVXNlckNvdW50PzogYm9vbGVhbikgPT4ge1xuICAgICAgICAgIGxldCB1cmwgPSBgL2d1aWxkcy8ke2d1aWxkSWR9L3NjaGVkdWxlZC1ldmVudHM/YFxuXG4gICAgICAgICAgaWYgKHdpdGhVc2VyQ291bnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdXJsICs9IGB3aXRoX3VzZXJfY291bnQ9JHt3aXRoVXNlckNvdW50LnRvU3RyaW5nKCl9YFxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdXJsXG4gICAgICAgIH0sXG4gICAgICAgIGV2ZW50OiAoZ3VpbGRJZCwgZXZlbnRJZCwgd2l0aFVzZXJDb3VudD86IGJvb2xlYW4pID0+IHtcbiAgICAgICAgICBsZXQgdXJsID0gYC9ndWlsZHMvJHtndWlsZElkfS9zY2hlZHVsZWQtZXZlbnRzLyR7ZXZlbnRJZH1gXG5cbiAgICAgICAgICBpZiAod2l0aFVzZXJDb3VudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB1cmwgKz0gYHdpdGhfdXNlcl9jb3VudD0ke3dpdGhVc2VyQ291bnQudG9TdHJpbmcoKX1gXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHVybFxuICAgICAgICB9LFxuICAgICAgICB1c2VyczogKGd1aWxkSWQsIGV2ZW50SWQsIG9wdGlvbnM/OiBHZXRTY2hlZHVsZWRFdmVudFVzZXJzKSA9PiB7XG4gICAgICAgICAgbGV0IHVybCA9IGAvZ3VpbGRzLyR7Z3VpbGRJZH0vc2NoZWR1bGVkLWV2ZW50cy8ke2V2ZW50SWR9L3VzZXJzP2BcblxuICAgICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5saW1pdCAhPT0gdW5kZWZpbmVkKSB1cmwgKz0gYGxpbWl0PSR7b3B0aW9ucy5saW1pdH1gXG4gICAgICAgICAgICBpZiAob3B0aW9ucy53aXRoTWVtYmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgdXJsICs9IGAmd2l0aF9tZW1iZXI9JHtvcHRpb25zLndpdGhNZW1iZXIudG9TdHJpbmcoKX1gXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5hZnRlciAhPT0gdW5kZWZpbmVkKSB1cmwgKz0gYCZhZnRlcj0ke29wdGlvbnMuYWZ0ZXJ9YFxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYmVmb3JlICE9PSB1bmRlZmluZWQpIHVybCArPSBgJmJlZm9yZT0ke29wdGlvbnMuYmVmb3JlfWBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdXJsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgZ3VpbGQoZ3VpbGRJZCwgd2l0aENvdW50cykge1xuICAgICAgICBsZXQgdXJsID0gYC9ndWlsZHMvJHtndWlsZElkfT9gXG5cbiAgICAgICAgaWYgKHdpdGhDb3VudHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHVybCArPSBgd2l0aF9jb3VudHM9JHt3aXRoQ291bnRzLnRvU3RyaW5nKCl9YFxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVybFxuICAgICAgfSxcbiAgICAgIGludGVncmF0aW9uKGd1aWxkSWQsIGludGVncmF0aW9uSWQpIHtcbiAgICAgICAgcmV0dXJuIGAvZ3VpbGRzLyR7Z3VpbGRJZH0vaW50ZWdyYXRpb25zLyR7aW50ZWdyYXRpb25JZH1gXG4gICAgICB9LFxuICAgICAgaW50ZWdyYXRpb25zOiAoZ3VpbGRJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC9ndWlsZHMvJHtndWlsZElkfS9pbnRlZ3JhdGlvbnM/aW5jbHVkZV9hcHBsaWNhdGlvbnM9dHJ1ZWBcbiAgICAgIH0sXG4gICAgICBpbnZpdGUoaW52aXRlQ29kZSwgb3B0aW9ucykge1xuICAgICAgICBsZXQgdXJsID0gYC9pbnZpdGVzLyR7aW52aXRlQ29kZX0/YFxuXG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMud2l0aENvdW50cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB1cmwgKz0gYHdpdGhfY291bnRzPSR7b3B0aW9ucy53aXRoQ291bnRzLnRvU3RyaW5nKCl9YFxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAob3B0aW9ucy5zY2hlZHVsZWRFdmVudElkKSB7XG4gICAgICAgICAgICB1cmwgKz0gYCZndWlsZF9zY2hlZHVsZWRfZXZlbnRfaWQ9JHtvcHRpb25zLnNjaGVkdWxlZEV2ZW50SWR9YFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1cmxcbiAgICAgIH0sXG4gICAgICBpbnZpdGVzOiAoZ3VpbGRJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC9ndWlsZHMvJHtndWlsZElkfS9pbnZpdGVzYFxuICAgICAgfSxcbiAgICAgIGxlYXZlOiAoZ3VpbGRJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC91c2Vycy9AbWUvZ3VpbGRzLyR7Z3VpbGRJZH1gXG4gICAgICB9LFxuICAgICAgbWVtYmVyczoge1xuICAgICAgICBiYW46IChndWlsZElkLCB1c2VySWQpID0+IHtcbiAgICAgICAgICByZXR1cm4gYC9ndWlsZHMvJHtndWlsZElkfS9iYW5zLyR7dXNlcklkfWBcbiAgICAgICAgfSxcbiAgICAgICAgYmFuczogKGd1aWxkSWQsIG9wdGlvbnMpID0+IHtcbiAgICAgICAgICBsZXQgdXJsID0gYC9ndWlsZHMvJHtndWlsZElkfS9iYW5zP2BcblxuICAgICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5saW1pdCkgdXJsICs9IGBsaW1pdD0ke29wdGlvbnMubGltaXR9YFxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYWZ0ZXIpIHVybCArPSBgJmFmdGVyPSR7b3B0aW9ucy5hZnRlcn1gXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5iZWZvcmUpIHVybCArPSBgJmJlZm9yZT0ke29wdGlvbnMuYmVmb3JlfWBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdXJsXG4gICAgICAgIH0sXG4gICAgICAgIGJ1bGtCYW46IChndWlsZElkKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGAvZ3VpbGRzLyR7Z3VpbGRJZH0vYnVsay1iYW5gXG4gICAgICAgIH0sXG4gICAgICAgIGJvdDogKGd1aWxkSWQpID0+IHtcbiAgICAgICAgICByZXR1cm4gYC9ndWlsZHMvJHtndWlsZElkfS9tZW1iZXJzL0BtZWBcbiAgICAgICAgfSxcbiAgICAgICAgbWVtYmVyOiAoZ3VpbGRJZCwgdXNlcklkKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGAvZ3VpbGRzLyR7Z3VpbGRJZH0vbWVtYmVycy8ke3VzZXJJZH1gXG4gICAgICAgIH0sXG4gICAgICAgIGN1cnJlbnRNZW1iZXI6IChndWlsZElkKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGAvdXNlcnMvQG1lL2d1aWxkcy8ke2d1aWxkSWR9L21lbWJlcmBcbiAgICAgICAgfSxcbiAgICAgICAgbWVtYmVyczogKGd1aWxkSWQsIG9wdGlvbnMpID0+IHtcbiAgICAgICAgICBsZXQgdXJsID0gYC9ndWlsZHMvJHtndWlsZElkfS9tZW1iZXJzP2BcblxuICAgICAgICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmxpbWl0KSB1cmwgKz0gYGxpbWl0PSR7b3B0aW9ucy5saW1pdH1gXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5hZnRlcikgdXJsICs9IGAmYWZ0ZXI9JHtvcHRpb25zLmFmdGVyfWBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdXJsXG4gICAgICAgIH0sXG4gICAgICAgIHNlYXJjaDogKGd1aWxkSWQsIHF1ZXJ5LCBvcHRpb25zKSA9PiB7XG4gICAgICAgICAgbGV0IHVybCA9IGAvZ3VpbGRzLyR7Z3VpbGRJZH0vbWVtYmVycy9zZWFyY2g/cXVlcnk9JHtlbmNvZGVVUklDb21wb25lbnQocXVlcnkpfWBcblxuICAgICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5saW1pdCAhPT0gdW5kZWZpbmVkKSB1cmwgKz0gYCZsaW1pdD0ke29wdGlvbnMubGltaXR9YFxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB1cmxcbiAgICAgICAgfSxcbiAgICAgICAgcHJ1bmU6IChndWlsZElkLCBvcHRpb25zKSA9PiB7XG4gICAgICAgICAgbGV0IHVybCA9IGAvZ3VpbGRzLyR7Z3VpbGRJZH0vcHJ1bmU/YFxuXG4gICAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmRheXMpIHVybCArPSBgZGF5cz0ke29wdGlvbnMuZGF5c31gXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmluY2x1ZGVSb2xlcykpIHtcbiAgICAgICAgICAgICAgdXJsICs9IGAmaW5jbHVkZV9yb2xlcz0ke29wdGlvbnMuaW5jbHVkZVJvbGVzLmpvaW4oJywnKX1gXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuaW5jbHVkZVJvbGVzKSB7XG4gICAgICAgICAgICAgIHVybCArPSBgJmluY2x1ZGVfcm9sZXM9JHtvcHRpb25zLmluY2x1ZGVSb2xlc31gXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHVybFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHByZXZpZXc6IChndWlsZElkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2d1aWxkcy8ke2d1aWxkSWR9L3ByZXZpZXdgXG4gICAgICB9LFxuICAgICAgcHJ1bmU6IChndWlsZElkLCBvcHRpb25zKSA9PiB7XG4gICAgICAgIGxldCB1cmwgPSBgL2d1aWxkcy8ke2d1aWxkSWR9L3BydW5lP2BcblxuICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgIGlmIChvcHRpb25zLmRheXMpIHVybCArPSBgZGF5cz0ke29wdGlvbnMuZGF5c31gXG4gICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5pbmNsdWRlUm9sZXMpKSB7XG4gICAgICAgICAgICB1cmwgKz0gYCZpbmNsdWRlX3JvbGVzPSR7b3B0aW9ucy5pbmNsdWRlUm9sZXMuam9pbignLCcpfWBcbiAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuaW5jbHVkZVJvbGVzKSB7XG4gICAgICAgICAgICB1cmwgKz0gYCZpbmNsdWRlX3JvbGVzPSR7b3B0aW9ucy5pbmNsdWRlUm9sZXN9YFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1cmxcbiAgICAgIH0sXG4gICAgICByb2xlczoge1xuICAgICAgICBvbmU6IChndWlsZElkLCByb2xlSWQpID0+IHtcbiAgICAgICAgICByZXR1cm4gYC9ndWlsZHMvJHtndWlsZElkfS9yb2xlcy8ke3JvbGVJZH1gXG4gICAgICAgIH0sXG4gICAgICAgIGFsbDogKGd1aWxkSWQpID0+IHtcbiAgICAgICAgICByZXR1cm4gYC9ndWlsZHMvJHtndWlsZElkfS9yb2xlc2BcbiAgICAgICAgfSxcbiAgICAgICAgbWVtYmVyOiAoZ3VpbGRJZCwgbWVtYmVySWQsIHJvbGVJZCkgPT4ge1xuICAgICAgICAgIHJldHVybiBgL2d1aWxkcy8ke2d1aWxkSWR9L21lbWJlcnMvJHttZW1iZXJJZH0vcm9sZXMvJHtyb2xlSWR9YFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHN0aWNrZXJzOiAoZ3VpbGRJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC9ndWlsZHMvJHtndWlsZElkfS9zdGlja2Vyc2BcbiAgICAgIH0sXG4gICAgICBzdGlja2VyOiAoZ3VpbGRJZCwgc3RpY2tlcklkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2d1aWxkcy8ke2d1aWxkSWR9L3N0aWNrZXJzLyR7c3RpY2tlcklkfWBcbiAgICAgIH0sXG4gICAgICB2b2ljZTogKGd1aWxkSWQsIHVzZXJJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC9ndWlsZHMvJHtndWlsZElkfS92b2ljZS1zdGF0ZXMvJHt1c2VySWQgPz8gJ0BtZSd9YFxuICAgICAgfSxcbiAgICAgIHRlbXBsYXRlczoge1xuICAgICAgICBjb2RlOiAoY29kZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBgL2d1aWxkcy90ZW1wbGF0ZXMvJHtjb2RlfWBcbiAgICAgICAgfSxcbiAgICAgICAgZ3VpbGQ6IChndWlsZElkLCBjb2RlKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGAvZ3VpbGRzLyR7Z3VpbGRJZH0vdGVtcGxhdGVzLyR7Y29kZX1gXG4gICAgICAgIH0sXG4gICAgICAgIGFsbDogKGd1aWxkSWQpID0+IHtcbiAgICAgICAgICByZXR1cm4gYC9ndWlsZHMvJHtndWlsZElkfS90ZW1wbGF0ZXNgXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdmFuaXR5OiAoZ3VpbGRJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC9ndWlsZHMvJHtndWlsZElkfS92YW5pdHktdXJsYFxuICAgICAgfSxcbiAgICAgIHJlZ2lvbnM6IChndWlsZElkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2d1aWxkcy8ke2d1aWxkSWR9L3JlZ2lvbnNgXG4gICAgICB9LFxuICAgICAgd2ViaG9va3M6IChndWlsZElkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2d1aWxkcy8ke2d1aWxkSWR9L3dlYmhvb2tzYFxuICAgICAgfSxcbiAgICAgIHdlbGNvbWU6IChndWlsZElkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2d1aWxkcy8ke2d1aWxkSWR9L3dlbGNvbWUtc2NyZWVuYFxuICAgICAgfSxcbiAgICAgIHdpZGdldDogKGd1aWxkSWQpID0+IHtcbiAgICAgICAgcmV0dXJuIGAvZ3VpbGRzLyR7Z3VpbGRJZH0vd2lkZ2V0YFxuICAgICAgfSxcbiAgICAgIHdpZGdldEpzb246IChndWlsZElkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2d1aWxkcy8ke2d1aWxkSWR9L3dpZGdldC5qc29uYFxuICAgICAgfSxcbiAgICAgIG9uYm9hcmRpbmc6IChndWlsZElkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2d1aWxkcy8ke2d1aWxkSWR9L29uYm9hcmRpbmdgXG4gICAgICB9LFxuICAgICAgaW5jaWRlbnRBY3Rpb25zOiAoZ3VpbGRJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC9ndWlsZHMvJHtndWlsZElkfS9pbmNpZGVudC1hY3Rpb25zYFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgc3RpY2tlcjogKHN0aWNrZXJJZCkgPT4ge1xuICAgICAgcmV0dXJuIGAvc3RpY2tlcnMvJHtzdGlja2VySWR9YFxuICAgIH0sXG5cbiAgICByZWdpb25zOiAoKSA9PiB7XG4gICAgICByZXR1cm4gJy92b2ljZS9yZWdpb25zJ1xuICAgIH0sXG5cbiAgICAvLyBJbnRlcmFjdGlvbiBFbmRwb2ludHNcbiAgICBpbnRlcmFjdGlvbnM6IHtcbiAgICAgIGNvbW1hbmRzOiB7XG4gICAgICAgIC8vIEFwcGxpY2F0aW9uIEVuZHBvaW50c1xuICAgICAgICBjb21tYW5kczogKGFwcGxpY2F0aW9uSWQsIHdpdGhMb2NhbGl6YXRpb25zKSA9PiB7XG4gICAgICAgICAgbGV0IHVybCA9IGAvYXBwbGljYXRpb25zLyR7YXBwbGljYXRpb25JZH0vY29tbWFuZHM/YFxuXG4gICAgICAgICAgaWYgKHdpdGhMb2NhbGl6YXRpb25zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHVybCArPSBgd2l0aF9sb2NhbGl6YXRpb25zPSR7d2l0aExvY2FsaXphdGlvbnMudG9TdHJpbmcoKX1gXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHVybFxuICAgICAgICB9LFxuXG4gICAgICAgIGd1aWxkczoge1xuICAgICAgICAgIGFsbChhcHBsaWNhdGlvbklkLCBndWlsZElkLCB3aXRoTG9jYWxpemF0aW9ucykge1xuICAgICAgICAgICAgbGV0IHVybCA9IGAvYXBwbGljYXRpb25zLyR7YXBwbGljYXRpb25JZH0vZ3VpbGRzLyR7Z3VpbGRJZH0vY29tbWFuZHM/YFxuXG4gICAgICAgICAgICBpZiAod2l0aExvY2FsaXphdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICB1cmwgKz0gYHdpdGhfbG9jYWxpemF0aW9ucz0ke3dpdGhMb2NhbGl6YXRpb25zLnRvU3RyaW5nKCl9YFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdXJsXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIG9uZShhcHBsaWNhdGlvbklkLCBndWlsZElkLCBjb21tYW5kSWQpIHtcbiAgICAgICAgICAgIHJldHVybiBgL2FwcGxpY2F0aW9ucy8ke2FwcGxpY2F0aW9uSWR9L2d1aWxkcy8ke2d1aWxkSWR9L2NvbW1hbmRzLyR7Y29tbWFuZElkfWBcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBwZXJtaXNzaW9uczogKGFwcGxpY2F0aW9uSWQsIGd1aWxkSWQpID0+IHtcbiAgICAgICAgICByZXR1cm4gYC9hcHBsaWNhdGlvbnMvJHthcHBsaWNhdGlvbklkfS9ndWlsZHMvJHtndWlsZElkfS9jb21tYW5kcy9wZXJtaXNzaW9uc2BcbiAgICAgICAgfSxcbiAgICAgICAgcGVybWlzc2lvbjogKGFwcGxpY2F0aW9uSWQsIGd1aWxkSWQsIGNvbW1hbmRJZCkgPT4ge1xuICAgICAgICAgIHJldHVybiBgL2FwcGxpY2F0aW9ucy8ke2FwcGxpY2F0aW9uSWR9L2d1aWxkcy8ke2d1aWxkSWR9L2NvbW1hbmRzLyR7Y29tbWFuZElkfS9wZXJtaXNzaW9uc2BcbiAgICAgICAgfSxcbiAgICAgICAgY29tbWFuZDogKGFwcGxpY2F0aW9uSWQsIGNvbW1hbmRJZCwgd2l0aExvY2FsaXphdGlvbnMpID0+IHtcbiAgICAgICAgICBsZXQgdXJsID0gYC9hcHBsaWNhdGlvbnMvJHthcHBsaWNhdGlvbklkfS9jb21tYW5kcy8ke2NvbW1hbmRJZH0/YFxuXG4gICAgICAgICAgaWYgKHdpdGhMb2NhbGl6YXRpb25zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHVybCArPSBgd2l0aExvY2FsaXphdGlvbnM9JHt3aXRoTG9jYWxpemF0aW9ucy50b1N0cmluZygpfWBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdXJsXG4gICAgICAgIH0sXG4gICAgICB9LFxuXG4gICAgICByZXNwb25zZXM6IHtcbiAgICAgICAgLy8gSW50ZXJhY3Rpb24gRW5kcG9pbnRzXG4gICAgICAgIGNhbGxiYWNrOiAoaW50ZXJhY3Rpb25JZCwgdG9rZW4sIG9wdGlvbnMpID0+IHtcbiAgICAgICAgICByZXR1cm4gYC9pbnRlcmFjdGlvbnMvJHtpbnRlcmFjdGlvbklkfS8ke3Rva2VufS9jYWxsYmFjaz93aXRoX3Jlc3BvbnNlPSR7ISFvcHRpb25zPy53aXRoUmVzcG9uc2V9YFxuICAgICAgICB9LFxuICAgICAgICBvcmlnaW5hbDogKGludGVyYWN0aW9uSWQsIHRva2VuKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGAvd2ViaG9va3MvJHtpbnRlcmFjdGlvbklkfS8ke3Rva2VufS9tZXNzYWdlcy9Ab3JpZ2luYWxgXG4gICAgICAgIH0sXG4gICAgICAgIG1lc3NhZ2U6IChhcHBsaWNhdGlvbklkLCB0b2tlbiwgbWVzc2FnZUlkKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGAvd2ViaG9va3MvJHthcHBsaWNhdGlvbklkfS8ke3Rva2VufS9tZXNzYWdlcy8ke21lc3NhZ2VJZH1gXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICAvLyBPQXV0aDIgZW5kcG9pbnRzXG4gICAgb2F1dGgyOiB7XG4gICAgICB0b2tlbkV4Y2hhbmdlOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiAnL29hdXRoMi90b2tlbidcbiAgICAgIH0sXG4gICAgICB0b2tlblJldm9rZTogKCkgPT4ge1xuICAgICAgICByZXR1cm4gJy9vYXV0aDIvdG9rZW4vcmV2b2tlJ1xuICAgICAgfSxcbiAgICAgIGN1cnJlbnRBdXRob3JpemF0aW9uOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiAnL29hdXRoMi9AbWUnXG4gICAgICB9LFxuICAgICAgYXBwbGljYXRpb246ICgpID0+IHtcbiAgICAgICAgcmV0dXJuICcvb2F1dGgyL2FwcGxpY2F0aW9ucy9AbWUnXG4gICAgICB9LFxuICAgICAgY29ubmVjdGlvbnM6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuICcvdXNlcnMvQG1lL2Nvbm5lY3Rpb25zJ1xuICAgICAgfSxcbiAgICAgIHJvbGVDb25uZWN0aW9uczogKGFwcGxpY2F0aW9uSWQpID0+IHtcbiAgICAgICAgcmV0dXJuIGAvdXNlcnMvQG1lL2FwcGxpY2F0aW9ucy8ke2FwcGxpY2F0aW9uSWR9L3JvbGUtY29ubmVjdGlvbmBcbiAgICAgIH0sXG4gICAgfSxcblxuICAgIG1vbmV0aXphdGlvbjoge1xuICAgICAgZW50aXRsZW1lbnRzOiAoYXBwbGljYXRpb25JZCwgb3B0aW9ucykgPT4ge1xuICAgICAgICBsZXQgdXJsID0gYC9hcHBsaWNhdGlvbnMvJHthcHBsaWNhdGlvbklkfS9lbnRpdGxlbWVudHM/YFxuXG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMuYWZ0ZXIpIHVybCArPSBgYWZ0ZXI9JHtvcHRpb25zLmFmdGVyfWBcbiAgICAgICAgICBpZiAob3B0aW9ucy5iZWZvcmUpIHVybCArPSBgJmJlZm9yZT0ke29wdGlvbnMuYmVmb3JlfWBcbiAgICAgICAgICBpZiAob3B0aW9ucy5leGNsdWRlRW5kZWQpIHVybCArPSBgJmV4Y2x1ZGVfZW5kZWQ9JHtvcHRpb25zLmV4Y2x1ZGVFbmRlZH1gXG4gICAgICAgICAgaWYgKG9wdGlvbnMuZ3VpbGRJZCkgdXJsICs9IGAmZ3VpbGRfaWQ9JHtvcHRpb25zLmd1aWxkSWR9YFxuICAgICAgICAgIGlmIChvcHRpb25zLmxpbWl0KSB1cmwgKz0gYCZsaW1pdD0ke29wdGlvbnMubGltaXR9YFxuICAgICAgICAgIGlmIChvcHRpb25zLnNrdUlkcykgdXJsICs9IGAmc2t1X2lkcz0ke29wdGlvbnMuc2t1SWRzLmpvaW4oJywnKX1gXG4gICAgICAgICAgaWYgKG9wdGlvbnMudXNlcklkKSB1cmwgKz0gYCZ1c2VyX2lkPSR7b3B0aW9ucy51c2VySWR9YFxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVybFxuICAgICAgfSxcbiAgICAgIGVudGl0bGVtZW50OiAoYXBwbGljYXRpb25JZCwgZW50aXRsZW1lbnRJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC9hcHBsaWNhdGlvbnMvJHthcHBsaWNhdGlvbklkfS9lbnRpdGxlbWVudHMvJHtlbnRpdGxlbWVudElkfWBcbiAgICAgIH0sXG4gICAgICBjb25zdW1lRW50aXRsZW1lbnQ6IChhcHBsaWNhdGlvbklkLCBlbnRpdGxlbWVudElkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2FwcGxpY2F0aW9ucy8ke2FwcGxpY2F0aW9uSWR9L2VudGl0bGVtZW50cy8ke2VudGl0bGVtZW50SWR9L2NvbnN1bWVgXG4gICAgICB9LFxuXG4gICAgICBza3VzOiAoYXBwbGljYXRpb25JZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC9hcHBsaWNhdGlvbnMvJHthcHBsaWNhdGlvbklkfS9za3VzYFxuICAgICAgfSxcblxuICAgICAgc3Vic2NyaXB0aW9uOiAoc2t1SWQsIHN1YnNjcmlwdGlvbklkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL3NrdXMvJHtza3VJZH0vc3Vic2NyaXB0aW9ucy8ke3N1YnNjcmlwdGlvbklkfWBcbiAgICAgIH0sXG5cbiAgICAgIHN1YnNjcmlwdGlvbnM6IChza3VJZCwgb3B0aW9ucykgPT4ge1xuICAgICAgICBsZXQgdXJsID0gYC9za3VzLyR7c2t1SWR9L3N1YnNjcmlwdGlvbnM/YFxuXG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMuYWZ0ZXIpIHVybCArPSBgYWZ0ZXI9JHtvcHRpb25zLmFmdGVyfWBcbiAgICAgICAgICBpZiAob3B0aW9ucy5iZWZvcmUpIHVybCArPSBgJmJlZm9yZT0ke29wdGlvbnMuYmVmb3JlfWBcbiAgICAgICAgICBpZiAob3B0aW9ucy51c2VySWQpIHVybCArPSBgJnVzZXJfaWQ9JHtvcHRpb25zLnVzZXJJZH1gXG4gICAgICAgICAgaWYgKG9wdGlvbnMubGltaXQpIHVybCArPSBgJmxpbWl0PSR7b3B0aW9ucy5saW1pdH1gXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdXJsXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICBzb3VuZGJvYXJkOiB7XG4gICAgICBzZW5kU291bmQ6IChjaGFubmVsSWQpID0+IHtcbiAgICAgICAgcmV0dXJuIGAvY2hhbm5lbHMvJHtjaGFubmVsSWR9YFxuICAgICAgfSxcbiAgICAgIGxpc3REZWZhdWx0OiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBgL3NvdW5kYm9hcmQtZGVmYXVsdC1zb3VuZHNgXG4gICAgICB9LFxuICAgICAgZ3VpbGRTb3VuZHM6IChndWlsZElkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2d1aWxkcy8ke2d1aWxkSWR9L3NvdW5kYm9hcmQtc291bmRzYFxuICAgICAgfSxcbiAgICAgIGd1aWxkU291bmQ6IChndWlsZElkLCBzb3VuZElkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2d1aWxkcy8ke2d1aWxkSWR9L3NvdW5kYm9hcmQtc291bmRzLyR7c291bmRJZH1gXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICBsb2JieToge1xuICAgICAgY3JlYXRlOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiAnL2xvYmJpZXMnXG4gICAgICB9LFxuXG4gICAgICBsb2JieTogKGxvYmJ5SWQpID0+IHtcbiAgICAgICAgcmV0dXJuIGAvbG9iYmllcy8ke2xvYmJ5SWR9YFxuICAgICAgfSxcblxuICAgICAgbWVtYmVyOiAobG9iYnlJZCwgdXNlcklkKSA9PiB7XG4gICAgICAgIHJldHVybiBgL2xvYmJpZXMvJHtsb2JieUlkfS9tZW1iZXJzLyR7dXNlcklkfWBcbiAgICAgIH0sXG5cbiAgICAgIGxlYXZlOiAobG9iYnlJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC9sb2JiaWVzLyR7bG9iYnlJZH0vbWVtYmVycy9AbWVgXG4gICAgICB9LFxuXG4gICAgICBsaW5rOiAobG9iYnlJZCkgPT4ge1xuICAgICAgICByZXR1cm4gYC9sb2JiaWVzLyR7bG9iYnlJZH0vY2hhbm5lbC1saW5raW5nYFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgYXBwbGljYXRpb25FbW9qaShhcHBsaWNhdGlvbklkLCBlbW9qaUlkKSB7XG4gICAgICByZXR1cm4gYC9hcHBsaWNhdGlvbnMvJHthcHBsaWNhdGlvbklkfS9lbW9qaXMvJHtlbW9qaUlkfWBcbiAgICB9LFxuXG4gICAgYXBwbGljYXRpb25FbW9qaXMoYXBwbGljYXRpb25JZCkge1xuICAgICAgcmV0dXJuIGAvYXBwbGljYXRpb25zLyR7YXBwbGljYXRpb25JZH0vZW1vamlzYFxuICAgIH0sXG5cbiAgICBhcHBsaWNhdGlvblJvbGVDb25uZWN0aW9uTWV0YWRhdGEoYXBwbGljYXRpb25JZCkge1xuICAgICAgcmV0dXJuIGAvYXBwbGljYXRpb25zLyR7YXBwbGljYXRpb25JZH0vcm9sZS1jb25uZWN0aW9ucy9tZXRhZGF0YWBcbiAgICB9LFxuXG4gICAgLy8gVXNlciBlbmRwb2ludHNcbiAgICB1c2VyKHVzZXJJZCkge1xuICAgICAgcmV0dXJuIGAvdXNlcnMvJHt1c2VySWR9YFxuICAgIH0sXG5cbiAgICBhcHBsaWNhdGlvbigpIHtcbiAgICAgIHJldHVybiAnL2FwcGxpY2F0aW9ucy9AbWUnXG4gICAgfSxcblxuICAgIGFwcGxpY2F0aW9uQWN0aXZpdHlJbnN0YW5jZShhcHBsaWNhdGlvbklkLCBpbnN0YW5jZUlkKSB7XG4gICAgICByZXR1cm4gYC9hcHBsaWNhdGlvbnMvJHthcHBsaWNhdGlvbklkfS9hY3Rpdml0eS1pbnN0YW5jZXMvJHtpbnN0YW5jZUlkfWBcbiAgICB9LFxuXG4gICAgY3VycmVudFVzZXIoKSB7XG4gICAgICByZXR1cm4gJy91c2Vycy9AbWUnXG4gICAgfSxcblxuICAgIGdhdGV3YXlCb3QoKSB7XG4gICAgICByZXR1cm4gJy9nYXRld2F5L2JvdCdcbiAgICB9LFxuXG4gICAgc3RpY2tlclBhY2soc3RpY2tlclBhY2tJZCkge1xuICAgICAgcmV0dXJuIGAvc3RpY2tlci1wYWNrcy8ke3N0aWNrZXJQYWNrSWR9YFxuICAgIH0sXG5cbiAgICBzdGlja2VyUGFja3MoKSB7XG4gICAgICByZXR1cm4gJy9zdGlja2VyLXBhY2tzJ1xuICAgIH0sXG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJpc0dldE1lc3NhZ2VzQWZ0ZXIiLCJpc0dldE1lc3NhZ2VzQXJvdW5kIiwiaXNHZXRNZXNzYWdlc0JlZm9yZSIsImlzR2V0TWVzc2FnZXNMaW1pdCIsImNyZWF0ZVJvdXRlcyIsIndlYmhvb2tzIiwiaWQiLCJ3ZWJob29rSWQiLCJtZXNzYWdlIiwidG9rZW4iLCJtZXNzYWdlSWQiLCJvcHRpb25zIiwidXJsIiwidGhyZWFkSWQiLCJ3aXRoQ29tcG9uZW50cyIsIndlYmhvb2siLCJ3YWl0IiwidW5kZWZpbmVkIiwidG9TdHJpbmciLCJjaGFubmVscyIsImJ1bGsiLCJjaGFubmVsSWQiLCJkbSIsImRtUmVjaXBpZW50IiwidXNlcklkIiwicGluIiwicGlucyIsIm1lc3NhZ2VQaW5zIiwiYmVmb3JlIiwibGltaXQiLCJtZXNzYWdlUGluIiwicmVhY3Rpb25zIiwiYm90IiwiZW1vamkiLCJlbmNvZGVVUklDb21wb25lbnQiLCJ1c2VyIiwiYWxsIiwidHlwZSIsImFmdGVyIiwiY2hhbm5lbCIsImZvbGxvdyIsImZvcnVtIiwiaW52aXRlcyIsIm1lc3NhZ2VzIiwiYXJvdW5kIiwib3ZlcndyaXRlIiwib3ZlcndyaXRlSWQiLCJjcm9zc3Bvc3QiLCJzdGFnZXMiLCJzdGFnZSIsInRocmVhZHMiLCJhY3RpdmUiLCJndWlsZElkIiwibWVtYmVycyIsIndpdGhNZW1iZXIiLCJtZSIsImdldFVzZXIiLCJhcmNoaXZlZCIsInB1YmxpYyIsIkRhdGUiLCJ0b0lTT1N0cmluZyIsInByaXZhdGUiLCJqb2luZWQiLCJ0eXBpbmciLCJwb2xscyIsInZvdGVzIiwiYW5zd2VySWQiLCJleHBpcmUiLCJndWlsZHMiLCJ1c2VyR3VpbGRzIiwid2l0aENvdW50cyIsImF1ZGl0bG9ncyIsImFjdGlvblR5cGUiLCJhdXRvbW9kIiwicnVsZSIsInJ1bGVJZCIsInJ1bGVzIiwiZW1vamlJZCIsImVtb2ppcyIsImV2ZW50cyIsIndpdGhVc2VyQ291bnQiLCJldmVudCIsImV2ZW50SWQiLCJ1c2VycyIsImd1aWxkIiwiaW50ZWdyYXRpb24iLCJpbnRlZ3JhdGlvbklkIiwiaW50ZWdyYXRpb25zIiwiaW52aXRlIiwiaW52aXRlQ29kZSIsInNjaGVkdWxlZEV2ZW50SWQiLCJsZWF2ZSIsImJhbiIsImJhbnMiLCJidWxrQmFuIiwibWVtYmVyIiwiY3VycmVudE1lbWJlciIsInNlYXJjaCIsInF1ZXJ5IiwicHJ1bmUiLCJkYXlzIiwiQXJyYXkiLCJpc0FycmF5IiwiaW5jbHVkZVJvbGVzIiwiam9pbiIsInByZXZpZXciLCJyb2xlcyIsIm9uZSIsInJvbGVJZCIsIm1lbWJlcklkIiwic3RpY2tlcnMiLCJzdGlja2VyIiwic3RpY2tlcklkIiwidm9pY2UiLCJ0ZW1wbGF0ZXMiLCJjb2RlIiwidmFuaXR5IiwicmVnaW9ucyIsIndlbGNvbWUiLCJ3aWRnZXQiLCJ3aWRnZXRKc29uIiwib25ib2FyZGluZyIsImluY2lkZW50QWN0aW9ucyIsImludGVyYWN0aW9ucyIsImNvbW1hbmRzIiwiYXBwbGljYXRpb25JZCIsIndpdGhMb2NhbGl6YXRpb25zIiwiY29tbWFuZElkIiwicGVybWlzc2lvbnMiLCJwZXJtaXNzaW9uIiwiY29tbWFuZCIsInJlc3BvbnNlcyIsImNhbGxiYWNrIiwiaW50ZXJhY3Rpb25JZCIsIndpdGhSZXNwb25zZSIsIm9yaWdpbmFsIiwib2F1dGgyIiwidG9rZW5FeGNoYW5nZSIsInRva2VuUmV2b2tlIiwiY3VycmVudEF1dGhvcml6YXRpb24iLCJhcHBsaWNhdGlvbiIsImNvbm5lY3Rpb25zIiwicm9sZUNvbm5lY3Rpb25zIiwibW9uZXRpemF0aW9uIiwiZW50aXRsZW1lbnRzIiwiZXhjbHVkZUVuZGVkIiwic2t1SWRzIiwiZW50aXRsZW1lbnQiLCJlbnRpdGxlbWVudElkIiwiY29uc3VtZUVudGl0bGVtZW50Iiwic2t1cyIsInN1YnNjcmlwdGlvbiIsInNrdUlkIiwic3Vic2NyaXB0aW9uSWQiLCJzdWJzY3JpcHRpb25zIiwic291bmRib2FyZCIsInNlbmRTb3VuZCIsImxpc3REZWZhdWx0IiwiZ3VpbGRTb3VuZHMiLCJndWlsZFNvdW5kIiwic291bmRJZCIsImxvYmJ5IiwiY3JlYXRlIiwibG9iYnlJZCIsImxpbmsiLCJhcHBsaWNhdGlvbkVtb2ppIiwiYXBwbGljYXRpb25FbW9qaXMiLCJhcHBsaWNhdGlvblJvbGVDb25uZWN0aW9uTWV0YWRhdGEiLCJhcHBsaWNhdGlvbkFjdGl2aXR5SW5zdGFuY2UiLCJpbnN0YW5jZUlkIiwiY3VycmVudFVzZXIiLCJnYXRld2F5Qm90Iiwic3RpY2tlclBhY2siLCJzdGlja2VyUGFja0lkIiwic3RpY2tlclBhY2tzIl0sIm1hcHBpbmdzIjoiQUFDQSxTQUFTQSxrQkFBa0IsRUFBRUMsbUJBQW1CLEVBQUVDLG1CQUFtQixFQUFFQyxrQkFBa0IsUUFBUSxvQkFBbUI7QUFHcEgsT0FBTyxTQUFTQztJQUNkLE9BQU87UUFDTEMsVUFBVTtZQUNSQyxJQUFJLENBQUNDO2dCQUNILE9BQU8sQ0FBQyxVQUFVLEVBQUVBLFdBQVc7WUFDakM7WUFDQUMsU0FBUyxDQUFDRCxXQUFXRSxPQUFPQyxXQUFXQztnQkFDckMsSUFBSUMsTUFBTSxDQUFDLFVBQVUsRUFBRUws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