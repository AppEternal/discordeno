/**
 * A builder to help create Discord embeds.
 *
 * @example
 * const embeds = new EmbedsBuilder()
 *  .setTitle('My Embed')
 *  .setDescription('This is my new embed')
 *  .newEmbed()
 *  .setTitle('My Second Embed')
 */ export class EmbedsBuilder extends Array {
    #currentEmbedIndex;
    /**
   * Adds a new field to the current embed.
   *
   * @param {string} name - Field name
   * @param {string} value - Field value
   * @param {?boolean} [inline=false] - Field should be inline or not.
   * @returns {EmbedsBuilder}
   */ addField(name, value, inline) {
        if (this.#currentEmbed.fields === undefined) {
            this.#currentEmbed.fields = [];
        }
        this.#currentEmbed.fields.push({
            name,
            value,
            inline
        });
        return this;
    }
    /**
   * Adds multiple new fields to the current embed.
   *
   * @param {DiscordEmbedField[]} fields - The fields to add
   * @returns {EmbedsBuilder}
   */ addFields(fields) {
        if (this.#currentEmbed.fields === undefined) {
            this.#currentEmbed.fields = [];
        }
        this.#currentEmbed.fields.push(...fields);
        return this;
    }
    /**
   * Creates a blank embed.
   *
   * @returns {EmbedsBuilder}
   */ newEmbed() {
        if (this.length >= 10) {
            throw new Error('Maximum embed count exceeded. You can not have more than 10 embeds.');
        }
        this.push({});
        this.setCurrentEmbed();
        return this;
    }
    /**
   * Set the current embed author.
   *
   * @param {string} name - Name of the author
   * @param {?Omit<DiscordEmbedAuthor, 'name'>} [options] - Extra author options
   * @returns {EmbedsBuilder}
   */ setAuthor(name, options) {
        this.#currentEmbed.author = {
            ...this.#currentEmbed.author,
            ...options,
            name
        };
        return this;
    }
    /**
   * Set the color on the side of the current embed.
   *
   * @param {(number | string)} color - The color, in base16 or hex color code
   * @returns {EmbedsBuilder}
   */ setColor(color) {
        if (typeof color === 'string') {
            if (color.toLowerCase() === 'random') {
                return this.setRandomColor();
            }
            const convertedValue = parseInt(color.replace('#', ''), 16);
            color = Number.isNaN(convertedValue) ? 0 : convertedValue;
        }
        this.#currentEmbed.color = color;
        return this;
    }
    /**
   * Set the current embed to a different index.
   *
   * WARNING: Only use this method if you know what you're doing. Make sure to set it back to the latest when you're done.
   *
   * @param {?number} [index] - The index of the embed in the EmbedsBuilder array
   * @returns {EmbedsBuilder}
   */ setCurrentEmbed(index) {
        if (index === undefined) {
            this.#currentEmbedIndex = this.length - 1;
            return this;
        }
        if (index >= this.length || index < 0) {
            throw new Error('Can not set the current embed to a index out of bounds.');
        }
        this.#currentEmbedIndex = index;
        return this;
    }
    /**
   * Set the description of the current embed.
   *
   * @param {string} description - Description
   * @returns {EmbedsBuilder}
   */ setDescription(description) {
        this.#currentEmbed.description = description;
        return this;
    }
    /**
   * Overwrite all fields on the current embed.
   *
   * @param {DiscordEmbedField[]} fields
   * @returns {EmbedsBuilder}
   */ setFields(fields) {
        this.#currentEmbed.fields = fields;
        return this;
    }
    /**
   * Set the footer in the current embed.
   *
   * @param {string} text - The text to display in the footer
   * @param {?Omit<DiscordEmbedFooter, 'text'>} [options]
   * @returns {EmbedsBuilder}
   */ setFooter(text, options) {
        this.#currentEmbed.footer = {
            ...this.#currentEmbed.footer,
            ...options,
            text
        };
        return this;
    }
    /**
   * Set the image in the current embed.
   *
   * @param {string} url - URL of the image
   * @param {?Omit<DiscordEmbedImage, 'url'>} [options]
   * @returns {EmbedsBuilder}
   */ setImage(url, options) {
        this.#currentEmbed.image = {
            ...this.#currentEmbed.image,
            ...options,
            url
        };
        return this;
    }
    /**
   * Set the provider of the current embed.
   *
   * @param {string} name
   * @param {?string} [url]
   * @returns {EmbedsBuilder}
   */ setProvider(name, url) {
        this.#currentEmbed.provider = {
            name,
            url
        };
        return this;
    }
    /**
   * Set the color of the current embed to a random value.
   *
   * @returns {EmbedsBuilder}
   */ setRandomColor() {
        return this.setColor(Math.floor(Math.random() * (0xffffff + 1)));
    }
    /**
   * Set the title of the current embed.
   *
   * @param {string} title
   * @param {?string} [url]
   * @returns {EmbedsBuilder}
   */ setTitle(title, url) {
        this.#currentEmbed.title = title;
        if (url) {
            this.setUrl(url);
        }
        return this;
    }
    /**
   * Set the timestamp of the current embed.
   *
   * @param {?(string | number | Date)} [timestamp]
   * @returns {EmbedsBuilder}
   */ setTimestamp(timestamp) {
        this.#currentEmbed.timestamp = new Date(timestamp ?? Date.now()).toISOString();
        return this;
    }
    /**
   * Set the thumbnail of the current embed.
   *
   * @param {string} url - URL of the image
   * @param {?Omit<DiscordEmbedThumbnail, 'url'>} [options]
   * @returns {EmbedsBuilder}
   */ setThumbnail(url, options) {
        this.#currentEmbed.thumbnail = {
            ...this.#currentEmbed.thumbnail,
            ...options,
            url
        };
        return this;
    }
    /**
   * Set the URL of the current embed title.
   *
   * @param {string} url
   * @returns {EmbedsBuilder}
   */ setUrl(url) {
        this.#currentEmbed.url = url;
        return this;
    }
    /**
   * Set the video of the current embed.
   *
   * @param {string} url
   * @param {?Omit<DiscordEmbedVideo, 'url'>} [options]
   * @returns {EmbedsBuilder}
   */ setVideo(url, options) {
        this.#currentEmbed.video = {
            ...this.#currentEmbed.video,
            ...options,
            url
        };
        return this;
    }
    /**
   * Validate all embeds available against current known Discord limits to help prevent bad requests.
   *
   * @returns {EmbedsBuilder}
   */ validate() {
        let totalCharacters = 0;
        if (this.length > 10) {
            throw new Error('You can not have more than 10 embeds on a single message.');
        }
        this.forEach(({ author, description, fields, footer, title }, index)=>{
            if (title) {
                const trimmedTitle = title.trim();
                if (trimmedTitle.length > 256) {
                    throw new Error(`Title of embed ${index} can not be longer than 256 characters.`);
                }
                totalCharacters += trimmedTitle.length;
            }
            if (description) {
                const trimmedDescription = description.trim();
                if (trimmedDescription.length > 4096) {
                    throw new Error(`Description of embed ${index} can not be longer than 4096 characters.`);
                }
                totalCharacters += trimmedDescription.length;
            }
            if (fields) {
                if (fields.length > 25) {
                    throw new Error(`embed ${index} can not have more than 25 fields.`);
                }
                fields.forEach(({ name, value }, fieldIndex)=>{
                    const trimmedName = name.trim();
                    const trimmedValue = value.trim();
                    if (trimmedName.length > 256) {
                        throw new Error(`Name of field ${fieldIndex} on embed ${index} can not be longer than 256 characters.`);
                    }
                    if (trimmedValue.length > 4096) {
                        throw new Error(`Value of field ${fieldIndex} on embed ${index} can not be longer than 1024 characters.`);
                    }
                    totalCharacters += trimmedName.length;
                    totalCharacters += trimmedValue.length;
                });
            }
            if (footer) {
                const trimmedFooterText = footer.text.trim();
                if (trimmedFooterText.length > 2048) {
                    throw new Error(`Footer text of embed ${index} can not be longer than 2048 characters.`);
                }
                totalCharacters += trimmedFooterText.length;
            }
            if (author) {
                const trimmedAuthorName = author.name.trim();
                if (trimmedAuthorName.length > 256) {
                    throw new Error(`Author name of embed ${index} can not be longer than 256 characters.`);
                }
                totalCharacters += trimmedAuthorName.length;
            }
        });
        if (totalCharacters > 6000) {
            throw new Error('Total character length of all embeds can not exceed 6000 characters.');
        }
        return this;
    }
    /**
   * Returns the current embed.
   *
   * @readonly
   * @type {DiscordEmbed}
   */ get #currentEmbed() {
        if (this.length === 0) {
            this.newEmbed();
            this.setCurrentEmbed();
        }
        return this[this.#currentEmbedIndex];
    }
    constructor(...args){
        super(...args), this.#currentEmbedIndex = 0;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9idWlsZGVycy9lbWJlZHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUge1xuICBEaXNjb3JkRW1iZWQsXG4gIERpc2NvcmRFbWJlZEF1dGhvcixcbiAgRGlzY29yZEVtYmVkRmllbGQsXG4gIERpc2NvcmRFbWJlZEZvb3RlcixcbiAgRGlzY29yZEVtYmVkSW1hZ2UsXG4gIERpc2NvcmRFbWJlZFRodW1ibmFpbCxcbiAgRGlzY29yZEVtYmVkVmlkZW8sXG59IGZyb20gJ0BkaXNjb3JkZW5vL3R5cGVzJ1xuXG4vKipcbiAqIEEgYnVpbGRlciB0byBoZWxwIGNyZWF0ZSBEaXNjb3JkIGVtYmVkcy5cbiAqXG4gKiBAZXhhbXBsZVxuICogY29uc3QgZW1iZWRzID0gbmV3IEVtYmVkc0J1aWxkZXIoKVxuICogIC5zZXRUaXRsZSgnTXkgRW1iZWQnKVxuICogIC5zZXREZXNjcmlwdGlvbignVGhpcyBpcyBteSBuZXcgZW1iZWQnKVxuICogIC5uZXdFbWJlZCgpXG4gKiAgLnNldFRpdGxlKCdNeSBTZWNvbmQgRW1iZWQnKVxuICovXG5leHBvcnQgY2xhc3MgRW1iZWRzQnVpbGRlciBleHRlbmRzIEFycmF5PERpc2NvcmRFbWJlZD4ge1xuICAjY3VycmVudEVtYmVkSW5kZXg6IG51bWJlciA9IDBcblxuICAvKipcbiAgICogQWRkcyBhIG5ldyBmaWVsZCB0byB0aGUgY3VycmVudCBlbWJlZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgLSBGaWVsZCBuYW1lXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSAtIEZpZWxkIHZhbHVlXG4gICAqIEBwYXJhbSB7P2Jvb2xlYW59IFtpbmxpbmU9ZmFsc2VdIC0gRmllbGQgc2hvdWxkIGJlIGlubGluZSBvciBub3QuXG4gICAqIEByZXR1cm5zIHtFbWJlZHNCdWlsZGVyfVxuICAgKi9cbiAgYWRkRmllbGQobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBpbmxpbmU/OiBib29sZWFuKTogdGhpcyB7XG4gICAgaWYgKHRoaXMuI2N1cnJlbnRFbWJlZC5maWVsZHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy4jY3VycmVudEVtYmVkLmZpZWxkcyA9IFtdXG4gICAgfVxuXG4gICAgdGhpcy4jY3VycmVudEVtYmVkLmZpZWxkcy5wdXNoKHtcbiAgICAgIG5hbWUsXG4gICAgICB2YWx1ZSxcbiAgICAgIGlubGluZSxcbiAgICB9KVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIG11bHRpcGxlIG5ldyBmaWVsZHMgdG8gdGhlIGN1cnJlbnQgZW1iZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7RGlzY29yZEVtYmVkRmllbGRbXX0gZmllbGRzIC0gVGhlIGZpZWxkcyB0byBhZGRcbiAgICogQHJldHVybnMge0VtYmVkc0J1aWxkZXJ9XG4gICAqL1xuICBhZGRGaWVsZHMoZmllbGRzOiBEaXNjb3JkRW1iZWRGaWVsZFtdKTogdGhpcyB7XG4gICAgaWYgKHRoaXMuI2N1cnJlbnRFbWJlZC5maWVsZHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy4jY3VycmVudEVtYmVkLmZpZWxkcyA9IFtdXG4gICAgfVxuXG4gICAgdGhpcy4jY3VycmVudEVtYmVkLmZpZWxkcy5wdXNoKC4uLmZpZWxkcylcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGJsYW5rIGVtYmVkLlxuICAgKlxuICAgKiBAcmV0dXJucyB7RW1iZWRzQnVpbGRlcn1cbiAgICovXG4gIG5ld0VtYmVkKCk6IHRoaXMge1xuICAgIGlmICh0aGlzLmxlbmd0aCA+PSAxMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNYXhpbXVtIGVtYmVkIGNvdW50IGV4Y2VlZGVkLiBZb3UgY2FuIG5vdCBoYXZlIG1vcmUgdGhhbiAxMCBlbWJlZHMuJylcbiAgICB9XG5cbiAgICB0aGlzLnB1c2goe30pXG4gICAgdGhpcy5zZXRDdXJyZW50RW1iZWQoKVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGN1cnJlbnQgZW1iZWQgYXV0aG9yLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIE5hbWUgb2YgdGhlIGF1dGhvclxuICAgKiBAcGFyYW0gez9PbWl0PERpc2NvcmRFbWJlZEF1dGhvciwgJ25hbWUnPn0gW29wdGlvbnNdIC0gRXh0cmEgYXV0aG9yIG9wdGlvbnNcbiAgICogQHJldHVybnMge0VtYmVkc0J1aWxkZXJ9XG4gICAqL1xuICBzZXRBdXRob3IobmFtZTogc3RyaW5nLCBvcHRpb25zPzogT21pdDxEaXNjb3JkRW1iZWRBdXRob3IsICduYW1lJz4pOiB0aGlzIHtcbiAgICB0aGlzLiNjdXJyZW50RW1iZWQuYXV0aG9yID0ge1xuICAgICAgLi4udGhpcy4jY3VycmVudEVtYmVkLmF1dGhvcixcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBuYW1lLFxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjb2xvciBvbiB0aGUgc2lkZSBvZiB0aGUgY3VycmVudCBlbWJlZC5cbiAgICpcbiAgICogQHBhcmFtIHsobnVtYmVyIHwgc3RyaW5nKX0gY29sb3IgLSBUaGUgY29sb3IsIGluIGJhc2UxNiBvciBoZXggY29sb3IgY29kZVxuICAgKiBAcmV0dXJucyB7RW1iZWRzQnVpbGRlcn1cbiAgICovXG4gIHNldENvbG9yKGNvbG9yOiBudW1iZXIgfCBzdHJpbmcpOiB0aGlzIHtcbiAgICBpZiAodHlwZW9mIGNvbG9yID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKGNvbG9yLnRvTG93ZXJDYXNlKCkgPT09ICdyYW5kb20nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldFJhbmRvbUNvbG9yKClcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29udmVydGVkVmFsdWUgPSBwYXJzZUludChjb2xvci5yZXBsYWNlKCcjJywgJycpLCAxNilcbiAgICAgIGNvbG9yID0gTnVtYmVyLmlzTmFOKGNvbnZlcnRlZFZhbHVlKSA/IDAgOiBjb252ZXJ0ZWRWYWx1ZVxuICAgIH1cblxuICAgIHRoaXMuI2N1cnJlbnRFbWJlZC5jb2xvciA9IGNvbG9yXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgY3VycmVudCBlbWJlZCB0byBhIGRpZmZlcmVudCBpbmRleC5cbiAgICpcbiAgICogV0FSTklORzogT25seSB1c2UgdGhpcyBtZXRob2QgaWYgeW91IGtub3cgd2hhdCB5b3UncmUgZG9pbmcuIE1ha2Ugc3VyZSB0byBzZXQgaXQgYmFjayB0byB0aGUgbGF0ZXN0IHdoZW4geW91J3JlIGRvbmUuXG4gICAqXG4gICAqIEBwYXJhbSB7P251bWJlcn0gW2luZGV4XSAtIFRoZSBpbmRleCBvZiB0aGUgZW1iZWQgaW4gdGhlIEVtYmVkc0J1aWxkZXIgYXJyYXlcbiAgICogQHJldHVybnMge0VtYmVkc0J1aWxkZXJ9XG4gICAqL1xuICBzZXRDdXJyZW50RW1iZWQoaW5kZXg/OiBudW1iZXIpOiB0aGlzIHtcbiAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy4jY3VycmVudEVtYmVkSW5kZXggPSB0aGlzLmxlbmd0aCAtIDFcblxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICBpZiAoaW5kZXggPj0gdGhpcy5sZW5ndGggfHwgaW5kZXggPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3Qgc2V0IHRoZSBjdXJyZW50IGVtYmVkIHRvIGEgaW5kZXggb3V0IG9mIGJvdW5kcy4nKVxuICAgIH1cblxuICAgIHRoaXMuI2N1cnJlbnRFbWJlZEluZGV4ID0gaW5kZXhcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBkZXNjcmlwdGlvbiBvZiB0aGUgY3VycmVudCBlbWJlZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGRlc2NyaXB0aW9uIC0gRGVzY3JpcHRpb25cbiAgICogQHJldHVybnMge0VtYmVkc0J1aWxkZXJ9XG4gICAqL1xuICBzZXREZXNjcmlwdGlvbihkZXNjcmlwdGlvbjogc3RyaW5nKTogdGhpcyB7XG4gICAgdGhpcy4jY3VycmVudEVtYmVkLmRlc2NyaXB0aW9uID0gZGVzY3JpcHRpb25cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlIGFsbCBmaWVsZHMgb24gdGhlIGN1cnJlbnQgZW1iZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7RGlzY29yZEVtYmVkRmllbGRbXX0gZmllbGRzXG4gICAqIEByZXR1cm5zIHtFbWJlZHNCdWlsZGVyfVxuICAgKi9cbiAgc2V0RmllbGRzKGZpZWxkczogRGlzY29yZEVtYmVkRmllbGRbXSk6IHRoaXMge1xuICAgIHRoaXMuI2N1cnJlbnRFbWJlZC5maWVsZHMgPSBmaWVsZHNcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBmb290ZXIgaW4gdGhlIGN1cnJlbnQgZW1iZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGhlIHRleHQgdG8gZGlzcGxheSBpbiB0aGUgZm9vdGVyXG4gICAqIEBwYXJhbSB7P09taXQ8RGlzY29yZEVtYmVkRm9vdGVyLCAndGV4dCc+fSBbb3B0aW9uc11cbiAgICogQHJldHVybnMge0VtYmVkc0J1aWxkZXJ9XG4gICAqL1xuICBzZXRGb290ZXIodGV4dDogc3RyaW5nLCBvcHRpb25zPzogT21pdDxEaXNjb3JkRW1iZWRGb290ZXIsICd0ZXh0Jz4pOiB0aGlzIHtcbiAgICB0aGlzLiNjdXJyZW50RW1iZWQuZm9vdGVyID0ge1xuICAgICAgLi4udGhpcy4jY3VycmVudEVtYmVkLmZvb3RlcixcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICB0ZXh0LFxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBpbWFnZSBpbiB0aGUgY3VycmVudCBlbWJlZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVybCAtIFVSTCBvZiB0aGUgaW1hZ2VcbiAgICogQHBhcmFtIHs/T21pdDxEaXNjb3JkRW1iZWRJbWFnZSwgJ3VybCc+fSBbb3B0aW9uc11cbiAgICogQHJldHVybnMge0VtYmVkc0J1aWxkZXJ9XG4gICAqL1xuICBzZXRJbWFnZSh1cmw6IHN0cmluZywgb3B0aW9ucz86IE9taXQ8RGlzY29yZEVtYmVkSW1hZ2UsICd1cmwnPik6IHRoaXMge1xuICAgIHRoaXMuI2N1cnJlbnRFbWJlZC5pbWFnZSA9IHtcbiAgICAgIC4uLnRoaXMuI2N1cnJlbnRFbWJlZC5pbWFnZSxcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICB1cmwsXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHByb3ZpZGVyIG9mIHRoZSBjdXJyZW50IGVtYmVkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgKiBAcGFyYW0gez9zdHJpbmd9IFt1cmxdXG4gICAqIEByZXR1cm5zIHtFbWJlZHNCdWlsZGVyfVxuICAgKi9cbiAgc2V0UHJvdmlkZXIobmFtZTogc3RyaW5nLCB1cmw/OiBzdHJpbmcpOiB0aGlzIHtcbiAgICB0aGlzLiNjdXJyZW50RW1iZWQucHJvdmlkZXIgPSB7XG4gICAgICBuYW1lLFxuICAgICAgdXJsLFxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjb2xvciBvZiB0aGUgY3VycmVudCBlbWJlZCB0byBhIHJhbmRvbSB2YWx1ZS5cbiAgICpcbiAgICogQHJldHVybnMge0VtYmVkc0J1aWxkZXJ9XG4gICAqL1xuICBzZXRSYW5kb21Db2xvcigpOiB0aGlzIHtcbiAgICByZXR1cm4gdGhpcy5zZXRDb2xvcihNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoMHhmZmZmZmYgKyAxKSkpXG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSB0aXRsZSBvZiB0aGUgY3VycmVudCBlbWJlZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRpdGxlXG4gICAqIEBwYXJhbSB7P3N0cmluZ30gW3VybF1cbiAgICogQHJldHVybnMge0VtYmVkc0J1aWxkZXJ9XG4gICAqL1xuICBzZXRUaXRsZSh0aXRsZTogc3RyaW5nLCB1cmw/OiBzdHJpbmcpOiB0aGlzIHtcbiAgICB0aGlzLiNjdXJyZW50RW1iZWQudGl0bGUgPSB0aXRsZVxuXG4gICAgaWYgKHVybCkge1xuICAgICAgdGhpcy5zZXRVcmwodXJsKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSB0aW1lc3RhbXAgb2YgdGhlIGN1cnJlbnQgZW1iZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7PyhzdHJpbmcgfCBudW1iZXIgfCBEYXRlKX0gW3RpbWVzdGFtcF1cbiAgICogQHJldHVybnMge0VtYmVkc0J1aWxkZXJ9XG4gICAqL1xuICBzZXRUaW1lc3RhbXAodGltZXN0YW1wPzogc3RyaW5nIHwgbnVtYmVyIHwgRGF0ZSk6IHRoaXMge1xuICAgIHRoaXMuI2N1cnJlbnRFbWJlZC50aW1lc3RhbXAgPSBuZXcgRGF0ZSh0aW1lc3RhbXAgPz8gRGF0ZS5ub3coKSkudG9JU09TdHJpbmcoKVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHRodW1ibmFpbCBvZiB0aGUgY3VycmVudCBlbWJlZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVybCAtIFVSTCBvZiB0aGUgaW1hZ2VcbiAgICogQHBhcmFtIHs/T21pdDxEaXNjb3JkRW1iZWRUaHVtYm5haWwsICd1cmwnPn0gW29wdGlvbnNdXG4gICAqIEByZXR1cm5zIHtFbWJlZHNCdWlsZGVyfVxuICAgKi9cbiAgc2V0VGh1bWJuYWlsKHVybDogc3RyaW5nLCBvcHRpb25zPzogT21pdDxEaXNjb3JkRW1iZWRUaHVtYm5haWwsICd1cmwnPik6IHRoaXMge1xuICAgIHRoaXMuI2N1cnJlbnRFbWJlZC50aHVtYm5haWwgPSB7XG4gICAgICAuLi50aGlzLiNjdXJyZW50RW1iZWQudGh1bWJuYWlsLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIHVybCxcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgVVJMIG9mIHRoZSBjdXJyZW50IGVtYmVkIHRpdGxlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsXG4gICAqIEByZXR1cm5zIHtFbWJlZHNCdWlsZGVyfVxuICAgKi9cbiAgc2V0VXJsKHVybDogc3RyaW5nKTogdGhpcyB7XG4gICAgdGhpcy4jY3VycmVudEVtYmVkLnVybCA9IHVybFxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHZpZGVvIG9mIHRoZSBjdXJyZW50IGVtYmVkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsXG4gICAqIEBwYXJhbSB7P09taXQ8RGlzY29yZEVtYmVkVmlkZW8sICd1cmwnPn0gW29wdGlvbnNdXG4gICAqIEByZXR1cm5zIHtFbWJlZHNCdWlsZGVyfVxuICAgKi9cbiAgc2V0VmlkZW8odXJsOiBzdHJpbmcsIG9wdGlvbnM/OiBPbWl0PERpc2NvcmRFbWJlZFZpZGVvLCAndXJsJz4pOiB0aGlzIHtcbiAgICB0aGlzLiNjdXJyZW50RW1iZWQudmlkZW8gPSB7XG4gICAgICAuLi50aGlzLiNjdXJyZW50RW1iZWQudmlkZW8sXG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgdXJsLFxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgYWxsIGVtYmVkcyBhdmFpbGFibGUgYWdhaW5zdCBjdXJyZW50IGtub3duIERpc2NvcmQgbGltaXRzIHRvIGhlbHAgcHJldmVudCBiYWQgcmVxdWVzdHMuXG4gICAqXG4gICAqIEByZXR1cm5zIHtFbWJlZHNCdWlsZGVyfVxuICAgKi9cbiAgdmFsaWRhdGUoKTogdGhpcyB7XG4gICAgbGV0IHRvdGFsQ2hhcmFjdGVycyA9IDBcblxuICAgIGlmICh0aGlzLmxlbmd0aCA+IDEwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBjYW4gbm90IGhhdmUgbW9yZSB0aGFuIDEwIGVtYmVkcyBvbiBhIHNpbmdsZSBtZXNzYWdlLicpXG4gICAgfVxuXG4gICAgdGhpcy5mb3JFYWNoKCh7IGF1dGhvciwgZGVzY3JpcHRpb24sIGZpZWxkcywgZm9vdGVyLCB0aXRsZSB9LCBpbmRleCkgPT4ge1xuICAgICAgaWYgKHRpdGxlKSB7XG4gICAgICAgIGNvbnN0IHRyaW1tZWRUaXRsZSA9IHRpdGxlLnRyaW0oKVxuXG4gICAgICAgIGlmICh0cmltbWVkVGl0bGUubGVuZ3RoID4gMjU2KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaXRsZSBvZiBlbWJlZCAke2luZGV4fSBjYW4gbm90IGJlIGxvbmdlciB0aGFuIDI1NiBjaGFyYWN0ZXJzLmApXG4gICAgICAgIH1cblxuICAgICAgICB0b3RhbENoYXJhY3RlcnMgKz0gdHJpbW1lZFRpdGxlLmxlbmd0aFxuICAgICAgfVxuXG4gICAgICBpZiAoZGVzY3JpcHRpb24pIHtcbiAgICAgICAgY29uc3QgdHJpbW1lZERlc2NyaXB0aW9uID0gZGVzY3JpcHRpb24udHJpbSgpXG5cbiAgICAgICAgaWYgKHRyaW1tZWREZXNjcmlwdGlvbi5sZW5ndGggPiA0MDk2KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEZXNjcmlwdGlvbiBvZiBlbWJlZCAke2luZGV4fSBjYW4gbm90IGJlIGxvbmdlciB0aGFuIDQwOTYgY2hhcmFjdGVycy5gKVxuICAgICAgICB9XG5cbiAgICAgICAgdG90YWxDaGFyYWN0ZXJzICs9IHRyaW1tZWREZXNjcmlwdGlvbi5sZW5ndGhcbiAgICAgIH1cblxuICAgICAgaWYgKGZpZWxkcykge1xuICAgICAgICBpZiAoZmllbGRzLmxlbmd0aCA+IDI1KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBlbWJlZCAke2luZGV4fSBjYW4gbm90IGhhdmUgbW9yZSB0aGFuIDI1IGZpZWxkcy5gKVxuICAgICAgICB9XG5cbiAgICAgICAgZmllbGRzLmZvckVhY2goKHsgbmFtZSwgdmFsdWUgfSwgZmllbGRJbmRleCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHRyaW1tZWROYW1lID0gbmFtZS50cmltKClcbiAgICAgICAgICBjb25zdCB0cmltbWVkVmFsdWUgPSB2YWx1ZS50cmltKClcblxuICAgICAgICAgIGlmICh0cmltbWVkTmFtZS5sZW5ndGggPiAyNTYpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTmFtZSBvZiBmaWVsZCAke2ZpZWxkSW5kZXh9IG9uIGVtYmVkICR7aW5kZXh9IGNhbiBub3QgYmUgbG9uZ2VyIHRoYW4gMjU2IGNoYXJhY3RlcnMuYClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodHJpbW1lZFZhbHVlLmxlbmd0aCA+IDQwOTYpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVmFsdWUgb2YgZmllbGQgJHtmaWVsZEluZGV4fSBvbiBlbWJlZCAke2luZGV4fSBjYW4gbm90IGJlIGxvbmdlciB0aGFuIDEwMjQgY2hhcmFjdGVycy5gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRvdGFsQ2hhcmFjdGVycyArPSB0cmltbWVkTmFtZS5sZW5ndGhcbiAgICAgICAgICB0b3RhbENoYXJhY3RlcnMgKz0gdHJpbW1lZFZhbHVlLmxlbmd0aFxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBpZiAoZm9vdGVyKSB7XG4gICAgICAgIGNvbnN0IHRyaW1tZWRGb290ZXJUZXh0ID0gZm9vdGVyLnRleHQudHJpbSgpXG5cbiAgICAgICAgaWYgKHRyaW1tZWRGb290ZXJUZXh0Lmxlbmd0aCA+IDIwNDgpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZvb3RlciB0ZXh0IG9mIGVtYmVkICR7aW5kZXh9IGNhbiBub3QgYmUgbG9uZ2VyIHRoYW4gMjA0OCBjaGFyYWN0ZXJzLmApXG4gICAgICAgIH1cblxuICAgICAgICB0b3RhbENoYXJhY3RlcnMgKz0gdHJpbW1lZEZvb3RlclRleHQubGVuZ3RoXG4gICAgICB9XG5cbiAgICAgIGlmIChhdXRob3IpIHtcbiAgICAgICAgY29uc3QgdHJpbW1lZEF1dGhvck5hbWUgPSBhdXRob3IubmFtZS50cmltKClcblxuICAgICAgICBpZiAodHJpbW1lZEF1dGhvck5hbWUubGVuZ3RoID4gMjU2KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBdXRob3IgbmFtZSBvZiBlbWJlZCAke2luZGV4fSBjYW4gbm90IGJlIGxvbmdlciB0aGFuIDI1NiBjaGFyYWN0ZXJzLmApXG4gICAgICAgIH1cblxuICAgICAgICB0b3RhbENoYXJhY3RlcnMgKz0gdHJpbW1lZEF1dGhvck5hbWUubGVuZ3RoXG4gICAgICB9XG4gICAgfSlcblxuICAgIGlmICh0b3RhbENoYXJhY3RlcnMgPiA2MDAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RvdGFsIGNoYXJhY3RlciBsZW5ndGggb2YgYWxsIGVtYmVkcyBjYW4gbm90IGV4Y2VlZCA2MDAwIGNoYXJhY3RlcnMuJylcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGN1cnJlbnQgZW1iZWQuXG4gICAqXG4gICAqIEByZWFkb25seVxuICAgKiBAdHlwZSB7RGlzY29yZEVtYmVkfVxuICAgKi9cbiAgZ2V0ICNjdXJyZW50RW1iZWQoKTogRGlzY29yZEVtYmVkIHtcbiAgICBpZiAodGhpcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMubmV3RW1iZWQoKVxuICAgICAgdGhpcy5zZXRDdXJyZW50RW1iZWQoKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzW3RoaXMuI2N1cnJlbnRFbWJlZEluZGV4XVxuICB9XG59XG4iXSwibmFtZXMiOlsiRW1iZWRzQnVpbGRlciIsIkFycmF5IiwiYWRkRmllbGQiLCJuYW1lIiwidmFsdWUiLCJpbmxpbmUiLCJmaWVsZHMiLCJ1bmRlZmluZWQiLCJwdXNoIiwiYWRkRmllbGRzIiwibmV3RW1iZWQiLCJsZW5ndGgiLCJFcnJvciIsInNldEN1cnJlbnRFbWJlZCIsInNldEF1dGhvciIsIm9wdGlvbnMiLCJhdXRob3IiLCJzZXRDb2xvciIsImNvbG9yIiwidG9Mb3dlckNhc2UiLCJzZXRSYW5kb21Db2xvciIsImNvbnZlcnRlZFZhbHVlIiwicGFyc2VJbnQiLCJyZXBsYWNlIiwiTnVtYmVyIiwiaXNOYU4iLCJpbmRleCIsInNldERlc2NyaXB0aW9uIiwiZGVzY3JpcHRpb24iLCJzZXRGaWVsZHMiLCJzZXRGb290ZXIiLCJ0ZXh0IiwiZm9vdGVyIiwic2V0SW1hZ2UiLCJ1cmwiLCJpbWFnZSIsInNldFByb3ZpZGVyIiwicHJvdmlkZXIiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJzZXRUaXRsZSIsInRpdGxlIiwic2V0VXJsIiwic2V0VGltZXN0YW1wIiwidGltZXN0YW1wIiwiRGF0ZSIsIm5vdyIsInRvSVNPU3RyaW5nIiwic2V0VGh1bWJuYWlsIiwidGh1bWJuYWlsIiwic2V0VmlkZW8iLCJ2aWRlbyIsInZhbGlkYXRlIiwidG90YWxDaGFyYWN0ZXJzIiwiZm9yRWFjaCIsInRyaW1tZWRUaXRsZSIsInRyaW0iLCJ0cmltbWVkRGVzY3JpcHRpb24iLCJmaWVsZEluZGV4IiwidHJpbW1lZE5hbWUiLCJ0cmltbWVkVmFsdWUiLCJ0cmltbWVkRm9vdGVyVGV4dCIsInRyaW1tZWRBdXRob3JOYW1lIl0sIm1hcHBpbmdzIjoiQUFVQTs7Ozs7Ozs7O0NBU0MsR0FDRCxPQUFPLE1BQU1BLHNCQUFzQkM7SUFDakMsQ0FBQSxpQkFBa0IsQ0FBWTtJQUU5Qjs7Ozs7OztHQU9DLEdBQ0RDLFNBQVNDLElBQVksRUFBRUMsS0FBYSxFQUFFQyxNQUFnQixFQUFRO1FBQzVELElBQUksSUFBSSxDQUFDLENBQUEsWUFBYSxDQUFDQyxNQUFNLEtBQUtDLFdBQVc7WUFDM0MsSUFBSSxDQUFDLENBQUEs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