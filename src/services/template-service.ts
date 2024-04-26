/* eslint-disable camelcase */
import { OrderParam, TemplatesSort } from 'atomicassets/build/API/Explorer/Enums.js';
import { ITemplate } from 'atomicassets/build/API/Explorer/Objects.js';
import timeUtils from '../utils/time-utils.js';
import { getAtomicApi, transact } from './antelope-service.js';
import { getBatchesFromArray } from '../utils/array-utils.js';
import { CliConfig, SettingsConfig, TemplateIdentifier, TemplateToCreate } from '../types/index.js';
import { TransactResult } from '@wharfkit/session';
import { ux } from '@oclif/core';

export async function getTemplate(collection: string, templateId: string, config: SettingsConfig): Promise<ITemplate> {
  return getAtomicApi(config.aaUrl).getTemplate(collection, templateId);
}

export async function getTemplates(
  templateIds: string,
  collection: string,
  config: SettingsConfig,
): Promise<ITemplate[]> {
  return getAtomicApi(config.aaUrl).getTemplates({
    ids: templateIds,
    collection_name: collection,
  });
}

export async function getTemplatesForCollection(collection: string, config: SettingsConfig): Promise<ITemplate[]> {
  let templatesInPage: ITemplate[] = [];
  let allTemplates: ITemplate[] = [];
  let page = 1;
  const batchSize = 100;
  do {
    templatesInPage = await getAtomicApi(config.aaUrl).getTemplates(
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
  config: SettingsConfig,
): Promise<ITemplate[]> {
  let templatesInPage: ITemplate[] = [];
  let allTemplates: ITemplate[] = [];
  let page = 1;
  const batchSize = 100;
  do {
    templatesInPage = await getAtomicApi(config.aaUrl).getTemplates(
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
  config: SettingsConfig,
): Promise<ITemplate[]> {
  let templatesInPage: ITemplate[] = [];
  let allTemplates: ITemplate[] = [];
  let page = 1;
  do {
    templatesInPage = await getAtomicApi(config.aaUrl).getTemplates(
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

export async function getTemplatesMap(
  templateIds: number[],
  config: SettingsConfig,
): Promise<Record<string, ITemplate>> {
  if (templateIds.length === 0) {
    return {};
  }

  const batchSize = 100;
  const batches = getBatchesFromArray([...new Set(templateIds)], batchSize);
  let templates: ITemplate[] = [];
  for (let i = 0; i < batches.length; i++) {
    const ids = batches[i];
    const result = await getAtomicApi(config.aaUrl).getTemplates(
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
): Promise<TransactResult> {
  const session = config.session;
  const authorization = [
    {
      actor: session.actor,
      permission: session.permission,
    },
  ];
  const actions = templates.map((template: TemplateToCreate) => {
    const { schema, maxSupply, isBurnable, isTransferable, immutableAttributes } = template;
    return {
      account: 'atomicassets',
      name: 'createtempl',
      authorization,
      data: {
        authorized_creator: session.actor,
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
    return await transact(actions, config);
  } catch (error) {
    ux.error('Error while creating templates...');
    throw error;
  }
}

export async function lockManyTemplates(locks: TemplateIdentifier[], config: CliConfig): Promise<TransactResult> {
  const session = config.session;
  const authorization = [
    {
      actor: session.actor,
      permission: session.permission,
    },
  ];

  const actions = locks.map((lock) => {
    return {
      account: 'atomicassets',
      name: 'locktemplate',
      authorization,
      data: {
        authorized_editor: session.actor,
        collection_name: lock.collectionName,
        template_id: lock.templateId,
      },
    };
  });

  return await transact(actions, config);
}
