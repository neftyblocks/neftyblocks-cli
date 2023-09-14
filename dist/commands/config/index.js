"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
class Config extends core_1.Command {
    async run() {
        (0, core_1.run)([Config.id, '--help']);
    }
}
Config.description = 'Manages the configuration.';
exports.default = Config;
