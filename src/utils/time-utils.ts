export = {
  sleep: (milliseconds: number | undefined) => new Promise((resolve) => setTimeout(resolve, milliseconds)), // eslint-disable-line no-promise-executor-return
};
