import { ToggleBitfield } from './ToggleBitfield.js';
export const VoiceStateToggle = {
    /** Whether this user is deafened by the server */ deaf: 1 << 0,
    /** Whether this user is muted by the server */ mute: 1 << 1,
    /** Whether this user is locally deafened */ selfDeaf: 1 << 2,
    /** Whether this user is locally muted */ selfMute: 1 << 3,
    /** Whether this user is streaming using "Go Live" */ selfStream: 1 << 4,
    /** Whether this user's camera is enabled */ selfVideo: 1 << 5,
    /** Whether this user is muted by the current user */ suppress: 1 << 6
};
export class VoiceStateToggles extends ToggleBitfield {
    constructor(voiceOrTogglesInt){
        super();
        if (typeof voiceOrTogglesInt === 'number') this.bitfield = voiceOrTogglesInt;
        else {
            const voice = voiceOrTogglesInt;
            if (voice.deaf) this.add(VoiceStateToggle.deaf);
            if (voice.mute) this.add(VoiceStateToggle.mute);
            if (voice.self_deaf) this.add(VoiceStateToggle.selfDeaf);
            if (voice.self_mute) this.add(VoiceStateToggle.selfMute);
            if (voice.self_stream) this.add(VoiceStateToggle.selfStream);
            if (voice.self_video) this.add(VoiceStateToggle.selfVideo);
            if (voice.suppress) this.add(VoiceStateToggle.suppress);
        }
    }
    /** Whether this user is deafened by the server */ get deaf() {
        return this.has('deaf');
    }
    /** Whether this user is muted by the server */ get mute() {
        return this.has('mute');
    }
    /** Whether this user is locally deafened */ get selfDeaf() {
        return this.has('selfDeaf');
    }
    /** Whether this user is locally muted */ get selfMute() {
        return this.has('selfMute');
    }
    /** Whether this user is streaming using "Go Live" */ get selfStream() {
        return this.has('selfStream');
    }
    /** Whether this user's camera is enabled */ get selfVideo() {
        return this.has('selfVideo');
    }
    /** Whether this user is muted by the current user */ get suppress() {
        return this.has('suppress');
    }
    /** Checks whether or not the permissions exist in this */ has(permissions) {
        if (!Array.isArray(permissions)) return super.contains(VoiceStateToggle[permissions]);
        return super.contains(permissions.reduce((a, b)=>a |= VoiceStateToggle[b], 0));
    }
    /** Lists all the toggles for the role and whether or not each is true or false. */ list() {
        const json = {};
        for (const [key, value] of Object.entries(VoiceStateToggle)){
            json[key] = super.contains(value);
        }
        return json;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90cmFuc2Zvcm1lcnMvdG9nZ2xlcy92b2ljZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IERpc2NvcmRWb2ljZVN0YXRlIH0gZnJvbSAnQGRpc2NvcmRlbm8vdHlwZXMnXG5pbXBvcnQgeyBUb2dnbGVCaXRmaWVsZCB9IGZyb20gJy4vVG9nZ2xlQml0ZmllbGQuanMnXG5cbmV4cG9ydCBjb25zdCBWb2ljZVN0YXRlVG9nZ2xlID0ge1xuICAvKiogV2hldGhlciB0aGlzIHVzZXIgaXMgZGVhZmVuZWQgYnkgdGhlIHNlcnZlciAqL1xuICBkZWFmOiAxIDw8IDAsXG4gIC8qKiBXaGV0aGVyIHRoaXMgdXNlciBpcyBtdXRlZCBieSB0aGUgc2VydmVyICovXG4gIG11dGU6IDEgPDwgMSxcbiAgLyoqIFdoZXRoZXIgdGhpcyB1c2VyIGlzIGxvY2FsbHkgZGVhZmVuZWQgKi9cbiAgc2VsZkRlYWY6IDEgPDwgMixcbiAgLyoqIFdoZXRoZXIgdGhpcyB1c2VyIGlzIGxvY2FsbHkgbXV0ZWQgKi9cbiAgc2VsZk11dGU6IDEgPDwgMyxcbiAgLyoqIFdoZXRoZXIgdGhpcyB1c2VyIGlzIHN0cmVhbWluZyB1c2luZyBcIkdvIExpdmVcIiAqL1xuICBzZWxmU3RyZWFtOiAxIDw8IDQsXG4gIC8qKiBXaGV0aGVyIHRoaXMgdXNlcidzIGNhbWVyYSBpcyBlbmFibGVkICovXG4gIHNlbGZWaWRlbzogMSA8PCA1LFxuICAvKiogV2hldGhlciB0aGlzIHVzZXIgaXMgbXV0ZWQgYnkgdGhlIGN1cnJlbnQgdXNlciAqL1xuICBzdXBwcmVzczogMSA8PCA2LFxufVxuXG5leHBvcnQgY2xhc3MgVm9pY2VTdGF0ZVRvZ2dsZXMgZXh0ZW5kcyBUb2dnbGVCaXRmaWVsZCB7XG4gIGNvbnN0cnVjdG9yKHZvaWNlT3JUb2dnbGVzSW50OiBEaXNjb3JkVm9pY2VTdGF0ZSB8IG51bWJlcikge1xuICAgIHN1cGVyKClcblxuICAgIGlmICh0eXBlb2Ygdm9pY2VPclRvZ2dsZXNJbnQgPT09ICdudW1iZXInKSB0aGlzLmJpdGZpZWxkID0gdm9pY2VPclRvZ2dsZXNJbnRcbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IHZvaWNlID0gdm9pY2VPclRvZ2dsZXNJbnRcblxuICAgICAgaWYgKHZvaWNlLmRlYWYpIHRoaXMuYWRkKFZvaWNlU3RhdGVUb2dnbGUuZGVhZilcbiAgICAgIGlmICh2b2ljZS5tdXRlKSB0aGlzLmFkZChWb2ljZVN0YXRlVG9nZ2xlLm11dGUpXG4gICAgICBpZiAodm9pY2Uuc2VsZl9kZWFmKSB0aGlzLmFkZChWb2ljZVN0YXRlVG9nZ2xlLnNlbGZEZWFmKVxuICAgICAgaWYgKHZvaWNlLnNlbGZfbXV0ZSkgdGhpcy5hZGQoVm9pY2VTdGF0ZVRvZ2dsZS5zZWxmTXV0ZSlcbiAgICAgIGlmICh2b2ljZS5zZWxmX3N0cmVhbSkgdGhpcy5hZGQoVm9pY2VTdGF0ZVRvZ2dsZS5zZWxmU3RyZWFtKVxuICAgICAgaWYgKHZvaWNlLnNlbGZfdmlkZW8pIHRoaXMuYWRkKFZvaWNlU3RhdGVUb2dnbGUuc2VsZlZpZGVvKVxuICAgICAgaWYgKHZvaWNlLnN1cHByZXNzKSB0aGlzLmFkZChWb2ljZVN0YXRlVG9nZ2xlLnN1cHByZXNzKVxuICAgIH1cbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoaXMgdXNlciBpcyBkZWFmZW5lZCBieSB0aGUgc2VydmVyICovXG4gIGdldCBkZWFmKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygnZGVhZicpXG4gIH1cblxuICAvKiogV2hldGhlciB0aGlzIHVzZXIgaXMgbXV0ZWQgYnkgdGhlIHNlcnZlciAqL1xuICBnZXQgbXV0ZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ211dGUnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyB1c2VyIGlzIGxvY2FsbHkgZGVhZmVuZWQgKi9cbiAgZ2V0IHNlbGZEZWFmKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygnc2VsZkRlYWYnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyB1c2VyIGlzIGxvY2FsbHkgbXV0ZWQgKi9cbiAgZ2V0IHNlbGZNdXRlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhcygnc2VsZk11dGUnKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyB1c2VyIGlzIHN0cmVhbWluZyB1c2luZyBcIkdvIExpdmVcIiAqL1xuICBnZXQgc2VsZlN0cmVhbSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ3NlbGZTdHJlYW0nKVxuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhpcyB1c2VyJ3MgY2FtZXJhIGlzIGVuYWJsZWQgKi9cbiAgZ2V0IHNlbGZWaWRlbygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXMoJ3NlbGZWaWRlbycpXG4gIH1cblxuICAvKiogV2hldGhlciB0aGlzIHVzZXIgaXMgbXV0ZWQgYnkgdGhlIGN1cnJlbnQgdXNlciAqL1xuICBnZXQgc3VwcHJlc3MoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaGFzKCdzdXBwcmVzcycpXG4gIH1cblxuICAvKiogQ2hlY2tzIHdoZXRoZXIgb3Igbm90IHRoZSBwZXJtaXNzaW9ucyBleGlzdCBpbiB0aGlzICovXG4gIGhhcyhwZXJtaXNzaW9uczogVm9pY2VTdGF0ZVRvZ2dsZUtleXMgfCBWb2ljZVN0YXRlVG9nZ2xlS2V5c1tdKTogYm9vbGVhbiB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHBlcm1pc3Npb25zKSkgcmV0dXJuIHN1cGVyLmNvbnRhaW5zKFZvaWNlU3RhdGVUb2dnbGVbcGVybWlzc2lvbnNdKVxuXG4gICAgcmV0dXJuIHN1cGVyLmNvbnRhaW5zKHBlcm1pc3Npb25zLnJlZHVjZSgoYSwgYikgPT4gKGEgfD0gVm9pY2VTdGF0ZVRvZ2dsZVtiXSksIDApKVxuICB9XG5cbiAgLyoqIExpc3RzIGFsbCB0aGUgdG9nZ2xlcyBmb3IgdGhlIHJvbGUgYW5kIHdoZXRoZXIgb3Igbm90IGVhY2ggaXMgdHJ1ZSBvciBmYWxzZS4gKi9cbiAgbGlzdCgpOiBSZWNvcmQ8Vm9pY2VTdGF0ZVRvZ2dsZUtleXMsIGJvb2xlYW4+IHtcbiAgICBjb25zdCBqc29uOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoVm9pY2VTdGF0ZVRvZ2dsZSkpIHtcbiAgICAgIGpzb25ba2V5XSA9IHN1cGVyLmNvbnRhaW5zKHZhbHVlKVxuICAgIH1cblxuICAgIHJldHVybiBqc29uIGFzIFJlY29yZDxWb2ljZVN0YXRlVG9nZ2xlS2V5cywgYm9vbGVhbj5cbiAgfVxufVxuXG5leHBvcnQgdHlwZSBWb2ljZVN0YXRlVG9nZ2xlS2V5cyA9IGtleW9mIHR5cGVvZiBWb2ljZVN0YXRlVG9nZ2xlXG4iXSwibmFtZXMiOlsiVG9nZ2xlQml0ZmllbGQiLCJWb2ljZVN0YXRlVG9nZ2xlIiwiZGVhZiIsIm11dGUiLCJzZWxmRGVhZiIsInNlbGZNdXRlIiwic2VsZlN0cmVhbSIsInNlbGZWaWRlbyIsInN1cHByZXNzIiwiVm9pY2VTdGF0ZVRvZ2dsZXMiLCJ2b2ljZU9yVG9nZ2xlc0ludCIsImJpdGZpZWxkIiwidm9pY2UiLCJhZGQiLCJzZWxmX2RlYWYiLCJzZWxmX211dGUiLCJzZWxmX3N0cmVhbSIsInNlbGZfdmlkZW8iLCJoYXMiLCJwZXJtaXNzaW9ucyIsIkFycmF5IiwiaXNBcnJheSIsImNvbnRhaW5zIiwicmVkdWNlIiwiYSIsImIiLCJsaXN0IiwianNvbiIsImtleSIsInZhbHVlIiwiT2JqZWN0IiwiZW50cmllcyJdLCJtYXBwaW5ncyI6IkFBQ0EsU0FBU0EsY0FBYyxRQUFRLHNCQUFxQjtBQUVwRCxPQUFPLE1BQU1DLG1CQUFtQjtJQUM5QixnREFBZ0QsR0FDaERDLE1BQU0sS0FBSztJQUNYLDZDQUE2QyxHQUM3Q0MsTUFBTSxLQUFLO0lBQ1gsMENBQTBDLEdBQzFDQyxVQUFVLEtBQUs7SUFDZix1Q0FBdUMsR0FDdkNDLFVBQVUsS0FBSztJ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