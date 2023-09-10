import { Args, Flags, ux } from '@oclif/core';
import readXlsxFile, { readSheetNames } from 'read-excel-file/node';
import { AssetSchema, getCollectionSchemas } from '../../services/schema-service';
import { TemplateToCreate, createTemplates } from '../../services/template-service';
import { Cell, Row } from 'read-excel-file/types';
import { getBatchesFromArray } from '../../utils/array-utils';
import { fileExists } from '../../utils/file-utils';
import { isValidAttribute } from '../../utils/attributes-utils';
import { PasswordProtectedCommand } from '../../base/PasswordProtectedCommand';
import { TransactResult } from '@wharfkit/session';

// Required headers
const maxSupplyField = 'template_max_supply';
const isBurnableField = 'template_is_burnable';
const isTransferableField = 'template_is_transferable';

const typeAliases: Record<string, string> = {
  image: 'string',
  ipfs: 'string',
  bool: 'uint8',
};

export default class CreateCommand extends PasswordProtectedCommand {
  static description = 'Create templates in a collection by batches using a spreadsheet.';
  static examples = ['<%= config.bin %> <%= command.id %> template.xls -c alpacaworlds -s thejourney'];

  static args = {
    input: Args.file({
      description: 'Excel file with the assets to mint',
      required: true,
    }),
  };

  static flags = {
    collection: Flags.string({
      char: 'c',
      description: 'Collection id',
      required: true,
    }),
    batchSize: Flags.integer({
      char: 's',
      description: 'Transactions batch size',
      default: 100,
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(CreateCommand);

    const collection = flags.collection;
    const templatesFile = args.input;
    const batchSize: number = flags.batchSize;
    const pwd = flags.password;
    this.debug(`Collection ${collection}`);
    this.debug(`templatesFile ${templatesFile}`);
    this.debug(`batchSize ${batchSize}`);

    const config = await this.getCliConfig(pwd);

    // Get Schemas
    ux.action.start('Getting collection schemas');
    let schemasMap: Record<string, AssetSchema> = {};
    try {
      const schemas = await getCollectionSchemas(collection, config);
      schemasMap = Object.fromEntries(schemas.map((row) => [row.name, row]));
    } catch {
      this.error(`Unable to obtain schemas for collection ${collection}`);
    }

    ux.action.stop();

    // Read XLS file
    if (!fileExists(templatesFile)) {
      this.error('XLS file not found!');
    }

    ux.action.start('Reading templates in file');
    const sheetNames = await readSheetNames(templatesFile);
    const sheets = await Promise.all(sheetNames.map((name) => readXlsxFile(templatesFile, { sheet: name })));

    // Get Templates
    const templates: TemplateToCreate[] = [];
    for (let i = 0; i < sheetNames.length; i++) {
      const schemaName = sheetNames[i].trim();
      const sheet = sheets[i];
      const schema = schemasMap[schemaName];
      if (!schema) {
        this.error(`Schema ${schemaName} doesn't exist`);
      }
      templates.push(...this.getTemplateToCreate(sheet, schema));
    }
    ux.action.stop();

    const batches = getBatchesFromArray(templates, batchSize);
    batches.forEach((templatesBatch: any[]) => {
      ux.table(templatesBatch, {
        Schema: {
          get: ({ schema }) => schema,
        },
        'Max Supply': {
          get: ({ maxSupply }) => (maxSupply > 0 ? maxSupply : '∞'),
        },
        'Burnable?': {
          get: ({ isBurnable }) => isBurnable,
        },
        'Transferable?': {
          get: ({ isTransferable }) => isTransferable,
        },
        Attributes: {
          get: ({ immutableAttributes }) =>
            <[Map<string, any>]>(
              immutableAttributes
                .map((map: any) => `${<Map<string, any>>map.key}: ${<Map<string, any>>map.value[1]}`)
                .join('\n')
            ),
        },
      });
    });

    let totalCreated = 0;
    const proceed = await ux.confirm('Continue? y/n');

    // Create Templates
    ux.action.start('Creating Templates...');
    if (proceed) {
      try {
        for (const templatesBatch of batches) {
          const result = (await createTemplates(collection, templatesBatch, config)) as TransactResult;
          const txId = result.resolved?.transaction.id;
          this.log(
            `${templatesBatch.length} Templates created successfully. Transaction: ${config.explorerUrl}/transaction/${txId}`,
          );
          totalCreated += templatesBatch.length;
        }
      } catch (error: any) {
        this.warn(`Error after creating ~${totalCreated}`);
        this.error(error.message);
      }

      ux.action.stop();
      this.log('Done!');
      this.exit(0);
    }
  }

  getTemplateToCreate(rows: Row[], schema: AssetSchema): TemplateToCreate[] {
    if (rows.length < 2) {
      this.error(`No entries in the ${schema.name} sheet`);
    }

    const headerRow = rows[0];
    const headersMap: { [key: string]: number } = Object.fromEntries(
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

    if (
      !isHeaderPresent(maxSupplyField) ||
      !isHeaderPresent(isBurnableField) ||
      !isHeaderPresent(isTransferableField)
    ) {
      this.error(`Headers ${maxSupplyField}, ${isBurnableField}, ${isTransferableField} must be present`);
    }

    const maxSupplyIndex = headersMap[maxSupplyField];
    const isBurnableIndex = headersMap[isBurnableField];
    const isTransferableIndex = headersMap[isTransferableField];

    const contentRows = rows.slice(1);

    const templates: TemplateToCreate[] = contentRows.map((row: Row, index: number) => {
      const maxSupply = +row[maxSupplyIndex] || 0;
      const isBurnable = Boolean(row[isBurnableIndex]);
      const isTransferable = Boolean(row[isTransferableIndex]);

      if (!isBurnable && !isTransferable) {
        console.error('Non-transferable and non-burnable templates are not supposed to be created');
      }

      for (const header of headerRow) {
        if (
          header.toString() != maxSupplyField &&
          header.toString() != isBurnableField &&
          header.toString() != isTransferableField
        ) {
          const match = schema.format.some(
            (e: { name: string | number | boolean | DateConstructor }) => e.name === header,
          );
          if (!match)
            this.warn(
              `The attribute: '${header.toString()}' is not available in schema: '${schema.name}' in row ${index + 2}`,
            );
        }
      }

      const attributes: any[] = [];
      schema.format.forEach((attr: { name: string; type: string }) => {
        let value = row[headersMap[attr.name]];
        // @TODO: do this warning for each schema, not foreach template
        if (headersMap[attr.name] === undefined) {
          this.warn(
            `The attribute: '${attr.name}' of schema: '${
              schema.name
            }' is not in any of the columns of the spreadsheet in row ${index + 2}`,
          );
        }
        if (value !== null && value !== undefined) {
          const type = typeAliases[attr.type] || attr.type;
          if (!isValidAttribute(attr.type, value)) {
            this.error(
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

      return {
        schema: schema.name,
        maxSupply,
        isBurnable,
        isTransferable,
        immutableAttributes: attributes,
      };
    });

    return templates;
  }
}
