/** Types for: https://discord.com/developers/docs/topics/oauth2 */ /** https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes */ export var OAuth2Scope =
  /*#__PURE__*/ (function (OAuth2Scope) {
    /**
     * Allows your app to fetch data from a user's "Now Playing/Recently Played" list
     *
     * @remarks
     * This scope is not currently available for apps
     */ OAuth2Scope['ActivitiesRead'] = 'activities.read'
    /**
     * Allows your app to update a user's activity
     *
     * @remarks
     * This scope not currently available for apps.
     */ OAuth2Scope['ActivitiesWrite'] = 'activities.write'
    /** Allows your app to read build data for a user's applications */ OAuth2Scope['ApplicationsBuildsRead'] = 'applications.builds.read'
    /**
     * Allows your app to upload/update builds for a user's applications
     *
     * @remarks
     * This scope requires Discord approval to be used
     */ OAuth2Scope['ApplicationsBuildsUpload'] = 'applications.builds.upload'
    /** Allows your app to add commands to a guild - included by default with the `bot` scope */ OAuth2Scope['ApplicationsCommands'] =
      'applications.commands'
    /**
     * Allows your app to update its Application Commands via this bearer token
     *
     * @remarks
     * This scope can only be used when using a [Client Credential Grant](https://discord.com/developers/docs/topics/oauth2#client-credentials-grant)
     */ OAuth2Scope['ApplicationsCommandsUpdate'] = 'applications.commands.update'
    /** Allows your app to update permissions for its commands in a guild a user has permissions to */ OAuth2Scope[
      'ApplicationCommandsPermissionsUpdate'
    ] = 'applications.commands.permissions.update'
    /** Allows your app to read entitlements for a user's applications */ OAuth2Scope['ApplicationsEntitlements'] = 'applications.entitlements'
    /** Allows your app to read and update store data (SKUs, store listings, achievements, etc.) for a user's applications */ OAuth2Scope[
      'ApplicationsStoreUpdate'
    ] = 'applications.store.update'
    /** For oauth2 bots, this puts the bot in the user's selected guild by default */ OAuth2Scope['Bot'] = 'bot'
    /** Allows requests to [/users/@me/connections](https://discord.com/developers/docs/resources/user#get-user-connections) */ OAuth2Scope[
      'Connections'
    ] = 'connections'
    /**
     * Allows your app to see information about the user's DMs and group DMs
     *
     * @remarks
     * This scope requires Discord approval to be used
     */ OAuth2Scope['DMChannelsRead'] = 'dm_channels.read'
    /** Adds the `email` filed to [/users/@me](https://discord.com/developers/docs/resources/user#get-current-user) */ OAuth2Scope['Email'] = 'email'
    /** Allows your app to join users to a group dm */ OAuth2Scope['GroupDMJoins'] = 'gdm.join'
    /** Allows requests to [/users/@me/guilds](https://discord.com/developers/docs/resources/user#get-current-user-guilds) */ OAuth2Scope['Guilds'] =
      'guilds'
    /** Allows requests to [/guilds/{guild.id}/members/{user.id}](https://discord.com/developers/docs/resources/guild#add-guild-member) */ OAuth2Scope[
      'GuildsJoin'
    ] = 'guilds.join'
    /** Allows requests to [/users/@me/guilds/{guild.id}/member](https://discord.com/developers/docs/resources/user#get-current-user-guild-member) */ OAuth2Scope[
      'GuildsMembersRead'
    ] = 'guilds.members.read'
    /**
     * Allows requests to [/users/@me](https://discord.com/developers/docs/resources/user#get-current-user)
     *
     * @remarks
     * The return object from [/users/@me](https://discord.com/developers/docs/resources/user#get-current-user)
     * does NOT contain the `email` field unless the scope `email` is also used
     */ OAuth2Scope['Identify'] = 'identify'
    /**
     * For local rpc server api access, this allows you to read messages from all client channels
     * (otherwise restricted to channels/guilds your app creates)
     */ OAuth2Scope['MessagesRead'] = 'messages.read'
    /**
     * Allows your app to know a user's friends and implicit relationships
     *
     * @remarks
     * This scope requires Discord approval to be used
     */ OAuth2Scope['RelationshipsRead'] = 'relationships.read'
    /** Allows your app to update a user's connection and metadata for the app */ OAuth2Scope['RoleConnectionsWrite'] = 'role_connections.write'
    /**
     * For local rpc server access, this allows you to control a user's local Discord client
     *
     * @remarks
     * This scope requires Discord approval to be used
     */ OAuth2Scope['RPC'] = 'rpc'
    /**
     * For local rpc server access, this allows you to update a user's activity
     *
     * @remarks
     * This scope requires Discord approval to be used
     */ OAuth2Scope['RPCActivitiesWrite'] = 'rpc.activities.write'
    /**
     * For local rpc server api access, this allows you to receive notifications pushed out to the user
     *
     * @remarks
     * This scope requires Discord approval to be used
     */ OAuth2Scope['RPCNotificationsRead'] = 'rpc.notifications.read'
    /**
     * For local rpc server access, this allows you to read a user's voice settings and listen for voice events
     *
     * @remarks
     * This scope requires Discord approval to be used
     */ OAuth2Scope['RPCVoiceRead'] = 'rpc.voice.read'
    /**
     * For local rpc server access, this allows you to update a user's voice settings
     *
     * @remarks
     * This scope requires Discord approval to be used
     */ OAuth2Scope['RPCVoiceWrite'] = 'rpc.voice.write'
    /**
     * Allows your app to connect to voice on user's behalf and see all the voice members
     *
     * @remarks
     * This scope requires Discord approval to be used
     */ OAuth2Scope['Voice'] = 'voice'
    /** Generate a webhook that is returned in the oauth token response for authorization code grants */ OAuth2Scope['WebhookIncoming'] =
      'webhook.incoming'
    return OAuth2Scope
  })({})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9kaXNjb3JkL29hdXRoMi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogVHlwZXMgZm9yOiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy90b3BpY3Mvb2F1dGgyICovXG5cbmltcG9ydCB0eXBlIHsgRGlzY29yZEFwcGxpY2F0aW9uIH0gZnJvbSAnLi9hcHBsaWNhdGlvbi5qcydcbmltcG9ydCB0eXBlIHsgRGlzY29yZEd1aWxkIH0gZnJvbSAnLi9ndWlsZC5qcydcbmltcG9ydCB0eXBlIHsgRGlzY29yZFVzZXIgfSBmcm9tICcuL3VzZXIuanMnXG5pbXBvcnQgdHlwZSB7IERpc2NvcmRXZWJob29rIH0gZnJvbSAnLi93ZWJob29rLmpzJ1xuXG4vKiogaHR0cHM6Ly9kaXNjb3JkLmNvbS9kZXZlbG9wZXJzL2RvY3MvdG9waWNzL29hdXRoMiNzaGFyZWQtcmVzb3VyY2VzLW9hdXRoMi1zY29wZXMgKi9cbmV4cG9ydCBlbnVtIE9BdXRoMlNjb3BlIHtcbiAgLyoqXG4gICAqIEFsbG93cyB5b3VyIGFwcCB0byBmZXRjaCBkYXRhIGZyb20gYSB1c2VyJ3MgXCJOb3cgUGxheWluZy9SZWNlbnRseSBQbGF5ZWRcIiBsaXN0XG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgc2NvcGUgaXMgbm90IGN1cnJlbnRseSBhdmFpbGFibGUgZm9yIGFwcHNcbiAgICovXG4gIEFjdGl2aXRpZXNSZWFkID0gJ2FjdGl2aXRpZXMucmVhZCcsXG4gIC8qKlxuICAgKiBBbGxvd3MgeW91ciBhcHAgdG8gdXBkYXRlIGEgdXNlcidzIGFjdGl2aXR5XG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgc2NvcGUgbm90IGN1cnJlbnRseSBhdmFpbGFibGUgZm9yIGFwcHMuXG4gICAqL1xuICBBY3Rpdml0aWVzV3JpdGUgPSAnYWN0aXZpdGllcy53cml0ZScsXG4gIC8qKiBBbGxvd3MgeW91ciBhcHAgdG8gcmVhZCBidWlsZCBkYXRhIGZvciBhIHVzZXIncyBhcHBsaWNhdGlvbnMgKi9cbiAgQXBwbGljYXRpb25zQnVpbGRzUmVhZCA9ICdhcHBsaWNhdGlvbnMuYnVpbGRzLnJlYWQnLFxuICAvKipcbiAgICogQWxsb3dzIHlvdXIgYXBwIHRvIHVwbG9hZC91cGRhdGUgYnVpbGRzIGZvciBhIHVzZXIncyBhcHBsaWNhdGlvbnNcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBzY29wZSByZXF1aXJlcyBEaXNjb3JkIGFwcHJvdmFsIHRvIGJlIHVzZWRcbiAgICovXG4gIEFwcGxpY2F0aW9uc0J1aWxkc1VwbG9hZCA9ICdhcHBsaWNhdGlvbnMuYnVpbGRzLnVwbG9hZCcsXG4gIC8qKiBBbGxvd3MgeW91ciBhcHAgdG8gYWRkIGNvbW1hbmRzIHRvIGEgZ3VpbGQgLSBpbmNsdWRlZCBieSBkZWZhdWx0IHdpdGggdGhlIGBib3RgIHNjb3BlICovXG4gIEFwcGxpY2F0aW9uc0NvbW1hbmRzID0gJ2FwcGxpY2F0aW9ucy5jb21tYW5kcycsXG4gIC8qKlxuICAgKiBBbGxvd3MgeW91ciBhcHAgdG8gdXBkYXRlIGl0cyBBcHBsaWNhdGlvbiBDb21tYW5kcyB2aWEgdGhpcyBiZWFyZXIgdG9rZW5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBzY29wZSBjYW4gb25seSBiZSB1c2VkIHdoZW4gdXNpbmcgYSBbQ2xpZW50IENyZWRlbnRpYWwgR3JhbnRdKGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3RvcGljcy9vYXV0aDIjY2xpZW50LWNyZWRlbnRpYWxzLWdyYW50KVxuICAgKi9cbiAgQXBwbGljYXRpb25zQ29tbWFuZHNVcGRhdGUgPSAnYXBwbGljYXRpb25zLmNvbW1hbmRzLnVwZGF0ZScsXG4gIC8qKiBBbGxvd3MgeW91ciBhcHAgdG8gdXBkYXRlIHBlcm1pc3Npb25zIGZvciBpdHMgY29tbWFuZHMgaW4gYSBndWlsZCBhIHVzZXIgaGFzIHBlcm1pc3Npb25zIHRvICovXG4gIEFwcGxpY2F0aW9uQ29tbWFuZHNQZXJtaXNzaW9uc1VwZGF0ZSA9ICdhcHBsaWNhdGlvbnMuY29tbWFuZHMucGVybWlzc2lvbnMudXBkYXRlJyxcbiAgLyoqIEFsbG93cyB5b3VyIGFwcCB0byByZWFkIGVudGl0bGVtZW50cyBmb3IgYSB1c2VyJ3MgYXBwbGljYXRpb25zICovXG4gIEFwcGxpY2F0aW9uc0VudGl0bGVtZW50cyA9ICdhcHBsaWNhdGlvbnMuZW50aXRsZW1lbnRzJyxcbiAgLyoqIEFsbG93cyB5b3VyIGFwcCB0byByZWFkIGFuZCB1cGRhdGUgc3RvcmUgZGF0YSAoU0tVcywgc3RvcmUgbGlzdGluZ3MsIGFjaGlldmVtZW50cywgZXRjLikgZm9yIGEgdXNlcidzIGFwcGxpY2F0aW9ucyAqL1xuICBBcHBsaWNhdGlvbnNTdG9yZVVwZGF0ZSA9ICdhcHBsaWNhdGlvbnMuc3RvcmUudXBkYXRlJyxcbiAgLyoqIEZvciBvYXV0aDIgYm90cywgdGhpcyBwdXRzIHRoZSBib3QgaW4gdGhlIHVzZXIncyBzZWxlY3RlZCBndWlsZCBieSBkZWZhdWx0ICovXG4gIEJvdCA9ICdib3QnLFxuICAvKiogQWxsb3dzIHJlcXVlc3RzIHRvIFsvdXNlcnMvQG1lL2Nvbm5lY3Rpb25zXShodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZXNvdXJjZXMvdXNlciNnZXQtdXNlci1jb25uZWN0aW9ucykgKi9cbiAgQ29ubmVjdGlvbnMgPSAnY29ubmVjdGlvbnMnLFxuICAvKipcbiAgICogQWxsb3dzIHlvdXIgYXBwIHRvIHNlZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgdXNlcidzIERNcyBhbmQgZ3JvdXAgRE1zXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgc2NvcGUgcmVxdWlyZXMgRGlzY29yZCBhcHByb3ZhbCB0byBiZSB1c2VkXG4gICAqL1xuICBETUNoYW5uZWxzUmVhZCA9ICdkbV9jaGFubmVscy5yZWFkJyxcbiAgLyoqIEFkZHMgdGhlIGBlbWFpbGAgZmlsZWQgdG8gWy91c2Vycy9AbWVdKGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3Jlc291cmNlcy91c2VyI2dldC1jdXJyZW50LXVzZXIpICovXG4gIEVtYWlsID0gJ2VtYWlsJyxcbiAgLyoqIEFsbG93cyB5b3VyIGFwcCB0byBqb2luIHVzZXJzIHRvIGEgZ3JvdXAgZG0gKi9cbiAgR3JvdXBETUpvaW5zID0gJ2dkbS5qb2luJyxcbiAgLyoqIEFsbG93cyByZXF1ZXN0cyB0byBbL3VzZXJzL0BtZS9ndWlsZHNdKGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3Jlc291cmNlcy91c2VyI2dldC1jdXJyZW50LXVzZXItZ3VpbGRzKSAqL1xuICBHdWlsZHMgPSAnZ3VpbGRzJyxcbiAgLyoqIEFsbG93cyByZXF1ZXN0cyB0byBbL2d1aWxkcy97Z3VpbGQuaWR9L21lbWJlcnMve3VzZXIuaWR9XShodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZXNvdXJjZXMvZ3VpbGQjYWRkLWd1aWxkLW1lbWJlcikgKi9cbiAgR3VpbGRzSm9pbiA9ICdndWlsZHMuam9pbicsXG4gIC8qKiBBbGxvd3MgcmVxdWVzdHMgdG8gWy91c2Vycy9AbWUvZ3VpbGRzL3tndWlsZC5pZH0vbWVtYmVyXShodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZXNvdXJjZXMvdXNlciNnZXQtY3VycmVudC11c2VyLWd1aWxkLW1lbWJlcikgKi9cbiAgR3VpbGRzTWVtYmVyc1JlYWQgPSAnZ3VpbGRzLm1lbWJlcnMucmVhZCcsXG4gIC8qKlxuICAgKiBBbGxvd3MgcmVxdWVzdHMgdG8gWy91c2Vycy9AbWVdKGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3Jlc291cmNlcy91c2VyI2dldC1jdXJyZW50LXVzZXIpXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoZSByZXR1cm4gb2JqZWN0IGZyb20gWy91c2Vycy9AbWVdKGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3Jlc291cmNlcy91c2VyI2dldC1jdXJyZW50LXVzZXIpXG4gICAqIGRvZXMgTk9UIGNvbnRhaW4gdGhlIGBlbWFpbGAgZmllbGQgdW5sZXNzIHRoZSBzY29wZSBgZW1haWxgIGlzIGFsc28gdXNlZFxuICAgKi9cbiAgSWRlbnRpZnkgPSAnaWRlbnRpZnknLFxuICAvKipcbiAgICogRm9yIGxvY2FsIHJwYyBzZXJ2ZXIgYXBpIGFjY2VzcywgdGhpcyBhbGxvd3MgeW91IHRvIHJlYWQgbWVzc2FnZXMgZnJvbSBhbGwgY2xpZW50IGNoYW5uZWxzXG4gICAqIChvdGhlcndpc2UgcmVzdHJpY3RlZCB0byBjaGFubmVscy9ndWlsZHMgeW91ciBhcHAgY3JlYXRlcylcbiAgICovXG4gIE1lc3NhZ2VzUmVhZCA9ICdtZXNzYWdlcy5yZWFkJyxcbiAgLyoqXG4gICAqIEFsbG93cyB5b3VyIGFwcCB0byBrbm93IGEgdXNlcidzIGZyaWVuZHMgYW5kIGltcGxpY2l0IHJlbGF0aW9uc2hpcHNcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBzY29wZSByZXF1aXJlcyBEaXNjb3JkIGFwcHJvdmFsIHRvIGJlIHVzZWRcbiAgICovXG4gIFJlbGF0aW9uc2hpcHNSZWFkID0gJ3JlbGF0aW9uc2hpcHMucmVhZCcsXG4gIC8qKiBBbGxvd3MgeW91ciBhcHAgdG8gdXBkYXRlIGEgdXNlcidzIGNvbm5lY3Rpb24gYW5kIG1ldGFkYXRhIGZvciB0aGUgYXBwICovXG4gIFJvbGVDb25uZWN0aW9uc1dyaXRlID0gJ3JvbGVfY29ubmVjdGlvbnMud3JpdGUnLFxuICAvKipcbiAgICogRm9yIGxvY2FsIHJwYyBzZXJ2ZXIgYWNjZXNzLCB0aGlzIGFsbG93cyB5b3UgdG8gY29udHJvbCBhIHVzZXIncyBsb2NhbCBEaXNjb3JkIGNsaWVudFxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIHNjb3BlIHJlcXVpcmVzIERpc2NvcmQgYXBwcm92YWwgdG8gYmUgdXNlZFxuICAgKi9cbiAgUlBDID0gJ3JwYycsXG4gIC8qKlxuICAgKiBGb3IgbG9jYWwgcnBjIHNlcnZlciBhY2Nlc3MsIHRoaXMgYWxsb3dzIHlvdSB0byB1cGRhdGUgYSB1c2VyJ3MgYWN0aXZpdHlcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBzY29wZSByZXF1aXJlcyBEaXNjb3JkIGFwcHJvdmFsIHRvIGJlIHVzZWRcbiAgICovXG4gIFJQQ0FjdGl2aXRpZXNXcml0ZSA9ICdycGMuYWN0aXZpdGllcy53cml0ZScsXG4gIC8qKlxuICAgKiBGb3IgbG9jYWwgcnBjIHNlcnZlciBhcGkgYWNjZXNzLCB0aGlzIGFsbG93cyB5b3UgdG8gcmVjZWl2ZSBub3RpZmljYXRpb25zIHB1c2hlZCBvdXQgdG8gdGhlIHVzZXJcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBzY29wZSByZXF1aXJlcyBEaXNjb3JkIGFwcHJvdmFsIHRvIGJlIHVzZWRcbiAgICovXG4gIFJQQ05vdGlmaWNhdGlvbnNSZWFkID0gJ3JwYy5ub3RpZmljYXRpb25zLnJlYWQnLFxuICAvKipcbiAgICogRm9yIGxvY2FsIHJwYyBzZXJ2ZXIgYWNjZXNzLCB0aGlzIGFsbG93cyB5b3UgdG8gcmVhZCBhIHVzZXIncyB2b2ljZSBzZXR0aW5ncyBhbmQgbGlzdGVuIGZvciB2b2ljZSBldmVudHNcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBzY29wZSByZXF1aXJlcyBEaXNjb3JkIGFwcHJvdmFsIHRvIGJlIHVzZWRcbiAgICovXG4gIFJQQ1ZvaWNlUmVhZCA9ICdycGMudm9pY2UucmVhZCcsXG4gIC8qKlxuICAgKiBGb3IgbG9jYWwgcnBjIHNlcnZlciBhY2Nlc3MsIHRoaXMgYWxsb3dzIHlvdSB0byB1cGRhdGUgYSB1c2VyJ3Mgdm9pY2Ugc2V0dGluZ3NcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBzY29wZSByZXF1aXJlcyBEaXNjb3JkIGFwcHJvdmFsIHRvIGJlIHVzZWRcbiAgICovXG4gIFJQQ1ZvaWNlV3JpdGUgPSAncnBjLnZvaWNlLndyaXRlJyxcbiAgLyoqXG4gICAqIEFsbG93cyB5b3VyIGFwcCB0byBjb25uZWN0IHRvIHZvaWNlIG9uIHVzZXIncyBiZWhhbGYgYW5kIHNlZSBhbGwgdGhlIHZvaWNlIG1lbWJlcnNcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBzY29wZSByZXF1aXJlcyBEaXNjb3JkIGFwcHJvdmFsIHRvIGJlIHVzZWRcbiAgICovXG4gIFZvaWNlID0gJ3ZvaWNlJyxcbiAgLyoqIEdlbmVyYXRlIGEgd2ViaG9vayB0aGF0IGlzIHJldHVybmVkIGluIHRoZSBvYXV0aCB0b2tlbiByZXNwb25zZSBmb3IgYXV0aG9yaXphdGlvbiBjb2RlIGdyYW50cyAqL1xuICBXZWJob29rSW5jb21pbmcgPSAnd2ViaG9vay5pbmNvbWluZycsXG59XG5cbi8qKiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy90b3BpY3Mvb2F1dGgyI2F1dGhvcml6YXRpb24tY29kZS1ncmFudC1yZWRpcmVjdC11cmwtZXhhbXBsZSAqL1xuZXhwb3J0IGludGVyZmFjZSBEaXNjb3JkVG9rZW5FeGNoYW5nZUF1dGhvcml6YXRpb25Db2RlIHtcbiAgZ3JhbnRfdHlwZTogJ2F1dGhvcml6YXRpb25fY29kZSdcbiAgLyoqIFRoZSBjb2RlIGZvciB0aGUgdG9rZW4gZXhjaGFuZ2UgKi9cbiAgY29kZTogc3RyaW5nXG4gIC8qKiBUaGUgcmVkaXJlY3RfdXJpIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGF1dGhvcml6YXRpb24gKi9cbiAgcmVkaXJlY3RfdXJpOiBzdHJpbmdcbn1cblxuLyoqIGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3RvcGljcy9vYXV0aDIjYXV0aG9yaXphdGlvbi1jb2RlLWdyYW50LWFjY2Vzcy10b2tlbi1yZXNwb25zZSAqL1xuZXhwb3J0IGludGVyZmFjZSBEaXNjb3JkQWNjZXNzVG9rZW5SZXNwb25zZSB7XG4gIC8qKiBUaGUgYWNjZXNzIHRva2VuIG9mIHRoZSB1c2VyICovXG4gIGFjY2Vzc190b2tlbjogc3RyaW5nXG4gIC8qKiBUaGUgdHlwZSBvZiB0b2tlbiAqL1xuICB0b2tlbl90eXBlOiBzdHJpbmdcbiAgLyoqIFRoZSBudW1iZXIgb2Ygc2Vjb25kcyBhZnRlciB0aGF0IHRoZSBhY2Nlc3MgdG9rZW4gaXMgZXhwaXJlZCAqL1xuICBleHBpcmVzX2luOiBudW1iZXJcbiAgLyoqXG4gICAqIFRoZSByZWZyZXNoIHRva2VuIHRvIHJlZnJlc2ggdGhlIGFjY2VzcyB0b2tlblxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBXaGVuIHRoZSB0b2tlbiBleGNoYW5nZSBpcyBhIGNsaWVudCBjcmVkZW50aWFscyB0eXBlIGdyYW50IHRoaXMgdmFsdWUgaXMgbm90IGRlZmluZWQuXG4gICAqL1xuICByZWZyZXNoX3Rva2VuOiBzdHJpbmdcbiAgLyoqIFRoZSBzY29wZXMgZm9yIHRoZSBhY2Nlc3MgdG9rZW4gKi9cbiAgc2NvcGU6IHN0cmluZ1xuICAvKiogVGhlIHdlYmhvb2sgdGhlIHVzZXIgY3JlYXRlZCBmb3IgdGhlIGFwcGxpY2F0aW9uLiBSZXF1aXJlcyB0aGUgYHdlYmhvb2suaW5jb21pbmdgIHNjb3BlICovXG4gIHdlYmhvb2s/OiBEaXNjb3JkV2ViaG9va1xuICAvKiogVGhlIGd1aWxkIHRoZSBib3QgaGFzIGJlZW4gYWRkZWQuIFJlcXVpcmVzIHRoZSBgYm90YCBzY29wZSAqL1xuICBndWlsZD86IERpc2NvcmRHdWlsZFxufVxuXG4vKipcbiAqIGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3RvcGljcy9vYXV0aDIjYXV0aG9yaXphdGlvbi1jb2RlLWdyYW50XG4gKiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy90b3BpY3Mvb2F1dGgyI2NsaWVudC1jcmVkZW50aWFscy1ncmFudFxuICovXG5leHBvcnQgdHlwZSBEaXNjb3JkVG9rZW5FeGNoYW5nZSA9IERpc2NvcmRUb2tlbkV4Y2hhbmdlQXV0aG9yaXphdGlvbkNvZGUgfCBEaXNjb3JkVG9rZW5FeGNoYW5nZVJlZnJlc2hUb2tlbiB8IERpc2NvcmRUb2tlbkV4Y2hhbmdlQ2xpZW50Q3JlZGVudGlhbHNcblxuLyoqIGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3RvcGljcy9vYXV0aDIjYXV0aG9yaXphdGlvbi1jb2RlLWdyYW50LXJlZnJlc2gtdG9rZW4tZXhjaGFuZ2UtZXhhbXBsZSAqL1xuZXhwb3J0IGludGVyZmFjZSBEaXNjb3JkVG9rZW5FeGNoYW5nZVJlZnJlc2hUb2tlbiB7XG4gIGdyYW50X3R5cGU6ICdyZWZyZXNoX3Rva2VuJ1xuICAvKiogdGhlIHVzZXIncyByZWZyZXNoIHRva2VuICovXG4gIHJlZnJlc2hfdG9rZW46IHN0cmluZ1xufVxuXG4vKiogaHR0cHM6Ly9kaXNjb3JkLmNvbS9kZXZlbG9wZXJzL2RvY3MvdG9waWNzL29hdXRoMiNhdXRob3JpemF0aW9uLWNvZGUtZ3JhbnQtdG9rZW4tcmV2b2NhdGlvbi1leGFtcGxlICovXG5leHBvcnQgaW50ZXJmYWNlIERpc2NvcmRUb2tlblJldm9jYXRpb24ge1xuICAvKiogVGhlIGFjY2VzcyB0b2tlbiB0byByZXZva2UgKi9cbiAgdG9rZW46IHN0cmluZ1xuICAvKiogT3B0aW9uYWwsIHRoZSB0eXBlIG9mIHRva2VuIHlvdSBhcmUgdXNpbmcgZm9yIHRoZSByZXZvY2F0aW9uICovXG4gIHRva2VuX3R5cGVfaGludD86ICdhY2Nlc3NfdG9rZW4nIHwgJ3JlZnJlc2hfdG9rZW4nXG59XG5cbi8qKiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy90b3BpY3Mvb2F1dGgyI2NsaWVudC1jcmVkZW50aWFscy1ncmFudCAqL1xuZXhwb3J0IGludGVyZmFjZSBEaXNjb3JkVG9rZW5FeGNoYW5nZUNsaWVudENyZWRlbnRpYWxzIHtcbiAgZ3JhbnRfdHlwZTogJ2NsaWVudF9jcmVkZW50aWFscydcbiAgLyoqIFRoZSBzY29wZShzKSBmb3IgdGhlIGFjY2VzcyB0b2tlbiAqL1xuICBzY29wZTogT0F1dGgyU2NvcGVbXVxufVxuXG4vKiogaHR0cHM6Ly9kaXNjb3JkLmNvbS9kZXZlbG9wZXJzL2RvY3MvdG9waWNzL29hdXRoMiNnZXQtY3VycmVudC1hdXRob3JpemF0aW9uLWluZm9ybWF0aW9uLXJlc3BvbnNlLXN0cnVjdHVyZSAqL1xuZXhwb3J0IGludGVyZmFjZSBEaXNjb3JkQ3VycmVudEF1dGhvcml6YXRpb24ge1xuICBhcHBsaWNhdGlvbjogRGlzY29yZEFwcGxpY2F0aW9uXG4gIC8qKiB0aGUgc2NvcGVzIHRoZSB1c2VyIGhhcyBhdXRob3JpemVkIHRoZSBhcHBsaWNhdGlvbiBmb3IgKi9cbiAgc2NvcGVzOiBPQXV0aDJTY29wZVtdXG4gIC8qKiB3aGVuIHRoZSBhY2Nlc3MgdG9rZW4gZXhwaXJlcyAqL1xuICBleHBpcmVzOiBzdHJpbmdcbiAgLyoqIHRoZSB1c2VyIHdobyBoYXMgYXV0aG9yaXplZCwgaWYgdGhlIHVzZXIgaGFzIGF1dGhvcml6ZWQgd2l0aCB0aGUgYGlkZW50aWZ5YCBzY29wZSAqL1xuICB1c2VyPzogRGlzY29yZFVzZXJcbn1cbiJdLCJuYW1lcyI6WyJPQXV0aDJTY29wZSJdLCJtYXBwaW5ncyI6IkFBQUEsaUVBQWlFLEdBT2pFLHFGQUFxRixHQUNyRixPQUFPLElBQUEsQUFBS0EscUNBQUFBO0lBQ1Y7Ozs7O0dBS0M7SUFFRDs7Ozs7R0FLQztJQUVELGlFQUFpRTtJQUVqRTs7Ozs7R0FLQztJQUVELDBGQUEwRjtJQUUxRjs7Ozs7R0FLQztJQUVELGdHQUFnRztJQUVoRyxtRUFBbUU7SUFFbkUsdUhBQXVIO0lBRXZILCtFQUErRTtJQUUvRSx5SEFBeUg7SUFFekg7Ozs7O0dBS0M7SUFFRCxnSEFBZ0g7SUFFaEgsZ0RBQWdEO0lBRWhELHVIQUF1SDtJQUV2SCxvSUFBb0k7SUFFcEksK0lBQStJO0lBRS9JOzs7Ozs7R0FNQztJQUVEOzs7R0FHQztJQUVEOzs7OztHQUtDO0lBRUQsMkVBQTJFO0lBRTNFOzs7OztHQUtDO0lBRUQ7Ozs7O0dBS0M7SUFFRDs7Ozs7R0FLQztJQUVEOzs7OztHQUtDO0lBRUQ7Ozs7O0dBS0M7SUFFRDs7Ozs7R0FLQztJQUVELGtHQUFrRztXQTVIeEZBO01BOEhYIn0=
