import { ITemplate } from 'atomicassets/build/API/Explorer/Objects';
import { CliConfig, SettingsConfig } from '../types/cli-config';
import { TransactResult } from '@wharfkit/session';
export interface TemplateToCreate {
    schema: string;
    maxSupply: number;
    isBurnable: boolean;
    isTransferable: boolean;
    immutableAttributes: unknown;
}
export interface TemplateIdentifier {
    templateId: string | number;
    collectionName: string;
}
export declare function getTemplate(collection: string, templateId: string, config: SettingsConfig): Promise<ITemplate>;
export declare function getTemplates(templateIds: string, collection: string, config: SettingsConfig): Promise<ITemplate[]>;
export declare function getTemplatesForCollection(collection: string, config: SettingsConfig): Promise<ITemplate[]>;
export declare function getTemplatesFromSchema(collection: string, schema: string, config: SettingsConfig): Promise<ITemplate[]>;
export declare function getNewTemplatesForCollectionAndSchema(collection: string, schema: string, batchSize: number, config: SettingsConfig): Promise<ITemplate[]>;
export declare function getTemplatesMap(templateIds: number[], config: SettingsConfig): Promise<Record<string, ITemplate>>;
export declare function createTemplates(collection: string, templates: TemplateToCreate[], config: CliConfig): Promise<TransactResult>;
export declare function lockManyTemplates(locks: TemplateIdentifier[], config: CliConfig): Promise<TransactResult>;
