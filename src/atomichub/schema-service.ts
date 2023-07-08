import { getAtomicRpc } from './eos-service'
const { account, privateKey, permission } = require('../config')
import { getRpc, getApi } from './eos-service'

const rpc = getRpc()
const api = getApi(rpc, privateKey)

const atomicRpc = getAtomicRpc()

const schemaService = {
  getSchema: async (collection: any, schema: any) => {
    const result = await atomicRpc.getSchema(collection, schema)
    return result.toObject()
  },

  getCollectionSchemas: async (collection: any) => {
    const result = await atomicRpc.getCollectionsSchemas(collection)
    return Promise.all(result.map((x: { toObject: () => any }) => x.toObject()))
  },

  createSchema: async (collectionName: any, schemaName: any, schemaFormat: any, broadcast = true) => {
    const authorization = [{
      actor: account,
      permission,
    }]

    try {
      return await api.transact({
        actions: [{
          account: 'atomicassets',
          name: 'createschema',
          authorization,
          data: {
            authorized_creator: account,
            collection_name: collectionName,
            schema_name: schemaName,
            schema_format: schemaFormat,
          },
        }],
      }, {
        blocksBehind: 3,
        expireSeconds: 120,
        broadcast,
      })
    } catch (error) {
      throw error
    }
  },
}

export = schemaService
