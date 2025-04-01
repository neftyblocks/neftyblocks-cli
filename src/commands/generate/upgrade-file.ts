import { Args } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand.js';
import writeXlsxFile, { Row } from 'write-excel-file/node';
import { fileExists } from '../../utils/file-utils.js';
import {
  idHeader,
  schemaHeader,
  templateHeader,
  nameHeader,
  imageHeader,
  categoryHeader,
  maxUsesHeader,
  startDateHeader,
  endDateHeader,
  whitelistHeader,
  hiddenHeader,
  revealVideoHeader,
  backgroundColorHeader,
  valueHeader,
  configIdHeader,
  effectHeader,
  typeHeader,
  displayDataHeader,
  collectionHeader,
  balanceAttributeHeader,
  balanceAttributCosteHeader,
  tokenHeader,
  tokenPrecisionHeader,
  tokenContractHeader,
  amountHeader,
  receipientHeader,
  videoHeader,
  descriptionHeader,
  matchTemplatesHeader,
  matchAttributeHeader,
  matchAttributeValuesHeader,
  schemaAttributesWithAllowedValuesHeader,
} from '../../services/upgrade-service.js';
import { confirmPrompt, makeSpinner } from '../../utils/tty-utils.js';

export default class GenerateUpgradeFileCommand extends BaseCommand {
  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> upgrade-layers.xlsx',
      description:
        'Generates the file to manage upgrades and saves it in the current directory in a file called upgrades.xlsx.',
    },
  ];
  static description = 'Generates the file to generate a upgrade collection with the specified layers.';

  static args = {
    output: Args.file({
      description: 'Location where the file will be generated.',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GenerateUpgradeFileCommand);

    const output = args.output;

    if (fileExists(output)) {
      const proceed = await confirmPrompt('File already exists. Do you want to overwrite it?');
      if (!proceed) {
        return;
      }
    }

    //Config sheet headers
    const configHeadersRow: Row[] = [
      [
        {
          value: idHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: collectionHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: schemaHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: templateHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: nameHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: imageHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: videoHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: categoryHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: descriptionHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: maxUsesHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: startDateHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: endDateHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: whitelistHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: hiddenHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: revealVideoHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: backgroundColorHeader,
          type: String,
          fontWeight: 'bold',
        },
      ],
    ];

    //Upgarde sheet Headers
    const upgradeHeadersRow: Row[] = [
      [
        {
          value: configIdHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: schemaHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: matchTemplatesHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: matchAttributeHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: matchAttributeValuesHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: effectHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: valueHeader,
          type: String,
          fontWeight: 'bold',
        },
      ],
    ];

    //Ingredients sheet Headers
    const ingredientsHeadersRow: Row[] = [
      [
        {
          value: configIdHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: typeHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: displayDataHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: collectionHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: schemaHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: templateHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: schemaAttributesWithAllowedValuesHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: balanceAttributeHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: balanceAttributCosteHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: tokenHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: tokenPrecisionHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: tokenContractHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: amountHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: effectHeader,
          type: String,
          fontWeight: 'bold',
        },
        {
          value: receipientHeader,
          type: String,
          fontWeight: 'bold',
        },
      ],
    ];

    // Define data for each sheet
    const configData: Row[] = [
      [
        { value: 1, type: Number },
        { value: 'alpacaworlds', type: String },
        { value: 'thejourney', type: String },
        { value: 1111, type: Number },
        { value: 'AlpacaUpgrade', type: String },
        { value: 'Image_Ipfs_Hash', type: String },
        { value: 'Video_Ipfs_Hash', type: String },
        { value: 'My_Category', type: String },
        { value: 'An Alpaca Upgrade', type: String },
        { value: 0, type: Number },
        { value: 0, type: Number },
        { value: 0, type: Number },
        { value: 'Alpaca_Whitelist', type: String },
        { value: false, type: Boolean },
        { value: 'Reveal_Video_Ipfs_Hash', type: String },
        { value: '#FFFF', type: String },
      ],
      [
        { value: 2, type: Number },
        { value: 'alpacaworlds', type: String },
        { value: 'thejourney', type: String },
        { value: 1112, type: Number },
        { value: 'AlpacaUpgrade2', type: String },
        { value: '', type: String },
        { value: '', type: String },
        { value: '', type: String },
        { value: '', type: String },
        { value: 0, type: Number },
        { value: 0, type: Number },
        { value: 0, type: Number },
        { value: '', type: String },
        { value: false, type: Boolean },
        { value: '', type: String },
        { value: '', type: String },
      ],
    ];

    const upgradeData: Row[] = [
      [
        { value: 1, type: Number },
        { value: 'thejourney', type: String },
        { value: 2222, type: Number },
        { value: 'rarity', type: String },
        { value: 'Normal', type: String },
        { value: 'rarity', type: String },
        { value: 'set', type: String },
        { value: 'Rare', type: String },
      ],
      [
        { value: 1, type: Number },
        { value: 'thejourney', type: String },
        { value: '', type: Number },
        { value: '', type: String },
        { value: '', type: String },
        { value: 'img', type: String },
        { value: 'set', type: String },
        { value: 'new_ipfs_hash', type: String },
      ],
      [
        { value: 2, type: Number },
        { value: 'thejourney', type: String },
        { value: 2223, type: Number },
        { value: 'country', type: String },
        { value: 'France', type: String },
        { value: 'country', type: String },
        { value: 'set', type: String },
        { value: 'Spain', type: String },
      ],
    ];

    const ingredientsData: Row[] = [
      [
        { value: 1, type: Number },
        { value: 'attribute', type: String },
        { value: '', type: String },
        { value: 'alpacaworlds', type: String },
        { value: 'thejourney', type: String },
        { value: 1111, type: Number },
        { value: '{"country":["France", "Italy"], "name": ["Marseille", "Rome"]}', type: String },
        { value: '', type: String },
        { value: '', type: String },
        { value: '', type: String },
        { value: '', type: String },
        { value: '', type: String },
        { value: 1, type: Number },
        { value: 'burn', type: String },
        { value: '', type: String },
      ],
      [
        { value: 1, type: Number },
        { value: 'token', type: String },
        { value: '', type: String },
        { value: '', type: String },
        { value: '', type: String },
        { value: '', type: Number },
        { value: '', type: String },
        { value: '', type: String },
        { value: '', type: String },
        { value: 'WAX', type: String },
        { value: 8, type: Number },
        { value: 'eosio', type: String },
        { value: 0.1, type: Number },
        { value: 'transfer', type: String },
        { value: 'nefty', type: String },
      ],
      [
        { value: 2, type: Number },
        { value: 'token', type: String },
        { value: '', type: String },
        { value: '', type: String },
        { value: '', type: String },
        { value: '', type: Number },
        { value: '', type: String },
        { value: '', type: String },
        { value: '', type: String },
        { value: 'NEFTY', type: String },
        { value: 8, type: Number },
        { value: 'token.nefty', type: String },
        { value: 100.5, type: Number },
        { value: 'transfer', type: String },
        { value: 'nefty.wallet', type: String },
      ],
    ];

    const data = [
      [...configHeadersRow, ...configData],
      [...upgradeHeadersRow, ...upgradeData],
      [...ingredientsHeadersRow, ...ingredientsData],
    ];

    const spinner = makeSpinner('Generating file...').start();
    await writeXlsxFile(data, {
      sheets: ['config', 'upgrade', 'ingredients'],
      filePath: output,
    });
    spinner.succeed();

    this.log(`File generated at ${output}`);
  }
}
