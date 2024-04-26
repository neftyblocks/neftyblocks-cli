import { Args, Command, ux } from '@oclif/core';
import { SettingsConfig } from '../../types/index.js';
import { readConfiguration, validate, writeConfiguration } from '../../utils/config-utils.js';

export default class SetCommand extends Command {
  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> explorerUrl https://waxblock.io',
      description: 'Sets the explorer url property',
    },
  ];
  static description = 'Sets a configuration property';

  static args = {
    property: Args.string({
      description: 'Configuration property.',
      options: ['explorerUrl', 'rpcUrl', 'aaUrl'],
    }),
    value: Args.string({
      description: 'Configuration value.',
    }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(SetCommand);

    const config: SettingsConfig = readConfiguration(this.config.configDir) as SettingsConfig;
    if (!config) {
      throw new Error('No configuration file found, please run "config init" command');
    }

    const configKey = args.property;
    const value = args.value;

    const updatedConf = Object.keys(config).reduce((accumulator, key) => {
      if (key === configKey) {
        return { ...accumulator, [key]: value };
      }

      return { ...accumulator, [key]: config[key as keyof SettingsConfig] };
    }, {}) as SettingsConfig;

    ux.action.start('Validating configurations...');
    const validConfi = await validate(updatedConf);
    ux.action.stop();

    if (!validConfi) {
      return;
    }

    ux.action.start('Updating configurations...');
    writeConfiguration(validConfi, this.config.configDir);
    ux.action.stop();
    this.log('Update completed!!');
  }
}
