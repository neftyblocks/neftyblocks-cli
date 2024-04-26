import { Command } from '@oclif/core';
import { SettingsConfig } from '../../types/index.js';
import { readConfiguration } from '../../utils/config-utils.js';
import { getSession } from '../../services/antelope-service.js';
import { removeDir } from '../../utils/file-utils.js';

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
      throw new Error('No configuration file found, please run "config init" command');
    }

    removeDir(config.sessionDir);
    await getSession(config, true);
    this.log('Update completed!!');
  }
}
