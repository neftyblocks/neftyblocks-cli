import { ux, Flags, Args } from '@oclif/core';
import { mintAssets } from '../../services/asset-service';
import { Cell, Row } from 'read-excel-file/types';
import { getTemplatesMap } from '../../services/template-service';
import { getBatchesFromArray } from '../../utils/array-utils';
import { getCollectionSchemas } from '../../services/schema-service';
import { isValidAttribute, typeAliases } from '../../utils/attributes-utils';
import { AssetSchema, CliConfig } from '../../types';
import { TransactResult } from '@wharfkit/session';
import { BaseCommand } from '../../base/BaseCommand';
import { readExcelContents } from '../../utils/excel-utils';
import { MintRow } from '../../types';

const templateField = 'template';
const amountField = 'amount';
const ownerField = 'owner';

export default class MintCommand extends BaseCommand {
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
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(MintCommand);
    const mintsFile = args.input;
    const batchSize = flags.batchSize;
    const ignoreSupply = flags.ignoreSupply;
    const collectionName = flags.collectionName;
    const config = await this.getCliConfig();

    ux.action.start('Getting collection schemas');
    const schema = await getCollectionSchemas(collectionName, config);
    const schemasMap = Object.fromEntries(schema.map((row) => [row.name, row]));
    ux.action.stop();

    // Read XLS file
    const mintRows: MintRow[] = [];
    try {
      ux.action.start('Reading mints in file');
      const sheets = await readExcelContents(mintsFile);
      for (let i = 0; i < sheets.length; i++) {
        const { name, rows } = sheets[i];
        const schemaName = name.trim();
        const schema = schemasMap[schemaName];
        mintRows.push(...(await this.getMintRows(rows, schema, config, ignoreSupply)));
      }
    } catch (error: any) {
      throw new Error(`Error reading file: ${error.message}`);
    } finally {
      ux.action.stop();
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
    ux.table(mintRows, columns);

    const proceed = await ux.confirm('Continue? y/n');
    if (!proceed) return;

    ux.action.start('Minting assets...');
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
        const result = (await mintAssets(mintActions, config)) as TransactResult;
        const txId = result.resolved?.transaction.id;
        this.log(
          `${mintActions.length} Assets minted successfully. Transaction: ${config.explorerUrl}/transaction/${txId}`,
        );
        {
          const templateAmountMap: any = {};
          for (const mintAction of mintActions) {
            if (templateAmountMap[mintAction.template_id.toString()] === undefined) {
              templateAmountMap[mintAction.template_id.toString()] = 1;
            } else {
              templateAmountMap[mintAction.template_id.toString()] += 1;
            }
          }

          for (const templateId in templateAmountMap) {
            this.log(`    minted ${templateAmountMap[templateId]} of template ${templateId}`);
          }
        }

        totalMintCount += mintActions.length;
      }
    } catch (error) {
      throw new Error(`ERROR after minting: ${totalMintCount} successfully\n` + error);
    }

    ux.action.stop();
  }

  async getMintRows(rows: Row[], schema: AssetSchema, config: CliConfig, ignoreSupply = false): Promise<MintRow[]> {
    const headerRow = rows[0];
    const headersMap = Object.fromEntries(
      headerRow
        .map((name: Cell, index: number) => ({
          name: name.valueOf() as string,
          index,
        }))
        .map((entry: { name: string; index: number }) => [entry.name, entry.index]),
    );

    const isHeaderPresent = (text: string) => {
      return headersMap[text] >= 0;
    };

    if (!isHeaderPresent(templateField) || !isHeaderPresent(amountField)) {
      throw new Error(`Headers ${templateField}, ${amountField} must be present`);
    }

    const contentRows = rows.slice(1);
    const templateIndex = headersMap[templateField];
    const amountIndex = headersMap[amountField];
    const ownerIndex = headersMap[ownerField];
    const templateIds = contentRows.map((row: any, index: number) => {
      const templateId = row[templateIndex];
      if (!templateId) {
        throw new Error(`Error in row: ${index + 2} Template is required`);
      }
      return templateId;
    });

    ux.action.start('Checking Templates...');
    const templatesMap = await getTemplatesMap(templateIds, config);
    const mintedCounts: Record<string, number> = {};
    ux.action.stop();

    const mints: any[] = [];
    contentRows.forEach((row: any, index: number) => {
      const templateId = row[templateIndex] as string;
      const template = templatesMap[templateId];
      const owner = row[ownerIndex] as string;
      let amount = row[amountIndex];
      if (amount) {
        amount = row[amountIndex] as number;
      }
      if (!template && templateId !== '-1') {
        throw new Error(`Template ${templateId} doesn't exist`);
      }
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      if (!owner) {
        throw new Error('Owner is required');
      }
      const inmutableData: { [key: string]: any } = template?.immutable_data || {};
      const attributes: any[] = [];
      schema.format.forEach((attr: { name: string; type: string }) => {
        let value = row[headersMap[attr.name]];
        if (headersMap[attr.name] === undefined) {
          this.warn(
            `The attribute: '${attr.name}' of schema: '${
              schema.name
            }' is not in any of the columns of the spreadsheet in row ${index + 2}`,
          );
        }
        if (value !== null && value !== undefined) {
          if (attr.name in inmutableData) {
            this.warn(
              `Schema contains attribute "${
                attr.name
              }" with value: "${value}", ignoring attribute from spreadsheet in row ${index + 2}`,
            );
            return;
          }
          const type = typeAliases[attr.type] || attr.type;
          if (!isValidAttribute(attr.type, value)) {
            this.warn(
              `The attribute: '${attr.name}' with value: '${value}' is not of type ${attr.type} for schema: '${
                schema.name
              }' in row ${index + 2}`,
            );
          } else {
            if (attr.type === 'bool') {
              value = value ? 1 : 0;
            }
          }
          attributes.push({
            key: attr.name,
            value: [type, value],
          });
        }
      });

      // to check if the template has enough max supply we must be mindful of the
      // fact that the same template could be in two different rows, to solve this
      // we use the template map to store how many assets of each template will
      // be minted after going thru all the rows
      if (mintedCounts[templateId] === undefined) {
        mintedCounts[templateId] = 0;
      }
      mintedCounts[templateId] += amount;

      if (
        parseInt(template?.max_supply || '0', 10) !== 0 &&
        mintedCounts[templateId] + parseInt(template.issued_supply, 10) > parseInt(template.max_supply, 10)
      ) {
        if (ignoreSupply) {
          const remainingSupply = Number(template.max_supply) - Number(template.issued_supply);
          if (amount > remainingSupply && remainingSupply > 0) {
            amount = remainingSupply;
          } else {
            return;
          }
        } else {
          this.log('Template', template);
          throw new Error(`Template ${templateId} doesn't have enough max supply to mint in row ${index + 2}`);
        }
      }

      mints.push({
        templateId,
        amount: amount,
        owner,
        mintActionData: {
          authorized_minter: config.session.actor,
          collection_name: schema.collectionName,
          schema_name: schema.name,
          template_id: templateId,
          new_asset_owner: owner,
          immutable_data: attributes.length > 0 ? attributes : [],
          mutable_data: [],
          tokens_to_back: [],
        },
      });
    });

    return mints;
  }
}
