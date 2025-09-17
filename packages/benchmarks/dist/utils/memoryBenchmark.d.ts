export declare function memoryBenchmark<O, E>(
  name: string,
  objectCreator: () => O,
  objectFeeder: (object: O, event: E) => void,
  events: E[],
  options?: {
    times: number
    log: boolean
    table: boolean
  },
): Promise<void>
//# sourceMappingURL=memoryBenchmark.d.ts.map
