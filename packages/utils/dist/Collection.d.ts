export interface PlaceHolderBot {}
export declare class Collection<K, V> extends Map<K, V> {
  /**
   * The maximum amount of items allowed in this collection. To disable cache, set it 0, set to undefined to make it infinite.
   * @default undefined
   */
  maxSize: number | undefined
  /** Handler to remove items from the collection every so often. */
  sweeper:
    | (CollectionSweeper<K, V> & {
        intervalId?: NodeJS.Timeout
      })
    | undefined
  constructor(entries?: (ReadonlyArray<readonly [K, V]> | null) | Map<K, V>, options?: CollectionOptions<K, V>)
  startSweeper(options: CollectionSweeper<K, V>): NodeJS.Timeout
  stopSweeper(): void
  changeSweeperInterval(newInterval: number): void
  changeSweeperFilter(newFilter: (value: V, key: K, bot: PlaceHolderBot) => boolean): void
  /** Add an item to the collection. Makes sure not to go above the maxSize. */
  set(key: K, value: V): this
  /** Add an item to the collection, no matter what the maxSize is. */
  forceSet(key: K, value: V): this
  /** Convert the collection to an array. */
  array(): V[]
  /** Retrieve the value of the first element in this collection. */
  first(): V | undefined
  /** Retrieve the value of the last element in this collection. */
  last(): V | undefined
  /** Retrieve the value of a random element in this collection. */
  random(): V | undefined
  /** Find a specific element in this collection. */
  find(callback: (value: V, key: K) => boolean): NonNullable<V> | undefined
  /** Find all elements in this collection that match the given pattern. */
  filter(callback: (value: V, key: K) => boolean): Collection<K, V>
  /** Converts the collection into an array by running a callback on all items in the collection. */
  map<T>(callback: (value: V, key: K) => T): T[]
  /** Check if one of the items in the collection matches the pattern. */
  some(callback: (value: V, key: K) => boolean): boolean
  /** Check if all of the items in the collection matches the pattern. */
  every(callback: (value: V, key: K) => boolean): boolean
  /** Runs a callback on all items in the collection, merging them into a single value. */
  reduce<T>(callback: (accumulator: T, value: V, key: K) => T, initialValue?: T): T
}
export interface CollectionOptions<K, V> {
  /** Handler to clean out the items in the collection every so often. */
  sweeper?: CollectionSweeper<K, V>
  /** The maximum number of items allowed in the collection. */
  maxSize?: number
}
export interface CollectionSweeper<K, V> {
  /** The filter to determine whether an element should be deleted or not */
  filter: (value: V, key: K, ...args: any[]) => boolean
  /** The interval in which the sweeper should run */
  interval: number
  /** The bot object itself */
  bot?: PlaceHolderBot
}
//# sourceMappingURL=Collection.d.ts.map
