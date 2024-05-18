import { Args } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand.js';
import { confirmPrompt, makeSpinner } from '../../utils/tty-utils.js';
import { issueToken } from '../../services/token-service.js';
import { Asset } from '@wharfkit/session';

export default class CreateTokenCommand extends BaseCommand {
  static readonly description = 'Issue tokens';

  static readonly examples = [`<%= config.bin %> <%= command.id %> supertoken '10000000.0000 SWT'`];

  static readonly args = {
    contractName: Args.string({
      description: 'Token contract',
      required: true,
    }),
    amount: Args.string({
      description: 'Amount to issue',
      required: true,
    }),
    memo: Args.string({
      description: 'Memo',
      required: false,
    }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(CreateTokenCommand);
    const { contractName, amount, memo } = args;
    const config = await this.getCliConfig();

    const issueAmountAsset = Asset.from(amount);
    const formattedAmount = `${new Intl.NumberFormat('en-US').format(+issueAmountAsset.toString().split(' ')[0])} ${issueAmountAsset.toString().split(' ')[1]}`;
    const proceed = await confirmPrompt(`Issue ${formattedAmount} tokens. Continue?`);
    if (!proceed) return;

    const spinner = makeSpinner('Issuing token...');

    try {
      const result = await issueToken({
        contractName,
        issueAmountAsset,
        memo,
        config,
      });
      const txId = result.resolved?.transaction.id;
      spinner.succeed(`Token issued. Transaction: ${config.explorerUrl}/transaction/${txId}`);
    } catch (error) {
      spinner.fail();
      throw Error(`ERROR issuing token: ` + error);
    }
  }
}
