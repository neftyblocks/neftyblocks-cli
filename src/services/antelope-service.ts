/* eslint-disable @typescript-eslint/ban-ts-comment */
import fetch from 'node-fetch';
import { ExplorerApi, RpcApi } from 'atomicassets';
import { CliConfig, SettingsConfig } from '../types/index.js';
import { Session, SessionKit, TransactArgs, TransactResult, APIClient, API, AssetType } from '@wharfkit/session';
import { WalletPluginAnchor } from '@wharfkit/wallet-plugin-anchor';
import { ConsoleUserInterface } from '../wallet/ConsoleRenderer.js';
import { createSessionStorage } from '../wallet/WalletSessionStorage.js';
import { WalletPluginSecurePrivateKey } from '../wallet/WalletPluginSecurePrivateKey.js';
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

export async function confirmTransaction(txId: string, config: CliConfig): Promise<boolean> {
  try {
    let lowestReadersBlock = Number.MAX_SAFE_INTEGER;

    const txStatus = await fetch(`${config.rpcUrl}/v1/chain/get_transaction_status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: txId,
      }),
    }).then((res) => res.json());

    const blockNumber = txStatus.block_number;
    const { data: health } = await fetch(`${config.aaUrl}/health`).then((res) => res.json());

    if (health?.postgres) {
      for (let i = 0; i < health.postgres.readers.length; i++) {
        const block_num = +health.postgres.readers[i].block_num;
        if (block_num < lowestReadersBlock) {
          lowestReadersBlock = block_num;
        }
      }
    }

    return blockNumber && blockNumber <= lowestReadersBlock;
  } catch (error: unknown) {
    // Ignore error
  }

  return false;
}
