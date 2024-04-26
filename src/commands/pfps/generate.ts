import { Args, Flags, ux } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand.js';
import { join } from 'node:path';
import { fileExists } from '../../utils/file-utils.js';
import { SingleBar } from 'cli-progress';
import writeXlsxFile from 'write-excel-file/node';
import { downloadIpfsImages, generateImage, generatePfps, readPfpLayerSpecs } from '../../services/pfp-service.js';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { PfpManifest } from '../../types/pfps.js';
import ora from 'ora';

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
    const spinner = ora();

    if (existsSync(manifestPath)) {
      const overwrite = await ux.confirm('Manifest file already exists, do you want to overwrite the pfp results? y/n');
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
    spinner.succeed('File read');

    if (downloadSpecs) {
      spinner.start('Downloading images...');
      await downloadIpfsImages(downloadSpecs);
      spinner.succeed('Images downloaded');
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
    const progressBar = new SingleBar({
      format: 'Generating images | {bar} | {percentage}% | {value}/{total} pfps | ETA: {eta_formatted}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    try {
      if (existsSync(imagesFolder)) {
        rmSync(imagesFolder, { recursive: true });
      }

      mkdirSync(imagesFolder, { recursive: true });

      progressBar.start(pfps.length, 0);
      for (const pfp of pfps) {
        await generateImage({
          pfp,
          rootDir,
          outputFolder: imagesFolder,
          resizeWidth: flags.resizeWidth,
        });
        progressBar.increment();
      }
    } finally {
      progressBar.stop();
    }
  }
}
