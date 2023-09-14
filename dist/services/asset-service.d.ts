import { AccountApiParams, AssetsApiParams, GreylistParams, HideOffersParams } from 'atomicassets/build/API/Explorer/Params';
import { IAccountStats, IAsset } from 'atomicassets/build/API/Explorer/Objects';
import { CliConfig, SettingsConfig } from '../types/cli-config';
import { TransactResult } from '@wharfkit/session';
export interface MintData {
    authorized_minter: string;
    collection_name: string;
    schema_name: string;
    template_id: string;
    new_asset_owner: string;
    immutable_data: any[];
    mutable_data: any[];
    tokens_to_back: any[];
}
export declare function getAccountTemplates(account: string, options: GreylistParams & HideOffersParams, config: SettingsConfig): Promise<IAccountStats['templates']>;
export declare function getAssetsByCollectionAndOwner(owner: string, collection: string, pageSize: number, config: SettingsConfig): Promise<IAsset[]>;
export declare function getAccounts(options: AccountApiParams, config: SettingsConfig, page?: number, limit?: number): Promise<Array<{
    account: string;
    assets: string;
}>>;
export declare function getAssetsBySchema(collection: string, schema: string, config: SettingsConfig, batchSize?: number): Promise<IAsset[]>;
export declare function batchedGetAssets(options: AssetsApiParams, config: SettingsConfig, batchSize?: number): Promise<IAsset[]>;
export declare function getAccountsBySchema(collection: string, schema: string, config: SettingsConfig): Promise<Array<{
    account: string;
    assets: string;
}>>;
export declare function getAssetsMap(assetIds: string[], config: SettingsConfig): Promise<Record<string, IAsset>>;
export declare function mintAssets(mints: MintData[], config: CliConfig): Promise<TransactResult>;
export declare function setAssetsData(actionSetAssetDataArray: any, config: CliConfig): Promise<TransactResult>;
export declare function burnAssets(assetIds: string[], config: CliConfig): Promise<TransactResult>;
export declare function getAssetsByTemplate(templateId: number, account: string, amount: number, config: SettingsConfig, batchSize?: number): Promise<IAsset[]>;
export declare function getOwnedAssetsByTemplateIds(templateIds: (number | string)[], account: string, config: SettingsConfig, templateIdsBatchSize?: number, assetsBatchSize?: number): Promise<IAsset[]>;
export declare function getUnburnedAssetsByTemplate(templateId: number, amount: number, config: SettingsConfig, batchSize?: number): Promise<IAsset[]>;
