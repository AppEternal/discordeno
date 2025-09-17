export class ToggleBitfield {
    constructor(bitfield){
        this.bitfield = 0;
        if (bitfield) this.bitfield = bitfield;
    }
    /** Tests whether or not this bitfield has the permission requested. */ contains(bits) {
        return Boolean(this.bitfield & bits);
    }
    /** Adds some bits to the bitfield. */ add(bits) {
        this.bitfield |= bits;
        return this;
    }
    /** Removes some bits from the bitfield. */ remove(bits) {
        this.bitfield &= ~bits;
        return this;
    }
    toJSON() {
        return this.bitfield;
    }
}
export class ToggleBitfieldBigint {
    constructor(bitfield){
        this.bitfield = 0n;
        if (bitfield) this.bitfield = bitfield;
    }
    /** Tests whether or not this bitfield has the permission requested. */ contains(bits) {
        return Boolean(this.bitfield & bits);
    }
    /** Adds some bits to the bitfield. */ add(bits) {
        this.bitfield |= bits;
        return this;
    }
    /** Removes some bits from the bitfield. */ remove(bits) {
        this.bitfield &= ~bits;
        return this;
    }
    toJSON() {
        return this.bitfield.toString();
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvdG9nZ2xlcy9Ub2dnbGVCaXRmaWVsZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgVG9nZ2xlQml0ZmllbGQge1xuICBiaXRmaWVsZCA9IDBcblxuICBjb25zdHJ1Y3RvcihiaXRmaWVsZD86IG51bWJlcikge1xuICAgIGlmIChiaXRmaWVsZCkgdGhpcy5iaXRmaWVsZCA9IGJpdGZpZWxkXG4gIH1cblxuICAvKiogVGVzdHMgd2hldGhlciBvciBub3QgdGhpcyBiaXRmaWVsZCBoYXMgdGhlIHBlcm1pc3Npb24gcmVxdWVzdGVkLiAqL1xuICBjb250YWlucyhiaXRzOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gQm9vbGVhbih0aGlzLmJpdGZpZWxkICYgYml0cylcbiAgfVxuXG4gIC8qKiBBZGRzIHNvbWUgYml0cyB0byB0aGUgYml0ZmllbGQuICovXG4gIGFkZChiaXRzOiBudW1iZXIpOiB0aGlzIHtcbiAgICB0aGlzLmJpdGZpZWxkIHw9IGJpdHNcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgc29tZSBiaXRzIGZyb20gdGhlIGJpdGZpZWxkLiAqL1xuICByZW1vdmUoYml0czogbnVtYmVyKTogdGhpcyB7XG4gICAgdGhpcy5iaXRmaWVsZCAmPSB+Yml0c1xuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICB0b0pTT04oKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5iaXRmaWVsZFxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUb2dnbGVCaXRmaWVsZEJpZ2ludCB7XG4gIGJpdGZpZWxkID0gMG5cblxuICBjb25zdHJ1Y3RvcihiaXRmaWVsZD86IGJpZ2ludCkge1xuICAgIGlmIChiaXRmaWVsZCkgdGhpcy5iaXRmaWVsZCA9IGJpdGZpZWxkXG4gIH1cblxuICAvKiogVGVzdHMgd2hldGhlciBvciBub3QgdGhpcyBiaXRmaWVsZCBoYXMgdGhlIHBlcm1pc3Npb24gcmVxdWVzdGVkLiAqL1xuICBjb250YWlucyhiaXRzOiBiaWdpbnQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gQm9vbGVhbih0aGlzLmJpdGZpZWxkICYgYml0cylcbiAgfVxuXG4gIC8qKiBBZGRzIHNvbWUgYml0cyB0byB0aGUgYml0ZmllbGQuICovXG4gIGFkZChiaXRzOiBiaWdpbnQpOiB0aGlzIHtcbiAgICB0aGlzLmJpdGZpZWxkIHw9IGJpdHNcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqIFJlbW92ZXMgc29tZSBiaXRzIGZyb20gdGhlIGJpdGZpZWxkLiAqL1xuICByZW1vdmUoYml0czogYmlnaW50KTogdGhpcyB7XG4gICAgdGhpcy5iaXRmaWVsZCAmPSB+Yml0c1xuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICB0b0pTT04oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5iaXRmaWVsZC50b1N0cmluZygpXG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJUb2dnbGVCaXRmaWVsZCIsImJpdGZpZWxkIiwiY29udGFpbnMiLCJiaXRzIiwiQm9vbGVhbiIsImFkZCIsInJlbW92ZSIsInRvSlNPTiIsIlRvZ2dsZUJpdGZpZWxkQmlnaW50IiwidG9TdHJpbmciXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sTUFBTUE7SUFHWCxZQUFZQyxRQUFpQixDQUFFO2FBRi9CQSxXQUFXO1FBR1QsSUFBSUEsVUFBVSxJQUFJLENBQUNBLFFBQVEsR0FBR0E7SUFDaEM7SUFFQSxxRUFBcUUsR0FDckVDLFNBQVNDLElBQVksRUFBVztRQUM5QixPQUFPQyxRQUFRLElBQUksQ0FBQ0gsUUFBUSxHQUFHRTtJQUNqQztJQUVBLG9DQUFvQyxHQUNwQ0UsSUFBSUYsSUFBWSxFQUFRO1FBQ3RCLElBQUksQ0FBQ0YsUUFBUSxJQUFJRTtRQUNqQixPQUFPLElBQUk7SUFDYjtJQUVBLHlDQUF5QyxHQUN6Q0csT0FBT0gsSUFBWSxFQUFRO1FBQ3pCLElBQUksQ0FBQ0YsUUFBUSxJQUFJLENBQUNFO1FBQ2xCLE9BQU8sSUFBSTtJQUNiO0lBRUFJLFNBQWlCO1FBQ2YsT0FBTyxJQUFJLENBQUNOLFFBQVE7SUFDdEI7QUFDRjtBQUVBLE9BQU8sTUFBTU87SUFHWCxZQUFZUCxRQUFpQixDQUFFO2FBRi9CQSxXQUFXLEVBQUU7UUFHWCxJQUFJQSxVQUFVLElBQUksQ0FBQ0EsUUFBUSxHQUFHQTtJQUNoQztJQUVBLHFFQUFxRSxHQUNyRUMsU0FBU0MsSUFBWSxFQUFXO1FBQzlCLE9BQU9DLFFBQVEsSUFBSSxDQUFDSCxRQUFRLEdBQUdFO0lBQ2pDO0lBRUEsb0NBQW9DLEdBQ3BDRSxJQUFJRixJQUFZLEVBQVE7UUFDdEIsSUFBSSxDQUFDRixRQUFRLElBQUlFO1FBQ2pCLE9BQU8sSUFBSTtJQUNiO0lBRUEseUNBQXlDLEdBQ3pDRyxPQUFPSCxJQUFZLEVBQVE7UUFDekIsSUFBSSxDQUFDRixRQUFRLElBQUksQ0FBQ0U7UUFDbEIsT0FBTyxJQUFJO0lBQ2I7SUFFQUksU0FBaUI7UUFDZixPQUFPLElBQUksQ0FBQ04sUUFBUSxDQUFDUSxRQUFRO0lBQy9CO0FBQ0YifQ==