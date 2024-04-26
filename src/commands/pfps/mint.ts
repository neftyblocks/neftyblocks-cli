import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand.js';
import MintAssetsCommand from '../assets/mint.js';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { PfpManifest } from '../../types/pfps.js';

export default class PreparePfpsCommand extends BaseCommand {
  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> ./pfps-folder',
      description: 'Mints the NFTS in the mint-pfps.xlsx file.',
    },
  ];
  static description = 'Mints the NFTS in the mint-pfps.xlsx file.';

  static args = {
    input: Args.directory({
      description: 'Directory where the pfps are saved.',
      required: true,
    }),
  };

  static flags = {
    skip: Flags.integer({
      description: 'Number of mints to skip',
      default: 0,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PreparePfpsCommand);

    const { input } = args;
    const { skip } = flags;

    const manifestPath = path.join(input, 'manifest.json');
    const mintFilePath = path.join(input, 'mint-pfps.xlsx');
    if (!existsSync(mintFilePath) || !existsSync(manifestPath)) {
      throw new Error('No manifest or mint file found. Run the build command first.');
    }

    const manifest: PfpManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    await MintAssetsCommand.run(
      [mintFilePath, `-c=${manifest.collectionName}`, '-i', '--confirm', '-b=10', `--skip=${skip}`],
      this.config,
    );
  }
}
