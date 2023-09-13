import {
  AbstractWalletPlugin,
  cancelable,
  Cancelable,
  Checksum256,
  LoginContext,
  PermissionLevel,
  PrivateKey,
  ResolvedSigningRequest,
  TransactContext,
  Transaction,
  WalletPlugin,
  WalletPluginConfig,
  WalletPluginLoginResponse,
  WalletPluginMetadata,
  WalletPluginSignResponse,
} from '@wharfkit/session';
import { password } from '@inquirer/prompts';
import { decrypt, encrypt } from '../utils/crypto-utils';
import { ux } from '@oclif/core';
import { validatePrivateKey } from '../utils/config-utils';

let cachedPassword: string | undefined;

export class WalletPluginSecurePrivateKey extends AbstractWalletPlugin implements WalletPlugin {
  chain: Checksum256 | undefined;
  auth: PermissionLevel | undefined;
  encryptedPrivateKey: string | undefined;
  publicKey: string | undefined;

  public id = 'wallet-plugin-privatekey';

  readonly config: WalletPluginConfig = {
    requiresChainSelect: false,
    requiresPermissionSelect: true,
  };
  readonly metadata: WalletPluginMetadata = WalletPluginMetadata.from({
    name: 'Private Key',
    description: '',
  });
  constructor() {
    super();
  }
  login(context: LoginContext): Cancelable<WalletPluginLoginResponse> {
    return cancelable(
      new Promise((resolve, reject) => {
        this.handleLogin(context)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      }),
    );
  }

  async handleLogin(context: LoginContext): Promise<WalletPluginLoginResponse> {
    let chain: Checksum256;
    if (context.chain) {
      chain = context.chain.id;
    } else {
      chain = context.chains[0].id;
    }

    if (!context.permissionLevel) {
      throw new Error(
        'Calling login() without a permissionLevel is not supported by the WalletPluginPrivateKey plugin.',
      );
    }

    const privateKeyString = await password({
      message: 'Enter the private key',
      mask: '*',
      validate: (value) => {
        return validatePrivateKey(value);
      },
    });

    const pass = await password({
      message: 'Enter a password to encrypt the private key',
      mask: '*',
      validate: (value) => (value.length > 3 ? true : 'Password must be at least 3 characters'),
    });
    await password({
      message: 'Confirm password',
      mask: '*',
      validate: (value) => (value === pass ? true : 'Passwords do not match'),
    });

    this.data.publicKey = PrivateKey.fromString(privateKeyString).toPublic().toString();
    this.data.encryptedPrivateKey = encrypt(privateKeyString, pass);

    return {
      chain,
      permissionLevel: context.permissionLevel,
    };
  }

  sign(resolved: ResolvedSigningRequest, context: TransactContext): Cancelable<WalletPluginSignResponse> {
    return cancelable(
      new Promise((resolve, reject) => {
        this.handleSign(resolved, context)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      }),
    );
  }

  async handleSign(resolved: ResolvedSigningRequest, context: TransactContext): Promise<WalletPluginSignResponse> {
    if (!cachedPassword) {
      cachedPassword = await ux.prompt('Enter your password to decrypt the private key', { type: 'hide' });
    }

    const privateKeyString = decrypt(this.data.encryptedPrivateKey, cachedPassword);
    if (!privateKeyString) {
      throw new Error('Invalid password');
    }
    const privateKey = PrivateKey.fromString(privateKeyString);

    const transaction = Transaction.from(resolved.transaction);
    const digest = transaction.signingDigest(Checksum256.from(context.chain.id));
    const signature = privateKey.signDigest(digest);
    return {
      signatures: [signature],
    };
  }
}
