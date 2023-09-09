import { Command, Flags, ux } from '@oclif/core';
import { configFileExists } from '../utils/file-utils';
import { decryptConfigurationFile } from '../utils/crypto-utils';
import CliConfig from '../types/cli-config';

export abstract class PasswordProtectedCommand extends Command {
  static baseFlags = {
    password: Flags.string({
      char: 'k',
      description: 'CLI password',
      default: undefined,
    }),
  };

  async getCliConfig(pwd: string | undefined): Promise<CliConfig> {
    // validate CLI password
    if (!configFileExists(this.config.configDir)) {
      this.log("No configuration file found, please run 'config init' command");
      this.exit();
    }
    const password = pwd ? pwd : await ux.prompt('Enter your CLI password', { type: 'hide' });
    const config = decryptConfigurationFile(password, this.config.configDir);
    if (!config) {
      ux.action.stop();
      this.log('Invalid password, please try again...');
      this.exit();
    }
    return config;
  }
}
