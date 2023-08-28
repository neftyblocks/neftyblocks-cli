import { getAtomicRpc } from './eos-service'
import { getRpc, getApi } from './eos-service'
import RpcSchema from 'atomicassets/build/API/Rpc/Schema'
import CliConfig from '../types/cli-config'

const schemaService = {
  getSchema: async (collection: string, schema: string, config: CliConfig) => {
    const result = await getAtomicRpc(config.rpcUrl).getSchema(collection, schema)
    return result.toObject()
  },

  getCollectionSchemas: async (collection: string, config: CliConfig) => {
    const result:RpcSchema[] = await getAtomicRpc(config.rpcUrl).getCollectionsSchemas(collection)
    return Promise.all(result.map((x: { toObject: () => any }) => x.toObject()))
  },

  createSchema: async (collectionName: string, schemaName: string, schemaFormat: unknown, broadcast = true, config: CliConfig) => {
    const authorization = [{
      actor: config.account,
      permission: config.permission,
    }]

    try {
      return await getApi(getRpc(config.rpcUrl), config.privateKey, config.cpuPrivateKey, config.proposerPrivateKey).transact({
        actions: [{
          account: 'atomicassets',
          name: 'createschema',
          authorization,
          data: {
            authorized_creator: config.account,
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
      console.log('Error creating Schema')
      throw error
    }
  },
}

export = schemaService
