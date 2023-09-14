"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transact = exports.getBalance = exports.getTableRows = exports.getTableByScope = exports.getAtomicRpc = exports.getAtomicApi = exports.getSession = exports.getApiClient = void 0;
const tslib_1 = require("tslib");
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const atomicassets_1 = require("atomicassets");
const session_1 = require("@wharfkit/session");
const wallet_plugin_anchor_1 = require("@wharfkit/wallet-plugin-anchor");
const ConsoleRenderer_1 = require("../wallet/ConsoleRenderer");
const WalletSessionStorage_1 = require("../wallet/WalletSessionStorage");
const WalletPluginSecurePrivateKey_1 = require("../wallet/WalletPluginSecurePrivateKey");
const core_1 = require("@oclif/core");
let apiClient;
let session;
function getApiClient(rpcUrl) {
    if (!apiClient) {
        apiClient = new session_1.APIClient({
            url: rpcUrl,
            fetch: node_fetch_1.default,
        });
    }
    return apiClient;
}
exports.getApiClient = getApiClient;
async function getSession(config, createIfNotFound = true) {
    if (!session) {
        const sessionStorage = (0, WalletSessionStorage_1.createSessionStorage)(config.sessionDir);
        const sessionKit = new session_1.SessionKit({
            appName: 'NeftyBlocks CLI',
            chains: [
                {
                    id: config.chainId,
                    url: config.rpcUrl,
                },
            ],
            walletPlugins: [new wallet_plugin_anchor_1.WalletPluginAnchor(), new WalletPluginSecurePrivateKey_1.WalletPluginSecurePrivateKey()],
            ui: new ConsoleRenderer_1.ConsoleUserInterface(),
        }, {
            fetch: node_fetch_1.default,
            storage: sessionStorage,
        });
        session = await sessionKit.restore();
        if (!session && createIfNotFound) {
            const loginResponse = await sessionKit.login();
            session = loginResponse.session;
        }
    }
    return session;
}
exports.getSession = getSession;
function getAtomicApi(aaUrl) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new atomicassets_1.ExplorerApi(aaUrl, 'atomicassets', { fetch: node_fetch_1.default });
}
exports.getAtomicApi = getAtomicApi;
function getAtomicRpc(rpcUrl) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new atomicassets_1.RpcApi(rpcUrl, 'atomicassets', { fetch: node_fetch_1.default, rateLimit: 5 });
}
exports.getAtomicRpc = getAtomicRpc;
async function getTableByScope(rpcUrl, options) {
    return getApiClient(rpcUrl).v1.chain.get_table_by_scope(options);
}
exports.getTableByScope = getTableByScope;
async function getTableRows(rpcUrl, options) {
    return getApiClient(rpcUrl).v1.chain.get_table_rows(options);
}
exports.getTableRows = getTableRows;
async function getBalance(rpcUrl, code, account, symbol) {
    return getApiClient(rpcUrl).v1.chain.get_currency_balance(account, code, symbol);
}
exports.getBalance = getBalance;
async function transact(actions, config) {
    const session = config.session;
    try {
        return await session.transact({
            actions,
        }, {
            expireSeconds: 120,
            broadcast: true,
        });
    }
    catch (e) {
        core_1.ux.error('Error while transacting...');
        throw e;
    }
}
exports.transact = transact;
