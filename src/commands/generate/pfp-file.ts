import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand.js';
import writeXlsxFile from 'write-excel-file/node';
import { fileExists } from '../../utils/file-utils.js';
import {
  dependenciesHeader,
  idHeader,
  insertFromLayersHeader,
  oddsHeader,
  pathHeader,
  removeLayersHeader,
  sameIdRestrictionsHeader,
  skipHeader,
  valueHeader,
} from '../../services/pfp-service.js';
import { confirmPrompt, makeSpinner } from '../../utils/tty-utils.js';

export default class GeneratePfpFileCommand extends BaseCommand {
  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> pfp-layers.xlsx -l Body -l Face -l Hair',
      description:
        'Generates the file to create pfps with the layers Body, Face and Hair and saves it in the current directory in a file called pfp-layers.xlsx.',
    },
    {
      command: '<%= config.bin %> <%= command.id %> pfp-layers.xlsx -l Body -l Face -l Hair -a',
      description:
        'Generates the file to create pfps with the layers Body, Face and Hair with advanced headers and saves it in the current directory in a file called pfp-layers.xlsx.',
    },
  ];
  static description = 'Generates the file to generate a pfp collection with the specified layers.';

  static args = {
    output: Args.file({
      description: 'Location where the file will be generated.',
      required: true,
    }),
  };

  static flags = {
    layers: Flags.string({
      char: 'l',
      description: 'The names of the layers to include in the file.',
      multiple: true,
    }),
    advanced: Flags.boolean({
      char: 'a',
      description: 'Include advanced headers.',
    }),
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(GeneratePfpFileCommand);

    const output = args.output;
    const layers = flags.layers || ['Layer1'];
    const advanced = flags.advanced;

    if (fileExists(output)) {
      const proceed = await confirmPrompt('File already exists. Do you want to overwrite it?');
      if (!proceed) {
        return;
      }
    }

    const headersRow = [
      {
        value: idHeader,
        type: String,
        fontWeight: 'bold',
      },
      {
        value: valueHeader,
        type: String,
        fontWeight: 'bold',
      },
      {
        value: oddsHeader,
        type: String,
        fontWeight: 'bold',
      },
      {
        value: pathHeader,
        type: String,
        fontWeight: 'bold',
      },
      ...(advanced
        ? [
            {
              value: dependenciesHeader,
              type: String,
              fontWeight: 'bold',
            },
            {
              value: sameIdRestrictionsHeader,
              type: String,
              fontWeight: 'bold',
            },
            {
              value: skipHeader,
              type: String,
              fontWeight: 'bold',
            },
            {
              value: insertFromLayersHeader,
              type: String,
              fontWeight: 'bold',
            },
            {
              value: removeLayersHeader,
              type: String,
              fontWeight: 'bold',
            },
          ]
        : []),
    ];

    const advancedContent = advanced
      ? [
          {
            value: '',
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
          {
            value: '',
            type: String,
          },
          {
            value: '',
            type: String,
          },
        ]
      : [];

    const data = layers.map((layer) => [
      headersRow,
      [
        {
          value: '1',
          type: String,
        },
        {
          value: `${layer} option 1`,
          type: String,
        },
        {
          value: '1',
          type: String,
        },
        {
          value: '',
          type: String,
        },
        ...advancedContent,
      ],
      [
        {
          value: 'None',
          type: String,
        },
        {
          value: 'None',
          type: String,
        },
        {
          value: '1',
          type: String,
        },
        {
          value: '',
          type: String,
        },
        ...advancedContent,
      ],
    ]);

    data.push([
      layers.map((layer) => ({
        value: layer,
        type: String,
        fontWeight: 'bold',
      })),
      layers.map(() => ({
        value: 'None',
        type: String,
      })),
    ]);

    const spinner = makeSpinner('Generating file...');
    await writeXlsxFile(data, {
      sheets: [...layers.map((layer) => layer), '_force_'],
      filePath: output,
    });
    spinner.succeed();

    this.log(`File generated at ${output}`);
  }
}
