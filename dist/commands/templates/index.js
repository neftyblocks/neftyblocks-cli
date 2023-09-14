"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
class Templates extends core_1.Command {
    async run() {
        (0, core_1.run)([Templates.id, '--help']);
    }
}
Templates.description = "Manages a collection's templates.";
exports.default = Templates;
