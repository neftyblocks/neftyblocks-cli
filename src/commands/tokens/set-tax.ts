import { Flags, Args } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand.js';
import { confirmPrompt, makeSpinner } from '../../utils/tty-utils.js';
import { setTokenTax } from '../../services/token-service.js';

export default class SetTokenTaxCommand extends BaseCommand {
  static readonly description = 'Sets the tax to a token contract';

  static readonly examples = ['<%= config.bin %> <%= command.id %> supertoken TOK --recipient fees.nefty --bps 100'];

  static readonly args = {
    contractName: Args.string({
      description: 'Token contract',
      required: true,
    }),
    symbolCode: Args.string({
      description: 'Token symbol code',
      required: true,
    }),
  };

  static readonly flags = {
    bps: Flags.integer({
      description: 'Bps of the tax (10000 = 100%)',
      required: true,
    }),
    recipient: Flags.string({
      description: 'Tax recipient address',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(SetTokenTaxCommand);
    const { contractName, symbolCode } = args;
    const { bps, recipient } = flags;
    const config = await this.getCliConfig();

    if (bps > 5000) {
      throw Error('bps must be less than 5000');
    }

    const proceed = await confirmPrompt(
      `Add tax of ${bps / 100}% in the token ${contractName}@${symbolCode} that will be paid to ${recipient}. Continue?`,
    );
    if (!proceed) return;

    const spinner = makeSpinner('Setting tax...');

    try {
      const result = await setTokenTax({
        contractName,
        symbolCode,
        bps,
        recipient,
        config,
      });
      const txId = result.resolved?.transaction.id;
      spinner.succeed(`Tax set. Transaction: ${config.explorerUrl}/transaction/${txId}`);
    } catch (error) {
      spinner.fail();
      throw Error(`ERROR setting tax: ` + error);
    }
  }
}
