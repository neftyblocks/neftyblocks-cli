import { ExplorerApi, RpcApi } from 'atomicassets';
import { CliConfig, SettingsConfig } from '../types/cli-config';
import { Session, TransactArgs, TransactResult, APIClient, API, AssetType } from '@wharfkit/session';
export declare function getApiClient(rpcUrl: string): APIClient;
export declare function getSession(config: SettingsConfig, createIfNotFound?: boolean): Promise<Session | undefined>;
export declare function getAtomicApi(aaUrl: string): ExplorerApi;
export declare function getAtomicRpc(rpcUrl: string): RpcApi;
export declare function getTableByScope(rpcUrl: string, options: API.v1.GetTableByScopeParams): Promise<API.v1.GetTableByScopeResponse>;
export declare function getTableRows<T extends API.v1.TableIndexType>(rpcUrl: string, options: API.v1.GetTableRowsParamsTyped<T>): Promise<API.v1.GetTableRowsResponse>;
export declare function getBalance(rpcUrl: string, code: string, account: string, symbol?: string): Promise<AssetType[]>;
export declare function transact(actions: TransactArgs['actions'], config: CliConfig): Promise<TransactResult>;