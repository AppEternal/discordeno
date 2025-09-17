export declare enum LogLevels {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Fatal = 4,
}
export declare function createLogger({ logLevel, name }?: { logLevel?: LogLevels; name?: string }): {
  log: (level: LogLevels, ...args: any[]) => void
  setLevel: (level: LogLevels) => void
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  fatal: (...args: any[]) => void
}
export declare const logger: {
  log: (level: LogLevels, ...args: any[]) => void
  setLevel: (level: LogLevels) => void
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  fatal: (...args: any[]) => void
}
export default logger
//# sourceMappingURL=logger.d.ts.map
