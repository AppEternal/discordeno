import type {
  DiscordEmbed,
  DiscordEmbedAuthor,
  DiscordEmbedField,
  DiscordEmbedFooter,
  DiscordEmbedImage,
  DiscordEmbedThumbnail,
  DiscordEmbedVideo,
} from '@discordeno/types'
/**
 * A builder to help create Discord embeds.
 *
 * @example
 * const embeds = new EmbedsBuilder()
 *  .setTitle('My Embed')
 *  .setDescription('This is my new embed')
 *  .newEmbed()
 *  .setTitle('My Second Embed')
 */
export declare class EmbedsBuilder extends Array<DiscordEmbed> {
  #private
  /**
   * Adds a new field to the current embed.
   *
   * @param {string} name - Field name
   * @param {string} value - Field value
   * @param {?boolean} [inline=false] - Field should be inline or not.
   * @returns {EmbedsBuilder}
   */
  addField(name: string, value: string, inline?: boolean): this
  /**
   * Adds multiple new fields to the current embed.
   *
   * @param {DiscordEmbedField[]} fields - The fields to add
   * @returns {EmbedsBuilder}
   */
  addFields(fields: DiscordEmbedField[]): this
  /**
   * Creates a blank embed.
   *
   * @returns {EmbedsBuilder}
   */
  newEmbed(): this
  /**
   * Set the current embed author.
   *
   * @param {string} name - Name of the author
   * @param {?Omit<DiscordEmbedAuthor, 'name'>} [options] - Extra author options
   * @returns {EmbedsBuilder}
   */
  setAuthor(name: string, options?: Omit<DiscordEmbedAuthor, 'name'>): this
  /**
   * Set the color on the side of the current embed.
   *
   * @param {(number | string)} color - The color, in base16 or hex color code
   * @returns {EmbedsBuilder}
   */
  setColor(color: number | string): this
  /**
   * Set the current embed to a different index.
   *
   * WARNING: Only use this method if you know what you're doing. Make sure to set it back to the latest when you're done.
   *
   * @param {?number} [index] - The index of the embed in the EmbedsBuilder array
   * @returns {EmbedsBuilder}
   */
  setCurrentEmbed(index?: number): this
  /**
   * Set the description of the current embed.
   *
   * @param {string} description - Description
   * @returns {EmbedsBuilder}
   */
  setDescription(description: string): this
  /**
   * Overwrite all fields on the current embed.
   *
   * @param {DiscordEmbedField[]} fields
   * @returns {EmbedsBuilder}
   */
  setFields(fields: DiscordEmbedField[]): this
  /**
   * Set the footer in the current embed.
   *
   * @param {string} text - The text to display in the footer
   * @param {?Omit<DiscordEmbedFooter, 'text'>} [options]
   * @returns {EmbedsBuilder}
   */
  setFooter(text: string, options?: Omit<DiscordEmbedFooter, 'text'>): this
  /**
   * Set the image in the current embed.
   *
   * @param {string} url - URL of the image
   * @param {?Omit<DiscordEmbedImage, 'url'>} [options]
   * @returns {EmbedsBuilder}
   */
  setImage(url: string, options?: Omit<DiscordEmbedImage, 'url'>): this
  /**
   * Set the provider of the current embed.
   *
   * @param {string} name
   * @param {?string} [url]
   * @returns {EmbedsBuilder}
   */
  setProvider(name: string, url?: string): this
  /**
   * Set the color of the current embed to a random value.
   *
   * @returns {EmbedsBuilder}
   */
  setRandomColor(): this
  /**
   * Set the title of the current embed.
   *
   * @param {string} title
   * @param {?string} [url]
   * @returns {EmbedsBuilder}
   */
  setTitle(title: string, url?: string): this
  /**
   * Set the timestamp of the current embed.
   *
   * @param {?(string | number | Date)} [timestamp]
   * @returns {EmbedsBuilder}
   */
  setTimestamp(timestamp?: string | number | Date): this
  /**
   * Set the thumbnail of the current embed.
   *
   * @param {string} url - URL of the image
   * @param {?Omit<DiscordEmbedThumbnail, 'url'>} [options]
   * @returns {EmbedsBuilder}
   */
  setThumbnail(url: string, options?: Omit<DiscordEmbedThumbnail, 'url'>): this
  /**
   * Set the URL of the current embed title.
   *
   * @param {string} url
   * @returns {EmbedsBuilder}
   */
  setUrl(url: string): this
  /**
   * Set the video of the current embed.
   *
   * @param {string} url
   * @param {?Omit<DiscordEmbedVideo, 'url'>} [options]
   * @returns {EmbedsBuilder}
   */
  setVideo(url: string, options?: Omit<DiscordEmbedVideo, 'url'>): this
  /**
   * Validate all embeds available against current known Discord limits to help prevent bad requests.
   *
   * @returns {EmbedsBuilder}
   */
  validate(): this
}
//# sourceMappingURL=embeds.d.ts.map
