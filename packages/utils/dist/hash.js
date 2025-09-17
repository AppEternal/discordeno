export function iconHashToBigInt(hash) {
    // The icon is animated so it needs special handling
    if (hash.startsWith('a_')) {
        // Change the `a_` to just be `a`
        hash = `a${hash.substring(2)}`;
    } else {
        // The icon is not animated but it could be that it starts with a 0 so we just put a `b` in front so nothing breaks
        hash = `b${hash}`;
    }
    return BigInt(`0x${hash}`);
}
export function iconBigintToHash(icon) {
    // Convert the bigint back to a hash
    const hash = icon.toString(16);
    // Hashes starting with a are animated and with b are not so need to handle that
    return hash.startsWith('a') ? `a_${hash.substring(1)}` : hash.substring(1);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9oYXNoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiBpY29uSGFzaFRvQmlnSW50KGhhc2g6IHN0cmluZyk6IGJpZ2ludCB7XG4gIC8vIFRoZSBpY29uIGlzIGFuaW1hdGVkIHNvIGl0IG5lZWRzIHNwZWNpYWwgaGFuZGxpbmdcbiAgaWYgKGhhc2guc3RhcnRzV2l0aCgnYV8nKSkge1xuICAgIC8vIENoYW5nZSB0aGUgYGFfYCB0byBqdXN0IGJlIGBhYFxuICAgIGhhc2ggPSBgYSR7aGFzaC5zdWJzdHJpbmcoMil9YFxuICB9IGVsc2Uge1xuICAgIC8vIFRoZSBpY29uIGlzIG5vdCBhbmltYXRlZCBidXQgaXQgY291bGQgYmUgdGhhdCBpdCBzdGFydHMgd2l0aCBhIDAgc28gd2UganVzdCBwdXQgYSBgYmAgaW4gZnJvbnQgc28gbm90aGluZyBicmVha3NcbiAgICBoYXNoID0gYGIke2hhc2h9YFxuICB9XG5cbiAgcmV0dXJuIEJpZ0ludChgMHgke2hhc2h9YClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGljb25CaWdpbnRUb0hhc2goaWNvbjogYmlnaW50KTogc3RyaW5nIHtcbiAgLy8gQ29udmVydCB0aGUgYmlnaW50IGJhY2sgdG8gYSBoYXNoXG4gIGNvbnN0IGhhc2ggPSBpY29uLnRvU3RyaW5nKDE2KVxuICAvLyBIYXNoZXMgc3RhcnRpbmcgd2l0aCBhIGFyZSBhbmltYXRlZCBhbmQgd2l0aCBiIGFyZSBub3Qgc28gbmVlZCB0byBoYW5kbGUgdGhhdFxuICByZXR1cm4gaGFzaC5zdGFydHNXaXRoKCdhJykgPyBgYV8ke2hhc2guc3Vic3RyaW5nKDEpfWAgOiBoYXNoLnN1YnN0cmluZygxKVxufVxuIl0sIm5hbWVzIjpbImljb25IYXNoVG9CaWdJbnQiLCJoYXNoIiwic3RhcnRzV2l0aCIsInN1YnN0cmluZyIsIkJpZ0ludCIsImljb25CaWdpbnRUb0hhc2giLCJpY29uIiwidG9TdHJpbmciXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sU0FBU0EsaUJBQWlCQyxJQUFZO0lBQzNDLG9EQUFvRDtJQUNwRCxJQUFJQSxLQUFLQyxVQUFVLENBQUMsT0FBTztRQUN6QixpQ0FBaUM7UUFDakNELE9BQU8sQ0FBQyxDQUFDLEVBQUVBLEtBQUtFLFNBQVMsQ0FBQyxJQUFJO0lBQ2hDLE9BQU87UUFDTCxtSEFBbUg7UUFDbkhGLE9BQU8sQ0FBQyxDQUFDLEVBQUVBLE1BQU07SUFDbkI7SUFFQSxPQUFPRyxPQUFPLENBQUMsRUFBRSxFQUFFSCxNQUFNO0FBQzNCO0FBRUEsT0FBTyxTQUFTSSxpQkFBaUJDLElBQVk7SUFDM0Msb0NBQW9DO0lBQ3BDLE1BQU1MLE9BQU9LLEtBQUtDLFFBQVEsQ0FBQztJQUMzQixnRkFBZ0Y7SUFDaEYsT0FBT04sS0FBS0MsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUVELEtBQUtFLFNBQVMsQ0FBQyxJQUFJLEdBQUdGLEtBQUtFLFNBQVMsQ0FBQztBQUMxRSJ9