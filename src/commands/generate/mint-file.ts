import { Args, Flags, ux } from '@oclif/core';
import { getTemplatesForCollection, getTemplatesFromSchema } from '../../services/template-service';
import { BaseCommand } from '../../base/BaseCommand';
import writeXlsxFile from 'write-excel-file/node';
import { getCollectionSchemas, getSchema } from '../../services/schema-service';
import { ITemplate } from 'atomicassets/build/API/Explorer/Objects';
import { getXlsType, transformValueToType } from '../../utils/attributes-utils';
import { fileExists } from '../../utils/file-utils';
import { AssetSchema } from '../../types';

const headers = [
  {
    value: 'template',
  },
  {
    value: 'amount',
  },
  {
    value: 'owner',
  },
];

export default class GenerateMintFileCommand extends BaseCommand {
  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> mints.xlsx -c alpacaworlds -s thejourney',
      description:
        'Generates the file for the collection alpacaworlds, schema thejourney and saves it in the current directory in a file called mints.xlsx.',
    },
    {
      command: '<%= config.bin %> <%= command.id %> mints.xlsx -c alpacaworlds',
      description:
        'Generates the file for the collection alpacaworlds, all schemas and saves it in the current directory in a file called mints.xlsx.',
    },
  ];
  static description =
    'Generates the file to batch mint assets in a collection. Each schema will be a different sheet.';

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
    const { flags, args } = await this.parse(GenerateMintFileCommand);
    const config = await this.getCliConfig();

    const output = args.output;
    const collection = flags.collection;
    const schema = flags.schema;
    const schemas: AssetSchema[] = [];
    const templates: ITemplate[] = [];

    if (fileExists(output)) {
      const proceed = await ux.confirm('File already exists. Do you want to overwrite it? y/n');
      if (!proceed) {
        return;
      }
    }

    if (schema) {
      ux.action.start('Getting schema...');
      schemas.push(await getSchema(collection, schema, config));
      ux.action.stop();

      ux.action.start('Getting templates...');
      templates.push(...(await getTemplatesFromSchema(collection, schema, config)));
      ux.action.stop();
    } else {
      ux.action.start('Getting schemas...');
      schemas.push(...(await getCollectionSchemas(collection, config)));
      ux.action.stop();

      ux.action.start('Getting templates...');
      templates.push(...(await getTemplatesForCollection(collection, config)));
      ux.action.stop();
    }

    ux.action.start('Generating file...');
    await this.generateExcelFile(schemas, templates, output);
    ux.action.stop();

    this.log(`File generated at ${output}`);
  }

  async generateExcelFile(schemas: AssetSchema[], templates: ITemplate[], output: string): Promise<void> {
    const groupedTemplates = Object.fromEntries(
      schemas.map((schema) => [
        schema.name,
        templates.filter((template) => template.schema.schema_name === schema.name),
      ]),
    );

    const data = schemas.map((schema) => {
      const dataHeaders = schema.format.map((field) => ({
        value: field.name,
      }));

      const schemaHeaders = [...headers, ...dataHeaders];
      const noTemplateRow = [
        {
          type: String,
          value: '-1',
        },
        {
          type: Number,
          value: 1,
        },
      ];
      const templateRows = groupedTemplates[schema.name].map((template) => [
        {
          type: String,
          value: template.template_id,
        },
        {
          type: Number,
          value: 1,
        },
        {
          type: String,
          value: '',
        },
        ...schema.format.map((field) => ({
          type: getXlsType(field.type),
          value: transformValueToType(field.type, template.immutable_data[field.name]),
        })),
      ]);

      return [schemaHeaders, noTemplateRow, ...templateRows];
    });

    await writeXlsxFile(data, {
      sheets: schemas.map((schema) => schema.name),
      filePath: output,
    });
  }
}
