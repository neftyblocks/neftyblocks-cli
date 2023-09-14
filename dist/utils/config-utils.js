"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionDir = exports.writeConfiguration = exports.readConfiguration = exports.validate = exports.removeSession = exports.removeConfigFile = exports.configFileExists = exports.validatePrivateKey = exports.validatePermissionName = exports.validateAccountName = exports.normalizeUrl = exports.validateAtomicAssetsUrl = exports.validateExplorerUrl = exports.getChainId = void 0;
const tslib_1 = require("tslib");
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const file_utils_1 = require("./file-utils");
const node_path_1 = tslib_1.__importStar(require("node:path"));
const node_fs_1 = require("node:fs");
const antelope_1 = require("@wharfkit/antelope");
const neftyConfFileName = 'config.json';
const sessionDir = 'sessions';
async function getChainId(rpcUrl) {
    const rpc = rpcUrl + '/v1/chain/get_info';
    try {
        const response = await (0, node_fetch_1.default)(rpc, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        });
        if (response.ok) {
            const result = await response.json();
            return result.chain_id;
        }
    }
    catch (error) {
        // Ignore
    }
    return '';
}
exports.getChainId = getChainId;
async function validateExplorerUrl(bloksUrl) {
    try {
        const response = await (0, node_fetch_1.default)(bloksUrl, {
            method: 'GET',
        });
        return response.ok;
    }
    catch (error) {
        return 'Invalid URL, please enter a valid URL as https://waxblock.io';
    }
}
exports.validateExplorerUrl = validateExplorerUrl;
async function validateAtomicAssetsUrl(aaUrl) {
    const aa = aaUrl + '/health';
    try {
        const response = await (0, node_fetch_1.default)(aa, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        });
        if (response.ok) {
            const result = await response.json();
            return result.data.chain.status === 'OK';
        }
        return 'Unable to connect to Atomic Assets API';
    }
    catch (error) {
        return 'Invalid URL, please enter a valid URL as https://aa.neftyblocks.com';
    }
}
exports.validateAtomicAssetsUrl = validateAtomicAssetsUrl;
function normalizeUrl(url) {
    if (url.endsWith('/')) {
        return url.slice(0, -1);
    }
    return url;
}
exports.normalizeUrl = normalizeUrl;
function validateAccountName(account) {
    const regex = new RegExp('^[a-z1-5.]{0,12}$');
    const match = regex.test(account);
    const lastChar = account.at(-1);
    if (lastChar === '.' || !match) {
        return 'Can contain letters "a-z", numbers betwen "1-5" and ".". Can contain a maximum of 12 characters. Cannot end with ".".';
    }
    return true;
}
exports.validateAccountName = validateAccountName;
function validatePermissionName(account) {
    const regex = new RegExp('^[a-z1-5.]{0,12}$');
    const match = regex.test(account);
    if (!match) {
        return 'Can contain letters "a-z", numbers betwen "1-5" and ".". Can contain a maximum of 12 characters.';
    }
    return true;
}
exports.validatePermissionName = validatePermissionName;
function validatePrivateKey(pkString) {
    try {
        const privateKey = antelope_1.PrivateKey.fromString(pkString);
        return !!privateKey;
    }
    catch (error) {
        return 'Invalid private key';
    }
}
exports.validatePrivateKey = validatePrivateKey;
function configFileExists(dir) {
    if (!(0, node_fs_1.existsSync)(dir)) {
        (0, node_fs_1.mkdirSync)(dir, { recursive: true });
        return false;
    }
    return (0, node_fs_1.existsSync)((0, node_path_1.join)(dir, neftyConfFileName));
}
exports.configFileExists = configFileExists;
function removeConfigFile(dir) {
    const configPath = node_path_1.default.join(dir, neftyConfFileName);
    (0, file_utils_1.removeFile)(configPath);
    removeSession(dir);
}
exports.removeConfigFile = removeConfigFile;
function removeSession(dir) {
    const sessionsDir = getSessionDir(dir);
    (0, file_utils_1.removeDir)(sessionsDir);
}
exports.removeSession = removeSession;
async function validate(config) {
    const [chainId, validAaUrl, validExplorerUrl] = await Promise.all([
        getChainId(config.rpcUrl),
        validateAtomicAssetsUrl(config.aaUrl),
        validateExplorerUrl(config.explorerUrl),
    ]);
    const valid = !!chainId && validAaUrl && validExplorerUrl;
    if (!valid) {
        return null;
    }
    return {
        ...config,
        chainId: chainId,
    };
}
exports.validate = validate;
function readConfiguration(dir) {
    if (!configFileExists(dir)) {
        return null;
    }
    const configPath = node_path_1.default.join(dir, neftyConfFileName);
    const configContents = (0, file_utils_1.readFile)(configPath);
    if (configContents === null) {
        return null;
    }
    return JSON.parse(configContents);
}
exports.readConfiguration = readConfiguration;
function writeConfiguration(config, dir) {
    const normalizedConfig = {
        rpcUrl: normalizeUrl(config.rpcUrl),
        aaUrl: normalizeUrl(config.aaUrl),
        explorerUrl: normalizeUrl(config.explorerUrl),
        chainId: config.chainId,
        sessionDir: config.sessionDir,
    };
    const configPath = node_path_1.default.join(dir, neftyConfFileName);
    (0, file_utils_1.writeFile)(configPath, JSON.stringify(normalizedConfig, null, 2));
}
exports.writeConfiguration = writeConfiguration;
function getSessionDir(dir) {
    return node_path_1.default.join(dir, sessionDir);
}
exports.getSessionDir = getSessionDir;
