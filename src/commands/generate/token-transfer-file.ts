import { Args, ux } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand';
import writeXlsxFile from 'write-excel-file/node';
import { fileExists } from '../../utils/file-utils';
import { amountField, contractField, memoField, recipientField, symbolField } from '../../services/token-service';

export default class GenerateTokenTransferFileCommand extends BaseCommand {
  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> transfers.xlsx',
      description: 'Generates the file to transfer tokens into a file called transfers.xlsx.',
    },
  ];
  static description = 'Generates the file to transfer tokens.';

  static args = {
    output: Args.file({
      description: 'Location where the file will be generated.',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GenerateTokenTransferFileCommand);

    const output = args.output;

    if (fileExists(output)) {
      const proceed = await ux.confirm('File already exists. Do you want to overwrite it?');
      if (!proceed) {
        return;
      }
    }

    const data = [
      [
        {
          value: contractField,
          type: String,
        },
        {
          value: symbolField,
          type: String,
        },
        {
          value: amountField,
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
      [
        {
          value: 'eosio.token',
          type: String,
        },
        {
          value: 'WAX',
          type: String,
        },
        {
          value: 1,
          type: Number,
        },
        {
          value: '',
          type: String,
        },
        {
          value: '',
          type: String,
        },
      ],
    ];

    ux.action.start('Generating file...');
    await writeXlsxFile(data, {
      filePath: output,
    });
    ux.action.stop();

    this.log(`File generated at ${output}`);
  }
}
