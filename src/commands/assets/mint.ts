import { Flags, Args } from '@oclif/core';
import { mintAssets } from '../../services/asset-service.js';
import { getBatchesFromArray } from '../../utils/array-utils.js';
import { getCollectionSchemas } from '../../services/schema-service.js';
import { MintRow } from '../../types/index.js';
import { TransactResult } from '@wharfkit/session';
import { BaseCommand } from '../../base/BaseCommand.js';
import { readExcelContents } from '../../utils/excel-utils.js';
import { readExcelMintRows } from '../../services/mint-service.js';
import { confirmTransaction } from '../../services/antelope-service.js';
import { confirmPrompt, makeSpinner, printTable } from '../../utils/tty-utils.js';

export default class MintAssetsCommand extends BaseCommand {
  static description = 'Mints assets in batches using a spreadsheet.';

  static examples = ['<%= config.bin %> <%= command.id %> test.xls -c alpacaworlds'];

  static args = {
    input: Args.file({
      description: 'Excel file with the templates and amounts',
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
    collectionName: Flags.string({
      char: 'c',
      description: 'Collection name',
      required: true,
    }),
    ignoreSupply: Flags.boolean({
      char: 'i',
      description: 'Ignore supply errors',
      default: false,
    }),
    confirm: Flags.boolean({
      description: 'Confirm transactions',
      default: false,
    }),
    skip: Flags.integer({
      description: 'Number of mints to skip',
      default: 0,
    }),
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(MintAssetsCommand);
    const mintsFile = args.input;
    const { batchSize, skip, confirm, ignoreSupply, collectionName } = flags;
    const config = await this.getCliConfig();
    const spinner = makeSpinner();

    spinner.start('Getting collection schemas');
    const schema = await getCollectionSchemas(collectionName, config);
    const schemasMap = Object.fromEntries(schema.map((row) => [row.name, row]));
    spinner.stop();

    // Read XLS file
    const mintRows: MintRow[] = [];
    try {
      spinner.start('Reading mints in file');
      const sheets = await readExcelContents(mintsFile);
      for (let i = 0; i < sheets.length; i++) {
        const { name, rows } = sheets[i];
        const schemaName = name.trim();
        const schema = schemasMap[schemaName];
        mintRows.push(...(await readExcelMintRows(rows, schema, config, ignoreSupply, skip)));
      }
      spinner.succeed();
    } catch (error: any) {
      spinner.fail();
      throw new Error(`Error reading file: ${error.message}`);
    }

    if (mintRows.length === 0) {
      this.log('Nothing to mint');
      return;
    }

    const sample = [mintRows[0]];
    if (mintRows.length > 1) {
      sample.push(mintRows[mintRows.length - 1]);
    }

    // Create table columns and print table
    const columns: any = {
      schema: { get: (row: MintRow) => row.mintActionData.schema_name },
      'Template Id': { get: (row: MintRow) => row.mintActionData.template_id },
      owner: { get: (row: MintRow) => row.mintActionData.new_asset_owner },
      amount: { get: (row: MintRow) => row.amount },
      attributes: {
        get: (row: MintRow) =>
          row.mintActionData.immutable_data
            .map((map: any) => `${<Map<string, any>>map.key}: ${<Map<string, any>>map.value[1]}`)
            .join('\n'),
      },
    };

    printTable(columns, sample);

    const proceed = await confirmPrompt(
      `About to mint ${mintRows.length} NFTs. (Only first and last NFTs are displayed above) Continue?`,
    );
    if (!proceed) return;

    const mintActions = [];
    for (const mint of mintRows) {
      for (let i = 0; i < mint.amount; i++) {
        mintActions.push(mint.mintActionData);
      }
    }

    const actionBatches = getBatchesFromArray(mintActions, batchSize);

    let totalMintCount = 0;
    try {
      for (const mintActions of actionBatches) {
        spinner.start(`Minting ${mintActions.length} assets`);
        const result = (await mintAssets(mintActions, config)) as TransactResult;
        const txId = result.resolved!.transaction.id;
        const message = `${mintActions.length} Assets minted successfully. Transaction: ${config.explorerUrl}/transaction/${txId}`;
        spinner.text = message + (confirm ? ' Confirming...' : '');

        const templateAmountMap: any = {};
        for (const mintAction of mintActions) {
          if (templateAmountMap[mintAction.template_id.toString()] === undefined) {
            templateAmountMap[mintAction.template_id.toString()] = 1;
          } else {
            templateAmountMap[mintAction.template_id.toString()] += 1;
          }
        }

        totalMintCount += mintActions.length;

        if (confirm) {
          let retriesLeft = 20;
          let confirmed = false;
          while (!confirmed && retriesLeft > 0) {
            confirmed = await confirmTransaction(txId.toString(), config);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            retriesLeft -= 1;
          }
          if (!confirmed) {
            throw new Error('Transaction not confirmed');
          } else {
            spinner.succeed(
              `${mintActions.length} Assets minted successfully. Transaction: ${config.explorerUrl}/transaction/${txId} Confirmed`,
            );
          }
        }
      }
    } catch (error: any) {
      spinner.fail(`Error after minting: ${totalMintCount} successfully: ` + error.message);
    }
  }
}
