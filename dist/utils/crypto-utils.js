"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paddingPassword = exports.decrypt = exports.encrypt = void 0;
const tslib_1 = require("tslib");
const node_crypto_1 = tslib_1.__importDefault(require("node:crypto"));
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16
const neftyPadding = Buffer.from('neftyblocks-cli padding').toString('base64');
function encrypt(text, encryptionKey) {
    const key = paddingPassword(encryptionKey); // must be 32
    const iv = Buffer.from(node_crypto_1.default.randomBytes(IV_LENGTH)).toString('hex').slice(0, IV_LENGTH);
    const cipher = node_crypto_1.default.createCipheriv(ALGORITHM, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv + ':' + encrypted.toString('hex');
}
exports.encrypt = encrypt;
function decrypt(text, encryptionKey) {
    try {
        const key = paddingPassword(encryptionKey);
        const textParts = text.includes(':') ? text.split(':') : [];
        const iv = Buffer.from(textParts.shift() || '', 'binary');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = node_crypto_1.default.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
    catch {
        return null;
    }
}
exports.decrypt = decrypt;
function paddingPassword(text) {
    let key = text;
    if (key.length < 32) {
        key += neftyPadding.slice(0, Math.max(0, 32 - key.length));
    }
    return key;
}
exports.paddingPassword = paddingPassword;
