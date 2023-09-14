"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
class Assets extends core_1.Command {
    async run() {
        (0, core_1.run)([Assets.id, '--help']);
    }
}
Assets.description = "Manages a collection's assets.";
exports.default = Assets;
