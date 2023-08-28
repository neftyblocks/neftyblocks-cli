export = {
    countOccurrences(array: any[]) {
      const summary = []
      let prev = null
      const sortedArray = [...array].sort()
      for (let i = 0; i < sortedArray.length; i++) {
        const value = sortedArray[i]
        if (value === prev) {
          summary[summary.length - 1].count += 1
        } else {
          summary.push({
            count: 1,
            value,
          })
        }
        prev = value
      }
      return summary
    },
  
    getBatchesFromArray(array: any[], batchSize: number) {
      const batches: any[] = []
      array.forEach((item: any) => {
        let batch: any[]
        const currentBatchSize = batches.length
        if (currentBatchSize === 0 || batches[currentBatchSize - 1].length >= batchSize) {
          batch = []
          batches.push(batch)
        } else {
          batch = batches[batches.length - 1]
        }
        batch.push(item)
      })
      return batches
    },
  
    groupBy(array: any[], keyGetter: any) {
      const map:any = {}
      array.forEach((item: any) => {
        const key = keyGetter(item)
        const collection = map[key]
        if (!collection) {
          map[key] = [item]
        } else {
          collection.push(item)
        }
      })
      return map
    },
  
    TwoDimensionArrayToCsv(twoDimensionArray: any) {
      let res = ''
  
      for (const row of twoDimensionArray) {
        for (const cell of row) {
          if (cell === undefined || cell === null) {
            res += ','
          } else {
            res += '"' + cell.toString() + '",'
          }
        }
        if (res[res.length - 1] === ',') {
          res = res.slice(0, -1)
        }
        res += '\n'
      }
  
      return res
    },
  }
  