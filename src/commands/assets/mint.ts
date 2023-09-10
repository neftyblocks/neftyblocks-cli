import { ux, Flags, Args } from '@oclif/core';
import readXlsxFile from 'read-excel-file/node';
import { TransactResult } from 'eosjs/dist/eosjs-api-interfaces';
import { mintAssets } from '../../services/asset-service';
import { Cell } from 'read-excel-file/types';
import { getTemplatesMap } from '../../services/template-service';
import { getBatchesFromArray } from '../../utils/array-utils';
import { fileExists } from '../../utils/file-utils';
import { AssetSchema, getSchema } from '../../services/schema-service';
import { isValidAttribute } from '../../utils/attributes-utils';
import { PasswordProtectedCommand } from '../../base/PasswordProtectedCommand';

const typeAliases: Record<string, string> = {
  image: 'string',
  ipfs: 'string',
  bool: 'uint8',
};

const templateField = 'template';
const amountField = 'amount';
const ownerField = 'owner';

export default class MintCommand extends PasswordProtectedCommand {
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
      char: 't',
      description: 'Transactions batch size',
      required: false,
      default: 100,
    }),
    collectionName: Flags.string({
      char: 'c',
      description: 'Collection name',
      required: true,
    }),
    schemaName: Flags.string({
      char: 's',
      description: 'Schema name',
      required: true,
    }),
    ignoreSupply: Flags.boolean({
      char: 'i',
      description: 'Ignore supply errors',
      default: false,
    }),
    addAttributes: Flags.boolean({
      char: 'a',
      description: 'Add Attributes',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(MintCommand);
    const fileTemplate = args.input;
    const batchSize = flags.batchSize;
    const ignoreSupply = flags.ignoreSupply;
    const collectionName = flags.collectionName;
    const schemaName = flags.schemaName;
    const password = flags.password;
    // const addAttributes = flags.addAttributes;

    // validate CLI password
    const config = await this.getCliConfig(password);

    ux.action.start('Getting collection schemas');
    let schema: AssetSchema;
    try {
      schema = await getSchema(collectionName, schemaName, config);
    } catch (error) {
      this.error(`Error with schema name: '${schemaName}'\n ` + error);
    }
    ux.action.stop();

    ux.action.start('Reading xlsx file');
    let sheet = [];
    if (fileExists(fileTemplate)) {
      try {
        sheet = await readXlsxFile(fileTemplate);
      } catch (error) {
        this.error('Unable to read templates file');
      }
    } else {
      ux.action.stop();
      this.error('XLS file not found');
    }

    if (sheet.length < 2) {
      ux.action.stop();
      this.error('No entries in the file');
    }
    ux.action.stop();

    const headersMap = Object.fromEntries(
      sheet[0]
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
      this.error(`Headers ${templateField}, ${amountField} must be present`);
    }

    sheet.splice(0, 1);

    const templateIndex = headersMap[templateField];
    const amountIndex = headersMap[amountField];
    const ownerIndex = headersMap[ownerField];
    const templateIds = sheet.map((row: any, index: number) => {
      const templateId = row[templateIndex];
      if (!templateId) {
        this.error(`Error in row: ${index + 2} Template is required`);
      }
      return templateId;
    });

    ux.action.start('Checking Templates...');
    const templatesMap = await getTemplatesMap(templateIds, config);
    const mintedCounts: Record<string, number> = {};
    ux.action.stop();

    const mints: any[] = [];
    sheet.forEach((row: any, index: number) => {
      // for (const row of sheet) {
      const templateId = row[templateIndex].valueOf() as string;
      const template = templatesMap[templateId];
      const owner = row[ownerIndex].valueOf() as string;
      let amount = row[amountIndex];
      if (amount) {
        amount = row[amountIndex].valueOf() as number;
      }
      if (!template) {
        this.error(`Template ${templateId} doesn't exist`);
      }
      if (isNaN(amount) || amount <= 0) {
        this.error('Amount must be greater than 0');
      }
      if (!owner) {
        this.error('Owner is required');
      }
      const inmutableData: { [key: string]: any } = template.immutable_data;
      const attributes: any[] = [];
      schema.format.forEach((attr: { name: string; type: string }) => {
        let value = row[headersMap[attr.name]];
        if (headersMap[attr.name] === undefined) {
          this.warn(
            `The attribute: '${
              attr.name
            }' of schema: '${schemaName}' is not in any of the columns of the spreadsheet in row ${index + 2}`,
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
              `The attribute: '${attr.name}' with value: '${value}' is not of type ${
                attr.type
              } for schema: '${schemaName}' in row ${index + 2}`,
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
      if (mintedCounts[template.template_id] === undefined) {
        mintedCounts[template.template_id] = 0;
      }
      mintedCounts[template.template_id] += amount;

      if (
        parseInt(template.max_supply, 10) !== 0 &&
        mintedCounts[template.template_id] + parseInt(template.issued_supply, 10) > parseInt(template.max_supply, 10)
      ) {
        if (ignoreSupply) {
          const remainingSupply = Number(template.max_supply) - Number(template.issued_supply);
          if (amount > remainingSupply && remainingSupply > 0) {
            amount = remainingSupply;
          } else {
            // continue;
            return;
          }
        } else {
          this.log('Template', template);
          this.error(`Template ${templateId} doesn't have enough max supply to mint `);
        }
      }

      mints.push({
        amount: amount,
        name: template.immutable_data.name,
        actionData: {
          authorized_minter: config.account,
          collection_name: template.collection.collection_name,
          schema_name: template.schema.schema_name,
          template_id: templateId,
          new_asset_owner: owner,
          immutable_data: attributes.length > 0 ? attributes : [],
          mutable_data: [],
          tokens_to_back: [],
        },
      });
      // }
    });

    // Create table columns and print table
    const columns: any = {
      'Template Id': { get: (row: any) => row.actionData.template_id },
      name: { get: (row: any) => row.name },
      owner: { get: (row: any) => row.actionData.new_asset_owner },
      amount: { get: (row: any) => row.amount },
      attributes: {
        get: (row: any) =>
          row.actionData.immutable_data
            .map((map: any) => `${<Map<string, any>>map.key}: ${<Map<string, any>>map.value[1]}`)
            .join('\n'),
      },
    };
    // for (let attribute of schema.format) {
    //     columns[attribute.name] = {get: (row: any) => this.getImmutableValueByKey(attribute.name, row.actionData.immutable_data)}
    // }
    ux.table(mints, columns);

    const proceed = await ux.confirm('Continue? y/n');
    if (!proceed) return;

    ux.action.start('Minting assets...');
    // We create the mintActions array because Each *single* asset mint is an action
    // in the `mintAssets` service
    const mintActions = [];
    for (const mint of mints) {
      for (let i = 0; i < mint.amount; i++) {
        mintActions.push(mint.actionData);
      }
    }

    const actionBatches = getBatchesFromArray(mintActions, batchSize);

    let totalMintCount = 0;
    try {
      for (const mintActions of actionBatches) {
        // eslint-disable-next-line no-await-in-loop
        const result = (await mintAssets(mintActions, config)) as TransactResult;
        const txId = result.transaction_id;
        this.log(
          `${mintActions.length} Assets minted successfully. Transaction: ${config.explorerUrl}/transaction/${txId}`,
        );
        // print how many of each template were minted
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
      this.error(`ERROR after minting: ${totalMintCount} successfully\n` + error);
    }

    ux.action.stop();

    this.log('Done!');
    this.exit(0);
  }

  getImmutableValueByKey(key: string, immutableData: any) {
    for (const data of immutableData) {
      if (data.key === key) {
        return data.value[1];
      }
    }
    // Return empty string if key isn't defined in immutableData
    return '';
  }
}
