import { Command, run } from '@oclif/core';

export default class Generate extends Command {
  static description = 'Generates files to use in other batch commands.';

  async run(): Promise<void> {
    run([Generate.id, '--help']);
  }
}
