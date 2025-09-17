/** Types for: https://discord.com/developers/docs/resources/sku */ /** https://discord.com/developers/docs/resources/sku#sku-object-sku-structure */ /** https://discord.com/developers/docs/resources/sku#sku-object-sku-types */ export var DiscordSkuType =
  /*#__PURE__*/ (function (DiscordSkuType) {
    /** Durable one-time purchase */ DiscordSkuType[(DiscordSkuType['Durable'] = 2)] = 'Durable'
    /** Consumable one-time purchase */ DiscordSkuType[(DiscordSkuType['Consumable'] = 3)] = 'Consumable'
    /** Represents a recurring subscription */ DiscordSkuType[(DiscordSkuType['Subscription'] = 5)] = 'Subscription'
    /** System-generated group for each SUBSCRIPTION SKU created */ DiscordSkuType[(DiscordSkuType['SubscriptionGroup'] = 6)] = 'SubscriptionGroup'
    return DiscordSkuType
  })({})
/** https://discord.com/developers/docs/resources/sku#sku-object-sku-flags */ export var SkuFlags = /*#__PURE__*/ (function (SkuFlags) {
  /** SKU is available for purchase */ SkuFlags[(SkuFlags['Available'] = 4)] = 'Available'
  /** Recurring SKU that can be purchased by a user and applied to a single server. Grants access to every user in that server. */ SkuFlags[
    (SkuFlags['GuildSubscription'] = 128)
  ] = 'GuildSubscription'
  /** Recurring SKU purchased by a user for themselves. Grants access to the purchasing user in every server. */ SkuFlags[
    (SkuFlags['UserSubscription'] = 256)
  ] = 'UserSubscription'
  return SkuFlags
})({})

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9kaXNjb3JkL3NrdS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogVHlwZXMgZm9yOiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZXNvdXJjZXMvc2t1ICovXG5cbi8qKiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZXNvdXJjZXMvc2t1I3NrdS1vYmplY3Qtc2t1LXN0cnVjdHVyZSAqL1xuZXhwb3J0IGludGVyZmFjZSBEaXNjb3JkU2t1IHtcbiAgLyoqIElEIG9mIFNLVSAqL1xuICBpZDogc3RyaW5nXG4gIC8qKiBUeXBlIG9mIFNLVSAqL1xuICB0eXBlOiBEaXNjb3JkU2t1VHlwZVxuICAvKiogSUQgb2YgdGhlIHBhcmVudCBhcHBsaWNhdGlvbiAqL1xuICBhcHBsaWNhdGlvbl9pZDogc3RyaW5nXG4gIC8qKiBDdXN0b21lci1mYWNpbmcgbmFtZSBvZiB5b3VyIHByZW1pdW0gb2ZmZXJpbmcgKi9cbiAgbmFtZTogc3RyaW5nXG4gIC8qKiBTeXN0ZW0tZ2VuZXJhdGVkIFVSTCBzbHVnIGJhc2VkIG9uIHRoZSBTS1UncyBuYW1lICovXG4gIHNsdWc6IHN0cmluZ1xuICAvKiogU0tVIGZsYWdzIGNvbWJpbmVkIGFzIGEgYml0ZmllbGQgKi9cbiAgZmxhZ3M6IFNrdUZsYWdzXG59XG5cbi8qKiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZXNvdXJjZXMvc2t1I3NrdS1vYmplY3Qtc2t1LXR5cGVzICovXG5leHBvcnQgZW51bSBEaXNjb3JkU2t1VHlwZSB7XG4gIC8qKiBEdXJhYmxlIG9uZS10aW1lIHB1cmNoYXNlICovXG4gIER1cmFibGUgPSAyLFxuICAvKiogQ29uc3VtYWJsZSBvbmUtdGltZSBwdXJjaGFzZSAqL1xuICBDb25zdW1hYmxlID0gMyxcbiAgLyoqIFJlcHJlc2VudHMgYSByZWN1cnJpbmcgc3Vic2NyaXB0aW9uICovXG4gIFN1YnNjcmlwdGlvbiA9IDUsXG4gIC8qKiBTeXN0ZW0tZ2VuZXJhdGVkIGdyb3VwIGZvciBlYWNoIFNVQlNDUklQVElPTiBTS1UgY3JlYXRlZCAqL1xuICBTdWJzY3JpcHRpb25Hcm91cCA9IDYsXG59XG5cbi8qKiBodHRwczovL2Rpc2NvcmQuY29tL2RldmVsb3BlcnMvZG9jcy9yZXNvdXJjZXMvc2t1I3NrdS1vYmplY3Qtc2t1LWZsYWdzICovXG5leHBvcnQgZW51bSBTa3VGbGFncyB7XG4gIC8qKiBTS1UgaXMgYXZhaWxhYmxlIGZvciBwdXJjaGFzZSAqL1xuICBBdmFpbGFibGUgPSAxIDw8IDIsXG4gIC8qKiBSZWN1cnJpbmcgU0tVIHRoYXQgY2FuIGJlIHB1cmNoYXNlZCBieSBhIHVzZXIgYW5kIGFwcGxpZWQgdG8gYSBzaW5nbGUgc2VydmVyLiBHcmFudHMgYWNjZXNzIHRvIGV2ZXJ5IHVzZXIgaW4gdGhhdCBzZXJ2ZXIuICovXG4gIEd1aWxkU3Vic2NyaXB0aW9uID0gMSA8PCA3LFxuICAvKiogUmVjdXJyaW5nIFNLVSBwdXJjaGFzZWQgYnkgYSB1c2VyIGZvciB0aGVtc2VsdmVzLiBHcmFudHMgYWNjZXNzIHRvIHRoZSBwdXJjaGFzaW5nIHVzZXIgaW4gZXZlcnkgc2VydmVyLiAqL1xuICBVc2VyU3Vic2NyaXB0aW9uID0gMSA8PCA4LFxufVxuIl0sIm5hbWVzIjpbIkRpc2NvcmRTa3VUeXBlIiwiU2t1RmxhZ3MiXSwibWFwcGluZ3MiOiJBQUFBLGlFQUFpRSxHQUVqRSwrRUFBK0UsR0FnQi9FLDJFQUEyRSxHQUMzRSxPQUFPLElBQUEsQUFBS0Esd0NBQUFBO0lBQ1YsOEJBQThCO0lBRTlCLGlDQUFpQztJQUVqQyx3Q0FBd0M7SUFFeEMsNkRBQTZEO1dBUG5EQTtNQVNYO0FBRUQsMkVBQTJFLEdBQzNFLE9BQU8sSUFBQSxBQUFLQyxrQ0FBQUE7SUFDVixrQ0FBa0M7SUFFbEMsOEhBQThIO0lBRTlILDRHQUE0RztXQUxsR0E7TUFPWCJ9
