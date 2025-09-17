import { bgBrightMagenta, black, bold, cyan, gray, italic, red, yellow } from './colors.js'
export var LogLevels = /*#__PURE__*/ (function (LogLevels) {
  LogLevels[(LogLevels['Debug'] = 0)] = 'Debug'
  LogLevels[(LogLevels['Info'] = 1)] = 'Info'
  LogLevels[(LogLevels['Warn'] = 2)] = 'Warn'
  LogLevels[(LogLevels['Error'] = 3)] = 'Error'
  LogLevels[(LogLevels['Fatal'] = 4)] = 'Fatal'
  return LogLevels
})({})
const prefixes = new Map([
  [0, 'DEBUG'],
  [1, 'INFO'],
  [2, 'WARN'],
  [3, 'ERROR'],
  [4, 'FATAL'],
])
const noColor = (msg) => msg
const colorFunctions = new Map([
  [0, gray],
  [1, cyan],
  [2, yellow],
  [3, (str) => red(str)],
  [4, (str) => red(bold(italic(str)))],
])
export function createLogger({ logLevel = 1, name } = {}) {
  function log(level, ...args) {
    if (level < logLevel) return
    let color = colorFunctions.get(level)
    if (!color) color = noColor
    const date = new Date()
    const log1 = [
      bgBrightMagenta(black(`[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]`)),
      color(prefixes.get(level) ?? 'DEBUG'),
      name ? `${name} >` : '>',
      ...args,
    ]
    switch (level) {
      case 0:
        return console.debug(...log1)
      case 1:
        return console.info(...log1)
      case 2:
        return console.warn(...log1)
      case 3:
        return console.error(...log1)
      case 4:
        return console.error(...log1)
      default:
        return console.log(...log1)
    }
  }
  function setLevel(level) {
    logLevel = level
  }
  function debug(...args) {
    log(0, ...args)
  }
  function info(...args) {
    log(1, ...args)
  }
  function warn(...args) {
    log(2, ...args)
  }
  function error(...args) {
    log(3, ...args)
  }
  function fatal(...args) {
    log(4, ...args)
  }
  return {
    log,
    setLevel,
    debug,
    info,
    warn,
    error,
    fatal,
  }
}
export const logger = createLogger({
  name: 'Discordeno',
})
export default logger

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9sb2dnZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYmdCcmlnaHRNYWdlbnRhLCBibGFjaywgYm9sZCwgY3lhbiwgZ3JheSwgaXRhbGljLCByZWQsIHllbGxvdyB9IGZyb20gJy4vY29sb3JzLmpzJ1xuXG5leHBvcnQgZW51bSBMb2dMZXZlbHMge1xuICBEZWJ1ZyxcbiAgSW5mbyxcbiAgV2FybixcbiAgRXJyb3IsXG4gIEZhdGFsLFxufVxuXG5jb25zdCBwcmVmaXhlcyA9IG5ldyBNYXA8TG9nTGV2ZWxzLCBzdHJpbmc+KFtcbiAgW0xvZ0xldmVscy5EZWJ1ZywgJ0RFQlVHJ10sXG4gIFtMb2dMZXZlbHMuSW5mbywgJ0lORk8nXSxcbiAgW0xvZ0xldmVscy5XYXJuLCAnV0FSTiddLFxuICBbTG9nTGV2ZWxzLkVycm9yLCAnRVJST1InXSxcbiAgW0xvZ0xldmVscy5GYXRhbCwgJ0ZBVEFMJ10sXG5dKVxuXG5jb25zdCBub0NvbG9yOiAoc3RyOiBzdHJpbmcpID0+IHN0cmluZyA9IChtc2cpID0+IG1zZ1xuY29uc3QgY29sb3JGdW5jdGlvbnMgPSBuZXcgTWFwPExvZ0xldmVscywgKHN0cjogc3RyaW5nKSA9PiBzdHJpbmc+KFtcbiAgW0xvZ0xldmVscy5EZWJ1ZywgZ3JheV0sXG4gIFtMb2dMZXZlbHMuSW5mbywgY3lhbl0sXG4gIFtMb2dMZXZlbHMuV2FybiwgeWVsbG93XSxcbiAgW0xvZ0xldmVscy5FcnJvciwgKHN0cjogc3RyaW5nKSA9PiByZWQoc3RyKV0sXG4gIFtMb2dMZXZlbHMuRmF0YWwsIChzdHI6IHN0cmluZykgPT4gcmVkKGJvbGQoaXRhbGljKHN0cikpKV0sXG5dKVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTG9nZ2VyKHsgbG9nTGV2ZWwgPSBMb2dMZXZlbHMuSW5mbywgbmFtZSB9OiB7IGxvZ0xldmVsPzogTG9nTGV2ZWxzOyBuYW1lPzogc3RyaW5nIH0gPSB7fSkge1xuICBmdW5jdGlvbiBsb2cobGV2ZWw6IExvZ0xldmVscywgLi4uYXJnczogYW55W10pIHtcbiAgICBpZiAobGV2ZWwgPCBsb2dMZXZlbCkgcmV0dXJuXG5cbiAgICBsZXQgY29sb3IgPSBjb2xvckZ1bmN0aW9ucy5nZXQobGV2ZWwpXG4gICAgaWYgKCFjb2xvcikgY29sb3IgPSBub0NvbG9yXG5cbiAgICBjb25zdCBkYXRlID0gbmV3IERhdGUoKVxuICAgIGNvbnN0IGxvZyA9IFtcbiAgICAgIGJnQnJpZ2h0TWFnZW50YShibGFjayhgWyR7ZGF0ZS50b0xvY2FsZURhdGVTdHJpbmcoKX0gJHtkYXRlLnRvTG9jYWxlVGltZVN0cmluZygpfV1gKSksXG4gICAgICBjb2xvcihwcmVmaXhlcy5nZXQobGV2ZWwpID8/ICdERUJVRycpLFxuICAgICAgbmFtZSA/IGAke25hbWV9ID5gIDogJz4nLFxuICAgICAgLi4uYXJncyxcbiAgICBdXG5cbiAgICBzd2l0Y2ggKGxldmVsKSB7XG4gICAgICBjYXNlIExvZ0xldmVscy5EZWJ1ZzpcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUuZGVidWcoLi4ubG9nKVxuICAgICAgY2FzZSBMb2dMZXZlbHMuSW5mbzpcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUuaW5mbyguLi5sb2cpXG4gICAgICBjYXNlIExvZ0xldmVscy5XYXJuOlxuICAgICAgICByZXR1cm4gY29uc29sZS53YXJuKC4uLmxvZylcbiAgICAgIGNhc2UgTG9nTGV2ZWxzLkVycm9yOlxuICAgICAgICByZXR1cm4gY29uc29sZS5lcnJvciguLi5sb2cpXG4gICAgICBjYXNlIExvZ0xldmVscy5GYXRhbDpcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoLi4ubG9nKVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKC4uLmxvZylcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZXRMZXZlbChsZXZlbDogTG9nTGV2ZWxzKSB7XG4gICAgbG9nTGV2ZWwgPSBsZXZlbFxuICB9XG5cbiAgZnVuY3Rpb24gZGVidWcoLi4uYXJnczogYW55W10pIHtcbiAgICBsb2coTG9nTGV2ZWxzLkRlYnVnLCAuLi5hcmdzKVxuICB9XG5cbiAgZnVuY3Rpb24gaW5mbyguLi5hcmdzOiBhbnlbXSkge1xuICAgIGxvZyhMb2dMZXZlbHMuSW5mbywgLi4uYXJncylcbiAgfVxuXG4gIGZ1bmN0aW9uIHdhcm4oLi4uYXJnczogYW55W10pIHtcbiAgICBsb2coTG9nTGV2ZWxzLldhcm4sIC4uLmFyZ3MpXG4gIH1cblxuICBmdW5jdGlvbiBlcnJvciguLi5hcmdzOiBhbnlbXSkge1xuICAgIGxvZyhMb2dMZXZlbHMuRXJyb3IsIC4uLmFyZ3MpXG4gIH1cblxuICBmdW5jdGlvbiBmYXRhbCguLi5hcmdzOiBhbnlbXSkge1xuICAgIGxvZyhMb2dMZXZlbHMuRmF0YWwsIC4uLmFyZ3MpXG4gIH1cblxuICByZXR1cm4ge1xuICAgIGxvZyxcbiAgICBzZXRMZXZlbCxcbiAgICBkZWJ1ZyxcbiAgICBpbmZvLFxuICAgIHdhcm4sXG4gICAgZXJyb3IsXG4gICAgZmF0YWwsXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGxvZ2dlciA9IGNyZWF0ZUxvZ2dlcih7IG5hbWU6ICdEaXNjb3JkZW5vJyB9KVxuZXhwb3J0IGRlZmF1bHQgbG9nZ2VyXG4iXSwibmFtZXMiOlsiYmdCcmlnaHRNYWdlbnRhIiwiYmxhY2siLCJib2xkIiwiY3lhbiIsImdyYXkiLCJpdGFsaWMiLCJyZWQiLCJ5ZWxsb3ciLCJMb2dMZXZlbHMiLCJwcmVmaXhlcyIsIk1hcCIsIm5vQ29sb3IiLCJtc2ciLCJjb2xvckZ1bmN0aW9ucyIsInN0ciIsImNyZWF0ZUxvZ2dlciIsImxvZ0xldmVsIiwibmFtZSIsImxvZyIsImxldmVsIiwiYXJncyIsImNvbG9yIiwiZ2V0IiwiZGF0ZSIsIkRhdGUiLCJ0b0xvY2FsZURhdGVTdHJpbmciLCJ0b0xvY2FsZVRpbWVTdHJpbmciLCJjb25zb2xlIiwiZGVidWciLCJpbmZvIiwid2FybiIsImVycm9yIiwic2V0TGV2ZWwiLCJmYXRhbCIsImxvZ2dlciJd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
