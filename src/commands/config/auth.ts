import { Command } from '@oclif/core';
import { SettingsConfig } from '../../types/cli-config';
import { readConfiguration, removeSession } from '../../utils/config-utils';
import { getSession } from '../../services/antelope-service';

export default class SetCommand extends Command {
  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> auth',
      description: 'Logs in to the CLI with a different account',
    },
  ];
  static description = 'Authenticates the CLI with a different account';

  public async run(): Promise<void> {
    const config: SettingsConfig = readConfiguration(this.config.configDir) as SettingsConfig;
    if (!config) {
      this.error('No configuration file found, please run "config init" command');
    }

    removeSession(this.config.configDir);
    getSession(config.chainId, config.rpcUrl, this.config.configDir);
    this.log('Update completed!!');
  }
}
