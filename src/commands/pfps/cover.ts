import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand.js';
import { join } from 'node:path';
import { generateCover } from '../../services/pfp-service.js';
import { existsSync, readFileSync } from 'node:fs';
import { PfpManifest } from '../../types/pfps.js';
import { makeSpinner } from '../../utils/tty-utils.js';

export default class PfpCoverCommand extends BaseCommand {
  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> pfps -w 400 -q 50',
      description: 'Generates the cover image with a width of 400 and 50 pfps.',
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
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(PfpCoverCommand);
    const { input } = args;
    const { quantity, include } = flags;

    const manifestPath = join(input, 'manifest.json');
    if (!existsSync(manifestPath)) {
      throw new Error('No manifest file found. Run the build command first.');
    }

    const spinner = makeSpinner('Generating cover image...').start();

    const manifest: PfpManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    const pfps = [...manifest.pfps].sort(() => Math.random() - 0.5);
    const samplePfps = [];
    for (let i = pfps.length - 1; i >= 0; i--) {
      const pfp = pfps[i];
      if (include && !include.includes(pfp.dna)) {
        continue;
      }
      samplePfps.push(pfp);
      pfps.splice(i, 1);
      if (samplePfps.length >= quantity) {
        break;
      }
    }

    const missingPfps = quantity - samplePfps.length;
    if (missingPfps > 0) {
      const pfsToAdd = pfps.slice(0, missingPfps);
      samplePfps.push(...pfsToAdd);
    }

    samplePfps.sort(() => Math.random() - 0.5);

    const imagePaths = samplePfps.map((pfp) => join(input, 'images', `${pfp.dna}.png`));
    await generateCover({
      imagePaths,
      outputFolder: input,
    });
    spinner.succeed();
  }
}
