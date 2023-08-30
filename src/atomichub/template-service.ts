/* eslint-disable camelcase */
import {OrderParam, TemplatesSort} from 'atomicassets/build/API/Explorer/Enums'
import {ITemplate} from 'atomicassets/build/API/Explorer/Objects'
import arrayUtils from '../utils/array-utils'
import timeUtils from '../utils/time-utils'
import {getRpc, getApi, getExplorerApi} from './eos-service'
import CliConfig from '../types/cli-config'

const templateService = {

  getTemplate: async (collection: string, templateId: string, atomicUrl: string) => {
    return getExplorerApi(atomicUrl).getTemplate(collection, templateId)
  },

  getTemplates: async (templateIds: string, collection: string, atomicUrl: string) => {
    return getExplorerApi(atomicUrl).getTemplates({
      ids: templateIds,
      collection_name: collection,
    })
  },

  getTemplatesForCollection: async (collection: string, batchSize: number, atomicUrl: string) => {
    let templatesInPage:ITemplate[] = []
    let allTemplates: ITemplate[] = []
    let page = 1
    do {
      templatesInPage = await getExplorerApi(atomicUrl).getTemplates({ // eslint-disable-line no-await-in-loop
        collection_name: collection,
        sort: TemplatesSort.Created,
        order: OrderParam.Asc,
      }, page, batchSize)
      page++
      allTemplates = [...allTemplates, ...templatesInPage]
    } while (templatesInPage.length >= batchSize)

    return allTemplates
  },

  getTemplatesFromSchema: async (collection: string, schema: string, atomicUrl: string, batchSize = 100) => {
    let templatesInPage: ITemplate[]  = []
    let allTemplates: ITemplate[] = []
    let page = 1
    do {
      templatesInPage = await getExplorerApi(atomicUrl).getTemplates({ // eslint-disable-line no-await-in-loop
        collection_name: collection, schema_name: schema,
        sort: TemplatesSort.Created, order: OrderParam.Asc,
      }, page, batchSize)
      page++
      allTemplates = [...allTemplates, ...templatesInPage]
    } while (templatesInPage.length >= batchSize)

    return allTemplates
  },

  getNewTemplatesForCollectionAndSchema: async (collection: string, schema: string, batchSize: number, atomicUrl: string) => {
    let templatesInPage: ITemplate[] = []
    let allTemplates: ITemplate[] = []
    let page = 1
    do {
      templatesInPage = await getExplorerApi(atomicUrl).getTemplates({ // eslint-disable-line no-await-in-loop
        collection_name: collection, schema_name: schema, has_assets: false,
        issued_supply: 0, sort: TemplatesSort.Created, order: OrderParam.Asc,
      }, page, batchSize)
      page++
      allTemplates = [...allTemplates, ...templatesInPage]
    } while (templatesInPage.length >= batchSize)

    return allTemplates
  },

  getTemplatesMap: async (templateIds: number[], atomicUrl: string) => {
    if (templateIds.length === 0) {
      return {}
    }

    const batchSize = 100
    const batches = arrayUtils.getBatchesFromArray([...new Set(templateIds)], batchSize)
    let templates: any[] = []
    for (let i = 0; i < batches.length; i++) {
      const ids = batches[i]
      const result = await getExplorerApi(atomicUrl).getTemplates({ // eslint-disable-line no-await-in-loop
        ids: ids.join(','),
      }, 1, batchSize)
      templates = [...templates, ...result]
      if (i !== batches.length - 1) {
        await timeUtils.sleep(500) // eslint-disable-line no-await-in-loop
      }
    }

    return templates.reduce((map, obj) => { // eslint-disable-line unicorn/no-array-reduce, unicorn/prefer-object-from-entries
      map[obj.template_id] = obj
      return map
    }, {})
  },

  createTemplates: async (collection: string, templates: any, config: CliConfig, broadcast = false) => {
    const actions = templates.map((template: { schema: string; maxSupply: number; isBurnable: boolean; isTransferable: boolean; immutableAttributes: unknown }) => {
      const {schema, maxSupply, isBurnable, isTransferable, immutableAttributes} = template
      return {
        account: 'atomicassets',
        name: 'createtempl',
        authorization: [{
          actor: config.account,
          permission: config.permission,
        }],
        data: {
          authorized_creator: config.account,
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
      return await getApi(getRpc(config.rpcUrl), config.privateKey, config.cpuPrivateKey, config.proposerPrivateKey).transact({
        actions,
      }, {
        blocksBehind: 3,
        expireSeconds: 120,
        broadcast,
      })
    } catch (error) {
      console.log('Error while creating templates...')
      throw error
    }
  },

  lockManyTemplates: async (locks: any[], config: CliConfig, broadcast = true) => {
    const authorization = [{
      actor: config.account,
      permission: config.permission,
    }]

    const actions = locks.map(lock => {
      return {
        account: 'atomicassets',
        name: 'locktemplate',
        authorization,
        data: {
          authorized_editor: config.account,
          collection_name: lock.collection_name,
          template_id: lock.template_id,
        },
      }
    })

    return getApi(getRpc(config.rpcUrl), config.privateKey, config.cpuPrivateKey, config.proposerPrivateKey).transact({
      actions,
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
      broadcast,
    })
  },
}

export = templateService
