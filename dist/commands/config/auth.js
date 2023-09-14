"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const config_utils_1 = require("../../utils/config-utils");
const antelope_service_1 = require("../../services/antelope-service");
const file_utils_1 = require("../../utils/file-utils");
class SetCommand extends core_1.Command {
    async run() {
        const config = (0, config_utils_1.readConfiguration)(this.config.configDir);
        if (!config) {
            this.error('No configuration file found, please run "config init" command');
        }
        (0, file_utils_1.removeDir)(config.sessionDir);
        await (0, antelope_service_1.getSession)(config, true);
        this.log('Update completed!!');
    }
}
SetCommand.examples = [
    {
        command: '<%= config.bin %> <%= command.id %> auth',
        description: 'Logs in to the CLI with a different account',
    },
];
SetCommand.description = 'Authenticates the CLI with a different account';
exports.default = SetCommand;
