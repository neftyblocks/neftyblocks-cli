import { Command, run } from '@oclif/core';

export default class Assets extends Command {
  static description = "Manages a collection's assets.";

  async run(): Promise<void> {
    run([Assets.id, '--help']);
  }
}
