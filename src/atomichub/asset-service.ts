/* eslint-disable camelcase */
import {getExplorerApi} from './eos-service'
import timeUtils from '../utils/time-utils'
import arrayUtils from '../utils/array-utils'
import eosService from './eos-service'
import {AssetsSort, OrderParam} from 'atomicassets/build/API/Explorer/Enums'
import {AssetsApiParams} from 'atomicassets/build/API/Explorer/Params'
import {IAsset} from 'atomicassets/build/API/Explorer/Objects'
import {Action} from 'eosjs/dist/eosjs-serialize'
import CliConfig from '../types/cli-config'

const assetsService = {
  getAccountTemplates: async (account: string, options: any, atomicUrl: string) => {
    const accountDetails = await getExplorerApi(atomicUrl).getAccount(account, options)
    let accountTemplates = accountDetails.templates
    accountTemplates
    .filter(template => template.template_id)
    .sort((a, b) => {
      return parseInt(a.assets) - parseInt(b.assets)
    })
    return accountTemplates
  },

  getAssetsByCollectionAndOwner: async (owner: string, collection: string, pageSize: number, atomicUrl: string) => {
    const atomicApi = getExplorerApi(atomicUrl)
    const collectionDetails = await atomicApi.getCollection(collection)
    if (collectionDetails === null) {
      throw `Collection: ${collection} does not exists`
    }

    let assetsInPage: IAsset[] = []
    let allAssets: IAsset[] = []
    let page = 1
    do {
      assetsInPage = await atomicApi.getAssets({
        collection_name: collection,
        owner: owner,
        sort: AssetsSort.Updated,
        order: OrderParam.Asc,
      }, page, pageSize)
      page++
      allAssets = [...allAssets, ...assetsInPage]
    } while (assetsInPage.length >= pageSize)

    return allAssets
  },

  getAccounts: async (options: any, atomicUrl: string,  page = 0, limit = 1000) => {
    return getExplorerApi(atomicUrl).getAccounts(options, page, limit)
  },

  getAssetsBySchema: async (collection: string, schema: string, atomicUrl: string, batchSize = 400) => {
    let assetsInPage: IAsset[] = []
    let allAssets: IAsset[] = []
    let page = 1
    do {
      assetsInPage = await getExplorerApi(atomicUrl).getAssets({
        collection_name: collection, schema_name: schema,
        sort: AssetsSort.Updated, order: OrderParam.Asc,
      }, page, batchSize)
      page++
      allAssets = [...allAssets, ...assetsInPage]
    } while (assetsInPage.length >= batchSize)

    return allAssets
  },

  batchedGetAssets: async (options: AssetsApiParams, atomicUrl: string, batchSize = 400) => {
    let assetsInPage: IAsset[] = []
    let allAssets: IAsset[] = []
    let page = 1
    do {
      assetsInPage = await getExplorerApi(atomicUrl).getAssets(options, page, batchSize)
      page++
      allAssets = [...allAssets, ...assetsInPage]
    } while (assetsInPage.length >= batchSize)

    return allAssets
  },

  getAccountsBySchema: async (collection: string, schema: string, atomicUrl: string) => {
    let accounts:Array<{
        account: string;
        assets: string;
    }> = []
    let hasMore = true
    let page = 1
    while (hasMore) {
      // eslint-disable-next-line no-await-in-loop
      const result = await assetsService.getAccounts({
        collection_name: collection,
        schema_name: schema,
      }, atomicUrl, page)
      if (result.length > 0) {
        accounts = [
          ...accounts,
          ...result,
        ]
        page += 1
        hasMore = true
      } else {
        hasMore = false
      }
    }
    return accounts
  },

  getAssetsMap: async (assetIds: string[], atomicUrl: string) => {
    if (assetIds.length === 0) {
      return {}
    }
    const batchSize = 500
    const batches = arrayUtils.getBatchesFromArray([...new Set(assetIds)], batchSize)
    let assets: IAsset[] = []
    // eslint-disable-next-line no-restricted-syntax
    for (let i = 0; i < batches.length; i++) {
      const ids = batches[i]
      // eslint-disable-next-line no-await-in-loop
      const result = await getExplorerApi(atomicUrl).getAssets({
        ids: ids.join(','),
      }, 1, batchSize)
      assets = [...assets, ...result]
      if (i !== batches.length - 1) {
        // eslint-disable-next-line no-await-in-loop
        await timeUtils.sleep(500)
      }
    }
    return assets.reduce((map: any, obj: IAsset) => {
      // eslint-disable-next-line no-param-reassign
      map[obj.asset_id] = obj
      return map
    }, {})
  },

  // @TODO: write less generic functions like: mintAssetsWithAttributes and
  // mintAssetsWithoutAttributes instead of expecting the caller of this funtion
  // to pass a valid and complete actionData, let them pass a "abstraction"
  // that only has, for example: amount, templateId and immutable attributes
  mintAssets: async (actionDataArray: any, config:CliConfig, broadcast = true) => {
    const rpc = eosService.getRpc(config.rpcUrl)
    const authorization = [{
      actor: config.account,
      permission: config.permission,
    }]
    let actions: Action[] = actionDataArray.map((actionData: any) => {
      return {
        account: 'atomicassets',
        name: 'mintasset',
        authorization,
        data: actionData,
      }
    })
    let neftyActions = [{
        account: 'neftyblocksa',
        name: 'validate',
        authorization,
        data: {
          nonce: Math.floor(Math.random() * 1000000000),
        },
      },
      ...actions,
    ]
    return eosService.transact(eosService.getApi(rpc, config.privateKey, config.cpuPrivateKey, config.proposerPrivateKey), neftyActions, '', '', '', true)
  },

  setAssetsData: async (actionSetAssetDataArray: any, config:CliConfig, broadcast = true) => {
    const authorization = [{
      actor: config.account,
      permission: config.permission,
    }]
    let actions = actionSetAssetDataArray.map((actionSetAssetData: any) => {
      return {
        account: 'atomicassets',
        name: 'setassetdata',
        authorization,
        data: actionSetAssetData,
      }
    })
    const rpc = eosService.getRpc(config.rpcUrl)
    const api = eosService.getApi(rpc, config.privateKey, config.cpuPrivateKey, config.proposerPrivateKey)
    return api.transact({
      actions,
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
      broadcast,
    })
  },

  burnAssets: async (assets: any, config: CliConfig, broadcast = true) => {
    const rpc = eosService.getRpc(config.rpcUrl)
    const api = eosService.getApi(rpc, config.privateKey, config.cpuPrivateKey, config.proposerPrivateKey)
    const authorization = [{
      actor: config.account,
      permission: config.permission,
    }]

    const actions = assets.map((asset: any) => {
      return {
        account: 'atomicassets',
        name: 'burnasset',
        authorization,
        data: {
          asset_owner: config.account,
          asset_id: asset.asset_id,
        },
      }
    })
    return api.transact({
      actions,
    }, {
      blocksBehind: 3,
      expireSeconds: 120,
      broadcast,
    })
  },

  getAssetsByTemplate: async (templateId: number, account: string, amount: number, atomicUrl: string, batchSize = 100) => {
    let fetchAssets = true
    let page = 1
    let assets: IAsset[] = []
    let left = amount
    while (fetchAssets && left > 0) {
      const limit = Math.min(left, batchSize)
      // eslint-disable-next-line no-await-in-loop
      const results = await getExplorerApi(atomicUrl).getAssets({
        owner: account,
        sort: AssetsSort.AssetId,
        order: OrderParam.Asc,
        template_id: templateId,
      }, page, batchSize)
      fetchAssets = results.length > 0
      page += 1
      left -= batchSize
      assets = [
        ...assets,
        ...results.slice(0, limit),
      ]

      // avoid getting rate limited
      timeUtils.sleep(500)
    }
    return assets
  },

  // @TODO: document params. it is weird how we have 2 different batch sizes
  getOwnedAssetsByTemplateIds: async (templateIds: any[], account: string, atomicUrl: string, templateIdsBatchSize = 100, assetsBatchSize = 400) => {
    let templateIdsBatches = arrayUtils.getBatchesFromArray(templateIds, templateIdsBatchSize)

    let allAssets: any[] = []
    for (let templateIdsBatch of templateIdsBatches) {
      let templateIdsString = ''
      for (let templateId of templateIdsBatch) {
        templateIdsString += templateId.toString() +  ','
      }
      if (templateIdsBatch.length > 0)
        // remove trailling comman or the api throws internal server error >:(
        templateIdsString = templateIdsString.slice(0, -1)

      let assetsInPage = []
      let page = 1
      do {
        assetsInPage = await getExplorerApi(atomicUrl).getAssets(
          {
            owner: account,
            sort: AssetsSort.AssetId,
            order: OrderParam.Asc,
            template_whitelist: templateIdsString,
          },
          page,
          assetsBatchSize
        )
        page++
        allAssets = [...allAssets, ...assetsInPage]
      } while (assetsInPage.length >= assetsBatchSize)
    }

    return allAssets
  },

  getUnburnedAssetsByTemplate: async (templateId: number, amount: number, atomicUrl: string, batchSize = 100) => {
    let fetchAssets = true
    let page = 1
    let assets: any[] = []
    let left = amount
    while (fetchAssets && left > 0) {
      // eslint-disable-next-line no-await-in-loop
      const results = await getExplorerApi(atomicUrl).getAssets({
        burned: false,
        sort: AssetsSort.AssetId,
        order: OrderParam.Asc,
        template_id: templateId,
      }, page, batchSize)
      fetchAssets = results.length > 0
      page += 1
      left -= results.length
      assets = [
        ...assets,
        ...results,
      ]
      // avoid getting rate limited
      timeUtils.sleep(500)
    }
    return assets
  },
}

export = assetsService
