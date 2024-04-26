import { Args, Flags } from '@oclif/core';
import { getTemplatesForCollection, getTemplatesFromSchema } from '../../services/template-service.js';
import { BaseCommand } from '../../base/BaseCommand.js';
import { getCollectionSchemas, getSchema } from '../../services/schema-service.js';
import { ITemplate } from 'atomicassets/build/API/Explorer/Objects.js';
import { fileExists } from '../../utils/file-utils.js';
import { AssetSchema } from '../../types/index.js';
import { generateMintExcelFile } from '../../services/mint-service.js';
import { confirmPrompt, makeSpinner } from '../../utils/tty-utils.js';

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

      spinner.start('Getting templates...');
      templates.push(...(await getTemplatesFromSchema(collection, schema, config)));
      spinner.succeed();
    } else {
      spinner.start('Getting schemas...');
      schemas.push(...(await getCollectionSchemas(collection, config)));
      spinner.succeed();

      spinner.start('Getting templates...');
      templates.push(...(await getTemplatesForCollection(collection, config)));
      spinner.succeed();
    }

    spinner.start('Generating file...');
    await generateMintExcelFile(schemas, templates, output);
    spinner.succeed();

    this.log(`File generated at ${output}`);
  }
}
