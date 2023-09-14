"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoDimensionArrayToCsv = exports.groupBy = exports.getBatchesFromArray = exports.countOccurrences = void 0;
function countOccurrences(array) {
    const summary = [];
    let prev = null;
    const sortedArray = [...array].sort();
    for (const value of sortedArray) {
        if (value === prev) {
            summary[summary.length - 1].count += 1;
        }
        else {
            summary.push({
                count: 1,
                value,
            });
        }
        prev = value;
    }
    return summary;
}
exports.countOccurrences = countOccurrences;
function getBatchesFromArray(array, batchSize) {
    const batches = [];
    array.forEach((item) => {
        let batch;
        const currentBatchSize = batches.length;
        if (currentBatchSize === 0 || batches[currentBatchSize - 1].length >= batchSize) {
            batch = [];
            batches.push(batch);
        }
        else {
            batch = batches[batches.length - 1];
        }
        batch.push(item);
    });
    return batches;
}
exports.getBatchesFromArray = getBatchesFromArray;
function groupBy(array, keyGetter) {
    const map = {};
    array.forEach((item) => {
        const key = keyGetter(item);
        const collection = map[key];
        if (collection) {
            collection.push(item);
        }
        else {
            map[key] = [item];
        }
    });
    return map;
}
exports.groupBy = groupBy;
function twoDimensionArrayToCsv(twoDimensionArray) {
    let res = '';
    for (const row of twoDimensionArray) {
        for (const cell of row) {
            res += cell === undefined || cell === null ? ',' : '"' + cell.toString() + '",';
        }
        if (res[res.length - 1] === ',') {
            res = res.slice(0, -1);
        }
        res += '\n';
    }
    return res;
}
exports.twoDimensionArrayToCsv = twoDimensionArrayToCsv;
