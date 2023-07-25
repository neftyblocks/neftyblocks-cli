import { Api, JsonRpc } from 'eosjs'
const fetch = require('node-fetch')
import { ExplorerApi, RpcApi } from 'atomicassets'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig'
import 'util'
import CliConfig from '../types/cli-config'



const genHexString = (len: number) => {
  const hex = '0123456789ABCDEF'
  let output = ''
  for (let i = 0; i < len; ++i) {
    output += hex.charAt(Math.floor(Math.random() * hex.length))
  }
  return output
}

function makeProposalName(length: number) {
  let result = ''
  const characters = 'abcdefghijklmnopqrstuvwxyz.12345'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

const getNonce = () => ({
  account: 'eosio.null',
  name: 'nonce',
  data: genHexString(16),
  authorization: [],
})

const eosService = {
  getRpc: (rpcUrl:string) => new JsonRpc(rpcUrl, {fetch}),
  getHistoryRpc: (hyperionUrl:string) => new JsonRpc(hyperionUrl, {fetch}),
  getApi: (rpc: any, privateKey: any, cpuPrivateKey: string, proposerPrivateKey: string) => {
    let keys = [privateKey]
    if (cpuPrivateKey.length > 0) {
      keys = [...keys, cpuPrivateKey]
    }
    if (proposerPrivateKey.length > 0) {
      keys = [...keys, proposerPrivateKey]
    }
    const signatureProvider = new JsSignatureProvider(keys)
    return new Api({
      rpc,
      signatureProvider,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
    })
  },
  getApiMultipleKeys: (rpc: any, privateKeys: any, cpuPrivateKey: string) => {
    let keys = privateKeys
    if (cpuPrivateKey.length > 0) {
      keys = [...keys, cpuPrivateKey]
    }
    const signatureProvider = new JsSignatureProvider(keys)
    return new Api({
      rpc,
      signatureProvider,
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
    })
  },
  getExplorerApi: (atomicUrl: string) => new ExplorerApi(atomicUrl, 'atomicassets', {fetch}),
  getAtomicRpc: (rpcUrl: string) => new RpcApi(rpcUrl, 'atomicassets', {fetch, rateLimit: 5}),
  getNonce,

  getTableByScope: async (rpcUrl:string, options: any) => {
    return new JsonRpc(rpcUrl, {fetch}).get_table_by_scope(options)
  },

  getTableRows: async (rpcUrl:string, options: any) => {
    return new JsonRpc(rpcUrl, {fetch}).get_table_rows(options)
  },

  getBalance: async (rpcUrl: string, code: any, account: any, symbol: any) => {
    return new JsonRpc(rpcUrl, {fetch}).get_currency_balance(code, account, symbol)
  },

  createProposal: async (api: any, transaction: any, permissions: any, config: CliConfig) => {
    let {actions} = transaction
    const serializedActions = await api.serializeActions(actions)

    const proposalName = makeProposalName(8)
    const proposerAccount = config.proposerAccount
    const expirationDate = new Date(new Date().getTime() + (4 * 24 * 60 * 60 * 1000))
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
    }
    
    const result = await eosService.transact(api, {
      actions: [{
        account: 'eosio.msig',
        name: 'propose',
        authorization: [{
          actor: proposerAccount,
          permission: config.proposerPermission,
        }],
        data: proposeInput,
      }],
    }, config.cpuAccount, config.cpuPermission, config.cpuPrivateKey)
    return {
      ...result,
      proposerAccount,
      proposalName,
    }
  },

  cancelProposal: async (api: any, name: string, config: CliConfig) => {
    return eosService.transact(api, {
      actions: [{
        account: 'eosio.msig',
        name: 'cancel',
        authorization: [{
          actor: config.proposerAccount,
          permission: config.proposerPermission,
        }],
        data: {
          proposer: config.proposerAccount,
          proposal_name: name,
          canceler: config.proposerAccount,
        },
      }],
    }, config.cpuAccount, config.cpuPermission, config.cpuPrivateKey)
  },

  transact: async (api: any, transaction: any, cpuAccount: string, cpuPermission: string, cpuPrivateKey: string, payCpu = false)  => {
    let {actions} = transaction
    if (payCpu) {
      if (cpuPrivateKey.length <= 0) {
        console.log("WARNING: Can't pay cpu if cpuPrivateKey is not present in local.json")
      } else {
        actions = [
          {
            account: cpuAccount,
            name: 'paycpu',
            authorization: [{
              actor: cpuAccount,
              permission: cpuPermission,
            }],
            data: { },
          },
          ...actions,
        ]
      }
    }

    return api.transact({
      ...transaction,
      actions,
    }, {
      blocksBehind: 3,
      expireSeconds: 120,
      broadcast: true,
    })
  },

  async getAllTableRows(rpcUrl: string, account: any, scope: any, table: any) {
    const totalRows = []
    let next_key
    let rows
    do {
      ({rows, next_key} = await eosService.getTableRows(rpcUrl, {
        code: account,
        table: table,
        scope,
        limit: 1000,
        lower_bound: next_key,
      }))

      totalRows.push(...rows)
    } while (next_key)
    return totalRows
  },
}

export = eosService
