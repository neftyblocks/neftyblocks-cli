import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand.js';
import { join } from 'node:path';
import { downloadImage, fileExists } from '../../utils/file-utils.js';
import { SingleBar } from 'cli-progress';
import writeXlsxFile from 'write-excel-file/node';
import { generateImage, generatePfps, readPfpLayerSpecs } from '../../services/pfp-service.js';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { PfpManifest } from '../../types/pfps.js';
import { confirmPrompt, makeSpinner } from '../../utils/tty-utils.js';
import PfpCoverCommand from './cover.js';
import PfpMosaicCommand from './mosaic.js';

export default class GeneratePfpsCommand extends BaseCommand {
  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> pfps-specs.xlsx pfps',
      description: 'Generates all the pfps defined in the pfps-specs.xlsx file and saves them in the pfps directory.',
    },
  ];
  static description = 'Generates the images and attributes for a pfp collection.';

  static args = {
    input: Args.string({
      description: 'Location or google sheets id of the excel file with the pfps definitions.',
      required: true,
    }),
    output: Args.directory({
      description: 'Directory where the images will be saved.',
      required: true,
    }),
  };

  static flags = {
    rootDir: Flags.directory({
      char: 'r',
      exists: true,
      description: 'Directory where the assets are stored.',
    }),
    resizeWidth: Flags.integer({
      char: 'w',
      description: 'Width to resize the images to.',
    }),
    quantity: Flags.integer({
      char: 'q',
      description: 'Number of pfps to generate.',
      required: true,
    }),
    debug: Flags.boolean({
      description: 'Include more information in the pfs excel.',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(GeneratePfpsCommand);

    const output = args.output;
    const rootDir = flags.rootDir || output;
    const quantity = flags.quantity;
    const debug = flags.debug;

    const manifestPath = join(output, 'manifest.json');
    const imagesFolder = join(output, 'images');
    const excelPath = join(output, 'pfps.xlsx');
    const spinner = makeSpinner();

    if (existsSync(manifestPath)) {
      const overwrite = await confirmPrompt('Manifest file already exists, do you want to overwrite the pfp results?');
      if (!overwrite) {
        return;
      } else {
        rmSync(manifestPath, { force: true });
        rmSync(excelPath, { force: true });
        rmSync(imagesFolder, { recursive: true, force: true });
      }
    }

    // Save pfps to json file in output directory
    if (!fileExists(output)) {
      mkdirSync(output, { recursive: true });
    }

    spinner.start('Reading file...');
    const { layerSpecs, forcedPfps, downloadSpecs } = await readPfpLayerSpecs({
      filePathOrSheetsId: args.input,
      rootDir: args.output,
    });
    spinner.succeed();

    if (downloadSpecs) {
      const layersProgressBar = new SingleBar({
        format: 'Downloading layers | {bar} | {percentage}% | {value}/{total} layers | ETA: {eta_formatted}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        clearOnComplete: true,
      });
      const output = downloadSpecs.folder;
      const ipfsValues = downloadSpecs.ipfsHashes;
      layersProgressBar.start(ipfsValues.length, 0);
      for (const ipfs of ipfsValues) {
        try {
          await downloadImage(ipfs, output);
          layersProgressBar.increment();
        } catch (error) {
          layersProgressBar.stop();
          spinner.fail('Failed to generate images');
          throw error;
        }
      }
      layersProgressBar.stop();
      spinner.succeed(`${ipfsValues.length} layers downloaded`);
    }

    spinner.start('Mixing pfps...');
    const pfps = generatePfps({
      quantity,
      layerSpecs,
      forcedPfps,
    });

    const manifest: PfpManifest = {
      collectionName: '',
      uploads: {},
      pfps: [],
    };

    const headerRow = [
      {
        type: String,
        value: 'dna',
      },
      ...(debug
        ? [
            {
              type: String,
              value: 'imageLayers',
            },
          ]
        : []),
      ...layerSpecs.flatMap((layerSpec) => [
        {
          type: String,
          value: layerSpec.name,
        },
        ...(debug
          ? [
              {
                type: String,
                value: `${layerSpec.name} id`,
              },
            ]
          : []),
      ]),
    ];

    const excelPfps = pfps.map((pfp) => [
      {
        type: String,
        value: pfp.dna,
      },
      ...(debug
        ? [
            {
              type: String,
              value: pfp.imageLayers.join('\n'),
            },
          ]
        : []),
      ...pfp.attributes.flatMap((attribute) => [
        {
          type: String,
          value: attribute.value,
        },
        ...(debug
          ? [
              {
                type: String,
                value: attribute.id,
              },
            ]
          : []),
      ]),
    ]);

    for (const pfp of pfps) {
      manifest.pfps.push({
        dna: pfp.dna,
        attributes: pfp.attributes.reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {}),
      });
    }

    const excelData = [headerRow, ...excelPfps];
    writeXlsxFile(excelData, { filePath: excelPath });
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    spinner.succeed('Pfps mixed and saved');

    // Generate images for pfps
    const imagesProgressBar = new SingleBar({
      format: 'Generating images | {bar} | {percentage}% | {value}/{total} pfps | ETA: {eta_formatted}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      clearOnComplete: true,
    });

    try {
      if (existsSync(imagesFolder)) {
        rmSync(imagesFolder, { recursive: true });
      }

      mkdirSync(imagesFolder, { recursive: true });

      imagesProgressBar.start(pfps.length, 0);
      for (const pfp of pfps) {
        await generateImage({
          pfp,
          rootDir,
          outputFolder: imagesFolder,
          resizeWidth: flags.resizeWidth,
        });
        imagesProgressBar.increment();
      }
      imagesProgressBar.stop();
      spinner.succeed(`Generated ${pfps.length} images`);
    } catch (error) {
      imagesProgressBar.stop();
      spinner.fail('Failed to generate images');
    }

    await PfpCoverCommand.run([output]);

    const mosaicQuantity = Math.min(quantity, 100);
    await PfpMosaicCommand.run([output, `--quantity=${mosaicQuantity}`]);
  }
}
