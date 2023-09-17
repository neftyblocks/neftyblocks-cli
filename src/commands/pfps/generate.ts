import { Args, Flags, ux } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand';
import { join } from 'node:path';
import { fileExists } from '../../utils/file-utils';
import { SingleBar } from 'cli-progress';
import writeXlsxFile from 'write-excel-file/node';
import { generateImage, generatePfps, readPfpLayerSpecs } from '../../services/pfp-service';
import { existsSync, mkdirSync, rmSync } from 'node:fs';

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
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(GeneratePfpsCommand);

    const output = args.output;
    const rootDir = flags.rootDir || process.cwd();
    const quantity = flags.quantity;

    ux.action.start('Reading excel file...');
    const { layerSpecs, forcedPfps } = await readPfpLayerSpecs({
      filePathOrSheetsId: args.input,
    });
    ux.action.stop();

    ux.action.start('Mixing pfps...');
    const pfps = generatePfps({
      quantity,
      layerSpecs,
      forcedPfps,
    });

    // Save pfps to json file in output directory
    if (!fileExists(output)) {
      mkdirSync(output, { recursive: true });
    }

    const headerRow = [
      {
        type: String,
        value: 'dna',
      },
      {
        type: String,
        value: 'imageLayers',
      },
      ...layerSpecs.flatMap((layerSpec) => [
        {
          type: String,
          value: layerSpec.name,
        },
        {
          type: String,
          value: `${layerSpec.name} id`,
        },
      ]),
    ];

    const excelPfps = pfps.map((pfp) => [
      {
        type: String,
        value: pfp.dna,
      },
      {
        type: String,
        value: pfp.imageLayers.join('\n'),
      },
      ...pfp.attributes.flatMap((attribute) => [
        {
          type: String,
          value: attribute.value,
        },
        {
          type: String,
          value: attribute.id,
        },
      ]),
    ]);

    const excelData = [headerRow, ...excelPfps];
    writeXlsxFile(excelData, { filePath: join(output, 'pfps.xlsx') });
    ux.action.stop();

    // Generate images for pfps
    const progressBar = new SingleBar({
      format: 'Generating images | {bar} | {percentage}% | {value}/{total} pfps | ETA: {eta_formatted}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    try {
      const outputFolder = join(output, 'images');
      if (existsSync(outputFolder)) {
        rmSync(outputFolder, { recursive: true });
      }

      mkdirSync(outputFolder, { recursive: true });

      progressBar.start(pfps.length, 0);
      for (const pfp of pfps) {
        await generateImage({
          pfp,
          rootDir,
          outputFolder,
          resizeWidth: flags.resizeWidth,
        });
        progressBar.increment();
      }
    } finally {
      progressBar.stop();
    }
  }
}
