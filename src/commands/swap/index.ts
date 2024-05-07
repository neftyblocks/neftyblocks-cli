import { Command, run } from '@oclif/core';

export default class Swap extends Command {
  static readonly description = 'Manages liquidity pools.';

  async run(): Promise<void> {
    run([Swap.id, '--help']);
  }
}
