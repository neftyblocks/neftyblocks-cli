"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletPluginSecurePrivateKey = void 0;
const session_1 = require("@wharfkit/session");
const prompts_1 = require("@inquirer/prompts");
const crypto_utils_1 = require("../utils/crypto-utils");
const core_1 = require("@oclif/core");
const config_utils_1 = require("../utils/config-utils");
let cachedPassword;
class WalletPluginSecurePrivateKey extends session_1.AbstractWalletPlugin {
    constructor() {
        super();
        this.id = 'wallet-plugin-secured-privatekey';
        this.config = {
            requiresChainSelect: false,
            requiresPermissionSelect: true,
        };
        this.metadata = session_1.WalletPluginMetadata.from({
            name: 'Private Key',
            description: 'Wallet plugin for a private key secured by a password.',
        });
    }
    login(context) {
        return (0, session_1.cancelable)(new Promise((resolve, reject) => {
            this.handleLogin(context)
                .then((response) => {
                resolve(response);
            })
                .catch((error) => {
                reject(error);
            });
        }));
    }
    async handleLogin(context) {
        let chain;
        if (context.chain) {
            chain = context.chain.id;
        }
        else {
            chain = context.chains[0].id;
        }
        if (!context.permissionLevel) {
            throw new Error('Invalid permission level.');
        }
        const privateKeyString = await (0, prompts_1.password)({
            message: 'Enter the private key',
            mask: '*',
            validate: (value) => {
                return (0, config_utils_1.validatePrivateKey)(value);
            },
        });
        const pass = await (0, prompts_1.password)({
            message: 'Enter a password to encrypt the private key',
            mask: '*',
            validate: (value) => (value.length > 3 ? true : 'Password must be at least 3 characters'),
        });
        await (0, prompts_1.password)({
            message: 'Confirm password',
            mask: '*',
            validate: (value) => (value === pass ? true : 'Passwords do not match'),
        });
        this.data.publicKey = session_1.PrivateKey.fromString(privateKeyString).toPublic().toString();
        this.data.encryptedPrivateKey = (0, crypto_utils_1.encrypt)(privateKeyString, pass);
        return {
            chain,
            permissionLevel: context.permissionLevel,
        };
    }
    sign(resolved, context) {
        return (0, session_1.cancelable)(new Promise((resolve, reject) => {
            this.handleSign(resolved, context)
                .then((response) => {
                resolve(response);
            })
                .catch((error) => {
                reject(error);
            });
        }));
    }
    async handleSign(resolved, context) {
        if (!cachedPassword) {
            cachedPassword = await core_1.ux.prompt('Enter your password to decrypt the private key', { type: 'hide' });
        }
        const privateKeyString = (0, crypto_utils_1.decrypt)(this.data.encryptedPrivateKey, cachedPassword);
        if (!privateKeyString) {
            throw new Error('Invalid password');
        }
        const privateKey = session_1.PrivateKey.fromString(privateKeyString);
        const transaction = session_1.Transaction.from(resolved.transaction);
        const digest = transaction.signingDigest(session_1.Checksum256.from(context.chain.id));
        const signature = privateKey.signDigest(digest);
        return {
            signatures: [signature],
        };
    }
}
exports.WalletPluginSecurePrivateKey = WalletPluginSecurePrivateKey;
