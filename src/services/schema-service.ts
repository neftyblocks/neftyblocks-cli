import { getAtomicRpc, transact } from './antelope-service.js';
import { AssetSchema, CliConfig, SettingsConfig } from '../types/index.js';
import { TransactResult } from '@wharfkit/session';
import { ux } from '@oclif/core';

export async function getCollectionSchemas(collection: string, config: SettingsConfig): Promise<AssetSchema[]> {
  const result = await getAtomicRpc(config.rpcUrl).getCollectionsSchemas(collection);
  return Promise.all(
    result.map(async (s) => ({
      name: s.name,
      collectionName: collection,
      format: await s.rawFormat(),
    })),
  );
}

export async function getSchema(collection: string, schema: string, config: SettingsConfig): Promise<AssetSchema> {
  const result = await getAtomicRpc(config.rpcUrl).getSchema(collection, schema);
  return {
    name: result.name,
    collectionName: collection,
    format: await result.rawFormat(),
  };
}

export async function createSchema(
  collectionName: string,
  schemaName: string,
  schemaFormat: unknown,
  config: CliConfig,
): Promise<TransactResult> {
  const session = config.session;
  const authorization = [
    {
      actor: session.actor,
      permission: session.permission,
    },
  ];

  try {
    return transact(
      [
        {
          account: 'atomicassets',
          name: 'createschema',
          authorization,
          data: {
            authorized_creator: session.actor,
            collection_name: collectionName,
            schema_name: schemaName,
            schema_format: schemaFormat, // eslint-disable-line camelcase
          },
        },
      ],
      config,
    );
  } catch (error) {
    ux.error('Error creating Schema');
    throw error;
  }
}
