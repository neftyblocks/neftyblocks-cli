import { Args } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand.js';
import { confirmPrompt, makeSpinner, printTable } from '../../utils/tty-utils.js';
import { createToken } from '../../services/token-service.js';
import { Asset } from '@wharfkit/session';

export default class CreateTokenCommand extends BaseCommand {
  static readonly description = 'Creates a new token in a contract';

  static readonly examples = [`<%= config.bin %> <%= command.id %> supertoken '10000000.0000 SWT'`];

  static readonly args = {
    contractName: Args.string({
      description: 'Token contract',
      required: true,
    }),
    maxSupply: Args.string({
      description: 'Token max supply (The decimals in the token contract will be derived from this)',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(CreateTokenCommand);
    const { contractName, maxSupply } = args;
    const config = await this.getCliConfig();

    const maxSupplyAsset = Asset.from(maxSupply);

    const columns: any = {
      contract: { get: () => contractName },
      'Max Supply': { get: (row: Asset) => new Intl.NumberFormat('en-US').format(+row.toString().split(' ')[0]) },
      decimals: { get: (row: Asset) => row.toString().split(' ')[0].split('.')[1].length || 0 },
      'Symbol Code': { get: (row: Asset) => row.symbol.code.toString() },
    };

    printTable(columns, [maxSupplyAsset]);

    const proceed = await confirmPrompt(`Create token with max supply of ${maxSupplyAsset.toString()}. Continue?`);
    if (!proceed) return;

    const spinner = makeSpinner('Creaiting token...');

    try {
      const result = await createToken({
        contractName,
        maxSupplyAsset,
        config,
      });
      const txId = result.resolved?.transaction.id;
      spinner.succeed(`Token created. Transaction: ${config.explorerUrl}/transaction/${txId}`);
    } catch (error) {
      spinner.fail();
      throw Error(`ERROR creating token: ` + error);
    }
  }
}
