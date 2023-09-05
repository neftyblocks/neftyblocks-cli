import {getAtomicRpc} from './eos-service'
import {getRpc, getApi} from './eos-service'
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

  createSchema: async (collectionName: string, schemaName: string, schemaFormat: unknown, config: CliConfig, broadcast = true) => {
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
            authorized_creator: config.account, // eslint-disable-line camelcase
            collection_name: collectionName, // eslint-disable-line camelcase
            schema_name: schemaName, // eslint-disable-line camelcase
            schema_format: schemaFormat, // eslint-disable-line camelcase
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
