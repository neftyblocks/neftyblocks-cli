import { Command, Flags, ux } from '@oclif/core';
import { configFileExists, getSessionDir, removeConfigFile, writeConfiguration } from '../../utils/config-utils';

import { getChainId, validateExplorerUrl, validateAtomicAssetsUrl } from '../../utils/config-utils';
import { getSession } from '../../services/antelope-service';
import { SettingsConfig } from '../../types';
import { input, select } from '@inquirer/prompts';

interface Preset {
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  aaUrl: string;
  chainId: string;
}

const presets: Preset[] = [
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

export default class InitCommand extends Command {
  static description = 'Configure the parameters to interact with the blockchain.';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    deleteConfig: Flags.boolean({
      char: 'd',
      description: 'Deletes configuration file',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(InitCommand);
    const deleteConfig = flags.deleteConfig;

    if (configFileExists(this.config.configDir)) {
      const proceed = deleteConfig
        ? true
        : await ux.confirm('Configuration file already exists, do you want to overwrite it? y/n');
      if (proceed) {
        ux.action.start('Deleting configuration file...');
        removeConfigFile(this.config.configDir);
        ux.action.stop();
      } else {
        this.log('Uff that was close! (｡•̀ᴗ-)✧');
        this.exit();
      }
    }

    // Select preset
    let preset = await select({
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

    const conf: SettingsConfig = {
      rpcUrl: preset.rpcUrl,
      aaUrl: preset.aaUrl,
      explorerUrl: preset.explorerUrl,
      chainId: preset.chainId,
      sessionDir: getSessionDir(this.config.configDir),
    };

    await getSession(conf, true);

    ux.action.start('Creating configuration file...');

    writeConfiguration(conf, this.config.configDir);
    if (configFileExists(this.config.configDir)) {
      ux.action.stop();
    } else {
      ux.action.stop('Failed to create configuration file');
    }

    this.exit();
  }

  async getCustomPreset(): Promise<Preset> {
    let chainId: string;

    // RPC URL
    const rpcUrl = await input({
      message: 'Enter a RPC URL',
      default: 'https://wax.neftyblocks.com',
      validate: async (value) => {
        chainId = await getChainId(value);
        return chainId ? true : 'Invalid RPC URL';
      },
    });

    // Explorer URL
    const explorerUrl = await input({
      message: 'Enter an explorer URL',
      default: 'https://waxblock.io',
      validate: async (value) => {
        return await validateExplorerUrl(value);
      },
    });

    // Atomic Assets URL
    const aaUrl = await input({
      message: 'Enter an atomic assets API URL',
      default: 'https://aa.neftyblocks.com',
      validate: async (value) => {
        return await validateAtomicAssetsUrl(value);
      },
    });

    return {
      name: 'Custom',
      rpcUrl,
      aaUrl,
      explorerUrl,
      chainId: chainId!,
    };
  }
}

module.exports = InitCommand;
