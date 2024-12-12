import { base32cid } from 'is-ipfs/';
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
