import { Cell } from "read-excel-file/types";

export const stringTypes = ["string", "image", "ipfs"];
export const ipfsTypes = ["image", "ipfs"];
export const integerTypes = [
  "uint8",
  "int16",
  "int32",
  "int64",
  "uint8",
  "uint16",
  "uint32",
  "uint64",
  "fixed8",
  "fixed16",
  "fixed32",
  "fixed64",
];
export const unsignedIntegerTypes = [
  "uint8",
  "uint16",
  "uint32",
  "uint64",
  "fixed8",
  "fixed16",
  "fixed32",
  "fixed64",
];
export const decimalTypes = ["double", "float"];

export function isValidAttribute(type: string, value: Cell) {
  if (stringTypes.includes(type)) {
    return typeof value === "string";
  } else if (decimalTypes.includes(type)) {
    return typeof value === "number";
  } else if (type === "bool") {
    if (value === "true" || value === "false" || value == 0 || value == 1) {
      return true;
    }
    return false;
  } else if (integerTypes.includes(type)) {
    return typeof value === "number";
  }
}
