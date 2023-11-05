import { ux, Flags, Args } from '@oclif/core';
import { getAssetsMap, readAssetsTransferFile, transferAssets } from '../../services/asset-service';
import { getBatchesFromArray } from '../../utils/array-utils';
import { AssetTransferData, AssetTransferRow } from '../../types';
import { BaseCommand } from '../../base/BaseCommand';

export default class TransferCommand extends BaseCommand {
  static description = 'Transfers assets in batches using a spreadsheet.';

  static examples = ['<%= config.bin %> <%= command.id %> test.xls'];

  static args = {
    input: Args.string({
      description: 'Excel file with the assets and new owners',
      required: true,
    }),
  };

  static flags = {
    batchSize: Flags.integer({
      char: 'b',
      description: 'Transactions batch size',
      required: false,
      default: 200,
    }),
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(TransferCommand);
    const transfersFile = args.input;
    const batchSize = flags.batchSize;
    const config = await this.getCliConfig();

    // Read XLS file
    let transfers: AssetTransferRow[];
    try {
      ux.action.start('Reading transfers in file');
      transfers = await readAssetsTransferFile({ filePathOrSheetsId: transfersFile, config });
    } catch (error: any) {
      throw new Error(`Error reading file: ${error.message}`);
    } finally {
      ux.action.stop();
    }

    // Getting assets data
    ux.action.start('Getting assets data');
    const assetsMap = await getAssetsMap(
      transfers.map((transfer) => transfer.assetId),
      config,
    );

    // Check that all assets are owned by the sender
    const assetsNotOwnedBySender = transfers.filter(
      (transfer) => assetsMap[transfer.assetId].owner !== config.session.actor.toString(),
    );

    if (assetsNotOwnedBySender.length > 0) {
      throw new Error(
        `The following assets are not owned by the sender: ${assetsNotOwnedBySender
          .map((transfer) => transfer.assetId)
          .join(', ')}`,
      );
    }

    // Create table columns and print table
    const columns: any = {
      id: { get: (row: AssetTransferRow) => row.assetId },
      mintNumber: { get: (row: AssetTransferRow) => assetsMap[row.assetId].template_mint },
      name: { get: (row: AssetTransferRow) => assetsMap[row.assetId].name },
      recipient: { get: (row: AssetTransferRow) => row.recipient },
    };
    ux.table(transfers, columns);

    const proceed = await ux.confirm('Continue? y/n');
    if (!proceed) return;

    ux.action.start('Transferring assets...');
    const transferActions: AssetTransferData[] = transfers.map((transfer) => {
      return {
        from: config.session.actor.toString(),
        to: transfer.recipient,
        asset_ids: [transfer.assetId],
        memo: transfer.memo,
      };
    });

    const transferBatches = getBatchesFromArray(transferActions, batchSize);

    let totalTransferCount = 0;
    try {
      for (const actions of transferBatches) {
        const result = await transferAssets(actions, config);
        const txId = result.resolved?.transaction.id;
        this.log(
          `${actions.length} Assets transferred successfully. Transaction: ${config.explorerUrl}/transaction/${txId}`,
        );
        totalTransferCount += actions.length;
      }
    } catch (error) {
      this.error(`ERROR after transferring: ${totalTransferCount} successfully\n` + error);
    }

    ux.action.stop();
  }
}
