import { Args } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand.js';
import writeXlsxFile from 'write-excel-file/node';
import { fileExists } from '../../utils/file-utils.js';
import { confirmPrompt, makeSpinner } from '../../utils/tty-utils.js';
import {
  token1AmountField,
  token1ContractField,
  token1SymbolField,
  token2AmountField,
  token2ContractField,
  token2SymbolField,
} from '../../services/swap-service.js';

export default class GenerateCreateLiquidityFileCommand extends BaseCommand {
  static readonly examples = [
    {
      command: '<%= config.bin %> <%= command.id %> pools.xlsx',
      description: 'Generates the file to create liquidity pools into a file called pools.xlsx.',
    },
  ];
  static readonly description = 'Generates the file to create liquidity pools.';

  static readonly args = {
    output: Args.file({
      description: 'Location where the file will be generated.',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GenerateCreateLiquidityFileCommand);

    const output = args.output;

    if (fileExists(output)) {
      const proceed = await confirmPrompt('File already exists. Do you want to overwrite it?');
      if (!proceed) {
        return;
      }
    }

    const data = [
      [
        {
          value: token1ContractField,
          type: String,
        },
        {
          value: token1SymbolField,
          type: String,
        },
        {
          value: token1AmountField,
          type: String,
        },
        {
          value: token2ContractField,
          type: String,
        },
        {
          value: token2SymbolField,
          type: String,
        },
        {
          value: token2AmountField,
          type: String,
        },
      ],
      [
        {
          value: 'token.nefty',
          type: String,
        },
        {
          value: 'NEFTY',
          type: String,
        },
        {
          value: 1,
          type: Number,
        },
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
      ],
    ];

    const spinner = makeSpinner('Generating file...').start();
    await writeXlsxFile(data, {
      filePath: output,
    });
    spinner.succeed();

    this.log(`File generated at ${output}`);
  }
}
