import { ux, Flags, Args } from '@oclif/core';
import { getBatchesFromArray } from '../../utils/array-utils';
import { TransferAction } from '../../types';
import { TransactResult } from '@wharfkit/session';
import { BaseCommand } from '../../base/BaseCommand';
import { readTransferFile, transfer } from '../../services/token-service';

export default class TransferCommand extends BaseCommand {
  static description = 'Transfers tokens in batches using a spreadsheet.';

  static examples = ['<%= config.bin %> <%= command.id %> test.xls'];

  static args = {
    input: Args.file({
      description: 'Excel file with the transfers to make.',
      required: true,
    }),
  };

  static flags = {
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
    try {
      ux.action.start('Reading transfers in file');
      transfers = await readTransferFile({ filePathOrSheetsId: transfersFile, config });
    } catch (error: any) {
      throw new Error(`Error reading file: ${error.message}`);
    } finally {
      ux.action.stop();
    }

    // Create table columns and print table
    const columns: any = {
      contract: { get: (row: TransferAction) => row.contract },
      quantity: { get: (row: TransferAction) => row.data.quantity.toString() },
      from: { get: (row: TransferAction) => row.data.from },
      recipient: { get: (row: TransferAction) => row.data.to },
      memo: { get: (row: TransferAction) => row.data.memo },
    };
    ux.table(transfers, columns);

    const proceed = await ux.confirm('Continue? y/n');
    if (!proceed) return;

    ux.action.start('Transferring assets...');

    const actionBatches = getBatchesFromArray(transfers, batchSize);

    let totalExecuted = 0;
    try {
      for (const transferActions of actionBatches) {
        const result = (await transfer(transferActions, config)) as TransactResult;
        const txId = result.resolved?.transaction.id;
        this.log(
          `${transferActions.length} transfers successful. Transaction: ${config.explorerUrl}/transaction/${txId}`,
        );

        totalExecuted += transferActions.length;
      }
    } catch (error) {
      throw Error(`ERROR after executing ${totalExecuted} transfers successfully: ` + error);
    } finally {
      ux.action.stop();
    }
  }
}
