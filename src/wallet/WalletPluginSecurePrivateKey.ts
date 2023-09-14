/*
Modified from: https://github.com/wharfkit/wallet-plugin-privatekey/blob/master/src/index.ts

Copyright (c) 2023 Greymass Inc. All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1.  Redistribution of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.

2.  Redistribution in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

3.  Neither the name of the copyright holder nor the names of its contributors
    may be used to endorse or promote products derived from this software without
    specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
OF THE POSSIBILITY OF SUCH DAMAGE.

YOU ACKNOWLEDGE THAT THIS SOFTWARE IS NOT DESIGNED, LICENSED OR INTENDED FOR USE
IN THE DESIGN, CONSTRUCTION, OPERATION OR MAINTENANCE OF ANY MILITARY FACILITY.
*/

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

  public id = 'wallet-plugin-secured-privatekey';

  readonly config: WalletPluginConfig = {
    requiresChainSelect: false,
    requiresPermissionSelect: true,
  };
  readonly metadata: WalletPluginMetadata = WalletPluginMetadata.from({
    name: 'Private Key',
    description: 'Wallet plugin for a private key secured by a password.',
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
      throw new Error('Invalid permission level.');
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
