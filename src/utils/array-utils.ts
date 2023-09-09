export function countOccurrences<T>(array: T[]): { count: number; value: T }[] {
  const summary = [];
  let prev = null;
  const sortedArray = [...array].sort();
  for (const value of sortedArray) {
    if (value === prev) {
      summary[summary.length - 1].count += 1;
    } else {
      summary.push({
        count: 1,
        value,
      });
    }

    prev = value;
  }

  return summary;
}

export function getBatchesFromArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  array.forEach((item: T) => {
    let batch: T[];
    const currentBatchSize = batches.length;
    if (
      currentBatchSize === 0 ||
      batches[currentBatchSize - 1].length >= batchSize
    ) {
      batch = [];
      batches.push(batch);
    } else {
      batch = batches[batches.length - 1];
    }

    batch.push(item);
  });
  return batches;
}

export function groupBy<T>(
  array: T[],
  keyGetter: (item: T) => any
): Record<any, T[]> {
  const map: Record<any, T[]> = {};
  array.forEach((item: T) => {
    const key = keyGetter(item);
    const collection = map[key];
    if (collection) {
      collection.push(item);
    } else {
      map[key] = [item];
    }
  });
  return map;
}

export function twoDimensionArrayToCsv<T>(twoDimensionArray: T[][]): string {
  let res = "";

  for (const row of twoDimensionArray) {
    for (const cell of row) {
      res +=
        cell === undefined || cell === null
          ? ","
          : '"' + cell.toString() + '",';
    }

    if (res[res.length - 1] === ",") {
      res = res.slice(0, -1);
    }

    res += "\n";
  }

  return res;
}
