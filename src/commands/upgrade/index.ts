import { Command, run } from '@oclif/core';

export default class Upgrade extends Command {
  static readonly description = 'Command to creates upgrades';

  async run(): Promise<void> {
    run([Upgrade.id, '--help']);
  }
}
