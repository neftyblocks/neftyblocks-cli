import { Command, Flags, ux } from '@oclif/core';
import { configFileExists, removeConfigFile, validateAccountName, writeConfiguration } from '../../utils/config-utils';

import {
  validateRpcUrl,
  validateExplorerUrl,
  validateAtomicAssetsUrl,
  validatePrivateKey,
} from '../../utils/config-utils';

export default class InitCommand extends Command {
  static description = 'Configure the parameters to interact with the blockchain.';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    accountName: Flags.string({
      char: 'n',
      description: 'account name',
      default: '',
    }),
    privateKey: Flags.string({
      char: 'k',
      description: 'private key',
      default: '',
    }),
    password: Flags.string({
      char: 'p',
      description: 'CLI password',
      default: '',
    }),
    permission: Flags.string({
      char: 'j',
      description: 'account permission',
      default: 'active',
    }),
    deleteConfig: Flags.boolean({
      char: 'd',
      description: 'deletes configuration file',
    }),
    skip: Flags.boolean({
      char: 's',
      description: 'skip the configuration by using the default values',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(InitCommand);

    let accountName = flags.accountName;
    let pKey = flags.privateKey;
    let password = flags.password;
    const permission = flags.permission;
    const deleteConfig = flags.deleteConfig;
    const skipConfig = flags.skip;

    if (deleteConfig) {
      const proceed = skipConfig
        ? skipConfig
        : await ux.confirm('Are you sure you want to delete the configuration file? y/n');
      if (proceed) {
        if (configFileExists(this.config.configDir)) {
          ux.action.start('Deleting configuration file...');
          removeConfigFile(this.config.configDir);
        }

        ux.action.stop();
      } else {
        this.log('Uff that was close! (｡•̀ᴗ-)✧');
      }
      this.exit();
    }

    if (configFileExists(this.config.configDir)) {
      ux.action.stop();
      this.log('Configuration file already exists');
      this.exit();
    } else {
      ux.action.stop();

      // Account name
      let validAccountName = false;
      while (!validAccountName) {
        accountName = await ux.prompt('Enter your account name');
        validAccountName = validateAccountName(accountName);
      }

      // Private key
      let validPrivateKey = false;
      while (!validPrivateKey) {
        pKey = await ux.prompt('Enter your private key', { type: 'hide' });
        validPrivateKey = validatePrivateKey(pKey);
      }

      // Password
      while (password.length === 0) {
        password = await ux.prompt('Enter your CLI password', { type: 'hide' });
      }

      // RPC URL
      let validRpcUrl = false;
      let rpcUrl = '';
      while (!validRpcUrl) {
        rpcUrl = skipConfig
          ? 'https://wax.neftyblocks.com'
          : await ux.prompt('Enter a RPC URL', {
              required: false,
              default: 'https://wax.neftyblocks.com',
            });
        if (!rpcUrl) this.log('Using default value');
        validRpcUrl = await validateRpcUrl(rpcUrl);
      }

      // Explorer URL
      let validExplorerUrl = false;
      let explorerUrl = '';
      while (!validExplorerUrl) {
        explorerUrl = skipConfig
          ? 'https://waxblock.io'
          : await ux.prompt('Enter a blocks explorer URL', {
              required: false,
              default: 'https://waxblock.io',
            });
        if (!explorerUrl) this.log('Using default value');
        validExplorerUrl = await validateExplorerUrl(explorerUrl);
      }

      // Atomic Assets URL
      let validAaUrl = false;
      let aaUrl = '';
      while (!validAaUrl) {
        aaUrl = skipConfig
          ? 'https://aa.neftyblocks.com'
          : await ux.prompt('Enter an Atomic URL', {
              required: false,
              default: 'https://aa.neftyblocks.com',
            });
        if (!aaUrl) this.log('Using default value');
        validAaUrl = await validateAtomicAssetsUrl(aaUrl);
      }

      const conf = {
        account: accountName,
        privateKey: pKey,
        permission,
        rpcUrl,
        aaUrl,
        explorerUrl,
      };
      this.log('Creating configuration file...');

      writeConfiguration(conf, password, this.config.configDir);
      if (configFileExists(this.config.configDir)) {
        this.log('Configuration file created!');
      }
    }
    ux.action.stop();
  }
}

module.exports = InitCommand;
