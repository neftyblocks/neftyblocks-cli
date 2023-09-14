import { Cell } from 'read-excel-file/types';
export declare const typeAliases: Record<string, string>;
export declare const stringTypes: string[];
export declare const ipfsTypes: string[];
export declare const integerTypes: string[];
export declare const unsignedIntegerTypes: string[];
export declare const decimalTypes: string[];
export declare function isValidAttribute(type: string, value: Cell): boolean | undefined;
export declare function getXlsType(type: string): StringConstructor | NumberConstructor | BooleanConstructor | undefined;
export declare function transformValueToType(type: string, value: any): any;
