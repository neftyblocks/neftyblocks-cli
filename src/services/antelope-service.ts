/* eslint-disable @typescript-eslint/ban-ts-comment */
import fetch from 'node-fetch';
import { ExplorerApi, RpcApi } from 'atomicassets';
import { CliConfig, SettingsConfig } from '../types';
import { Session, SessionKit, TransactArgs, TransactResult, APIClient, API, AssetType } from '@wharfkit/session';
import { WalletPluginAnchor } from '@wharfkit/wallet-plugin-anchor';
import { ConsoleUserInterface } from '../wallet/ConsoleRenderer';
import { createSessionStorage } from '../wallet/WalletSessionStorage';
import { WalletPluginSecurePrivateKey } from '../wallet/WalletPluginSecurePrivateKey';
import WebSocket from 'isomorphic-ws';

let apiClient: APIClient;
let session: Session | undefined;

// @ts-ignore
global.WebSocket = WebSocket;
// @ts-ignore
global.navigator = {};
// @ts-ignore
global.window = {
  // @ts-ignore
  location: {
    href: '',
  },
};

export function getApiClient(rpcUrl: string): APIClient {
  if (!apiClient) {
    apiClient = new APIClient({
      url: rpcUrl,
      fetch,
    });
  }
  return apiClient;
}

export async function getSession(config: SettingsConfig, createIfNotFound = true): Promise<Session | undefined> {
  if (!session) {
    const sessionStorage = createSessionStorage(config.sessionDir);
    const sessionKit = new SessionKit(
      {
        appName: 'NeftyBlocks CLI',
        chains: [
          {
            id: config.chainId,
            url: config.rpcUrl,
          },
        ],
        walletPlugins: [new WalletPluginAnchor(), new WalletPluginSecurePrivateKey()],
        ui: new ConsoleUserInterface(),
      },
      {
        fetch,
        storage: sessionStorage,
      },
    );

    session = await sessionKit.restore();
    if (!session && createIfNotFound) {
      const loginResponse = await sessionKit.login();
      session = loginResponse.session;
    }
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

export async function getTableRows<Key extends keyof API.v1.TableIndexTypes>(
  rpcUrl: string,
  options: API.v1.GetTableRowsParamsKeyed<API.v1.TableIndexTypes[Key], Key>,
): Promise<API.v1.GetTableRowsResponse<API.v1.TableIndexTypes[Key]>> {
  return getApiClient(rpcUrl).v1.chain.get_table_rows(options);
}

export async function getBalance(rpcUrl: string, code: string, account: string, symbol?: string): Promise<AssetType[]> {
  return getApiClient(rpcUrl).v1.chain.get_currency_balance(account, code, symbol);
}

export async function transact(actions: TransactArgs['actions'], config: CliConfig): Promise<TransactResult> {
  const session = config.session;
  return await session.transact(
    {
      actions,
    },
    {
      expireSeconds: 120,
      broadcast: true,
    },
  );
}
