import { base32cid } from 'is-ipfs';
import { CID } from 'multiformats/cid';

export const typeAliases: Record<string, string> = {
  image: 'string',
  ipfs: 'string',
  bool: 'uint8',
};
export const stringTypes = ['string', 'image', 'ipfs'];
export const ipfsTypes = ['image', 'ipfs'];
export const integerTypes = [
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
export const unsignedIntegerTypes = ['uint8', 'uint16', 'uint32', 'uint64', 'fixed8', 'fixed16', 'fixed32', 'fixed64'];
export const decimalTypes = ['double', 'float'];

export function isValidAttribute(type: string, value: any) {
  if (stringTypes.includes(type)) {
    return typeof value === 'string';
  } else if (decimalTypes.includes(type)) {
    return typeof value === 'number';
  } else if (type === 'bool') {
    if (value === 'true' || value === 'false' || value == 0 || value == 1) {
      return true;
    }
    return false;
  } else if (integerTypes.includes(type)) {
    return typeof value === 'number';
  }
}

export function getXlsType(type: string) {
  if (stringTypes.includes(type)) {
    return String;
  } else if (decimalTypes.includes(type)) {
    return Number;
  } else if (type === 'bool') {
    return Boolean;
  } else if (integerTypes.includes(type)) {
    return Number;
  }
}

export function transformValueToType(type: string, value: any) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (type === 'ipfs') {
    if (base32cid(value.toString())) {
      const cid = CID.parse(value.toString());
      return cid.toV0().toString();
    } else {
      return value.toString();
    }
  } else if (stringTypes.includes(type)) {
    return value.toString();
  } else if (decimalTypes.includes(type)) {
    return Number(value);
  } else if (type === 'bool') {
    return value === 1 || value === 'true' || !!value;
  } else if (integerTypes.includes(type)) {
    return Number(value);
  }
}

export function getUpgradeType(type: string) {
  if (type == 'int8') {
    return 'INT8_VEC';
  } else if (type == 'int16') {
    return 'INT16_VEC';
  } else if (type == 'int32') {
    return 'INT32_VEC';
  } else if (type == 'int64') {
    return 'INT64_VEC';
  } else if (type == 'uint8') {
    return 'UINT8_VEC';
  } else if (type == 'uint16') {
    return 'UINT16_VEC';
  } else if (type == 'uint32') {
    return 'UINT32_VEC';
  } else if (type == 'uint64') {
    return 'UINT64_VEC';
  } else if (type == 'fixed8') {
    return 'UINT8_VEC';
  } else if (type == 'byte') {
    return 'UINT8_VEC';
  } else if (type == 'fixed16') {
    return 'UINT16_VEC';
  } else if (type == 'fixed32') {
    return 'UINT32_VEC';
  } else if (type == 'fixed64') {
    return 'UINT64_VEC';
  } else if (type == 'float') {
    return 'FLOAT_VEC';
  } else if (type == 'double') {
    return 'DOUBLE_VEC';
  } else if (type == 'string') {
    return 'STRING_VEC';
  } else if (type == 'image') {
    return 'STRING_VEC';
  } else if (type == 'ipfs') {
    return 'STRING_VEC';
  } else if (type == 'bool') {
    return 'UINT8_VEC';
  }
}

export function transformToUpgradeType(type: string) {
  if (type === 'image' || type === 'ipfs') {
    return 'string';
  }
  if (type === 'bool') {
    return 'uint8';
  }

  return type;
}
