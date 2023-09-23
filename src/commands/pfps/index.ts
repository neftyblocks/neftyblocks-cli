import { Command, run } from '@oclif/core';

export default class Pfps extends Command {
  static description = 'Commands to manage a PFP collection.';

  async run(): Promise<void> {
    run([Pfps.id, '--help']);
  }
}
