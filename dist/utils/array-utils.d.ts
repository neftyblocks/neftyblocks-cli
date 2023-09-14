export declare function countOccurrences<T>(array: T[]): {
    count: number;
    value: T;
}[];
export declare function getBatchesFromArray<T>(array: T[], batchSize: number): T[][];
export declare function groupBy<T>(array: T[], keyGetter: (item: T) => any): Record<any, T[]>;
export declare function twoDimensionArrayToCsv<T>(twoDimensionArray: T[][]): string;
