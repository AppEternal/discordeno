import { GuildFeatures } from '@discordeno/types';
import { ToggleBitfieldBigint } from './ToggleBitfield.js';
/** @private This is subject to breaking changes without notices */ export const guildFeatureNames = [
    'animatedBanner',
    'animatedIcon',
    'applicationCommandPermissionsV2',
    'autoModeration',
    'banner',
    'community',
    'creatorMonetizableProvisional',
    'creatorStorePage',
    'developerSupportServer',
    'discoverable',
    'featurable',
    'invitesDisabled',
    'inviteSplash',
    'memberVerificationGateEnabled',
    'moreSoundboard',
    'moreStickers',
    'news',
    'partnered',
    'previewEnabled',
    'raidAlertsDisabled',
    'roleIcons',
    'roleSubscriptionsAvailableForPurchase',
    'roleSubscriptionsEnabled',
    'ticketedEventsEnabled',
    'vanityUrl',
    'verified',
    'vipRegions',
    'welcomeScreenEnabled',
    'guestsEnabled',
    'guildTags',
    'enhancedRoleColors'
];
export const GuildToggle = {
    /** Whether the bot is the owner of the guild */ owner: 1n << 0n,
    /** Whether the server widget is enabled */ widgetEnabled: 1n << 1n,
    /** Whether this is considered a large guild */ large: 1n << 2n,
    /** Whether this guild is unavailable due to an outage */ unavailable: 1n << 3n,
    /** Whether the guild has the boost progress bar enabled */ premiumProgressBarEnabled: 1n << 4n,
    // GUILD FEATURES ARE BELOW THIS
    /** Whether the guild has access to set an animated guild banner image */ animatedBanner: 1n << 11n,
    /** Whether the guild has access to set an animated guild icon */ animatedIcon: 1n << 16n,
    /** Whether the guild is using the old permissions configuration behavior */ applicationCommandPermissionsV2: 1n << 14n,
    /** Whether the guild has set up auto moderation rules */ autoModeration: 1n << 28n,
    /** Whether the guild has access to set a guild banner image */ banner: 1n << 17n,
    /** Whether the guild can enable welcome screen, Membership Screening, stage channels and discovery, and receives community updates */ community: 1n << 10n,
    /** Whether the guild has enabled monetization. */ creatorMonetizableProvisional: 1n << 31n,
    /** Whether the guild has enabled the role subscription promo page. */ creatorStorePage: 1n << 32n,
    /** Whether the guild has been set as a support server on the App Directory */ developerSupportServer: 1n << 30n,
    /** Whether the guild is able to be discovered in the directory */ discoverable: 1n << 13n,
    /** Whether the guild is able to be featured in the directory */ featurable: 1n << 15n,
    /** Whether the guild has paused invites, preventing new users from joining */ invitesDisabled: 1n << 29n,
    /** Whether the guild has access to set an invite splash background */ inviteSplash: 1n << 5n,
    /** Whether the guild has enabled [Membership Screening](https://discord.com/developers/docs/resources/guild#membership-screening-object) */ memberVerificationGateEnabled: 1n << 19n,
    /** Whether the guild has more soundboard sound slot */ moreSoundboard: 1n << 24n,
    /** Whether the guild has increased custom sticker slots */ moreStickers: 1n << 23n,
    /** Whether the guild has access to create news channels */ news: 1n << 12n,
    /** Whether the guild is partnered */ partnered: 1n << 9n,
    /** Whether the guild can be previewed before joining via Membership Screening or the directory */ previewEnabled: 1n << 20n,
    /** Whether the guild has disabled alerts for join raids in the configured safety alerts channel */ raidAlertsDisabled: 1n << 22n,
    /** Whether the guild is able to set role icons */ roleIcons: 1n << 27n,
    /** Whether the guild has role subscriptions that can be purchased. */ roleSubscriptionsAvailableForPurchase: 1n << 33n,
    /** Whether the guild has enabled role subscriptions. */ roleSubscriptionsEnabled: 1n << 34n,
    /** Whether the guild has created soundboard sounds. */ soundboard: 1n << 25n,
    /** Whether the guild has enabled ticketed events */ ticketedEventsEnabled: 1n << 21n,
    /** Whether the guild has access to set a vanity URL */ vanityUrl: 1n << 7n,
    /** Whether the guild is verified */ verified: 1n << 8n,
    /** Whether the guild has access to set 384 kbps bitrate in voice (previously VIP voice servers) */ vipRegions: 1n << 6n,
    /** Whether the guild has enabled the welcome screen */ welcomeScreenEnabled: 1n << 18n,
    /** Whether the guild has access to guest invites */ guestsEnabled: 1n << 26n,
    /** Whether the guild has access to set guild tags */ guildTags: 1n << 36n,
    /** Whether the guild is able to set gradient colors to roles */ enhancedRoleColors: 1n << 35n
};
export class GuildToggles extends ToggleBitfieldBigint {
    constructor(guildOrTogglesBigint){
        super();
        if (typeof guildOrTogglesBigint === 'bigint') this.bitfield = guildOrTogglesBigint;
        else {
            const guild = guildOrTogglesBigint;
            // Cause discord be smart like that
            if (!guild.features) guild.features = [];
            if (guild.owner) this.add(GuildToggle.owner);
            if (guild.widget_enabled) this.add(GuildToggle.widgetEnabled);
            if (guild.large) this.add(GuildToggle.large);
            if (guild.unavailable) this.add(GuildToggle.unavailable);
            if (guild.premium_progress_bar_enabled) this.add(GuildToggle.premiumProgressBarEnabled);
            if (guild.features.includes(GuildFeatures.AnimatedBanner)) this.add(GuildToggle.animatedBanner);
            if (guild.features.includes(GuildFeatures.AnimatedIcon)) this.add(GuildToggle.animatedIcon);
            if (guild.features.includes(GuildFeatures.ApplicationCommandPermissionsV2)) this.add(GuildToggle.applicationCommandPermissionsV2);
            if (guild.features.includes(GuildFeatures.AutoModeration)) this.add(GuildToggle.autoModeration);
            if (guild.features.includes(GuildFeatures.Banner)) this.add(GuildToggle.banner);
            if (guild.features.includes(GuildFeatures.Community)) this.add(GuildToggle.community);
            if (guild.features.includes(GuildFeatures.CreatorMonetizableProvisional)) this.add(GuildToggle.creatorMonetizableProvisional);
            if (guild.features.includes(GuildFeatures.CreatorStorePage)) this.add(GuildToggle.creatorStorePage);
            if (guild.features.includes(GuildFeatures.DeveloperSupportServer)) this.add(GuildToggle.developerSupportServer);
            if (guild.features.includes(GuildFeatures.Discoverable)) this.add(GuildToggle.discoverable);
            if (guild.features.includes(GuildFeatures.Featurable)) this.add(GuildToggle.featurable);
            if (guild.features.includes(GuildFeatures.InvitesDisabled)) this.add(GuildToggle.invitesDisabled);
            if (guild.features.includes(GuildFeatures.InviteSplash)) this.add(GuildToggle.inviteSplash);
            if (guild.features.includes(GuildFeatures.MemberVerificationGateEnabled)) this.add(GuildToggle.memberVerificationGateEnabled);
            if (guild.features.includes(GuildFeatures.MoreSoundboard)) this.add(GuildToggle.moreSoundboard);
            if (guild.features.includes(GuildFeatures.MoreStickers)) this.add(GuildToggle.moreStickers);
            if (guild.features.includes(GuildFeatures.News)) this.add(GuildToggle.news);
            if (guild.features.includes(GuildFeatures.Partnered)) this.add(GuildToggle.partnered);
            if (guild.features.includes(GuildFeatures.PreviewEnabled)) this.add(GuildToggle.previewEnabled);
            if (guild.features.includes(GuildFeatures.RaidAlertsDisabled)) this.add(GuildToggle.raidAlertsDisabled);
            if (guild.features.includes(GuildFeatures.RoleIcons)) this.add(GuildToggle.roleIcons);
            if (guild.features.includes(GuildFeatures.RoleSubscriptionsAvailableForPurchase)) this.add(GuildToggle.roleSubscriptionsAvailableForPurchase);
            if (guild.features.includes(GuildFeatures.RoleSubscriptionsEnabled)) this.add(GuildToggle.roleSubscriptionsEnabled);
            if (guild.features.includes(GuildFeatures.Soundboard)) this.add(GuildToggle.soundboard);
            if (guild.features.includes(GuildFeatures.TicketedEventsEnabled)) this.add(GuildToggle.ticketedEventsEnabled);
            if (guild.features.includes(GuildFeatures.VanityUrl)) this.add(GuildToggle.vanityUrl);
            if (guild.features.includes(GuildFeatures.Verified)) this.add(GuildToggle.verified);
            if (guild.features.includes(GuildFeatures.VipRegions)) this.add(GuildToggle.vipRegions);
            if (guild.features.includes(GuildFeatures.WelcomeScreenEnabled)) this.add(GuildToggle.welcomeScreenEnabled);
            if (guild.features.includes(GuildFeatures.GuestsEnabled)) this.add(GuildToggle.guestsEnabled);
            if (guild.features.includes(GuildFeatures.GuildTags)) this.add(GuildToggle.guildTags);
            if (guild.features.includes(GuildFeatures.EnhancedRoleColors)) this.add(GuildToggle.enhancedRoleColors);
        }
    }
    get features() {
        const features = [];
        for (const key of Object.keys(GuildToggle)){
            if (!guildFeatureNames.includes(key)) continue;
            if (!super.contains(GuildToggle[key])) continue;
            features.push(key);
        }
        return features;
    }
    /** Whether the bot is the owner of the guild */ get owner() {
        return this.has('owner');
    }
    /** Whether the server widget is enabled */ get widgetEnabled() {
        return this.has('widgetEnabled');
    }
    /** Whether this is considered a large guild */ get large() {
        return this.has('large');
    }
    /** Whether this guild is unavailable due to an outage */ get unavailable() {
        return this.has('unavailable');
    }
    /** Whether the guild has the boost progress bar enabled */ get premiumProgressBarEnabled() {
        return this.has('premiumProgressBarEnabled');
    }
    /** Whether the guild has access to set an invite splash background */ get inviteSplash() {
        return this.has('inviteSplash');
    }
    /** Whether the guild has access to set 384 kbps bitrate in voice (previously VIP voice servers) */ get vipRegions() {
        return this.has('vipRegions');
    }
    /** Whether the guild has access to set a vanity URL */ get vanityUrl() {
        return this.has('vanityUrl');
    }
    /** Whether the guild is verified */ get verified() {
        return this.has('verified');
    }
    /** Whether the guild is partnered */ get partnered() {
        return this.has('partnered');
    }
    /** Whether the guild can enable welcome screen, Membership Screening, stage channels and discovery, and receives community updates */ get community() {
        return this.has('community');
    }
    /** Whether the Guild has been set as a support server on the App Directory */ get developerSupportServer() {
        return this.has('developerSupportServer');
    }
    /** Whether the guild has access to set an animated guild banner image */ get animatedBanner() {
        return this.has('animatedBanner');
    }
    /** Whether the guild has access to create news channels */ get news() {
        return this.has('news');
    }
    /** Whether the guild is able to be discovered in the directory */ get discoverable() {
        return this.has('discoverable');
    }
    /** Whether the guild is able to be featured in the directory */ get featurable() {
        return this.has('featurable');
    }
    /** Whether the guild has access to set an animated guild icon */ get animatedIcon() {
        return this.has('animatedIcon');
    }
    /** Whether the guild has access to set a guild banner image */ get banner() {
        return this.has('banner');
    }
    /** Whether the guild has enabled the welcome screen */ get welcomeScreenEnabled() {
        return this.has('welcomeScreenEnabled');
    }
    /** Whether the guild has enabled [Membership Screening](https://discord.com/developers/docs/resources/guild#membership-screening-object) */ get memberVerificationGateEnabled() {
        return this.has('memberVerificationGateEnabled');
    }
    /** Whether the guild has more soundboard sound slot */ get moreSoundboard() {
        return this.has('moreSoundboard');
    }
    /** Whether the guild can be previewed before joining via Membership Screening or the directory */ get previewEnabled() {
        return this.has('previewEnabled');
    }
    /** Whether the guild has enabled ticketed events */ get ticketedEventsEnabled() {
        return this.has('ticketedEventsEnabled');
    }
    /** Whether the guild has increased custom sticker slots */ get moreStickers() {
        return this.has('moreStickers');
    }
    /** Whether the guild is able to set role icons */ get roleIcons() {
        return this.has('roleIcons');
    }
    /** Whether the guild has set up auto moderation rules */ get autoModeration() {
        return this.has('autoModeration');
    }
    /** Whether the guild has paused invites, preventing new users from joining */ get invitesDisabled() {
        return this.has('invitesDisabled');
    }
    /** Whether the guild is using the old permissions configuration behavior */ get applicationCommandPermissionsV2() {
        return this.has('applicationCommandPermissionsV2');
    }
    /** Whether the guild has enabled monetization. */ get creatorMonetizableProvisional() {
        return this.has('creatorMonetizableProvisional');
    }
    /** Whether the guild has enabled the role subscription promo page. */ get creatorStorePage() {
        return this.has('creatorStorePage');
    }
    /** Whether the guild has disabled alerts for join raids in the configured safety alerts channel */ get raidAlertsDisabled() {
        return this.has('raidAlertsDisabled');
    }
    /** Whether the guild has role subscriptions that can be purchased. */ get roleSubscriptionsAvailableForPurchase() {
        return this.has('roleSubscriptionsAvailableForPurchase');
    }
    /** Whether the guild has enabled role subscriptions. */ get roleSubscriptionsEnabled() {
        return this.has('roleSubscriptionsEnabled');
    }
    /** Whether the guild has created soundboard sounds. */ get soundboard() {
        return this.has('soundboard');
    }
    /** Whether the guild has access to guest invites */ get guestsEnabled() {
        return this.has('guestsEnabled');
    }
    /** Whether the guild has access to set guild tags */ get guildTags() {
        return this.has('guildTags');
    }
    /** Whether the guild is able to set gradient colors to roles */ get enhancedRoleColors() {
        return this.has('enhancedRoleColors');
    }
    /** Checks whether or not the permissions exist in this */ has(permissions) {
        if (!Array.isArray(permissions)) return super.contains(GuildToggle[permissions]);
        return super.contains(permissions.reduce((a, b)=>a |= GuildToggle[b], 0n));
    }
    /** Lists all the toggles for the role and whether or not each is true or false. */ list() {
        const json = {};
        for (const [key, value] of Object.entries(GuildToggle)){
            json[key] = super.contains(value);
        }
        return json;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvdG9nZ2xlcy9ndWlsZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB0eXBlIERpc2NvcmRHdWlsZCwgR3VpbGRGZWF0dXJlcyB9IGZyb20gJ0BkaXNjb3JkZW5vL3R5cGVzJ1xuaW1wb3J0IHsgVG9nZ2xlQml0ZmllbGRCaWdpbnQgfSBmcm9tICcuL1RvZ2dsZUJpdGZpZWxkLmpzJ1xuXG4vKiogQHByaXZhdGUgVGhpcyBpcyBzdWJqZWN0IHRvIGJyZWFraW5nIGNoYW5nZXMgd2l0aG91dCBub3RpY2VzICovXG5leHBvcnQgY29uc3QgZ3VpbGRGZWF0dXJlTmFtZXMgPSBbXG4gICdhbmltYXRlZEJhbm5lcicsXG4gICdhbmltYXRlZEljb24nLFxuICAnYXBwbGljYXRpb25Db21tYW5kUGVybWlzc2lvbnNWMicsXG4gICdhdXRvTW9kZXJhdGlvbicsXG4gICdiYW5uZXInLFxuICAnY29tbXVuaXR5JyxcbiAgJ2NyZWF0b3JNb25ldGl6YWJsZVByb3Zpc2lvbmFsJyxcbiAgJ2NyZWF0b3JTdG9yZVBhZ2UnLFxuICAnZGV2ZWxvcGVyU3VwcG9ydFNlcnZlcicsXG4gICdkaXNjb3ZlcmFibGUnLFxuICAnZmVhdHVyYWJsZScsXG4gICdpbnZpdGVzRGlzYWJsZWQnLFxuICAnaW52aXRlU3BsYXNoJyxcbiAgJ21lbWJlclZlcmlmaWNhdGlvbkdhdGVFbmFibGVkJyxcbiAgJ21vcmVTb3VuZGJvYXJkJyxcbiAgJ21vcmVTdGlja2VycycsXG4gICduZXdzJyxcbiAgJ3BhcnRuZXJlZCcsXG4gICdwcmV2aWV3RW5hYmxlZCcsXG4gICdyYWlkQWxlcnRzRGlzYWJsZWQnLFxuICAncm9sZUljb25zJyxcbiAgJ3JvbGVTdWJzY3JpcHRpb25zQXZhaWxhYmxlRm9yUHVyY2hhc2UnLFxuICAncm9sZVN1YnNjcmlwdGlvbnNFbmFibGVkJyxcbiAgJ3RpY2tldGVkRXZlbnRzRW5hYmxlZCcsXG4gICd2YW5pdHlVcmwnLFxuICAndmVyaWZpZWQnLFxuICAndmlwUmVnaW9ucycsXG4gICd3ZWxjb21lU2NyZWVuRW5hYmxlZCcsXG4gICdndWVzdHNFbmFibGVkJyxcbiAgJ2d1aWxkVGFncycsXG4gICdlbmhhbmNlZFJvbGVDb2xvcnMnLFxuXSBhcyBjb25zdFxuXG5leHBvcnQgY29uc3QgR3VpbGRUb2dnbGUgPSB7XG4gIC8qKiBXaGV0aGVyIHRoZSBib3QgaXMgdGhlIG93bmVyIG9mIHRoZSBndWlsZCAqL1xuICBvd25lcjogMW4gPDwgMG4sXG4gIC8qKiBXaGV0aGVyIHRoZSBzZXJ2ZXIgd2lkZ2V0IGlzIGVuYWJsZWQgKi9cbiAgd2lkZ2V0RW5hYmxlZDogMW4gPDwgMW4sXG4gIC8qKiBXaGV0aGVyIHRoaXMgaXMgY29uc2lkZXJlZCBhIGxhcmdlIGd1aWxkICovXG4gIGxhcmdlOiAxbiA8PCAybixcbiAgLyoqIFdoZXRoZXIgdGhpcyBndWlsZCBpcyB1bmF2YWlsYWJsZSBkdWUgdG8gYW4gb3V0YWdlICovXG4gIHVuYXZhaWxhYmxlOiAxbiA8PCAzbixcbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyB0aGUgYm9vc3QgcHJvZ3Jlc3MgYmFyIGVuYWJsZWQgKi9cbiAgcHJlbWl1bVByb2dyZXNzQmFyRW5hYmxlZDogMW4gPDwgNG4sXG5cbiAgLy8gR1VJTEQgRkVBVFVSRVMgQVJFIEJFTE9XIFRISVNcblxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIGFjY2VzcyB0byBzZXQgYW4gYW5pbWF0ZWQgZ3VpbGQgYmFubmVyIGltYWdlICovXG4gIGFuaW1hdGVkQmFubmVyOiAxbiA8PCAxMW4sXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBoYXMgYWNjZXNzIHRvIHNldCBhbiBhbmltYXRlZCBndWlsZCBpY29uICovXG4gIGFuaW1hdGVkSWNvbjogMW4gPDwgMTZuLFxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaXMgdXNpbmcgdGhlIG9sZCBwZXJtaXNzaW9ucyBjb25maWd1cmF0aW9uIGJlaGF2aW9yICovXG4gIGFwcGxpY2F0aW9uQ29tbWFuZFBlcm1pc3Npb25zVjI6IDFuIDw8IDE0bixcbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBzZXQgdXAgYXV0byBtb2RlcmF0aW9uIHJ1bGVzICovXG4gIGF1dG9Nb2RlcmF0aW9uOiAxbiA8PCAyOG4sXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBoYXMgYWNjZXNzIHRvIHNldCBhIGd1aWxkIGJhbm5lciBpbWFnZSAqL1xuICBiYW5uZXI6IDFuIDw8IDE3bixcbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGNhbiBlbmFibGUgd2VsY29tZSBzY3JlZW4sIE1lbWJlcnNoaXAgU2NyZWVuaW5nLCBzdGFnZSBjaGFubmVscyBhbmQgZGlzY292ZXJ5LCBhbmQgcmVjZWl2ZXMgY29tbXVuaXR5IHVwZGF0ZXMgKi9cbiAgY29tbXVuaXR5OiAxbiA8PCAxMG4sXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBoYXMgZW5hYmxlZCBtb25ldGl6YXRpb24uICovXG4gIGNyZWF0b3JNb25ldGl6YWJsZVByb3Zpc2lvbmFsOiAxbiA8PCAzMW4sXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBoYXMgZW5hYmxlZCB0aGUgcm9sZSBzdWJzY3JpcHRpb24gcHJvbW8gcGFnZS4gKi9cbiAgY3JlYXRvclN0b3JlUGFnZTogMW4gPDwgMzJuLFxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIGJlZW4gc2V0IGFzIGEgc3VwcG9ydCBzZXJ2ZXIgb24gdGhlIEFwcCBEaXJlY3RvcnkgKi9cbiAgZGV2ZWxvcGVyU3VwcG9ydFNlcnZlcjogMW4gPDwgMzBuLFxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaXMgYWJsZSB0byBiZSBkaXNjb3ZlcmVkIGluIHRoZSBkaXJlY3RvcnkgKi9cbiAgZGlzY292ZXJhYmxlOiAxbiA8PCAxM24sXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBpcyBhYmxlIHRvIGJlIGZlYXR1cmVkIGluIHRoZSBkaXJlY3RvcnkgKi9cbiAgZmVhdHVyYWJsZTogMW4gPDwgMTVuLFxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIHBhdXNlZCBpbnZpdGVzLCBwcmV2ZW50aW5nIG5ldyB1c2VycyBmcm9tIGpvaW5pbmcgKi9cbiAgaW52aXRlc0Rpc2FibGVkOiAxbiA8PCAyOW4sXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBoYXMgYWNjZXNzIHRvIHNldCBhbiBpbnZpdGUgc3BsYXNoIGJhY2tncm91bmQgKi9cbiAgaW52aXRlU3BsYXNoOiAxbiA8PCA1bixcbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBlbmFibGVkIFtNZW1iZXJzaGlwIFNjcmVlbmluZ10oaHR0cHM6Ly9kaXNjb3JkLmNvbS9kZXZlbG9wZXJzL2RvY3MvcmVzb3VyY2VzL2d1aWxkI21lbWJlcnNoaXAtc2NyZWVuaW5nLW9iamVjdCkgKi9cbiAgbWVtYmVyVmVyaWZpY2F0aW9uR2F0ZUVuYWJsZWQ6IDFuIDw8IDE5bixcbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBtb3JlIHNvdW5kYm9hcmQgc291bmQgc2xvdCAqL1xuICBtb3JlU291bmRib2FyZDogMW4gPDwgMjRuLFxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIGluY3JlYXNlZCBjdXN0b20gc3RpY2tlciBzbG90cyAqL1xuICBtb3JlU3RpY2tlcnM6IDFuIDw8IDIzbixcbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBhY2Nlc3MgdG8gY3JlYXRlIG5ld3MgY2hhbm5lbHMgKi9cbiAgbmV3czogMW4gPDwgMTJuLFxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaXMgcGFydG5lcmVkICovXG4gIHBhcnRuZXJlZDogMW4gPDwgOW4sXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBjYW4gYmUgcHJldmlld2VkIGJlZm9yZSBqb2luaW5nIHZpYSBNZW1iZXJzaGlwIFNjcmVlbmluZyBvciB0aGUgZGlyZWN0b3J5ICovXG4gIHByZXZpZXdFbmFibGVkOiAxbiA8PCAyMG4sXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBoYXMgZGlzYWJsZWQgYWxlcnRzIGZvciBqb2luIHJhaWRzIGluIHRoZSBjb25maWd1cmVkIHNhZmV0eSBhbGVydHMgY2hhbm5lbCAqL1xuICByYWlkQWxlcnRzRGlzYWJsZWQ6IDFuIDw8IDIybixcbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGlzIGFibGUgdG8gc2V0IHJvbGUgaWNvbnMgKi9cbiAgcm9sZUljb25zOiAxbiA8PCAyN24sXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBoYXMgcm9sZSBzdWJzY3JpcHRpb25zIHRoYXQgY2FuIGJlIHB1cmNoYXNlZC4gKi9cbiAgcm9sZVN1YnNjcmlwdGlvbnNBdmFpbGFibGVGb3JQdXJjaGFzZTogMW4gPDwgMzNuLFxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIGVuYWJsZWQgcm9sZSBzdWJzY3JpcHRpb25zLiAqL1xuICByb2xlU3Vic2NyaXB0aW9uc0VuYWJsZWQ6IDFuIDw8IDM0bixcbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBjcmVhdGVkIHNvdW5kYm9hcmQgc291bmRzLiAqL1xuICBzb3VuZGJvYXJkOiAxbiA8PCAyNW4sXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBoYXMgZW5hYmxlZCB0aWNrZXRlZCBldmVudHMgKi9cbiAgdGlja2V0ZWRFdmVudHNFbmFibGVkOiAxbiA8PCAyMW4sXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBoYXMgYWNjZXNzIHRvIHNldCBhIHZhbml0eSBVUkwgKi9cbiAgdmFuaXR5VXJsOiAxbiA8PCA3bixcbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGlzIHZlcmlmaWVkICovXG4gIHZlcmlmaWVkOiAxbiA8PCA4bixcbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBhY2Nlc3MgdG8gc2V0IDM4NCBrYnBzIGJpdHJhdGUgaW4gdm9pY2UgKHByZXZpb3VzbHkgVklQIHZvaWNlIHNlcnZlcnMpICovXG4gIHZpcFJlZ2lvbnM6IDFuIDw8IDZuLFxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIGVuYWJsZWQgdGhlIHdlbGNvbWUgc2NyZWVuICovXG4gIHdlbGNvbWVTY3JlZW5FbmFibGVkOiAxbiA8PCAxOG4sXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBoYXMgYWNjZXNzIHRvIGd1ZXN0IGludml0ZXMgKi9cbiAgZ3Vlc3RzRW5hYmxlZDogMW4gPDwgMjZuLFxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIGFjY2VzcyB0byBzZXQgZ3VpbGQgdGFncyAqL1xuICBndWlsZFRhZ3M6IDFuIDw8IDM2bixcbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGlzIGFibGUgdG8gc2V0IGdyYWRpZW50IGNvbG9ycyB0byByb2xlcyAqL1xuICBlbmhhbmNlZFJvbGVDb2xvcnM6IDFuIDw8IDM1bixcbn1cblxuZXhwb3J0IGNsYXNzIEd1aWxkVG9nZ2xlcyBleHRlbmRzIFRvZ2dsZUJpdGZpZWxkQmlnaW50IHtcbiAgY29uc3RydWN0b3IoZ3VpbGRPclRvZ2dsZXNCaWdpbnQ6IERpc2NvcmRHdWlsZCB8IGJpZ2ludCkge1xuICAgIHN1cGVyKClcblxuICAgIGlmICh0eXBlb2YgZ3VpbGRPclRvZ2dsZXNCaWdpbnQgPT09ICdiaWdpbnQnKSB0aGlzLmJpdGZpZWxkID0gZ3VpbGRPclRvZ2dsZXNCaWdpbnRcbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IGd1aWxkID0gZ3VpbGRPclRvZ2dsZXNCaWdpbnRcbiAgICAgIC8vIENhdXNlIGRpc2NvcmQgYmUgc21hcnQgbGlrZSB0aGF0XG4gICAgICBpZiAoIWd1aWxkLmZlYXR1cmVzKSBndWlsZC5mZWF0dXJlcyA9IFtdXG5cbiAgICAgIGlmIChndWlsZC5vd25lcikgdGhpcy5hZGQoR3VpbGRUb2dnbGUub3duZXIpXG4gICAgICBpZiAoZ3VpbGQud2lkZ2V0X2VuYWJsZWQpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLndpZGdldEVuYWJsZWQpXG4gICAgICBpZiAoZ3VpbGQubGFyZ2UpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLmxhcmdlKVxuICAgICAgaWYgKGd1aWxkLnVuYXZhaWxhYmxlKSB0aGlzLmFkZChHdWlsZFRvZ2dsZS51bmF2YWlsYWJsZSlcbiAgICAgIGlmIChndWlsZC5wcmVtaXVtX3Byb2dyZXNzX2Jhcl9lbmFibGVkKSB0aGlzLmFkZChHdWlsZFRvZ2dsZS5wcmVtaXVtUHJvZ3Jlc3NCYXJFbmFibGVkKVxuXG4gICAgICBpZiAoZ3VpbGQuZmVhdHVyZXMuaW5jbHVkZXMoR3VpbGRGZWF0dXJlcy5BbmltYXRlZEJhbm5lcikpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLmFuaW1hdGVkQmFubmVyKVxuICAgICAgaWYgKGd1aWxkLmZlYXR1cmVzLmluY2x1ZGVzKEd1aWxkRmVhdHVyZXMuQW5pbWF0ZWRJY29uKSkgdGhpcy5hZGQoR3VpbGRUb2dnbGUuYW5pbWF0ZWRJY29uKVxuICAgICAgaWYgKGd1aWxkLmZlYXR1cmVzLmluY2x1ZGVzKEd1aWxkRmVhdHVyZXMuQXBwbGljYXRpb25Db21tYW5kUGVybWlzc2lvbnNWMikpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLmFwcGxpY2F0aW9uQ29tbWFuZFBlcm1pc3Npb25zVjIpXG4gICAgICBpZiAoZ3VpbGQuZmVhdHVyZXMuaW5jbHVkZXMoR3VpbGRGZWF0dXJlcy5BdXRvTW9kZXJhdGlvbikpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLmF1dG9Nb2RlcmF0aW9uKVxuICAgICAgaWYgKGd1aWxkLmZlYXR1cmVzLmluY2x1ZGVzKEd1aWxkRmVhdHVyZXMuQmFubmVyKSkgdGhpcy5hZGQoR3VpbGRUb2dnbGUuYmFubmVyKVxuICAgICAgaWYgKGd1aWxkLmZlYXR1cmVzLmluY2x1ZGVzKEd1aWxkRmVhdHVyZXMuQ29tbXVuaXR5KSkgdGhpcy5hZGQoR3VpbGRUb2dnbGUuY29tbXVuaXR5KVxuICAgICAgaWYgKGd1aWxkLmZlYXR1cmVzLmluY2x1ZGVzKEd1aWxkRmVhdHVyZXMuQ3JlYXRvck1vbmV0aXphYmxlUHJvdmlzaW9uYWwpKSB0aGlzLmFkZChHdWlsZFRvZ2dsZS5jcmVhdG9yTW9uZXRpemFibGVQcm92aXNpb25hbClcbiAgICAgIGlmIChndWlsZC5mZWF0dXJlcy5pbmNsdWRlcyhHdWlsZEZlYXR1cmVzLkNyZWF0b3JTdG9yZVBhZ2UpKSB0aGlzLmFkZChHdWlsZFRvZ2dsZS5jcmVhdG9yU3RvcmVQYWdlKVxuICAgICAgaWYgKGd1aWxkLmZlYXR1cmVzLmluY2x1ZGVzKEd1aWxkRmVhdHVyZXMuRGV2ZWxvcGVyU3VwcG9ydFNlcnZlcikpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLmRldmVsb3BlclN1cHBvcnRTZXJ2ZXIpXG4gICAgICBpZiAoZ3VpbGQuZmVhdHVyZXMuaW5jbHVkZXMoR3VpbGRGZWF0dXJlcy5EaXNjb3ZlcmFibGUpKSB0aGlzLmFkZChHdWlsZFRvZ2dsZS5kaXNjb3ZlcmFibGUpXG4gICAgICBpZiAoZ3VpbGQuZmVhdHVyZXMuaW5jbHVkZXMoR3VpbGRGZWF0dXJlcy5GZWF0dXJhYmxlKSkgdGhpcy5hZGQoR3VpbGRUb2dnbGUuZmVhdHVyYWJsZSlcbiAgICAgIGlmIChndWlsZC5mZWF0dXJlcy5pbmNsdWRlcyhHdWlsZEZlYXR1cmVzLkludml0ZXNEaXNhYmxlZCkpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLmludml0ZXNEaXNhYmxlZClcbiAgICAgIGlmIChndWlsZC5mZWF0dXJlcy5pbmNsdWRlcyhHdWlsZEZlYXR1cmVzLkludml0ZVNwbGFzaCkpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLmludml0ZVNwbGFzaClcbiAgICAgIGlmIChndWlsZC5mZWF0dXJlcy5pbmNsdWRlcyhHdWlsZEZlYXR1cmVzLk1lbWJlclZlcmlmaWNhdGlvbkdhdGVFbmFibGVkKSkgdGhpcy5hZGQoR3VpbGRUb2dnbGUubWVtYmVyVmVyaWZpY2F0aW9uR2F0ZUVuYWJsZWQpXG4gICAgICBpZiAoZ3VpbGQuZmVhdHVyZXMuaW5jbHVkZXMoR3VpbGRGZWF0dXJlcy5Nb3JlU291bmRib2FyZCkpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLm1vcmVTb3VuZGJvYXJkKVxuICAgICAgaWYgKGd1aWxkLmZlYXR1cmVzLmluY2x1ZGVzKEd1aWxkRmVhdHVyZXMuTW9yZVN0aWNrZXJzKSkgdGhpcy5hZGQoR3VpbGRUb2dnbGUubW9yZVN0aWNrZXJzKVxuICAgICAgaWYgKGd1aWxkLmZlYXR1cmVzLmluY2x1ZGVzKEd1aWxkRmVhdHVyZXMuTmV3cykpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLm5ld3MpXG4gICAgICBpZiAoZ3VpbGQuZmVhdHVyZXMuaW5jbHVkZXMoR3VpbGRGZWF0dXJlcy5QYXJ0bmVyZWQpKSB0aGlzLmFkZChHdWlsZFRvZ2dsZS5wYXJ0bmVyZWQpXG4gICAgICBpZiAoZ3VpbGQuZmVhdHVyZXMuaW5jbHVkZXMoR3VpbGRGZWF0dXJlcy5QcmV2aWV3RW5hYmxlZCkpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLnByZXZpZXdFbmFibGVkKVxuICAgICAgaWYgKGd1aWxkLmZlYXR1cmVzLmluY2x1ZGVzKEd1aWxkRmVhdHVyZXMuUmFpZEFsZXJ0c0Rpc2FibGVkKSkgdGhpcy5hZGQoR3VpbGRUb2dnbGUucmFpZEFsZXJ0c0Rpc2FibGVkKVxuICAgICAgaWYgKGd1aWxkLmZlYXR1cmVzLmluY2x1ZGVzKEd1aWxkRmVhdHVyZXMuUm9sZUljb25zKSkgdGhpcy5hZGQoR3VpbGRUb2dnbGUucm9sZUljb25zKVxuICAgICAgaWYgKGd1aWxkLmZlYXR1cmVzLmluY2x1ZGVzKEd1aWxkRmVhdHVyZXMuUm9sZVN1YnNjcmlwdGlvbnNBdmFpbGFibGVGb3JQdXJjaGFzZSkpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLnJvbGVTdWJzY3JpcHRpb25zQXZhaWxhYmxlRm9yUHVyY2hhc2UpXG4gICAgICBpZiAoZ3VpbGQuZmVhdHVyZXMuaW5jbHVkZXMoR3VpbGRGZWF0dXJlcy5Sb2xlU3Vic2NyaXB0aW9uc0VuYWJsZWQpKSB0aGlzLmFkZChHdWlsZFRvZ2dsZS5yb2xlU3Vic2NyaXB0aW9uc0VuYWJsZWQpXG4gICAgICBpZiAoZ3VpbGQuZmVhdHVyZXMuaW5jbHVkZXMoR3VpbGRGZWF0dXJlcy5Tb3VuZGJvYXJkKSkgdGhpcy5hZGQoR3VpbGRUb2dnbGUuc291bmRib2FyZClcbiAgICAgIGlmIChndWlsZC5mZWF0dXJlcy5pbmNsdWRlcyhHdWlsZEZlYXR1cmVzLlRpY2tldGVkRXZlbnRzRW5hYmxlZCkpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLnRpY2tldGVkRXZlbnRzRW5hYmxlZClcbiAgICAgIGlmIChndWlsZC5mZWF0dXJlcy5pbmNsdWRlcyhHdWlsZEZlYXR1cmVzLlZhbml0eVVybCkpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLnZhbml0eVVybClcbiAgICAgIGlmIChndWlsZC5mZWF0dXJlcy5pbmNsdWRlcyhHdWlsZEZlYXR1cmVzLlZlcmlmaWVkKSkgdGhpcy5hZGQoR3VpbGRUb2dnbGUudmVyaWZpZWQpXG4gICAgICBpZiAoZ3VpbGQuZmVhdHVyZXMuaW5jbHVkZXMoR3VpbGRGZWF0dXJlcy5WaXBSZWdpb25zKSkgdGhpcy5hZGQoR3VpbGRUb2dnbGUudmlwUmVnaW9ucylcbiAgICAgIGlmIChndWlsZC5mZWF0dXJlcy5pbmNsdWRlcyhHdWlsZEZlYXR1cmVzLldlbGNvbWVTY3JlZW5FbmFibGVkKSkgdGhpcy5hZGQoR3VpbGRUb2dnbGUud2VsY29tZVNjcmVlbkVuYWJsZWQpXG4gICAgICBpZiAoZ3VpbGQuZmVhdHVyZXMuaW5jbHVkZXMoR3VpbGRGZWF0dXJlcy5HdWVzdHNFbmFibGVkKSkgdGhpcy5hZGQoR3VpbGRUb2dnbGUuZ3Vlc3RzRW5hYmxlZClcbiAgICAgIGlmIChndWlsZC5mZWF0dXJlcy5pbmNsdWRlcyhHdWlsZEZlYXR1cmVzLkd1aWxkVGFncykpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLmd1aWxkVGFncylcbiAgICAgIGlmIChndWlsZC5mZWF0dXJlcy5pbmNsdWRlcyhHdWlsZEZlYXR1cmVzLkVuaGFuY2VkUm9sZUNvbG9ycykpIHRoaXMuYWRkKEd1aWxkVG9nZ2xlLmVuaGFuY2VkUm9sZUNvbG9ycylcbiAgICB9XG4gIH1cblxuICBnZXQgZmVhdHVyZXMoKTogR3VpbGRGZWF0dXJlS2V5c1tdIHtcbiAgICBjb25zdCBmZWF0dXJlczogR3VpbGRGZWF0dXJlS2V5c1tdID0gW11cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhHdWlsZFRvZ2dsZSkpIHtcbiAgICAgIGlmICghZ3VpbGRGZWF0dXJlTmFtZXMuaW5jbHVkZXMoa2V5IGFzIEd1aWxkRmVhdHVyZUtleXMpKSBjb250aW51ZVxuICAgICAgaWYgKCFzdXBlci5jb250YWlucyhHdWlsZFRvZ2dsZVtrZXkgYXMgR3VpbGRUb2dnbGVLZXlzXSkpIGNvbnRpbnVlXG5cbiAgICAgIGZlYXR1cmVzLnB1c2goa2V5IGFzIEd1aWxkRmVhdHVyZUtleXMpXG4gICAgfVxuXG4gICAgcmV0dXJuIGZlYXR1cmVzXG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgYm90IGlzIHRoZSBvd25lciBvZiB0aGUgZ3VpbGQgKi9cbiAgZ2V0IG93bmVyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygnb3duZXInKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIHNlcnZlciB3aWRnZXQgaXMgZW5hYmxlZCAqL1xuICBnZXQgd2lkZ2V0RW5hYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ3dpZGdldEVuYWJsZWQnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBpcyBjb25zaWRlcmVkIGEgbGFyZ2UgZ3VpbGQgKi9cbiAgZ2V0IGxhcmdlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygnbGFyZ2UnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyBndWlsZCBpcyB1bmF2YWlsYWJsZSBkdWUgdG8gYW4gb3V0YWdlICovXG4gIGdldCB1bmF2YWlsYWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ3VuYXZhaWxhYmxlJylcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBoYXMgdGhlIGJvb3N0IHByb2dyZXNzIGJhciBlbmFibGVkICovXG4gIGdldCBwcmVtaXVtUHJvZ3Jlc3NCYXJFbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygncHJlbWl1bVByb2dyZXNzQmFyRW5hYmxlZCcpXG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIGFjY2VzcyB0byBzZXQgYW4gaW52aXRlIHNwbGFzaCBiYWNrZ3JvdW5kICovXG4gIGdldCBpbnZpdGVTcGxhc2goKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaGFzKCdpbnZpdGVTcGxhc2gnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBhY2Nlc3MgdG8gc2V0IDM4NCBrYnBzIGJpdHJhdGUgaW4gdm9pY2UgKHByZXZpb3VzbHkgVklQIHZvaWNlIHNlcnZlcnMpICovXG4gIGdldCB2aXBSZWdpb25zKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygndmlwUmVnaW9ucycpXG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIGFjY2VzcyB0byBzZXQgYSB2YW5pdHkgVVJMICovXG4gIGdldCB2YW5pdHlVcmwoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaGFzKCd2YW5pdHlVcmwnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGlzIHZlcmlmaWVkICovXG4gIGdldCB2ZXJpZmllZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ3ZlcmlmaWVkJylcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBpcyBwYXJ0bmVyZWQgKi9cbiAgZ2V0IHBhcnRuZXJlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ3BhcnRuZXJlZCcpXG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgY2FuIGVuYWJsZSB3ZWxjb21lIHNjcmVlbiwgTWVtYmVyc2hpcCBTY3JlZW5pbmcsIHN0YWdlIGNoYW5uZWxzIGFuZCBkaXNjb3ZlcnksIGFuZCByZWNlaXZlcyBjb21tdW5pdHkgdXBkYXRlcyAqL1xuICBnZXQgY29tbXVuaXR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygnY29tbXVuaXR5JylcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBHdWlsZCBoYXMgYmVlbiBzZXQgYXMgYSBzdXBwb3J0IHNlcnZlciBvbiB0aGUgQXBwIERpcmVjdG9yeSAqL1xuICBnZXQgZGV2ZWxvcGVyU3VwcG9ydFNlcnZlcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ2RldmVsb3BlclN1cHBvcnRTZXJ2ZXInKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBhY2Nlc3MgdG8gc2V0IGFuIGFuaW1hdGVkIGd1aWxkIGJhbm5lciBpbWFnZSAqL1xuICBnZXQgYW5pbWF0ZWRCYW5uZXIoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaGFzKCdhbmltYXRlZEJhbm5lcicpXG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIGFjY2VzcyB0byBjcmVhdGUgbmV3cyBjaGFubmVscyAqL1xuICBnZXQgbmV3cygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ25ld3MnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGlzIGFibGUgdG8gYmUgZGlzY292ZXJlZCBpbiB0aGUgZGlyZWN0b3J5ICovXG4gIGdldCBkaXNjb3ZlcmFibGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaGFzKCdkaXNjb3ZlcmFibGUnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGlzIGFibGUgdG8gYmUgZmVhdHVyZWQgaW4gdGhlIGRpcmVjdG9yeSAqL1xuICBnZXQgZmVhdHVyYWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ2ZlYXR1cmFibGUnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBhY2Nlc3MgdG8gc2V0IGFuIGFuaW1hdGVkIGd1aWxkIGljb24gKi9cbiAgZ2V0IGFuaW1hdGVkSWNvbigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ2FuaW1hdGVkSWNvbicpXG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIGFjY2VzcyB0byBzZXQgYSBndWlsZCBiYW5uZXIgaW1hZ2UgKi9cbiAgZ2V0IGJhbm5lcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ2Jhbm5lcicpXG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIGVuYWJsZWQgdGhlIHdlbGNvbWUgc2NyZWVuICovXG4gIGdldCB3ZWxjb21lU2NyZWVuRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ3dlbGNvbWVTY3JlZW5FbmFibGVkJylcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBoYXMgZW5hYmxlZCBbTWVtYmVyc2hpcCBTY3JlZW5pbmddKGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3Jlc291cmNlcy9ndWlsZCNtZW1iZXJzaGlwLXNjcmVlbmluZy1vYmplY3QpICovXG4gIGdldCBtZW1iZXJWZXJpZmljYXRpb25HYXRlRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ21lbWJlclZlcmlmaWNhdGlvbkdhdGVFbmFibGVkJylcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBoYXMgbW9yZSBzb3VuZGJvYXJkIHNvdW5kIHNsb3QgKi9cbiAgZ2V0IG1vcmVTb3VuZGJvYXJkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygnbW9yZVNvdW5kYm9hcmQnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGNhbiBiZSBwcmV2aWV3ZWQgYmVmb3JlIGpvaW5pbmcgdmlhIE1lbWJlcnNoaXAgU2NyZWVuaW5nIG9yIHRoZSBkaXJlY3RvcnkgKi9cbiAgZ2V0IHByZXZpZXdFbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygncHJldmlld0VuYWJsZWQnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBlbmFibGVkIHRpY2tldGVkIGV2ZW50cyAqL1xuICBnZXQgdGlja2V0ZWRFdmVudHNFbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygndGlja2V0ZWRFdmVudHNFbmFibGVkJylcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBoYXMgaW5jcmVhc2VkIGN1c3RvbSBzdGlja2VyIHNsb3RzICovXG4gIGdldCBtb3JlU3RpY2tlcnMoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaGFzKCdtb3JlU3RpY2tlcnMnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGlzIGFibGUgdG8gc2V0IHJvbGUgaWNvbnMgKi9cbiAgZ2V0IHJvbGVJY29ucygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ3JvbGVJY29ucycpXG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIHNldCB1cCBhdXRvIG1vZGVyYXRpb24gcnVsZXMgKi9cbiAgZ2V0IGF1dG9Nb2RlcmF0aW9uKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygnYXV0b01vZGVyYXRpb24nKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBwYXVzZWQgaW52aXRlcywgcHJldmVudGluZyBuZXcgdXNlcnMgZnJvbSBqb2luaW5nICovXG4gIGdldCBpbnZpdGVzRGlzYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaGFzKCdpbnZpdGVzRGlzYWJsZWQnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGlzIHVzaW5nIHRoZSBvbGQgcGVybWlzc2lvbnMgY29uZmlndXJhdGlvbiBiZWhhdmlvciAqL1xuICBnZXQgYXBwbGljYXRpb25Db21tYW5kUGVybWlzc2lvbnNWMigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ2FwcGxpY2F0aW9uQ29tbWFuZFBlcm1pc3Npb25zVjInKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBlbmFibGVkIG1vbmV0aXphdGlvbi4gKi9cbiAgZ2V0IGNyZWF0b3JNb25ldGl6YWJsZVByb3Zpc2lvbmFsKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygnY3JlYXRvck1vbmV0aXphYmxlUHJvdmlzaW9uYWwnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBlbmFibGVkIHRoZSByb2xlIHN1YnNjcmlwdGlvbiBwcm9tbyBwYWdlLiAqL1xuICBnZXQgY3JlYXRvclN0b3JlUGFnZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ2NyZWF0b3JTdG9yZVBhZ2UnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBkaXNhYmxlZCBhbGVydHMgZm9yIGpvaW4gcmFpZHMgaW4gdGhlIGNvbmZpZ3VyZWQgc2FmZXR5IGFsZXJ0cyBjaGFubmVsICovXG4gIGdldCByYWlkQWxlcnRzRGlzYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaGFzKCdyYWlkQWxlcnRzRGlzYWJsZWQnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyByb2xlIHN1YnNjcmlwdGlvbnMgdGhhdCBjYW4gYmUgcHVyY2hhc2VkLiAqL1xuICBnZXQgcm9sZVN1YnNjcmlwdGlvbnNBdmFpbGFibGVGb3JQdXJjaGFzZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ3JvbGVTdWJzY3JpcHRpb25zQXZhaWxhYmxlRm9yUHVyY2hhc2UnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGd1aWxkIGhhcyBlbmFibGVkIHJvbGUgc3Vic2NyaXB0aW9ucy4gKi9cbiAgZ2V0IHJvbGVTdWJzY3JpcHRpb25zRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ3JvbGVTdWJzY3JpcHRpb25zRW5hYmxlZCcpXG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIGNyZWF0ZWQgc291bmRib2FyZCBzb3VuZHMuICovXG4gIGdldCBzb3VuZGJvYXJkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygnc291bmRib2FyZCcpXG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIGFjY2VzcyB0byBndWVzdCBpbnZpdGVzICovXG4gIGdldCBndWVzdHNFbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygnZ3Vlc3RzRW5hYmxlZCcpXG4gIH1cblxuICAvKiogV2hldGhlciB0aGUgZ3VpbGQgaGFzIGFjY2VzcyB0byBzZXQgZ3VpbGQgdGFncyAqL1xuICBnZXQgZ3VpbGRUYWdzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygnZ3VpbGRUYWdzJylcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBndWlsZCBpcyBhYmxlIHRvIHNldCBncmFkaWVudCBjb2xvcnMgdG8gcm9sZXMgKi9cbiAgZ2V0IGVuaGFuY2VkUm9sZUNvbG9ycygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ2VuaGFuY2VkUm9sZUNvbG9ycycpXG4gIH1cblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgb3Igbm90IHRoZSBwZXJtaXNzaW9ucyBleGlzdCBpbiB0aGlzICovXG4gIGhhcyhwZXJtaXNzaW9uczogR3VpbGRUb2dnbGVLZXlzIHwgR3VpbGRUb2dnbGVLZXlzW10pOiBib29sZWFuIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocGVybWlzc2lvbnMpKSByZXR1cm4gc3VwZXIuY29udGFpbnMoR3VpbGRUb2dnbGVbcGVybWlzc2lvbnNdKVxuXG4gICAgcmV0dXJuIHN1cGVyLmNvbnRhaW5zKHBlcm1pc3Npb25zLnJlZHVjZSgoYSwgYikgPT4gKGEgfD0gR3VpbGRUb2dnbGVbYl0pLCAwbikpXG4gIH1cblxuICAvKiogTGlzdHMgYWxsIHRoZSB0b2dnbGVzIGZvciB0aGUgcm9sZSBhbmQgd2hldGhlciBvciBub3QgZWFjaCBpcyB0cnVlIG9yIGZhbHNlLiAqL1xuICBsaXN0KCk6IFJlY29yZDxHdWlsZFRvZ2dsZUtleXMsIGJvb2xlYW4+IHtcbiAgICBjb25zdCBqc29uOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoR3VpbGRUb2dnbGUpKSB7XG4gICAgICBqc29uW2tleV0gPSBzdXBlci5jb250YWlucyh2YWx1ZSlcbiAgICB9XG5cbiAgICByZXR1cm4ganNvbiBhcyBSZWNvcmQ8R3VpbGRUb2dnbGVLZXlzLCBib29sZWFuPlxuICB9XG59XG5cbmV4cG9ydCB0eXBlIEd1aWxkVG9nZ2xlS2V5cyA9IGtleW9mIHR5cGVvZiBHdWlsZFRvZ2dsZVxuXG5leHBvcnQgdHlwZSBHdWlsZEZlYXR1cmVLZXlzID0gKHR5cGVvZiBndWlsZEZlYXR1cmVOYW1lcylbbnVtYmVyXVxuIl0sIm5hbWVzIjpbIkd1aWxkRmVhdHVyZXMiLCJUb2dnbGVCaXRmaWVsZEJpZ2ludCIsImd1aWxkRmVhdHVyZU5hbWVzIiwiR3VpbGRUb2dnbGUiLCJvd25lciIsIndpZGdldEVuYWJsZWQiLCJsYXJnZSIsInVuYXZhaWxhYmxlIiwicHJlbWl1bVByb2dyZXNzQmFyRW5hYmxlZCIsImFuaW1hdGVkQmFubmVyIiwiYW5pbWF0ZWRJY29uIiwiYXBwbGljYXRpb25Db21tYW5kUGVybWlzc2lvbnNWMiIsImF1dG9Nb2RlcmF0aW9uIiwiYmFubmVyIiwiY29tbXVuaXR5IiwiY3JlYXRvck1vbmV0aXphYmxlUHJvdmlzaW9uYWwiLCJjcmVhdG9yU3RvcmVQYWdlIiwiZGV2ZWxvcGVyU3VwcG9ydFNlcnZlciIsImRpc2NvdmVyYWJsZSIsImZlYXR1cmFibGUiLCJpbnZpdGVzRGlzYWJsZWQiLCJpbnZpdGVTcGxhc2giLCJtZW1iZXJWZXJpZmljYXRpb25HYXRlRW5hYmxlZCIsIm1vcmVTb3VuZGJvYXJkIiwibW9yZVN0aWNrZXJzIiwibmV3cyIsInBhcnRuZXJlZCIsInByZXZpZXdFbmFibGVkIiwicmFpZEFsZXJ0c0Rpc2FibGVkIiwicm9sZUljb25zIiwicm9sZVN1YnNjcmlwdGlvbnNBdmFpbGFibGVGb3JQdXJjaGFzZSIsInJvbGVTdWJzY3JpcHRpb25zRW5hYmxlZCIsInNvdW5kYm9hcmQiLCJ0aWNrZXRlZEV2ZW50c0VuYWJsZWQiLCJ2YW5pdHlVcmwiLCJ2ZXJpZmllZCIsInZpcFJlZ2lvbnMiLCJ3ZWxjb21lU2NyZWVuRW5hYmxlZCIsImd1ZXN0c0VuYWJsZWQiLCJndWlsZFRhZ3MiLCJlbmhhbmNlZFJvbGVDb2xvcnMiLCJHdWlsZFRvZ2dsZXMiLCJndWlsZE9yVG9nZ2xlc0JpZ2ludCIsImJpdGZpZWxkIiwiZ3VpbGQiLCJmZWF0dXJlcyIsImFkZCIsIndpZGdldF9lbmFibGVkIiwicHJlbWl1bV9wcm9ncmVzc19iYXJfZW5hYmxlZCIsImluY2x1ZGVzIiwiQW5pbWF0ZWRCYW5uZXIiLCJBbmltYXRlZEljb24iLCJBcHBsaWNhdGlvbkNvbW1hbmRQZXJtaXNzaW9uc1YyIiwiQXV0b01vZGVyYXRpb24iLCJCYW5uZXIiLCJDb21tdW5pdHkiLCJDcmVhdG9yTW9uZXRpemFibGVQcm92aXNpb25hbCIsIkNyZWF0b3JTdG9yZVBhZ2UiLCJEZXZlbG9wZXJTdXBwb3J0U2VydmVyIiwiRGlzY292ZXJhYmxlIiwiRmVhdHVyYWJsZSIsIkludml0ZXNEaXNhYmxlZCIsIkludml0ZVNwbGFzaCIsIk1lbWJlclZlcmlmaWNhdGlvbkdhdGVFbmFibGVkIiwiTW9yZVNvdW5kYm9hcmQiLCJNb3JlU3RpY2tlcnMiLCJOZXdzIiwiUGFydG5lcmVkIiwiUHJldmlld0VuYWJsZWQiLCJSYWlkQWxlcnRzRGlzYWJsZWQiLCJSb2xlSWNvbnMiLCJSb2xlU3Vic2NyaXB0aW9uc0F2YWlsYWJsZUZvclB1cmNoYXNlIiwiUm9sZVN1YnNjcmlwdGlvbnNFbmFibGVkIiwiU291bmRib2FyZCIsIlRpY2tldGVkRXZlbnRzRW5hYmxlZCIsIlZhbml0eVVybCIsIlZlcmlmaWVkIiwiVmlwUmVnaW9ucyIsIldlbGNvbWVTY3JlZW5FbmFibGVkIiwiR3Vlc3RzRW5hYmxlZCIsIkd1aWxkVGFncyIsIkVuaGFuY2VkUm9sZUNvbG9ycyIsImtleSIsIk9iamVjdCIsImtleXMiLCJjb250YWlucyIsInB1c2giLCJoYXMiLCJwZXJtaXNzaW9ucyIsIkFycmF5IiwiaXNBcnJheSIsInJlZHVjZSIsImEiLCJiIiwibGlzdCIsImpzb24iLCJ2YWx1ZSIsImVudHJpZXMiXSwibWFwcGluZ3MiOiJBQUFBLFNBQTRCQSxhQUFhLFFBQVEsb0JBQW1CO0FBQ3BFLFNBQVNDLG9CQUFvQixRQUFRLHNCQUFxQjtBQUUxRCxpRUFBaUUsR0FDakUsT0FBTyxNQUFNQyxvQkFBb0I7SUFDL0I7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7Q0FDRCxDQUFTO0FBRVYsT0FBTyxNQUFNQyxjQUFjO0lBQ3pCLDhDQUE4QyxHQUM5Q0MsT0FBTyxFQUFFLElBQUksRUFBRTtJQUNmLHlDQUF5QyxHQUN6Q0MsZUFBZSxFQUFFLElBQUksRUFBRTtJQUN2Qiw2Q0FBNkMsR0FDN0NDLE9BQU8sRUFBRSxJQUFJLEVBQUU7SUFDZix1REFBdUQsR0FDdkRDLGFBQWEsRUFBRSxJQUFJLEVBQUU7SUFDckIseURBQXlELEdBQ3pEQywyQkFBMkIsRUFBRSxJQUFJLEVBQUU7SUFFbkMsZ0NBQWdDO0lBRWhDLHVFQUF1RSxHQUN2RUMsZ0JBQWdCLEVBQUUsSUFBSSxHQUFHO0lBQ3pCLCtEQUErRCxHQUMvREMsY0FBYyxFQUFFLElBQUksR0FBRztJQUN2QiwwRUFBMEUsR0FDMUVDLGlDQUFpQyxFQUFFLElBQUksR0FBRztJQUMxQyx1REFBdUQsR0FDdkRDLGdCQUFnQixFQUFFLElBQUks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