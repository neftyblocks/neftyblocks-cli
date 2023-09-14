"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const config_utils_1 = require("../../utils/config-utils");
class SetCommand extends core_1.Command {
    async run() {
        const { args } = await this.parse(SetCommand);
        const config = (0, config_utils_1.readConfiguration)(this.config.configDir);
        if (!config) {
            this.error('No configuration file found, please run "config init" command');
        }
        const configKey = args.property;
        const value = args.value;
        const updatedConf = Object.keys(config).reduce((accumulator, key) => {
            if (key === configKey) {
                return { ...accumulator, [key]: value };
            }
            return { ...accumulator, [key]: config[key] };
        }, {});
        core_1.ux.action.start('Validating configurations...');
        const validConfi = await (0, config_utils_1.validate)(updatedConf);
        core_1.ux.action.stop();
        if (!validConfi) {
            this.exit(1);
        }
        core_1.ux.action.start('Updating configurations...');
        (0, config_utils_1.writeConfiguration)(validConfi, this.config.configDir);
        core_1.ux.action.stop();
        this.log('Update completed!!');
    }
}
SetCommand.examples = [
    {
        command: '<%= config.bin %> <%= command.id %> explorerUrl https://waxblock.io',
        description: 'Sets the explorer url property',
    },
];
SetCommand.description = 'Sets a configuration property';
SetCommand.args = {
    property: core_1.Args.string({
        description: 'Configuration property.',
        options: ['explorerUrl', 'rpcUrl', 'aaUrl'],
    }),
    value: core_1.Args.string({
        description: 'Configuration value.',
    }),
};
exports.default = SetCommand;
