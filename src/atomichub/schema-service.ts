import { getAtomicRpc } from './eos-service'
import { getRpc, getApi } from './eos-service'
import CliConfig from '../types/cli-config'

// const rpc = getRpc()
// const atomicRpc = getAtomicRpc()

const schemaService = {
  getSchema: async (collection: any, schema: any, contents: CliConfig) => {
    const result = await getAtomicRpc(contents.rpcUrl).getSchema(collection, schema)
    return result.toObject()
  },

  getCollectionSchemas: async (collection: any, contents: CliConfig) => {
    const result = await getAtomicRpc(contents.rpcUrl).getCollectionsSchemas(collection)
    return Promise.all(result.map((x: { toObject: () => any }) => x.toObject()))
  },

  createSchema: async (collectionName: any, schemaName: any, schemaFormat: any, broadcast = true, contents: CliConfig) => {
    const authorization = [{
      actor: contents.account,
      permission: contents.permission,
    }]

    try {
      return await getApi(getRpc(contents.rpcUrl), contents.privateKey).transact({
        actions: [{
          account: 'atomicassets',
          name: 'createschema',
          authorization,
          data: {
            authorized_creator: contents.account,
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
