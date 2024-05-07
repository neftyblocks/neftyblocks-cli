import { Flags, Args } from '@oclif/core';
import { getBatchesFromArray } from '../../utils/array-utils.js';
import { TransferAction } from '../../types/index.js';
import { BaseCommand } from '../../base/BaseCommand.js';
import { readTransferFile, transfer } from '../../services/token-service.js';
import { confirmPrompt, makeSpinner, printTable } from '../../utils/tty-utils.js';

export default class TransferCommand extends BaseCommand {
  static readonly description = 'Transfers tokens in batches using a spreadsheet.';

  static readonly examples = ['<%= config.bin %> <%= command.id %> test.xls'];

  static readonly args = {
    input: Args.file({
      description: 'Excel file with the transfers to make.',
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
    const { flags, args } = await this.parse(TransferCommand);
    const transfersFile = args.input;
    const batchSize = flags.batchSize;
    const config = await this.getCliConfig();

    // Read XLS file
    let transfers: TransferAction[];
    const spinner = makeSpinner();
    try {
      spinner.start('Reading transfers in file');
      transfers = await readTransferFile({ filePathOrSheetsId: transfersFile, config });
      spinner.succeed();
    } catch (error: any) {
      spinner.fail();
      throw new Error(`Error reading file: ${error.message}`);
    }

    // Create table columns and print table
    const columns: any = {
      contract: { get: (row: TransferAction) => row.contract },
      quantity: { get: (row: TransferAction) => row.data.quantity.toString() },
      from: { get: (row: TransferAction) => row.data.from },
      recipient: { get: (row: TransferAction) => row.data.to },
      memo: { get: (row: TransferAction) => row.data.memo },
    };
    printTable(columns, transfers);

    const proceed = await confirmPrompt('Continue?');
    if (!proceed) return;

    const actionBatches = getBatchesFromArray(transfers, batchSize);
    let totalExecuted = 0;
    try {
      for (const transferActions of actionBatches) {
        const spinner = makeSpinner('Transferring assets...').start();
        const result = await transfer(transferActions, config);
        const txId = result.resolved?.transaction.id;
        spinner.succeed(
          `${transferActions.length} transfers successful. Transaction: ${config.explorerUrl}/transaction/${txId}`,
        );
        totalExecuted += transferActions.length;
      }
    } catch (error) {
      spinner.fail();
      throw Error(`ERROR after executing ${totalExecuted} transfers successfully: ` + error);
    }
  }
}
