"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const config_utils_1 = require("../../utils/config-utils");
const config_utils_2 = require("../../utils/config-utils");
const antelope_service_1 = require("../../services/antelope-service");
const prompts_1 = require("@inquirer/prompts");
const presets = [
    {
        name: 'WAX Mainnet',
        rpcUrl: 'https://wax.neftyblocks.com',
        explorerUrl: 'https://waxblock.io',
        aaUrl: 'https://aa.neftyblocks.com',
        chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
    },
    {
        name: 'WAX Testnet',
        rpcUrl: 'https://wax-testnet.neftyblocks.com',
        explorerUrl: 'https://testnet.waxblock.io',
        aaUrl: 'https://aa-testnet.neftyblocks.com',
        chainId: 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
    },
];
class InitCommand extends core_1.Command {
    async run() {
        const { flags } = await this.parse(InitCommand);
        const deleteConfig = flags.deleteConfig;
        if ((0, config_utils_1.configFileExists)(this.config.configDir)) {
            const proceed = deleteConfig
                ? true
                : await core_1.ux.confirm('Configuration file already exists, do you want to overwrite it? y/n');
            if (proceed) {
                core_1.ux.action.start('Deleting configuration file...');
                (0, config_utils_1.removeConfigFile)(this.config.configDir);
                core_1.ux.action.stop();
            }
            else {
                this.log('Uff that was close! (｡•̀ᴗ-)✧');
                this.exit();
            }
        }
        // Select preset
        let preset = await (0, prompts_1.select)({
            message: 'Select a blockchain',
            choices: [
                ...presets.map((preset) => ({
                    name: preset.name,
                    value: preset,
                })),
                {
                    name: 'Custom',
                    value: null,
                },
            ],
        });
        if (!preset) {
            preset = await this.getCustomPreset();
        }
        const conf = {
            rpcUrl: preset.rpcUrl,
            aaUrl: preset.aaUrl,
            explorerUrl: preset.explorerUrl,
            chainId: preset.chainId,
            sessionDir: (0, config_utils_1.getSessionDir)(this.config.configDir),
        };
        await (0, antelope_service_1.getSession)(conf, true);
        core_1.ux.action.start('Creating configuration file...');
        (0, config_utils_1.writeConfiguration)(conf, this.config.configDir);
        if ((0, config_utils_1.configFileExists)(this.config.configDir)) {
            core_1.ux.action.stop();
        }
        else {
            core_1.ux.action.stop('Failed to create configuration file');
        }
        this.exit();
    }
    async getCustomPreset() {
        let chainId;
        // RPC URL
        const rpcUrl = await (0, prompts_1.input)({
            message: 'Enter a RPC URL',
            default: 'https://wax.neftyblocks.com',
            validate: async (value) => {
                chainId = await (0, config_utils_2.getChainId)(value);
                return chainId ? true : 'Invalid RPC URL';
            },
        });
        // Explorer URL
        const explorerUrl = await (0, prompts_1.input)({
            message: 'Enter an explorer URL',
            default: 'https://waxblock.io',
            validate: async (value) => {
                return await (0, config_utils_2.validateExplorerUrl)(value);
            },
        });
        // Atomic Assets URL
        const aaUrl = await (0, prompts_1.input)({
            message: 'Enter an atomic assets API URL',
            default: 'https://aa.neftyblocks.com',
            validate: async (value) => {
                return await (0, config_utils_2.validateAtomicAssetsUrl)(value);
            },
        });
        return {
            name: 'Custom',
            rpcUrl,
            aaUrl,
            explorerUrl,
            chainId: chainId,
        };
    }
}
InitCommand.description = 'Configure the parameters to interact with the blockchain.';
InitCommand.examples = ['<%= config.bin %> <%= command.id %>'];
InitCommand.flags = {
    deleteConfig: core_1.Flags.boolean({
        char: 'd',
        description: 'Deletes configuration file',
    }),
};
exports.default = InitCommand;
module.exports = InitCommand;
