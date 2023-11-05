import { Args, Flags, ux } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand';
import writeXlsxFile from 'write-excel-file/node';
import { fileExists } from '../../utils/file-utils';
import { memoField, recipientField } from '../../services/asset-service';
import { assetIdField, getAllAssets } from '../../services/asset-service';

export default class GenerateAssetTransferFileCommand extends BaseCommand {
  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> transfers.xlsx',
      description: 'Generates the file to transfer assets into a file called transfers.xlsx.',
    },
  ];
  static description = 'Generates the file to transfer assets.';

  static args = {
    output: Args.file({
      description: 'Location where the file will be generated.',
      required: true,
    }),
  };

  static flags = {
    collection: Flags.string({
      description: 'Collection name',
      char: 'c',
      required: false,
    }),
    schema: Flags.string({
      description: 'Schema name',
      char: 's',
      required: false,
    }),
    template: Flags.string({
      description: 'Template id',
      char: 't',
      required: false,
    }),
    owner: Flags.string({
      description: 'Owner',
      char: 'o',
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GenerateAssetTransferFileCommand);

    const output = args.output;

    if (fileExists(output)) {
      const proceed = await ux.confirm('File already exists. Do you want to overwrite it?');
      if (!proceed) {
        return;
      }
    }

    const assets = await getAllAssets(
      {
        collection_name: flags.collection || '',
        schema_name: flags.schema || '',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        template_id: flags.template ? flags.template : '',
        owner: flags.owner,
      },
      await this.getCliConfig(),
    );

    if (assets.length === 0) {
      throw new Error('No assets found');
    }

    const data = [
      [
        {
          value: assetIdField,
          type: String,
        },
        {
          value: 'Name',
          type: String,
        },
        {
          value: 'Mint number',
          type: String,
        },
        {
          value: 'Template Id',
          type: String,
        },
        {
          value: recipientField,
          type: String,
        },
        {
          value: memoField,
          type: String,
        },
      ],
      ...assets.map((asset) => [
        {
          value: asset.asset_id,
          type: String,
        },
        {
          value: asset.name,
          type: String,
        },
        {
          value: asset.template_mint,
          type: String,
        },
        {
          value: asset.template?.template_id || '',
          type: String,
        },
        {
          value: '',
          type: String,
        },
        {
          value: '',
          type: String,
        },
      ]),
    ];

    ux.action.start('Generating file...');
    await writeXlsxFile(data, {
      filePath: output,
    });
    ux.action.stop();

    this.log(`File generated at ${output}`);
  }
}
