"use strict";
/*
Modified from: https://github.com/wharfkit/console-renderer/blob/master/src/user-interface.ts

Copyright (c) 2021 FFF00 Agents AB & Greymass Inc. All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

 1. Redistribution of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.

 2. Redistribution in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

 3. Neither the name of the copyright holder nor the names of its contributors
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
exports.ConsoleUserInterface = exports.countdown = void 0;
const tslib_1 = require("tslib");
const session_1 = require("@wharfkit/session");
const session_2 = require("@wharfkit/session");
const qrcode_terminal_1 = tslib_1.__importDefault(require("qrcode-terminal"));
const prompts_1 = require("@inquirer/prompts");
const core_1 = require("@oclif/core");
const config_utils_1 = require("../utils/config-utils");
function countdown(expirationTimeString, interval = 10000) {
    const expirationTime = expirationTimeString ? Date.parse(expirationTimeString) : Date.now() + 120000;
    const startTime = Date.now();
    const remainingTime = expirationTime - startTime;
    const intervalId = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const remainingSeconds = Math.ceil((remainingTime - elapsedTime) / 1000);
        if (remainingSeconds <= 0) {
            clearInterval(intervalId);
            core_1.ux.info('Time is up!');
            return process.exit(1);
        }
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        core_1.ux.info(`Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, interval);
    return () => clearInterval(intervalId);
}
exports.countdown = countdown;
class ConsoleUserInterface {
    async login(context) {
        const walletPluginIndex = await this.getWallet(context);
        const walletPlugin = context.walletPlugins[walletPluginIndex];
        const chainId = await this.getChain(context, walletPlugin);
        const permissionLevel = await this.getPermissionLevel(context, walletPlugin);
        return { walletPluginIndex, chainId, permissionLevel };
    }
    async onTransactComplete() {
        /**
         *
         * onTransactComplete(), implement when needed
         *
         */
    }
    async onLoginComplete() {
        /**
         *
         * onLoginComplete(), implement when needed
         *
         */
    }
    async onSignComplete() {
        /**
         *
         * onSignComplete(), implement when needed
         *
         */
    }
    async onBroadcastComplete() {
        /**
         *
         * onBroadcastComplete(), implement when needed
         *
         */
    }
    async onSign() {
        /**
         *
         * onSign, implement when needed
         *
         */
    }
    async onBroadcast() {
        /**
         *
         * onBroadcast(), implement when needed
         *
         */
    }
    translate() {
        return '';
    }
    getTranslate() {
        return () => {
            return '';
        };
    }
    addTranslations() {
        return;
    }
    /**
     * onLogin
     *
     * @param options LoginOptions
     */
    async onLogin() {
        /**
         * A login call has been initiated.
         *
         * Prepare any UI elements required for the login process.
         */
    }
    /**
     * onLoginResult
     */
    async onLoginResult() {
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
    async onTransact() {
        /**
         * A transact call has been initiated.
         *
         * Prepare any UI elements required for the transact process.
         */
    }
    /**
     * onTransactResult
     */
    async onTransactResult() {
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
    status(message) {
        /**
         * Plugins (TransactPlugins, WalletPlugins, etc) can use this to push generic text-only messages to the user interface.
         *
         * The UserInterface can decide how to surface this information to the user.
         */
        core_1.ux.info(`${message}`);
    }
    prompt(args) {
        /**
         * Prompt the user with a yes/no question.
         *
         * The message to display to the user is passed in as the first argument.
         *
         * The return value should be a boolean indicating whether the user selected yes or no.
         */
        core_1.ux.info(`${args.title}`);
        core_1.ux.info(`${args.body}`);
        const onEndCallbacks = [];
        args.elements.forEach((element) => {
            var _a;
            if (element.label) {
                core_1.ux.info(`${element.label}`);
            }
            if (element.type === 'qr') {
                qrcode_terminal_1.default.generate(element.data, { small: true });
            }
            else if (element.type === 'countdown') {
                const end = element.data.end;
                const onEndCallback = countdown(end);
                onEndCallbacks.push(onEndCallback);
            }
            else if (element.type === 'link') {
                const url = (_a = element.data) === null || _a === void 0 ? void 0 : _a.href;
                core_1.ux.info('If unable to click the link, please copy and paste the link into your browser:');
                core_1.ux.url(url, url);
            }
        });
        return (0, session_2.cancelable)(new Promise(() => {
            // Promise that never resolves
        }), () => {
            // Cancel callback
            onEndCallbacks.forEach((callback) => callback());
        });
    }
    async onError(error) {
        /**
         * An error has occurred in the session.
         *
         * This is a good place to display an error message to the user.
         */
        console.error(error);
    }
    async getPermissionLevel(context, walletPlugin) {
        if (!context.uiRequirements.requiresPermissionSelect || !walletPlugin.config.requiresPermissionSelect) {
            return;
        }
        const name = await (0, prompts_1.input)({
            message: 'Enter the account name',
            validate: (value) => {
                return (0, config_utils_1.validateAccountName)(value);
            },
        });
        const permission = await (0, prompts_1.input)({
            message: 'Please enter the permission',
            default: 'active',
            validate: (value) => {
                return (0, config_utils_1.validatePermissionName)(value);
            },
        });
        return session_1.PermissionLevel.from(`${name}@${permission}`);
    }
    async getChain(context, walletPlugin) {
        if (!context.uiRequirements.requiresChainSelect || !walletPlugin.config.requiresChainSelect) {
            return;
        }
        const chain = await (0, prompts_1.select)({
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
        return session_1.Checksum256.from(chain);
    }
    async getWallet(context) {
        if (!context.uiRequirements.requiresWalletSelect) {
            return 0;
        }
        const wallet = await (0, prompts_1.select)({
            message: 'Select an authentication method',
            choices: context.walletPlugins.map((wallet, index) => ({
                name: wallet.metadata.name,
                value: index,
            })),
        });
        return wallet;
    }
}
exports.ConsoleUserInterface = ConsoleUserInterface;
