import { CliConfig, SettingsConfig } from '../types/cli-config';
import { TransactResult } from '@wharfkit/session';
import { SchemaObject } from 'atomicassets/build/Schema';
export interface AssetSchema {
    name: string;
    collectionName: string;
    format: SchemaObject[];
}
export declare function getCollectionSchemas(collection: string, config: SettingsConfig): Promise<AssetSchema[]>;
export declare function getSchema(collection: string, schema: string, config: SettingsConfig): Promise<AssetSchema>;
export declare function createSchema(collectionName: string, schemaName: string, schemaFormat: unknown, config: CliConfig): Promise<TransactResult>;
