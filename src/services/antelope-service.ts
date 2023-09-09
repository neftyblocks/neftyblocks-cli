import { Api, JsonRpc } from 'eosjs';
import fetch from 'node-fetch';
import { ExplorerApi, RpcApi } from 'atomicassets';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import { Action, Authorization } from 'eosjs/dist/eosjs-serialize';
import CliConfig from '../types/cli-config';
import {
  GetTableByScopeResult,
  GetTableRowsResult,
  PushTransactionArgs,
  ReadOnlyTransactResult,
} from 'eosjs/dist/eosjs-rpc-interfaces';
import { TransactResult } from 'eosjs/dist/eosjs-api-interfaces';

export interface CreateProposalResult {
  result: TransactResult | ReadOnlyTransactResult | PushTransactionArgs;
  proposerAccount: string;
  proposalName: string;
}

export interface Nonce {
  account: string;
  name: string;
  data: string;
  authorization: string[];
}

export function getNonce(): Nonce {
  return {
    account: 'eosio.null',
    name: 'nonce',
    data: genHexString(16),
    authorization: [],
  };
}

export function getRpc(rpcUrl: string): JsonRpc {
  return new JsonRpc(rpcUrl, { fetch });
}

export function getHistoryRpc(hyperionUrl: string): JsonRpc {
  return new JsonRpc(hyperionUrl, { fetch });
}

export function getApi(rpc: JsonRpc, privateKey: string): Api {
  const signatureProvider = new JsSignatureProvider([privateKey]);

  return new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });
}

export function getAtomicApi(atomicUrl: string): ExplorerApi {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return new ExplorerApi(atomicUrl, 'atomicassets', { fetch });
}

export function getAtomicRpc(rpcUrl: string): RpcApi {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return new RpcApi(rpcUrl, 'atomicassets', { fetch, rateLimit: 5 });
}

export async function getTableByScope(rpcUrl: string, options: unknown): Promise<GetTableByScopeResult> {
  return new JsonRpc(rpcUrl, { fetch }).get_table_by_scope(options);
}

export async function getTableRows(rpcUrl: string, options: unknown): Promise<GetTableRowsResult> {
  return new JsonRpc(rpcUrl, { fetch }).get_table_rows(options);
}

export async function getBalance(rpcUrl: string, code: string, account: string, symbol?: string): Promise<string[]> {
  return new JsonRpc(rpcUrl, { fetch }).get_currency_balance(code, account, symbol);
}

export async function createProposal(
  api: Api,
  transaction: Action[],
  permissions: unknown,
  config: CliConfig,
): Promise<CreateProposalResult> {
  const serializedActions = await api.serializeActions(transaction);
  const proposalName = makeProposalName(8);
  const proposerAccount = config.account;
  const expirationDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  const proposeInput = {
    proposer: proposerAccount,
    proposal_name: proposalName,
    requested: permissions,
    trx: {
      expiration: expirationDate.toISOString().split('.')[0],
      ref_block_num: 0,
      ref_block_prefix: 0,
      max_net_usage_words: 0,
      max_cpu_usage_ms: 0,
      delay_sec: 0,
      context_free_actions: [],
      actions: serializedActions,
      transaction_extensions: [],
    },
  };
  const result = await transact(api, [
    {
      account: 'eosio.msig',
      name: 'propose',
      authorization: [
        {
          actor: proposerAccount,
          permission: config.permission,
        },
      ] as Authorization[],
      data: proposeInput,
    },
  ]);
  return {
    result,
    proposerAccount,
    proposalName,
  };
}

export async function cancelProposal(
  api: Api,
  name: string,
  config: CliConfig,
): Promise<TransactResult | ReadOnlyTransactResult | PushTransactionArgs> {
  return transact(api, [
    {
      account: 'eosio.msig',
      name: 'cancel',
      authorization: [
        {
          actor: config.account,
          permission: config.permission,
        },
      ],
      data: {
        proposer: config.account,
        proposal_name: name,
        canceler: config.account,
      },
    },
  ]);
}

export async function transact(
  api: Api,
  transaction: Action[],
): Promise<TransactResult | ReadOnlyTransactResult | PushTransactionArgs> {
  return api.transact(
    {
      actions: transaction,
    },
    {
      blocksBehind: 3,
      expireSeconds: 120,
      broadcast: true,
    },
  );
}

export async function getAllTableRows(
  rpcUrl: string,
  account: string,
  scope: unknown,
  table: string,
): Promise<GetTableRowsResult['rows']> {
  const totalRows = [];
  let next_key;
  let rows;
  do {
    ({ rows, next_key } = await getTableRows(rpcUrl, {
      code: account,
      table: table,
      scope,
      limit: 1000,
      lower_bound: next_key,
    }));

    totalRows.push(...rows);
  } while (next_key);

  return totalRows;
}

const genHexString = (len: number) => {
  const hex = '0123456789ABCDEF';
  let output = '';
  for (let i = 0; i < len; ++i) {
    output += hex.charAt(Math.floor(Math.random() * hex.length));
  }

  return output;
};

function makeProposalName(length: number) {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz.12345';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}
