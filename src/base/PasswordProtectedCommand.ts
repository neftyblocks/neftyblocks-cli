import { Flags, ux } from '@oclif/core';
import { CliConfig } from '../types/cli-config';
import { configFileExists, readConfiguration } from '../utils/config-utils';
import { BaseCommand } from './BaseCommand';

export abstract class PasswordProtectedCommand extends BaseCommand {
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
    const config = readConfiguration(password, this.config.configDir);
    if (!config) {
      ux.action.stop();
      this.log('Invalid password, please try again...');
      this.exit();
    }
    return config;
  }
}
