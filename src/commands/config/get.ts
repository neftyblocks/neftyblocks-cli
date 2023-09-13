import { ux } from '@oclif/core';
import { Session } from '@wharfkit/session';
import { BaseCommand } from '../../base/BaseCommand';

export default class GetCommand extends BaseCommand {
  static examples = ['<%= config.bin %> <%= command.id %>'];

  static description = 'Display all the configuration parameters.';

  static flags = {};

  public async run(): Promise<void> {
    const config = await this.getCliConfig();

    const params: { name: string; value: string }[] = [];
    const columns = {
      name: {
        get: (row: { name: string; value: string }) => {
          const name = row.name.replace(/([a-z](?=[A-Z]))/g, '$1 ');
          return name.toLowerCase();
        },
      },
      value: { get: (row: { name: string; value: string }) => row.value },
    };

    Object.entries(config).forEach(([key, value]) => {
      if (key === 'session') {
        const session = value as Session;

        params.push({
          name: 'authenticationMethod',
          value: session.walletPlugin.metadata?.name || 'Unknown',
        });

        params.push({
          name: 'accountName',
          value: session.actor.toString(),
        });

        params.push({
          name: 'permission',
          value: session.permission.toString(),
        });
      } else {
        const param = {
          name: key,
          value: value,
        };
        params.push(param);
      }
    });
    ux.table(params, columns);
  }
}
