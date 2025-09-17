/** Pause the execution for a given amount of milliseconds. */
export declare function delay(ms: number): Promise<void>
/** TS save way to check if a property exists in an object */
export declare function hasProperty<T extends {}, Y extends PropertyKey = string>(obj: T, prop: Y): obj is T & Record<Y, unknown>
/** Convert `JSON.stringify`-unserializable record values for debugging purposes. */
export declare function jsonSafeReplacer(_key: string, value: unknown): unknown
//# sourceMappingURL=utils.d.ts.map
