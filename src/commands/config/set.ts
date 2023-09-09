import { Args, Command, Flags, ux } from '@oclif/core';
import CliConfig from '../../types/cli-config';
import { decryptConfigurationFile, encrypt } from '../../utils/crypto-utils';
import { writeFile } from '../../utils/file-utils';

export default class SetCommand extends Command {
  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> explorerUrl https://waxblock.io',
      description: 'Sets the explorer url property',
    },
  ];
  static description = 'Get a configuration property';

  static args = {
    property: Args.string({
      description: 'Configuration property.',
      options: ['explorerUrl', 'rpcUrl', 'atomicUrl', 'account', 'permission', 'privateKey'],
    }),
    value: Args.string({
      description: 'Configuration value.',
    }),
  };

  static flags = {
    password: Flags.string({
      char: 'k',
      description: 'CLI password',
      default: undefined,
    }),
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(SetCommand);
    const pwd = flags.password;

    const password = pwd ? pwd : await ux.prompt('Enter your CLI password', { type: 'hide' });
    const config: CliConfig = decryptConfigurationFile(password, this.config.configDir) as CliConfig;
    if (!config) {
      this.error('Invalid password, please try again...');
    }

    const configKey = args.property;
    const value = args.value;

    ux.action.start('Updating configurations...');
    const updatedConf = Object.keys(config).reduce((accumulator, key) => {
      if (key === configKey) {
        return { ...accumulator, [key]: value };
      }

      return { ...accumulator, [key]: config[key as keyof CliConfig] };
    }, {});
    const encrypted = encrypt(JSON.stringify(updatedConf), password);
    writeFile(this.config.configDir, encrypted);
    ux.action.stop();
    this.log('Update completed!!');
  }
}
