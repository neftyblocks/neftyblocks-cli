import { getAtomicRpc } from './antelope-service';
import { getRpc, getApi } from './antelope-service';
import RpcSchema from 'atomicassets/build/API/Rpc/Schema';
import { PushTransactionArgs, ReadOnlyTransactResult } from 'eosjs/dist/eosjs-rpc-interfaces';
import { TransactResult } from 'eosjs/dist/eosjs-api-interfaces';
import { CliConfig, SettingsConfig } from '../types/cli-config';
import { SchemaObject } from 'atomicassets/build/Schema';

export interface AssetSchema {
  name: string;
  format: SchemaObject[];
}

export async function getCollectionSchemas(collection: string, config: SettingsConfig): Promise<AssetSchema[]> {
  const result: RpcSchema[] = await getAtomicRpc(config.rpcUrl).getCollectionsSchemas(collection);
  return Promise.all(
    result.map(async (s: RpcSchema) => ({
      name: s.name,
      format: await s.rawFormat(),
    })),
  );
}

export async function getSchema(collection: string, schema: string, config: SettingsConfig): Promise<AssetSchema> {
  const result = await getAtomicRpc(config.rpcUrl).getSchema(collection, schema);
  return {
    name: result.name,
    format: await result.rawFormat(),
  };
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
