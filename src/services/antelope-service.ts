import fetch from 'node-fetch';
import { ExplorerApi, RpcApi } from 'atomicassets';
import { CliConfig } from '../types/cli-config';
import { APIClient, API, AssetType } from '@wharfkit/antelope';
import { Session, SessionKit, TransactArgs, TransactResult } from '@wharfkit/session';
import { WalletPluginAnchor } from '@wharfkit/wallet-plugin-anchor';
import { ConsoleUserInterface } from '../base/ConsoleRenderer';

let apiClient: APIClient;
let session: Session;
const walletData: Record<string, string> = {};

export function getApiClient(rpcUrl: string): APIClient {
  if (!apiClient) {
    apiClient = new APIClient({
      url: rpcUrl,
    });
  }
  return apiClient;
}

export async function getSession(config: CliConfig): Promise<Session> {
  if (!session) {
    const sessionKit = new SessionKit(
      {
        appName: 'nefty-cli',
        chains: [
          {
            id: config.chainId,
            url: config.rpcUrl,
          },
        ],
        walletPlugins: [new WalletPluginAnchor()],
        ui: new ConsoleUserInterface(),
      },
      {
        fetch,
        storage: {
          write(key: string, data: string): Promise<void> {
            walletData[key] = data;

            return Promise.resolve();
          },
          read(key: string): Promise<string | null> {
            if (walletData[key]) {
              return Promise.resolve(walletData[key]);
            } else {
              return Promise.resolve(null);
            }
          },
          remove(key: string): Promise<void> {
            delete walletData[key];

            return Promise.resolve();
          },
        },
      },
    );

    const chain = sessionKit.getChainDefinition(config.chainId);
    const loginResponse = await sessionKit.login({
      chain: chain.id,
    });
    session = loginResponse.session;
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
  const session = await getSession(config);
  try {
    return await session.transact(
      {
        actions,
      },
      {
        expireSeconds: 120,
        broadcast: true,
      },
    );
  } catch (e) {
    console.log(e);
    throw e;
  }
}
