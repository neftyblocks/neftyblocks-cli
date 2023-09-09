import { getAtomicRpc } from './antelope-service';
import { getRpc, getApi } from './antelope-service';
import RpcSchema from 'atomicassets/build/API/Rpc/Schema';
import CliConfig from '../types/cli-config';
import { PushTransactionArgs, ReadOnlyTransactResult } from 'eosjs/dist/eosjs-rpc-interfaces';
import { TransactResult } from 'eosjs/dist/eosjs-api-interfaces';

export async function getCollectionSchemas(collection: string, config: CliConfig): Promise<Record<string, any>[]> {
  const result: RpcSchema[] = await getAtomicRpc(config.rpcUrl).getCollectionsSchemas(collection);
  return Promise.all(result.map((x: { toObject: () => any }) => x.toObject()));
}

export async function getSchema(collection: string, schema: string, config: CliConfig): Promise<Record<string, any>> {
  const result = await getAtomicRpc(config.rpcUrl).getSchema(collection, schema);
  return result.toObject();
}

export async function createSchema(
  collectionName: string,
  schemaName: string,
  schemaFormat: unknown,
  config: CliConfig,
  broadcast = true,
): Promise<TransactResult | ReadOnlyTransactResult | PushTransactionArgs> {
  const authorization = [
    {
      actor: config.account,
      permission: config.permission,
    },
  ];

  try {
    return await getApi(getRpc(config.rpcUrl), config.privateKey).transact(
      {
        actions: [
          {
            account: 'atomicassets',
            name: 'createschema',
            authorization,
            data: {
              authorized_creator: config.account,
              collection_name: collectionName,
              schema_name: schemaName,
              schema_format: schemaFormat, // eslint-disable-line camelcase
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 120,
        broadcast,
      },
    );
  } catch (error) {
    console.log('Error creating Schema');
    throw error;
  }
}
