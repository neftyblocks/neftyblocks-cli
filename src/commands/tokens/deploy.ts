import { Flags, Args } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand.js';
import { confirmPrompt, makeSpinner } from '../../utils/tty-utils.js';
import { createAccount, deploy, isAccountCreated } from '../../services/contract-service.js';

export default class DeployTokenCommand extends BaseCommand {
  static readonly description = 'Deploys a new token contract';

  static readonly examples = ['<%= config.bin %> <%= command.id %> supertoken'];

  static readonly args = {
    accountName: Args.string({
      description: 'Account name to deploy',
      required: true,
    }),
  };

  static readonly flags = {
    abi: Flags.string({
      char: 'a',
      description: 'Abi IPFS CID',
      default: 'QmRAyroPc7sc7uMLoCeeMaK4MqfsgrGbfF29Souki66e5m',
    }),
    wasm: Flags.string({
      char: 'w',
      description: 'WASM IPFS CID',
      default: 'QmYkZqCvQh9fCXFFkJz98qjaVWw1RhnpoZZW3HG1AfbyuP',
    }),
  };

  public async run(): Promise<void> {
    const { flags, args } = await this.parse(DeployTokenCommand);
    const { accountName } = args;
    const { abi, wasm } = flags;
    const config = await this.getCliConfig();

    const proceed = await confirmPrompt(`Contract will be deployed to ${accountName}. Continue?`);
    if (!proceed) return;

    const isCreated = await isAccountCreated({
      accountName,
      config,
    });

    const spinner = makeSpinner();

    if (!isCreated) {
      try {
        spinner.start('Creating account...');
        const result = await createAccount({
          accountName,
          config,
        });
        const txId = result.resolved?.transaction.id;
        spinner.succeed(`Account created. Transaction: ${config.explorerUrl}/transaction/${txId}`);
      } catch (error) {
        spinner.fail();
        throw Error(`ERROR creating account: ` + error);
      }
    }

    try {
      spinner.start('Deploying token...');
      const result = await deploy({
        accountName,
        abiCid: abi,
        wasmCid: wasm,
        bytes: 629 * 1024,
        config,
      });
      const txId = result.resolved?.transaction.id;
      spinner.succeed(`Token deployed. Transaction: ${config.explorerUrl}/transaction/${txId}`);
    } catch (error) {
      spinner.fail();
      throw Error(`ERROR deploying contract: ` + error);
    }
  }
}
