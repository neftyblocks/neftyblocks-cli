import { Checksum256, PermissionLevel } from '@wharfkit/session';
import {
  cancelable,
  Cancelable,
  LoginContext,
  PromptArgs,
  PromptElement,
  PromptResponse,
  UserInterface,
  UserInterfaceLoginResponse,
  UserInterfaceTranslateFunction,
  UserInterfaceWalletPlugin,
} from '@wharfkit/session';
import qrcode from 'qrcode-terminal';
import { select, input } from '@inquirer/prompts';
import { ux } from '@oclif/core';
import { validateAccountName, validatePermissionName } from '../utils/config-utils';

export function countdown(expirationTimeString?: string, interval = 10000) {
  const expirationTime = expirationTimeString ? Date.parse(expirationTimeString) : Date.now() + 120000;
  const startTime = Date.now();
  const remainingTime = expirationTime - startTime;

  const intervalId = setInterval(() => {
    const elapsedTime = Date.now() - startTime;
    const remainingSeconds = Math.ceil((remainingTime - elapsedTime) / 1000);

    if (remainingSeconds <= 0) {
      clearInterval(intervalId);
      ux.info('Time is up!');

      return process.exit(1);
    }

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    ux.info(`Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`);
  }, interval);

  return () => clearInterval(intervalId);
}

export function printLink(url: string) {
  ux.url(url, url);
}

export class ConsoleUserInterface implements UserInterface {
  async login(context: LoginContext): Promise<UserInterfaceLoginResponse> {
    const walletPluginIndex = await this.getWallet(context);
    const walletPlugin = context.walletPlugins[walletPluginIndex];
    const chainId = await this.getChain(context, walletPlugin);
    const permissionLevel = await this.getPermissionLevel(context, walletPlugin);

    return { walletPluginIndex, chainId, permissionLevel };
  }

  async onTransactComplete(): Promise<void> {
    /**
     *
     * onTransactComplete(), implement when needed
     *
     */
  }

  async onLoginComplete(): Promise<void> {
    /**
     *
     * onLoginComplete(), implement when needed
     *
     */
  }

  async onSignComplete(): Promise<void> {
    /**
     *
     * onSignComplete(), implement when needed
     *
     */
  }

  async onBroadcastComplete(): Promise<void> {
    /**
     *
     * onBroadcastComplete(), implement when needed
     *
     */
  }

  async onSign(): Promise<void> {
    /**
     *
     * onSign, implement when needed
     *
     */
  }

  async onBroadcast(): Promise<void> {
    /**
     *
     * onBroadcast(), implement when needed
     *
     */
  }

  translate(): string {
    return '';
  }

  getTranslate(): UserInterfaceTranslateFunction {
    return () => {
      return '';
    };
  }

  addTranslations(): void {
    return;
  }

  /**
   * onLogin
   *
   * @param options LoginOptions
   */
  async onLogin(): Promise<void> {
    /**
     * A login call has been initiated.
     *
     * Prepare any UI elements required for the login process.
     */
  }

  /**
   * onLoginResult
   */
  async onLoginResult(): Promise<void> {
    /**
     * The login call has completed.
     *
     * Cleanup any UI elements or state from the login process.
     */
  }

  /**
   * onTransact
   *
   * @param context TransactContext
   */
  async onTransact(): Promise<void> {
    /**
     * A transact call has been initiated.
     *
     * Prepare any UI elements required for the transact process.
     */
  }

  /**
   * onTransactResult
   */
  async onTransactResult(): Promise<void> {
    /**
     * The transact call has completed.
     *
     * Cleanup any UI elements or state from the transact process.
     */
  }

  /**
   * status
   *
   * @param message string
   */
  status(message: string) {
    /**
     * Plugins (TransactPlugins, WalletPlugins, etc) can use this to push generic text-only messages to the user interface.
     *
     * The UserInterface can decide how to surface this information to the user.
     */

    ux.info(`${message}`);
  }

  prompt(args: PromptArgs): Cancelable<PromptResponse> {
    /**
     * Prompt the user with a yes/no question.
     *
     * The message to display to the user is passed in as the first argument.
     *
     * The return value should be a boolean indicating whether the user selected yes or no.
     */

    ux.info(`${args.title}`);
    ux.info(`${args.body}`);

    const onEndCallbacks: (() => void)[] = [];

    args.elements.forEach((element: PromptElement) => {
      if (element.label) {
        ux.info(`${element.label}`);
      }

      if (element.type === 'qr') {
        qrcode.generate(element.data as string, { small: true });
      } else if (element.type === 'countdown') {
        const onEndCallback = countdown(element?.data as string);
        onEndCallbacks.push(onEndCallback);
      } else if (element.type === 'link') {
        ux.info('If unable to click the link, please copy and paste the link into your browser:');
        printLink((element.data as any)?.href);
      }
    });

    return cancelable(
      new Promise(() => {
        // Promise that never resolves
      }),
      () => {
        // Cancel callback
        onEndCallbacks.forEach((callback) => callback());
      },
    );
  }

  async onError(error: Error): Promise<void> {
    /**
     * An error has occurred in the session.
     *
     * This is a good place to display an error message to the user.
     */

    console.error(error);
  }

  private async getPermissionLevel(
    context: LoginContext,
    walletPlugin: UserInterfaceWalletPlugin,
  ): Promise<PermissionLevel | undefined> {
    if (!context.uiRequirements.requiresPermissionSelect || !walletPlugin.config.requiresPermissionSelect) {
      return;
    }

    const name = await input({
      message: 'Enter the account name',
      validate: (value) => {
        return validateAccountName(value);
      },
    });

    const permission = await input({
      message: 'Please enter the permission',
      default: 'active',
      validate: (value) => {
        return validatePermissionName(value);
      },
    });

    return PermissionLevel.from(`${name}@${permission}`);
  }

  private async getChain(
    context: LoginContext,
    walletPlugin: UserInterfaceWalletPlugin,
  ): Promise<Checksum256 | undefined> {
    if (!context.uiRequirements.requiresChainSelect || !walletPlugin.config.requiresChainSelect) {
      return;
    }

    const chain = await select({
      message: 'Please enter the chain name',
      choices: context.chains
        .filter((chain) => {
          !walletPlugin.config.supportedChains || walletPlugin.config.supportedChains.includes(chain.id);
        })
        .map((chain) => ({
          name: chain.name,
          value: chain.id,
        })),
    });

    return Checksum256.from(chain);
  }

  private async getWallet(context: LoginContext): Promise<number> {
    if (!context.uiRequirements.requiresWalletSelect) {
      return 0;
    }

    const wallet = await select({
      message: 'Select an authentication method',
      choices: context.walletPlugins.map((wallet, index) => ({
        name: wallet.metadata.name!,
        value: index,
      })),
    });

    return wallet;
  }
}
