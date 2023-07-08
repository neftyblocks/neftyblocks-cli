export = {
    sleep: (milliseconds: number | undefined) => new Promise(resolve => setTimeout(resolve, milliseconds)),
  }
  