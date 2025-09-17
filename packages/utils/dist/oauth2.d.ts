import type { BigString, DiscordApplicationIntegrationType, OAuth2Scope, PermissionStrings } from '@discordeno/types'
export declare function createOAuth2Link(options: CreateOAuth2LinkOptions): string
export interface CreateOAuth2LinkOptions {
  /**
   * The type of response
   *
   * @remarks
   * Should be defined only if using either OAuth2 authorization, implicit or not, or [advanced bot authorization](https://discord.com/developers/docs/topics/oauth2#advanced-bot-authorization)
   */
  responseType?: 'code' | 'token'
  /** The id of the application */
  clientId: BigString
  /** The scopes for the application */
  scope: OAuth2Scope[]
  /**
   * The optional state for security
   *
   * @see https://discord.com/developers/docs/topics/oauth2#state-and-security
   */
  state?: string
  /**
   * The redirect uri for after the authentication
   *
   * @remarks
   * Should be defined only if using either OAuth2 authorization, implicit or not, or [advanced bot authorization](https://discord.com/developers/docs/topics/oauth2#advanced-bot-authorization)
   */
  redirectUri?: string
  /**
   * The type of prompt to give to the user
   *
   * @remarks
   * If set to `none`, it will skip the authorization screen and redirect them back to your redirect URI without requesting their authorization.
   * For passthrough scopes, like bot and webhook.incoming, authorization is always required.
   */
  prompt?: 'consent' | 'none'
  /**
   * The permissions of the invited bot
   *
   * @remarks
   * Should be defined only in a [bot authorization flow](https://discord.com/developers/docs/topics/oauth2#bot-authorization-flow) or with [advanced bot authorization](https://discord.com/developers/docs/topics/oauth2#advanced-bot-authorization)
   */
  permissions?: BigString | PermissionStrings[]
  /**
   * Pre-fills the dropdown picker with a guild for the user
   *
   * @remarks
   * Should be defined only in a [bot authorization flow](https://discord.com/developers/docs/topics/oauth2#bot-authorization-flow) or with [advanced bot authorization](https://discord.com/developers/docs/topics/oauth2#advanced-bot-authorization) or with the `webhook.incoming` scope
   */
  guildId?: BigString
  /**
   * Disallows the user from changing the guild dropdown if set to true
   *
   * @remarks
   * Should be defined only in a [bot authorization flow](https://discord.com/developers/docs/topics/oauth2#bot-authorization-flow), with [advanced bot authorization](https://discord.com/developers/docs/topics/oauth2#advanced-bot-authorization) or with the `webhook.incoming` scope
   */
  disableGuildSelect?: boolean
  /**
   * Specifies the installation context for the authorization
   *
   * @remarks
   * Should be defined only when {@link scope} includes {@link OAuth2Scope.ApplicationsCommands}.
   *
   * When set to GuildInstall (0) the application will be authorized for installation to a server, and when set to UserInstall (1) the application will be authorized for installation to a user.
   *
   * The application must be configured in the Developer Portal to support the provided `integrationType`.
   */
  integrationType?: DiscordApplicationIntegrationType
}
//# sourceMappingURL=oauth2.d.ts.map
