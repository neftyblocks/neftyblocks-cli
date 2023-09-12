import fetch from 'node-fetch';
import { ExplorerApi, RpcApi } from 'atomicassets';
import { CliConfig } from '../types/cli-config';
import { APIClient, API, AssetType } from '@wharfkit/antelope';
import { Session, TransactArgs, TransactResult } from '@wharfkit/session';
import { WalletPluginPrivateKey } from '@wharfkit/wallet-plugin-privatekey';

let apiClient: APIClient;
let session: Session;

export function getApiClient(rpcUrl: string): APIClient {
  if (!apiClient) {
    apiClient = new APIClient({
      url: rpcUrl,
    });
  }
  return apiClient;
}

export function getSession(config: CliConfig): Session {
  if (!session) {
    session = new Session(
      {
        chain: {
          id: config.chainId,
          url: config.rpcUrl,
        },
        actor: config.account,
        permission: config.permission,
        walletPlugin: new WalletPluginPrivateKey(config.privateKey),
      },
      {
        fetch,
      },
    );
  }
  return session;
}

export function getAtomicApi(aaUrl: string): ExplorerApi {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return new ExplorerApi(aaUrl, 'atomicassets', { fetch });
}

export function getAtomicRpc(rpcUrl: string): RpcApi {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return new RpcApi(rpcUrl, 'atomicassets', { fetch, rateLimit: 5 });
}

export async function getTableByScope(
  rpcUrl: string,
  options: API.v1.GetTableByScopeParams,
): Promise<API.v1.GetTableByScopeResponse> {
  return getApiClient(rpcUrl).v1.chain.get_table_by_scope(options);
}

export async function getTableRows<T extends API.v1.TableIndexType>(
  rpcUrl: string,
  options: API.v1.GetTableRowsParamsTyped<T>,
): Promise<API.v1.GetTableRowsResponse> {
  return getApiClient(rpcUrl).v1.chain.get_table_rows<T>(options);
}

export async function getBalance(rpcUrl: string, code: string, account: string, symbol?: string): Promise<AssetType[]> {
  return getApiClient(rpcUrl).v1.chain.get_currency_balance(account, code, symbol);
}

export async function transact(actions: TransactArgs['actions'], config: CliConfig): Promise<TransactResult> {
  const session = getSession(config);
  return session.transact(
    {
      actions,
    },
    {
      expireSeconds: 120,
      broadcast: true,
    },
  );
}
