import { Command, run } from '@oclif/core';

export default class Tokens extends Command {
  static readonly description = "Manages an account's tokens";

  async run(): Promise<void> {
    run([Tokens.id, '--help']);
  }
}
