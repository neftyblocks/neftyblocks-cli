import { Args, Flags, ux } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand';
import writeXlsxFile from 'write-excel-file/node';
import { AssetSchema, getCollectionSchemas, getSchema } from '../../services/schema-service';
import { getXlsType } from '../../utils/attributes-utils';
import { fileExists } from '../../utils/file-utils';

const headers = [
  {
    value: 'template_max_supply',
  },
  {
    value: 'template_is_burnable',
  },
  {
    value: 'template_is_transferable',
  },
];

export default class GenerateTemplateMetadataCommand extends BaseCommand {
  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> templates.xlsx -c alpacaworlds -s thejourney',
      description:
        'Generates the file for the collection alpacaworlds, schema thejourney and saves it in the current directory in a file called templates.xlsx.',
    },
    {
      command: '<%= config.bin %> <%= command.id %> templates.xlsx -c alpacaworlds',
      description:
        'Generates the file for the collection alpacaworlds, all schemas and saves it in the current directory in a file called templates.xlsx.',
    },
  ];
  static description =
    'Generates the file to batch create templates in a collection. Each schema will be a different sheet.';

  static args = {
    output: Args.file({
      description: 'Location where the file will be generated.',
      required: true,
    }),
  };

  static flags = {
    collection: Flags.string({
      char: 'c',
      description: 'Collection to filter the assets.',
      required: true,
    }),
    schema: Flags.string({
      char: 's',
      description: 'Schema to filter the assets.',
    }),
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(GenerateTemplateMetadataCommand);
    const settings = await this.getSettings();

    const output = args.output;
    const collection = flags.collection;
    const schema = flags.schema;
    const schemas: AssetSchema[] = [];

    if (fileExists(output)) {
      const proceed = await ux.confirm('File already exists. Do you want to overwrite it?');
      if (!proceed) {
        this.exit();
      }
    }

    if (schema) {
      ux.action.start('Getting schema...');
      schemas.push(await getSchema(collection, schema, settings));
      ux.action.stop();
    } else {
      ux.action.start('Getting schemas...');
      schemas.push(...(await getCollectionSchemas(collection, settings)));
      ux.action.stop();
    }

    ux.action.start('Generating file...');
    await this.generateExcelFile(schemas, output);
    ux.action.stop();

    this.log(`File generated at ${output}`);
    this.exit();
  }

  async generateExcelFile(schemas: AssetSchema[], output: string): Promise<void> {
    const data = schemas.map((schema) => {
      const dataHeaders = schema.format.map((field) => ({
        value: field.name,
      }));

      const schemaHeaders = [...headers, ...dataHeaders];
      const exampleRow = [
        {
          type: Number,
          value: 0,
        },
        {
          type: Boolean,
          value: true,
        },
        {
          type: Boolean,
          value: true,
        },
        ...schema.format.map((field) => ({
          type: getXlsType(field.type),
          value: undefined,
        })),
      ];

      return [schemaHeaders, exampleRow];
    });

    await writeXlsxFile(data, {
      sheets: schemas.map((schema) => schema.name),
      filePath: output,
    });
  }
}
