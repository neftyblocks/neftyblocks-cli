import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand.js';
import { join } from 'node:path';
import { generateCover, getPfpsSample } from '../../services/pfp-service.js';
import { existsSync, readFileSync } from 'node:fs';
import { PfpManifest } from '../../types/pfps.js';
import { makeSpinner } from '../../utils/tty-utils.js';

export default class PfpCoverCommand extends BaseCommand {
  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> pfps -q 50',
      description: 'Generates the cover image with 50 pfps.',
    },
    {
      command:
        '<%= config.bin %> <%= command.id %> pfps -q 50 -i 0b1b2e8ad9672bed621e8259894ea8152857d3dfcc15d6dcccebc98b618d8b5b ff28ca1c5749e6a6369dae7fe7d334b5b5ca40e43f1c345e7f0b4b22b36c0c6b',
      description: 'Generates the cover image with 50 pfps, forcing the use of dnas 0b1b...b5b and ff28...0c6b',
    },
  ];
  static description = 'Generates a cover image based on the generated pfps.';

  static args = {
    input: Args.directory({
      description: 'Directory where the pfps are saved.',
      required: true,
    }),
  };

  static flags = {
    quantity: Flags.integer({
      char: 'q',
      description: 'Number of images to use in the cover.',
      default: 20,
      required: true,
    }),
    include: Flags.string({
      char: 'i',
      description: 'Include specific dnas in the cover.',
      multiple: true,
    }),
    delay: Flags.integer({
      description: 'Delay in ms between each image in the cover.',
      default: 200,
    }),
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(PfpCoverCommand);
    const { input } = args;
    const { quantity, include, delay } = flags;

    const manifestPath = join(input, 'manifest.json');
    if (!existsSync(manifestPath)) {
      throw new Error('No manifest file found. Run the build command first.');
    }

    const spinner = makeSpinner('Generating cover image...').start();

    const manifest: PfpManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    const samplePfps = getPfpsSample({
      manifest,
      quantity,
      include,
      randomize: true,
    });

    const imagePaths = samplePfps.map((pfp) => join(input, 'images', `${pfp.dna}.png`));
    await generateCover({
      imagePaths,
      delay,
      outputFolder: input,
    });
    spinner.succeed();
  }
}
