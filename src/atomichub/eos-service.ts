import { Api, JsonRpc } from 'eosjs'
const fetch = require('node-fetch')
import { ExplorerApi, RpcApi } from 'atomicassets'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig'
import 'util'
const { eosUrl, atomicUrl, cpuAccount, cpuPrivateKey, cpuPermission, proposerAccount, proposerPermission, proposerPrivateKey, hyperionUrl } = require('../config')

const rpc = new JsonRpc(eosUrl, {fetch})
const historyRpc = new JsonRpc(hyperionUrl, {fetch})
const explorerApi =  new ExplorerApi(atomicUrl, 'atomicassets', {fetch})
const atomicRpcApi = new RpcApi(eosUrl, 'atomicassets', {fetch, rateLimit: 5})

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
  getRpc: () => rpc,
  getHistoryRpc: () => historyRpc,
  getApi: (rpc: any, privateKey: any) => {
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
  getApiMultipleKeys: (rpc: any, privateKeys: any) => {
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
  getExplorerApi: () => explorerApi,
  getAtomicRpc: () => atomicRpcApi,
  getNonce,

  getTableByScope: async (options: any) => {
    return rpc.get_table_by_scope(options)
  },

  getTableRows: async (options: any) => {
    return rpc.get_table_rows(options)
  },

  getBalance: async (code: any, account: any, symbol: any) => {
    return rpc.get_currency_balance(code, account, symbol)
  },

  createProposal: async (api: any, transaction: any, permissions: any) => {
    let {actions} = transaction
    const serializedActions = await api.serializeActions(actions)

    const proposalName = makeProposalName(8)
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
          permission: proposerPermission,
        }],
        data: proposeInput,
      }],
    })
    return {
      ...result,
      proposerAccount,
      proposalName,
    }
  },

  cancelProposal: async (api: any, name: any) => {
    return eosService.transact(api, {
      actions: [{
        account: 'eosio.msig',
        name: 'cancel',
        authorization: [{
          actor: proposerAccount,
          permission: proposerPermission,
        }],
        data: {
          proposer: proposerAccount,
          proposal_name: name,
          canceler: proposerAccount,
        },
      }],
    })
  },

  transact: async (api: any, transaction: any, payCpu = false)  => {
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

  async getAllTableRows(account: any, scope: any, table: any) {
    const totalRows = []
    let next_key
    let rows
    do {
      ({rows, next_key} = await eosService.getTableRows({
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
