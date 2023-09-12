import { Command, ux } from '@oclif/core';
import { SettingsConfig } from '../types/cli-config';
import { readSettings } from '../utils/config-utils';

export abstract class BaseCommand extends Command {
  async getSettings(): Promise<SettingsConfig> {
    const config = readSettings(this.config.configDir);
    if (!config) {
      ux.action.stop();
      this.log('No configuration file found, please run "config init" command');
      this.exit();
    }
    return config;
  }
}
