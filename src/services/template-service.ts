/* eslint-disable camelcase */
import { OrderParam, TemplatesSort } from 'atomicassets/build/API/Explorer/Enums';
import { ITemplate } from 'atomicassets/build/API/Explorer/Objects';
import timeUtils from '../utils/time-utils';
import { getRpc, getApi, getAtomicApi } from './antelope-service';
import CliConfig from '../types/cli-config';
import { TransactResult } from 'eosjs/dist/eosjs-api-interfaces';
import { ReadOnlyTransactResult, PushTransactionArgs } from 'eosjs/dist/eosjs-rpc-interfaces';
import { getBatchesFromArray } from '../utils/array-utils';

export interface TemplateToCreate {
  schema: string;
  maxSupply: number;
  isBurnable: boolean;
  isTransferable: boolean;
  immutableAttributes: unknown;
}

export interface TemplateIdentifier {
  templateId: string | number;
  collectionName: string;
}

export async function getTemplate(collection: string, templateId: string, atomicUrl: string): Promise<ITemplate> {
  return getAtomicApi(atomicUrl).getTemplate(collection, templateId);
}

export async function getTemplates(templateIds: string, collection: string, atomicUrl: string): Promise<ITemplate[]> {
  return getAtomicApi(atomicUrl).getTemplates({
    ids: templateIds,
    collection_name: collection,
  });
}

export async function getTemplatesForCollection(
  collection: string,
  batchSize: number,
  atomicUrl: string,
): Promise<ITemplate[]> {
  let templatesInPage: ITemplate[] = [];
  let allTemplates: ITemplate[] = [];
  let page = 1;
  do {
    templatesInPage = await getAtomicApi(atomicUrl).getTemplates(
      {
        collection_name: collection,
        sort: TemplatesSort.Created,
        order: OrderParam.Asc,
      },
      page,
      batchSize,
    );
    page++;
    allTemplates = [...allTemplates, ...templatesInPage];
  } while (templatesInPage.length >= batchSize);

  return allTemplates;
}

export async function getTemplatesFromSchema(
  collection: string,
  schema: string,
  atomicUrl: string,
  batchSize = 100,
): Promise<ITemplate[]> {
  let templatesInPage: ITemplate[] = [];
  let allTemplates: ITemplate[] = [];
  let page = 1;
  do {
    templatesInPage = await getAtomicApi(atomicUrl).getTemplates(
      {
        collection_name: collection,
        schema_name: schema,
        sort: TemplatesSort.Created,
        order: OrderParam.Asc,
      },
      page,
      batchSize,
    );
    page++;
    allTemplates = [...allTemplates, ...templatesInPage];
  } while (templatesInPage.length >= batchSize);

  return allTemplates;
}

export async function getNewTemplatesForCollectionAndSchema(
  collection: string,
  schema: string,
  batchSize: number,
  atomicUrl: string,
): Promise<ITemplate[]> {
  let templatesInPage: ITemplate[] = [];
  let allTemplates: ITemplate[] = [];
  let page = 1;
  do {
    templatesInPage = await getAtomicApi(atomicUrl).getTemplates(
      {
        collection_name: collection,
        schema_name: schema,
        has_assets: false,
        issued_supply: 0,
        sort: TemplatesSort.Created,
        order: OrderParam.Asc,
      },
      page,
      batchSize,
    );
    page++;
    allTemplates = [...allTemplates, ...templatesInPage];
  } while (templatesInPage.length >= batchSize);

  return allTemplates;
}

export async function getTemplatesMap(templateIds: number[], atomicUrl: string): Promise<Record<string, ITemplate>> {
  if (templateIds.length === 0) {
    return {};
  }

  const batchSize = 100;
  const batches = getBatchesFromArray([...new Set(templateIds)], batchSize);
  let templates: ITemplate[] = [];
  for (let i = 0; i < batches.length; i++) {
    const ids = batches[i];
    const result = await getAtomicApi(atomicUrl).getTemplates(
      {
        ids: ids.join(','),
      },
      1,
      batchSize,
    );
    templates = [...templates, ...result];
    if (i !== batches.length - 1) {
      await timeUtils.sleep(500);
    }
  }

  return templates.reduce((map: Record<string, ITemplate>, obj: ITemplate) => {
    map[obj.template_id] = obj;
    return map;
  }, {});
}

export async function createTemplates(
  collection: string,
  templates: TemplateToCreate[],
  config: CliConfig,
  broadcast = false,
): Promise<TransactResult | ReadOnlyTransactResult | PushTransactionArgs> {
  const actions = templates.map((template: TemplateToCreate) => {
    const { schema, maxSupply, isBurnable, isTransferable, immutableAttributes } = template;
    return {
      account: 'atomicassets',
      name: 'createtempl',
      authorization: [
        {
          actor: config.account,
          permission: config.permission,
        },
      ],
      data: {
        authorized_creator: config.account,
        collection_name: collection,
        schema_name: schema,
        transferable: isTransferable,
        burnable: isBurnable,
        max_supply: maxSupply,
        immutable_data: immutableAttributes,
      },
    };
  });
  try {
    return await getApi(getRpc(config.rpcUrl), config.privateKey).transact(
      {
        actions,
      },
      {
        blocksBehind: 3,
        expireSeconds: 120,
        broadcast,
      },
    );
  } catch (error) {
    console.log('Error while creating templates...');
    throw error;
  }
}

export async function lockManyTemplates(
  locks: TemplateIdentifier[],
  config: CliConfig,
  broadcast = true,
): Promise<TransactResult | ReadOnlyTransactResult | PushTransactionArgs> {
  const authorization = [
    {
      actor: config.account,
      permission: config.permission,
    },
  ];

  const actions = locks.map((lock) => {
    return {
      account: 'atomicassets',
      name: 'locktemplate',
      authorization,
      data: {
        authorized_editor: config.account,
        collection_name: lock.collectionName,
        template_id: lock.templateId,
      },
    };
  });

  return getApi(getRpc(config.rpcUrl), config.privateKey).transact(
    {
      actions,
    },
    {
      blocksBehind: 3,
      expireSeconds: 30,
      broadcast,
    },
  );
}
