"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
class Generate extends core_1.Command {
    async run() {
        (0, core_1.run)([Generate.id, '--help']);
    }
}
Generate.description = 'Generates files to use in other batch commands.';
exports.default = Generate;
