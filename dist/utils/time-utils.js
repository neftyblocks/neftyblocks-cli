"use strict";
module.exports = {
    sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)), // eslint-disable-line no-promise-executor-return
};
