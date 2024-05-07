import { Flags, Args } from '@oclif/core';
import { getBatchesFromArray } from '../../utils/array-utils.js';
import { BaseCommand } from '../../base/BaseCommand.js';
import { confirmPrompt, makeSpinner, printTable } from '../../utils/tty-utils.js';
import { createTacoLiquidity, readNewLiquidityFile } from '../../services/swap-service.js';
import { NewLiquidityAction } from '../../types/swaps.js';

export default class CreateSwapPoolsCommand extends BaseCommand {
  static readonly description = 'Create new liquidity pools in taco swap.';

  static readonly examples = ['<%= config.bin %> <%= command.id %> test.xls'];

  static readonly args = {
    input: Args.file({
      description: 'Excel file with the liquidity pools to open.',
      required: true,
    }),
  };

  static readonly flags = {
    batchSize: Flags.integer({
      char: 'b',
      description: 'Transactions batch size',
      required: false,
      default: 100,
    }),
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(CreateSwapPoolsCommand);
    const transfersFile = args.input;
    const batchSize = flags.batchSize;
    const config = await this.getCliConfig();

    // Read XLS file
    let newLiquidityActions: NewLiquidityAction[];
    const spinner = makeSpinner();
    try {
      spinner.start('Reading transfers in file');
      newLiquidityActions = await readNewLiquidityFile({ filePathOrSheetsId: transfersFile, config });
      spinner.succeed();
    } catch (error: any) {
      spinner.fail();
      throw new Error(`Error reading file: ${error.message}`);
    }

    // Create table columns and print table
    const columns: any = {
      token1: { get: (row: NewLiquidityAction) => `${row.token1Amount.quantity}@${row.token1Amount.contract}` },
      token2: { get: (row: NewLiquidityAction) => `${row.token2Amount.quantity}@${row.token2Amount.contract}` },
      user: { get: () => config.session.actor.toString() },
    };
    printTable(columns, newLiquidityActions);

    const proceed = await confirmPrompt('Continue?');
    if (!proceed) return;

    const actionBatches = getBatchesFromArray(newLiquidityActions, batchSize);
    let totalExecuted = 0;
    try {
      for (const actions of actionBatches) {
        const spinner = makeSpinner('Creating liquity pools...').start();
        const result = await createTacoLiquidity(actions, config);
        const txId = result.resolved?.transaction.id;
        spinner.succeed(
          `${actions.length} liquidity pools created. Transaction: ${config.explorerUrl}/transaction/${txId}`,
        );
        totalExecuted += actions.length;
      }
    } catch (error) {
      spinner.fail();
      throw Error(`ERROR after executing ${totalExecuted} new liquidity pools successfully: ` + error);
    }
  }
}
