// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// A module to print ANSI terminal colors. Inspired by chalk, kleur, and colors
// on npm.
// https://deno.land/std@0.153.0/fmt/colors.ts?source
let enabled = true;
/**
 * Set changing text color to enabled or disabled
 * @param value
 */ export function setColorEnabled(value) {
    enabled = value;
}
/** Get whether text color change is enabled or disabled. */ export function getColorEnabled() {
    return enabled;
}
/**
 * Builds color code
 * @param open
 * @param close
 */ function code(open, close) {
    return {
        open: `\x1b[${open.join(';')}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, 'g')
    };
}
/**
 * Applies color and background based on color code and its associated text
 * @param str text to apply color settings to
 * @param code color code to apply
 */ function run(str, code) {
    return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
/**
 * Reset the text modified
 * @param str text to reset
 */ export function reset(str) {
    return run(str, code([
        0
    ], 0));
}
/**
 * Make the text bold.
 * @param str text to make bold
 */ export function bold(str) {
    return run(str, code([
        1
    ], 22));
}
/**
 * The text emits only a small amount of light.
 * @param str text to dim
 */ export function dim(str) {
    return run(str, code([
        2
    ], 22));
}
/**
 * Make the text italic.
 * @param str text to make italic
 */ export function italic(str) {
    return run(str, code([
        3
    ], 23));
}
/**
 * Make the text underline.
 * @param str text to underline
 */ export function underline(str) {
    return run(str, code([
        4
    ], 24));
}
/**
 * Invert background color and text color.
 * @param str text to invert its color
 */ export function inverse(str) {
    return run(str, code([
        7
    ], 27));
}
/**
 * Make the text hidden.
 * @param str text to hide
 */ export function hidden(str) {
    return run(str, code([
        8
    ], 28));
}
/**
 * Put horizontal line through the center of the text.
 * @param str text to strike through
 */ export function strikethrough(str) {
    return run(str, code([
        9
    ], 29));
}
/**
 * Set text color to black.
 * @param str text to make black
 */ export function black(str) {
    return run(str, code([
        30
    ], 39));
}
/**
 * Set text color to red.
 * @param str text to make red
 */ export function red(str) {
    return run(str, code([
        31
    ], 39));
}
/**
 * Set text color to green.
 * @param str text to make green
 */ export function green(str) {
    return run(str, code([
        32
    ], 39));
}
/**
 * Set text color to yellow.
 * @param str text to make yellow
 */ export function yellow(str) {
    return run(str, code([
        33
    ], 39));
}
/**
 * Set text color to blue.
 * @param str text to make blue
 */ export function blue(str) {
    return run(str, code([
        34
    ], 39));
}
/**
 * Set text color to magenta.
 * @param str text to make magenta
 */ export function magenta(str) {
    return run(str, code([
        35
    ], 39));
}
/**
 * Set text color to cyan.
 * @param str text to make cyan
 */ export function cyan(str) {
    return run(str, code([
        36
    ], 39));
}
/**
 * Set text color to white.
 * @param str text to make white
 */ export function white(str) {
    return run(str, code([
        37
    ], 39));
}
/**
 * Set text color to gray.
 * @param str text to make gray
 */ export function gray(str) {
    return brightBlack(str);
}
/**
 * Set text color to bright black.
 * @param str text to make bright-black
 */ export function brightBlack(str) {
    return run(str, code([
        90
    ], 39));
}
/**
 * Set text color to bright red.
 * @param str text to make bright-red
 */ export function brightRed(str) {
    return run(str, code([
        91
    ], 39));
}
/**
 * Set text color to bright green.
 * @param str text to make bright-green
 */ export function brightGreen(str) {
    return run(str, code([
        92
    ], 39));
}
/**
 * Set text color to bright yellow.
 * @param str text to make bright-yellow
 */ export function brightYellow(str) {
    return run(str, code([
        93
    ], 39));
}
/**
 * Set text color to bright blue.
 * @param str text to make bright-blue
 */ export function brightBlue(str) {
    return run(str, code([
        94
    ], 39));
}
/**
 * Set text color to bright magenta.
 * @param str text to make bright-magenta
 */ export function brightMagenta(str) {
    return run(str, code([
        95
    ], 39));
}
/**
 * Set text color to bright cyan.
 * @param str text to make bright-cyan
 */ export function brightCyan(str) {
    return run(str, code([
        96
    ], 39));
}
/**
 * Set text color to bright white.
 * @param str text to make bright-white
 */ export function brightWhite(str) {
    return run(str, code([
        97
    ], 39));
}
/**
 * Set background color to black.
 * @param str text to make its background black
 */ export function bgBlack(str) {
    return run(str, code([
        40
    ], 49));
}
/**
 * Set background color to red.
 * @param str text to make its background red
 */ export function bgRed(str) {
    return run(str, code([
        41
    ], 49));
}
/**
 * Set background color to green.
 * @param str text to make its background green
 */ export function bgGreen(str) {
    return run(str, code([
        42
    ], 49));
}
/**
 * Set background color to yellow.
 * @param str text to make its background yellow
 */ export function bgYellow(str) {
    return run(str, code([
        43
    ], 49));
}
/**
 * Set background color to blue.
 * @param str text to make its background blue
 */ export function bgBlue(str) {
    return run(str, code([
        44
    ], 49));
}
/**
 *  Set background color to magenta.
 * @param str text to make its background magenta
 */ export function bgMagenta(str) {
    return run(str, code([
        45
    ], 49));
}
/**
 * Set background color to cyan.
 * @param str text to make its background cyan
 */ export function bgCyan(str) {
    return run(str, code([
        46
    ], 49));
}
/**
 * Set background color to white.
 * @param str text to make its background white
 */ export function bgWhite(str) {
    return run(str, code([
        47
    ], 49));
}
/**
 * Set background color to bright black.
 * @param str text to make its background bright-black
 */ export function bgBrightBlack(str) {
    return run(str, code([
        100
    ], 49));
}
/**
 * Set background color to bright red.
 * @param str text to make its background bright-red
 */ export function bgBrightRed(str) {
    return run(str, code([
        101
    ], 49));
}
/**
 * Set background color to bright green.
 * @param str text to make its background bright-green
 */ export function bgBrightGreen(str) {
    return run(str, code([
        102
    ], 49));
}
/**
 * Set background color to bright yellow.
 * @param str text to make its background bright-yellow
 */ export function bgBrightYellow(str) {
    return run(str, code([
        103
    ], 49));
}
/**
 * Set background color to bright blue.
 * @param str text to make its background bright-blue
 */ export function bgBrightBlue(str) {
    return run(str, code([
        104
    ], 49));
}
/**
 * Set background color to bright magenta.
 * @param str text to make its background bright-magenta
 */ export function bgBrightMagenta(str) {
    return run(str, code([
        105
    ], 49));
}
/**
 * Set background color to bright cyan.
 * @param str text to make its background bright-cyan
 */ export function bgBrightCyan(str) {
    return run(str, code([
        106
    ], 49));
}
/**
 * Set background color to bright white.
 * @param str text to make its background bright-white
 */ export function bgBrightWhite(str) {
    return run(str, code([
        107
    ], 49));
}
/* Special Color Sequences */ /**
 * Clam and truncate color codes
 * @param n
 * @param max number to truncate to
 * @param min number to truncate from
 */ function clampAndTruncate(n, max = 255, min = 0) {
    return Math.trunc(Math.max(Math.min(n, max), min));
}
/**
 * Set text color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit colors to
 * @param color code
 */ export function rgb8(str, color) {
    return run(str, code([
        38,
        5,
        clampAndTruncate(color)
    ], 39));
}
/**
 * Set background color using paletted 8bit colors.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
 * @param str text color to apply paletted 8bit background colors to
 * @param color code
 */ export function bgRgb8(str, color) {
    return run(str, code([
        48,
        5,
        clampAndTruncate(color)
    ], 49));
}
/**
 * Set text color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 * ```ts
 *      import { rgb24 } from "./colors.ts";
 *      rgb24("foo", 0xff00ff);
 *      rgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str text color to apply 24bit rgb to
 * @param color code
 */ export function rgb24(str, color) {
    if (typeof color === 'number') {
        return run(str, code([
            38,
            2,
            color >> 16 & 0xff,
            color >> 8 & 0xff,
            color & 0xff
        ], 39));
    }
    return run(str, code([
        38,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b)
    ], 39));
}
/**
 * Set background color using 24bit rgb.
 * `color` can be a number in range `0x000000` to `0xffffff` or
 * an `Rgb`.
 *
 * To produce the color magenta:
 *
 * ```ts
 *      import { bgRgb24 } from "./colors.ts";
 *      bgRgb24("foo", 0xff00ff);
 *      bgRgb24("foo", {r: 255, g: 0, b: 255});
 * ```
 * @param str text color to apply 24bit rgb to
 * @param color code
 */ export function bgRgb24(str, color) {
    if (typeof color === 'number') {
        return run(str, code([
            48,
            2,
            color >> 16 & 0xff,
            color >> 8 & 0xff,
            color & 0xff
        ], 49));
    }
    return run(str, code([
        48,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b)
    ], 49));
}
// https://github.com/chalk/ansi-regex/blob/02fa893d619d3da85411acc8fd4e2eea0e95a9d9/index.js
const ANSI_PATTERN = new RegExp([
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'
].join('|'), 'g');
/**
 * Remove ANSI escape codes from the string.
 * @param string to remove ANSI escape codes from
 */ export function stripColor(string) {
    return string.replace(ANSI_PATTERN, '');
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb2xvcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIEEgbW9kdWxlIHRvIHByaW50IEFOU0kgdGVybWluYWwgY29sb3JzLiBJbnNwaXJlZCBieSBjaGFsaywga2xldXIsIGFuZCBjb2xvcnNcbi8vIG9uIG5wbS5cbi8vIGh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2ZtdC9jb2xvcnMudHM/c291cmNlXG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29kZSB7XG4gIG9wZW46IHN0cmluZ1xuICBjbG9zZTogc3RyaW5nXG4gIHJlZ2V4cDogUmVnRXhwXG59XG5cbi8qKiBSR0IgOC1iaXRzIHBlciBjaGFubmVsLiBFYWNoIGluIHJhbmdlIGAwLT4yNTVgIG9yIGAweDAwLT4weGZmYCAqL1xuZXhwb3J0IGludGVyZmFjZSBSZ2Ige1xuICByOiBudW1iZXJcbiAgZzogbnVtYmVyXG4gIGI6IG51bWJlclxufVxuXG5sZXQgZW5hYmxlZCA9IHRydWVcblxuLyoqXG4gKiBTZXQgY2hhbmdpbmcgdGV4dCBjb2xvciB0byBlbmFibGVkIG9yIGRpc2FibGVkXG4gKiBAcGFyYW0gdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldENvbG9yRW5hYmxlZCh2YWx1ZTogYm9vbGVhbikge1xuICBlbmFibGVkID0gdmFsdWVcbn1cblxuLyoqIEdldCB3aGV0aGVyIHRleHQgY29sb3IgY2hhbmdlIGlzIGVuYWJsZWQgb3IgZGlzYWJsZWQuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29sb3JFbmFibGVkKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gZW5hYmxlZFxufVxuXG4vKipcbiAqIEJ1aWxkcyBjb2xvciBjb2RlXG4gKiBAcGFyYW0gb3BlblxuICogQHBhcmFtIGNsb3NlXG4gKi9cbmZ1bmN0aW9uIGNvZGUob3BlbjogbnVtYmVyW10sIGNsb3NlOiBudW1iZXIpOiBDb2RlIHtcbiAgcmV0dXJuIHtcbiAgICBvcGVuOiBgXFx4MWJbJHtvcGVuLmpvaW4oJzsnKX1tYCxcbiAgICBjbG9zZTogYFxceDFiWyR7Y2xvc2V9bWAsXG4gICAgcmVnZXhwOiBuZXcgUmVnRXhwKGBcXFxceDFiXFxcXFske2Nsb3NlfW1gLCAnZycpLFxuICB9XG59XG5cbi8qKlxuICogQXBwbGllcyBjb2xvciBhbmQgYmFja2dyb3VuZCBiYXNlZCBvbiBjb2xvciBjb2RlIGFuZCBpdHMgYXNzb2NpYXRlZCB0ZXh0XG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gYXBwbHkgY29sb3Igc2V0dGluZ3MgdG9cbiAqIEBwYXJhbSBjb2RlIGNvbG9yIGNvZGUgdG8gYXBwbHlcbiAqL1xuZnVuY3Rpb24gcnVuKHN0cjogc3RyaW5nLCBjb2RlOiBDb2RlKTogc3RyaW5nIHtcbiAgcmV0dXJuIGVuYWJsZWQgPyBgJHtjb2RlLm9wZW59JHtzdHIucmVwbGFjZShjb2RlLnJlZ2V4cCwgY29kZS5vcGVuKX0ke2NvZGUuY2xvc2V9YCA6IHN0clxufVxuXG4vKipcbiAqIFJlc2V0IHRoZSB0ZXh0IG1vZGlmaWVkXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gcmVzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzBdLCAwKSlcbn1cblxuLyoqXG4gKiBNYWtlIHRoZSB0ZXh0IGJvbGQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBib2xkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBib2xkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzFdLCAyMikpXG59XG5cbi8qKlxuICogVGhlIHRleHQgZW1pdHMgb25seSBhIHNtYWxsIGFtb3VudCBvZiBsaWdodC5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBkaW1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpbShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsyXSwgMjIpKVxufVxuXG4vKipcbiAqIE1ha2UgdGhlIHRleHQgaXRhbGljLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRhbGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpdGFsaWMoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbM10sIDIzKSlcbn1cblxuLyoqXG4gKiBNYWtlIHRoZSB0ZXh0IHVuZGVybGluZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byB1bmRlcmxpbmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuZGVybGluZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0XSwgMjQpKVxufVxuXG4vKipcbiAqIEludmVydCBiYWNrZ3JvdW5kIGNvbG9yIGFuZCB0ZXh0IGNvbG9yLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIGludmVydCBpdHMgY29sb3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludmVyc2Uoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbN10sIDI3KSlcbn1cblxuLyoqXG4gKiBNYWtlIHRoZSB0ZXh0IGhpZGRlbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBoaWRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoaWRkZW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOF0sIDI4KSlcbn1cblxuLyoqXG4gKiBQdXQgaG9yaXpvbnRhbCBsaW5lIHRocm91Z2ggdGhlIGNlbnRlciBvZiB0aGUgdGV4dC5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBzdHJpa2UgdGhyb3VnaFxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaWtldGhyb3VnaChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs5XSwgMjkpKVxufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJsYWNrLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYmxhY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsYWNrKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMwXSwgMzkpKVxufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIHJlZC5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIHJlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMxXSwgMzkpKVxufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGdyZWVuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgZ3JlZW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdyZWVuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMyXSwgMzkpKVxufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIHllbGxvdy5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIHllbGxvd1xuICovXG5leHBvcnQgZnVuY3Rpb24geWVsbG93KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMzXSwgMzkpKVxufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJsdWUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBibHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibHVlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM0XSwgMzkpKVxufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIG1hZ2VudGEuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBtYWdlbnRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYWdlbnRhKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM1XSwgMzkpKVxufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGN5YW4uXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBjeWFuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjeWFuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM2XSwgMzkpKVxufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIHdoaXRlLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2Ugd2hpdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdoaXRlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzM3XSwgMzkpKVxufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGdyYXkuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBncmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBncmF5KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGJyaWdodEJsYWNrKHN0cilcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBicmlnaHQgYmxhY2suXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBicmlnaHQtYmxhY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodEJsYWNrKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzkwXSwgMzkpKVxufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCByZWQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBicmlnaHQtcmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBicmlnaHRSZWQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTFdLCAzOSkpXG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gYnJpZ2h0IGdyZWVuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYnJpZ2h0LWdyZWVuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBicmlnaHRHcmVlbihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs5Ml0sIDM5KSlcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBicmlnaHQgeWVsbG93LlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYnJpZ2h0LXllbGxvd1xuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0WWVsbG93KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzkzXSwgMzkpKVxufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCBibHVlLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgYnJpZ2h0LWJsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodEJsdWUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTRdLCAzOSkpXG59XG5cbi8qKlxuICogU2V0IHRleHQgY29sb3IgdG8gYnJpZ2h0IG1hZ2VudGEuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBicmlnaHQtbWFnZW50YVxuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0TWFnZW50YShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs5NV0sIDM5KSlcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB0byBicmlnaHQgY3lhbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJyaWdodC1jeWFuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBicmlnaHRDeWFuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzk2XSwgMzkpKVxufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHRvIGJyaWdodCB3aGl0ZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGJyaWdodC13aGl0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0V2hpdGUoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbOTddLCAzOSkpXG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gYmxhY2suXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBibGFja1xuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCbGFjayhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0MF0sIDQ5KSlcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byByZWQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCByZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnUmVkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQxXSwgNDkpKVxufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGdyZWVuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgZ3JlZW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnR3JlZW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDJdLCA0OSkpXG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8geWVsbG93LlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgeWVsbG93XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ1llbGxvdyhzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0M10sIDQ5KSlcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBibHVlLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYmx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCbHVlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQ0XSwgNDkpKVxufVxuXG4vKipcbiAqICBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBtYWdlbnRhLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgbWFnZW50YVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdNYWdlbnRhKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQ1XSwgNDkpKVxufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGN5YW4uXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBjeWFuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0N5YW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDZdLCA0OSkpXG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gd2hpdGUuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCB3aGl0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdXaGl0ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFs0N10sIDQ5KSlcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgYmxhY2suXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBicmlnaHQtYmxhY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQnJpZ2h0QmxhY2soc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTAwXSwgNDkpKVxufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJyaWdodCByZWQuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBicmlnaHQtcmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JyaWdodFJlZChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsxMDFdLCA0OSkpXG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gYnJpZ2h0IGdyZWVuLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYnJpZ2h0LWdyZWVuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JyaWdodEdyZWVuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzEwMl0sIDQ5KSlcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgeWVsbG93LlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYnJpZ2h0LXllbGxvd1xuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCcmlnaHRZZWxsb3coc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTAzXSwgNDkpKVxufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJyaWdodCBibHVlLlxuICogQHBhcmFtIHN0ciB0ZXh0IHRvIG1ha2UgaXRzIGJhY2tncm91bmQgYnJpZ2h0LWJsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJnQnJpZ2h0Qmx1ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsxMDRdLCA0OSkpXG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdG8gYnJpZ2h0IG1hZ2VudGEuXG4gKiBAcGFyYW0gc3RyIHRleHQgdG8gbWFrZSBpdHMgYmFja2dyb3VuZCBicmlnaHQtbWFnZW50YVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCcmlnaHRNYWdlbnRhKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzEwNV0sIDQ5KSlcbn1cblxuLyoqXG4gKiBTZXQgYmFja2dyb3VuZCBjb2xvciB0byBicmlnaHQgY3lhbi5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJyaWdodC1jeWFuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ0JyaWdodEN5YW4oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMTA2XSwgNDkpKVxufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHRvIGJyaWdodCB3aGl0ZS5cbiAqIEBwYXJhbSBzdHIgdGV4dCB0byBtYWtlIGl0cyBiYWNrZ3JvdW5kIGJyaWdodC13aGl0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmdCcmlnaHRXaGl0ZShzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBydW4oc3RyLCBjb2RlKFsxMDddLCA0OSkpXG59XG5cbi8qIFNwZWNpYWwgQ29sb3IgU2VxdWVuY2VzICovXG5cbi8qKlxuICogQ2xhbSBhbmQgdHJ1bmNhdGUgY29sb3IgY29kZXNcbiAqIEBwYXJhbSBuXG4gKiBAcGFyYW0gbWF4IG51bWJlciB0byB0cnVuY2F0ZSB0b1xuICogQHBhcmFtIG1pbiBudW1iZXIgdG8gdHJ1bmNhdGUgZnJvbVxuICovXG5mdW5jdGlvbiBjbGFtcEFuZFRydW5jYXRlKG46IG51bWJlciwgbWF4ID0gMjU1LCBtaW4gPSAwKTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGgudHJ1bmMoTWF0aC5tYXgoTWF0aC5taW4obiwgbWF4KSwgbWluKSlcbn1cblxuLyoqXG4gKiBTZXQgdGV4dCBjb2xvciB1c2luZyBwYWxldHRlZCA4Yml0IGNvbG9ycy5cbiAqIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjOC1iaXRcbiAqIEBwYXJhbSBzdHIgdGV4dCBjb2xvciB0byBhcHBseSBwYWxldHRlZCA4Yml0IGNvbG9ycyB0b1xuICogQHBhcmFtIGNvbG9yIGNvZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJnYjgoc3RyOiBzdHJpbmcsIGNvbG9yOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzgsIDUsIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IpXSwgMzkpKVxufVxuXG4vKipcbiAqIFNldCBiYWNrZ3JvdW5kIGNvbG9yIHVzaW5nIHBhbGV0dGVkIDhiaXQgY29sb3JzLlxuICogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSM4LWJpdFxuICogQHBhcmFtIHN0ciB0ZXh0IGNvbG9yIHRvIGFwcGx5IHBhbGV0dGVkIDhiaXQgYmFja2dyb3VuZCBjb2xvcnMgdG9cbiAqIEBwYXJhbSBjb2xvciBjb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ1JnYjgoc3RyOiBzdHJpbmcsIGNvbG9yOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDgsIDUsIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IpXSwgNDkpKVxufVxuXG4vKipcbiAqIFNldCB0ZXh0IGNvbG9yIHVzaW5nIDI0Yml0IHJnYi5cbiAqIGBjb2xvcmAgY2FuIGJlIGEgbnVtYmVyIGluIHJhbmdlIGAweDAwMDAwMGAgdG8gYDB4ZmZmZmZmYCBvclxuICogYW4gYFJnYmAuXG4gKlxuICogVG8gcHJvZHVjZSB0aGUgY29sb3IgbWFnZW50YTpcbiAqXG4gKiBgYGB0c1xuICogICAgICBpbXBvcnQgeyByZ2IyNCB9IGZyb20gXCIuL2NvbG9ycy50c1wiO1xuICogICAgICByZ2IyNChcImZvb1wiLCAweGZmMDBmZik7XG4gKiAgICAgIHJnYjI0KFwiZm9vXCIsIHtyOiAyNTUsIGc6IDAsIGI6IDI1NX0pO1xuICogYGBgXG4gKiBAcGFyYW0gc3RyIHRleHQgY29sb3IgdG8gYXBwbHkgMjRiaXQgcmdiIHRvXG4gKiBAcGFyYW0gY29sb3IgY29kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmdiMjQoc3RyOiBzdHJpbmcsIGNvbG9yOiBudW1iZXIgfCBSZ2IpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIGNvbG9yID09PSAnbnVtYmVyJykge1xuICAgIHJldHVybiBydW4oc3RyLCBjb2RlKFszOCwgMiwgKGNvbG9yID4+IDE2KSAmIDB4ZmYsIChjb2xvciA+PiA4KSAmIDB4ZmYsIGNvbG9yICYgMHhmZl0sIDM5KSlcbiAgfVxuICByZXR1cm4gcnVuKHN0ciwgY29kZShbMzgsIDIsIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IuciksIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IuZyksIGNsYW1wQW5kVHJ1bmNhdGUoY29sb3IuYildLCAzOSkpXG59XG5cbi8qKlxuICogU2V0IGJhY2tncm91bmQgY29sb3IgdXNpbmcgMjRiaXQgcmdiLlxuICogYGNvbG9yYCBjYW4gYmUgYSBudW1iZXIgaW4gcmFuZ2UgYDB4MDAwMDAwYCB0byBgMHhmZmZmZmZgIG9yXG4gKiBhbiBgUmdiYC5cbiAqXG4gKiBUbyBwcm9kdWNlIHRoZSBjb2xvciBtYWdlbnRhOlxuICpcbiAqIGBgYHRzXG4gKiAgICAgIGltcG9ydCB7IGJnUmdiMjQgfSBmcm9tIFwiLi9jb2xvcnMudHNcIjtcbiAqICAgICAgYmdSZ2IyNChcImZvb1wiLCAweGZmMDBmZik7XG4gKiAgICAgIGJnUmdiMjQoXCJmb29cIiwge3I6IDI1NSwgZzogMCwgYjogMjU1fSk7XG4gKiBgYGBcbiAqIEBwYXJhbSBzdHIgdGV4dCBjb2xvciB0byBhcHBseSAyNGJpdCByZ2IgdG9cbiAqIEBwYXJhbSBjb2xvciBjb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiZ1JnYjI0KHN0cjogc3RyaW5nLCBjb2xvcjogbnVtYmVyIHwgUmdiKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiBjb2xvciA9PT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gcnVuKHN0ciwgY29kZShbNDgsIDIsIChjb2xvciA+PiAxNikgJiAweGZmLCAoY29sb3IgPj4gOCkgJiAweGZmLCBjb2xvciAmIDB4ZmZdLCA0OSkpXG4gIH1cbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzQ4LCAyLCBjbGFtcEFuZFRydW5jYXRlKGNvbG9yLnIpLCBjbGFtcEFuZFRydW5jYXRlKGNvbG9yLmcpLCBjbGFtcEFuZFRydW5jYXRlKGNvbG9yLmIpXSwgNDkpKVxufVxuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vY2hhbGsvYW5zaS1yZWdleC9ibG9iLzAyZmE4OTNkNjE5ZDNkYTg1NDExYWNjOGZkNGUyZWVhMGU5NWE5ZDkvaW5kZXguanNcbmNvbnN0IEFOU0lfUEFUVEVSTiA9IG5ldyBSZWdFeHAoXG4gIFtcbiAgICAnW1xcXFx1MDAxQlxcXFx1MDA5Ql1bW1xcXFxdKCkjOz9dKig/Oig/Oig/Oig/OjtbLWEtekEtWlxcXFxkXFxcXC8jJi46PT8lQH5fXSspKnxbYS16QS1aXFxcXGRdKyg/OjtbLWEtekEtWlxcXFxkXFxcXC8jJi46PT8lQH5fXSopKik/XFxcXHUwMDA3KScsXG4gICAgJyg/Oig/OlxcXFxkezEsNH0oPzo7XFxcXGR7MCw0fSkqKT9bXFxcXGRBLVBSLVRaY2YtbnEtdXk9Pjx+XSkpJyxcbiAgXS5qb2luKCd8JyksXG4gICdnJyxcbilcblxuLyoqXG4gKiBSZW1vdmUgQU5TSSBlc2NhcGUgY29kZXMgZnJvbSB0aGUgc3RyaW5nLlxuICogQHBhcmFtIHN0cmluZyB0byByZW1vdmUgQU5TSSBlc2NhcGUgY29kZXMgZnJvbVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaXBDb2xvcihzdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzdHJpbmcucmVwbGFjZShBTlNJX1BBVFRFUk4sICcnKVxufVxuIl0sIm5hbWVzIjpbImVuYWJsZWQiLCJzZXRDb2xvckVuYWJsZWQiLCJ2YWx1ZSIsImdldENvbG9yRW5hYmxlZCIsImNvZGUiLCJvcGVuIiwiY2xvc2UiLCJqb2luIiwicmVnZXhwIiwiUmVnRXhwIiwicnVuIiwic3RyIiwicmVwbGFjZSIsInJlc2V0IiwiYm9sZCIsImRpbSIsIml0YWxpYyIsInVuZGVybGluZSIsImludmVyc2UiLCJoaWRkZW4iLCJzdHJpa2V0aHJvdWdoIiwiYmxhY2siLCJyZWQiLCJncmVlbiIsInllbGxvdyIsImJsdWUiLCJtYWdlbnRhIiwiY3lhbiIsIndoaXRlIiwiZ3JheSIsImJyaWdodEJsYWNrIiwiYnJpZ2h0UmVkIiwiYnJpZ2h0R3JlZW4iLCJicmlnaHRZZWxsb3ciLCJicmlnaHRCbHVlIiwiYnJpZ2h0TWFnZW50YSIsImJyaWdodEN5YW4iLCJicmlnaHRXaGl0ZSIsImJnQmxhY2siLCJiZ1JlZCIsImJnR3JlZW4iLCJiZ1llbGxvdyIsImJnQmx1ZSIsImJnTWFnZW50YSIsImJnQ3lhbiIsImJnV2hpdGUiLCJiZ0JyaWdodEJsYWNrIiwiYmdCcmlnaHRSZWQiLCJiZ0JyaWdodEdyZWVuIiwiYmdCcmlnaHRZZWxsb3ciLCJiZ0JyaWdodEJsdWUiLCJiZ0JyaWdodE1hZ2VudGEiLCJiZ0JyaWdodEN5YW4iLCJiZ0JyaWdodFdoaXRlIiwiY2xhbXBBbmRUcnVuY2F0ZSIsIm4iLCJtYXgiLCJtaW4iLCJNYXRoIiwidHJ1bmMiLCJyZ2I4IiwiY29sb3IiLCJiZ1JnYjgiLCJyZ2IyNCIsInIiLCJnIiwiYiIsImJnUmdiMjQiLCJBTlNJX1BBVFRFUk4iLCJzdHJpcENvbG9yIiwic3RyaW5nIl0sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUsK0VBQStFO0FBQy9FLFVBQVU7QUFDVixxREFBcUQ7QUFlckQsSUFBSUEsVUFBVTtBQUVkOzs7Q0FHQyxHQUNELE9BQU8sU0FBU0MsZ0JBQWdCQyxLQUFjO0lBQzVDRixVQUFVRTtBQUNaO0FBRUEsMERBQTBELEdBQzFELE9BQU8sU0FBU0M7SUFDZCxPQUFPSDtBQUNUO0FBRUE7Ozs7Q0FJQyxHQUNELFNBQVNJLEtBQUtDLElBQWMsRUFBRUMsS0FBYTtJ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