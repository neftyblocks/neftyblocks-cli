"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformValueToType = exports.getXlsType = exports.isValidAttribute = exports.decimalTypes = exports.unsignedIntegerTypes = exports.integerTypes = exports.ipfsTypes = exports.stringTypes = exports.typeAliases = void 0;
exports.typeAliases = {
    image: 'string',
    ipfs: 'string',
    bool: 'uint8',
};
exports.stringTypes = ['string', 'image', 'ipfs'];
exports.ipfsTypes = ['image', 'ipfs'];
exports.integerTypes = [
    'uint8',
    'int16',
    'int32',
    'int64',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'fixed8',
    'fixed16',
    'fixed32',
    'fixed64',
];
exports.unsignedIntegerTypes = ['uint8', 'uint16', 'uint32', 'uint64', 'fixed8', 'fixed16', 'fixed32', 'fixed64'];
exports.decimalTypes = ['double', 'float'];
function isValidAttribute(type, value) {
    if (exports.stringTypes.includes(type)) {
        return typeof value === 'string';
    }
    else if (exports.decimalTypes.includes(type)) {
        return typeof value === 'number';
    }
    else if (type === 'bool') {
        if (value === 'true' || value === 'false' || value == 0 || value == 1) {
            return true;
        }
        return false;
    }
    else if (exports.integerTypes.includes(type)) {
        return typeof value === 'number';
    }
}
exports.isValidAttribute = isValidAttribute;
function getXlsType(type) {
    if (exports.stringTypes.includes(type)) {
        return String;
    }
    else if (exports.decimalTypes.includes(type)) {
        return Number;
    }
    else if (type === 'bool') {
        return Boolean;
    }
    else if (exports.integerTypes.includes(type)) {
        return Number;
    }
}
exports.getXlsType = getXlsType;
function transformValueToType(type, value) {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (exports.stringTypes.includes(type)) {
        return value.toString();
    }
    else if (exports.decimalTypes.includes(type)) {
        return Number(value);
    }
    else if (type === 'bool') {
        return value === 1 || value === 'true' || !!value;
    }
    else if (exports.integerTypes.includes(type)) {
        return Number(value);
    }
}
exports.transformValueToType = transformValueToType;
