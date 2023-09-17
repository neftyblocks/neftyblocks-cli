import { Command } from '@oclif/core';
import { SettingsConfig } from '../../types';
import { readConfiguration } from '../../utils/config-utils';
import { getSession } from '../../services/antelope-service';
import { removeDir } from '../../utils/file-utils';

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

    removeDir(config.sessionDir);
    await getSession(config, true);
    this.log('Update completed!!');
  }
}
