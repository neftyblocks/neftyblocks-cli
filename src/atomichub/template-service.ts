/* eslint-disable camelcase */
import { OrderParam, TemplatesSort } from 'atomicassets/build/API/Explorer/Enums'
import arrayUtils from '../utils/array-utils'
import timeUtils from '../utils/time-utils'
const {account, privateKey, permission} = require('../config')
import { getRpc, getApi, getExplorerApi } from './eos-service'

const rpc = getRpc()
const api = getApi(rpc, privateKey)

const atomicApi = getExplorerApi()

const templateService = {
  getTemplate: async (collection: string, templateId: string) => {
    return atomicApi.getTemplate(collection, templateId)
  },

  getTemplates: async (templateIds: any, collection: any) => {
    return atomicApi.getTemplates({
      ids: templateIds,
      collection_name: collection,
    })
  },

  getTemplatesForCollection: async (collection: any, batchSize: number) => {
    let templatesInPage = []
    let allTemplates: any[] = []
    let page = 1
    do {
      templatesInPage = await atomicApi.getTemplates({
        collection_name: collection,
        sort: TemplatesSort.Created,
        order: OrderParam.Asc,
      }, page, batchSize)
      page++
      allTemplates = [...allTemplates, ...templatesInPage]
    } while (templatesInPage.length >= batchSize)

    return allTemplates
  },

  getTemplatesFromSchema: async (collection: any, schema: any, batchSize = 100) => {
    let templatesInPage: any[]  = []
    let allTemplates: any[] = []
    let page = 1
    do {
      templatesInPage = await atomicApi.getTemplates({
        collection_name: collection, schema_name: schema,
        sort: TemplatesSort.Created, order: OrderParam.Asc,
      }, page, batchSize)
      page++
      allTemplates = [...allTemplates, ...templatesInPage]
    } while (templatesInPage.length >= batchSize)

    return allTemplates
  },

  getNewTemplatesForCollectionAndSchema: async (collection: any, schema: any, batchSize: number) => {
    let templatesInPage: any[] = []
    let allTemplates: any[] = []
    let page = 1
    do {
      templatesInPage = await atomicApi.getTemplates({
        collection_name: collection, schema_name: schema, has_assets: false,
        issued_supply: 0, sort: TemplatesSort.Created, order: OrderParam.Asc,
      }, page, batchSize)
      page++
      allTemplates = [...allTemplates, ...templatesInPage]
    } while (templatesInPage.length >= batchSize)

    return allTemplates
  },

  getTemplatesMap: async (templateIds: any[]) => {
    if (templateIds.length === 0) {
      return {}
    }

    const batchSize = 100
    const batches = arrayUtils.getBatchesFromArray([...new Set(templateIds)], batchSize)
    let templates: any[] = []
    // eslint-disable-next-line no-restricted-syntax
    for (let i = 0; i < batches.length; i++) {
      const ids = batches[i]
      // eslint-disable-next-line no-await-in-loop
      const result = await atomicApi.getTemplates({
        ids: ids.join(','),
      }, 1, batchSize)
      templates = [...templates, ...result]
      if (i !== batches.length - 1) {
        // eslint-disable-next-line no-await-in-loop
        await timeUtils.sleep(500)
      }
    }
    return templates.reduce((map, obj) => {
      // eslint-disable-next-line no-param-reassign
      map[obj.template_id] = obj
      return map
    }, {})
  },

  createTemplates: async (collection: any, templates: any, broadcast = false) => {
    const actions = templates.map((template: { schema: any; maxSupply: any; isBurnable: any; isTransferable: any; immutableAttributes: any }) => {
      const {schema, maxSupply, isBurnable, isTransferable, immutableAttributes} = template
      
      return {
        account: 'atomicassets',
        name: 'createtempl',
        authorization: [{
          actor: account,
          permission,
        }],
        data: {
          authorized_creator: account,
          collection_name: collection,
          schema_name: schema,
          transferable: isTransferable,
          burnable: isBurnable,
          max_supply: maxSupply,
          immutable_data: immutableAttributes,
        },
      }
    })
    console.log(JSON.stringify(actions, null, 2))
    try {
      return await api.transact({
        actions,
      }, {
        blocksBehind: 3,
        expireSeconds: 120,
        broadcast,
      })
    } catch (error) {
      throw error
    }
  },

  lockManyTemplates: async (locks: any[], broadcast = true) => {
    const authorization = [{
      actor: account,
      permission,
    }]

    let actions = locks.map(lock => {
      return {
        account: 'atomicassets',
        name: 'locktemplate',
        authorization,
        data: {
          authorized_editor: account,
          collection_name: lock.collection_name,
          template_id: lock.template_id,
        },
      }
    })

    return api.transact({
      actions,
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
      broadcast,
    })
  },
}

export = templateService
