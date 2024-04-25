import { Command, run } from '@oclif/core';

export default class Generate extends Command {
  static description = 'Generates excel files to use in other batch commands.';

  async run(): Promise<void> {
    run([Generate.id, '--help']);
  }
}
