import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand.js';
import writeXlsxFile from 'write-excel-file/node';
import { getCollectionSchemas, getSchema } from '../../services/schema-service.js';
import { getXlsType } from '../../utils/attributes-utils.js';
import { fileExists } from '../../utils/file-utils.js';
import { AssetSchema } from '../../types/index.js';
import { confirmPrompt, makeSpinner } from '../../utils/tty-utils.js';

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

export default class GenerateTemplateFileCommand extends BaseCommand {
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
      description: 'Collection name to generate the file.',
      required: true,
    }),
    schema: Flags.string({
      char: 's',
      description: 'Schema to use to generate the file. If not provided, all schemas will be used.',
    }),
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(GenerateTemplateFileCommand);
    const config = await this.getCliConfig();

    const output = args.output;
    const collection = flags.collection;
    const schema = flags.schema;
    const schemas: AssetSchema[] = [];

    if (fileExists(output)) {
      const proceed = await confirmPrompt('File already exists. Do you want to overwrite it?');
      if (!proceed) {
        return;
      }
    }

    const spinner = makeSpinner();
    if (schema) {
      spinner.start('Getting schema...');
      schemas.push(await getSchema(collection, schema, config));
      spinner.succeed();
    } else {
      spinner.start('Getting schemas...');
      schemas.push(...(await getCollectionSchemas(collection, config)));
      spinner.succeed();
    }

    spinner.start('Generating file...');
    await this.generateExcelFile(schemas, output);
    spinner.succeed();

    this.log(`File generated at ${output}`);
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
