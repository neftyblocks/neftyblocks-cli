import { getAtomicApi, transact } from './antelope-service';
import timeUtils from '../utils/time-utils';
import { AssetsSort, OrderParam } from 'atomicassets/build/API/Explorer/Enums';
import {
  AccountApiParams,
  AssetsApiParams,
  GreylistParams,
  HideOffersParams,
} from 'atomicassets/build/API/Explorer/Params';
import { IAccountStats, IAsset } from 'atomicassets/build/API/Explorer/Objects';
import { getBatchesFromArray } from '../utils/array-utils';
import { CliConfig, SettingsConfig } from '../types/cli-config';
import { TransactResult, AnyAction } from '@wharfkit/session';

export interface MintData {
  authorized_minter: string;
  collection_name: string;
  schema_name: string;
  template_id: string;
  new_asset_owner: string;
  immutable_data: any[];
  mutable_data: any[];
  tokens_to_back: any[];
}

export async function getAccountTemplates(
  account: string,
  options: GreylistParams & HideOffersParams,
  config: SettingsConfig,
): Promise<IAccountStats['templates']> {
  const accountDetails = await getAtomicApi(config.aaUrl).getAccount(account, options);
  const accountTemplates = accountDetails.templates;
  accountTemplates
    .filter((template) => template.template_id)
    .sort((a, b) => {
      return parseInt(a.assets) - parseInt(b.assets);
    });
  return accountTemplates;
}

export async function getAssetsByCollectionAndOwner(
  owner: string,
  collection: string,
  pageSize: number,
  config: SettingsConfig,
): Promise<IAsset[]> {
  const atomicApi = getAtomicApi(config.aaUrl);
  const collectionDetails = await atomicApi.getCollection(collection);
  if (collectionDetails === null) {
    throw `Collection: ${collection} does not exists`;
  }

  let assetsInPage: IAsset[] = [];
  let allAssets: IAsset[] = [];
  let page = 1;
  do {
    assetsInPage = await atomicApi.getAssets(
      {
        collection_name: collection,
        owner: owner,
        sort: AssetsSort.Updated,
        order: OrderParam.Asc,
      },
      page,
      pageSize,
    );
    page++;
    allAssets = [...allAssets, ...assetsInPage];
  } while (assetsInPage.length >= pageSize);

  return allAssets;
}

export async function getAccounts(
  options: AccountApiParams,
  config: SettingsConfig,
  page = 0,
  limit = 1000,
): Promise<
  Array<{
    account: string;
    assets: string;
  }>
> {
  return getAtomicApi(config.aaUrl).getAccounts(options, page, limit);
}

export async function getAssetsBySchema(
  collection: string,
  schema: string,
  config: SettingsConfig,
  batchSize = 400,
): Promise<IAsset[]> {
  let assetsInPage: IAsset[] = [];
  let allAssets: IAsset[] = [];
  let page = 1;
  do {
    assetsInPage = await getAtomicApi(config.aaUrl).getAssets(
      {
        collection_name: collection,
        schema_name: schema,
        sort: AssetsSort.Updated,
        order: OrderParam.Asc,
      },
      page,
      batchSize,
    );
    page++;
    allAssets = [...allAssets, ...assetsInPage];
  } while (assetsInPage.length >= batchSize);

  return allAssets;
}

export async function batchedGetAssets(
  options: AssetsApiParams,
  config: SettingsConfig,
  batchSize = 400,
): Promise<IAsset[]> {
  let assetsInPage: IAsset[] = [];
  let allAssets: IAsset[] = [];
  let page = 1;
  do {
    assetsInPage = await getAtomicApi(config.aaUrl).getAssets(options, page, batchSize);
    page++;
    allAssets = [...allAssets, ...assetsInPage];
  } while (assetsInPage.length >= batchSize);

  return allAssets;
}

export async function getAccountsBySchema(
  collection: string,
  schema: string,
  config: SettingsConfig,
): Promise<
  Array<{
    account: string;
    assets: string;
  }>
> {
  let accounts: Array<{
    account: string;
    assets: string;
  }> = [];
  let hasMore = true;
  let page = 1;
  while (hasMore) {
    const result = await getAccounts(
      {
        collection_name: collection,
        schema_name: schema,
      },
      config,
      page,
    );
    if (result.length > 0) {
      accounts = [...accounts, ...result];
      page += 1;
      hasMore = true;
    } else {
      hasMore = false;
    }
  }
  return accounts;
}

export async function getAssetsMap(assetIds: string[], config: SettingsConfig): Promise<Record<string, IAsset>> {
  if (assetIds.length === 0) {
    return {};
  }
  const batchSize = 500;
  const batches = getBatchesFromArray([...new Set(assetIds)], batchSize);
  let assets: IAsset[] = [];
  for (let i = 0; i < batches.length; i++) {
    const ids = batches[i];
    const result = await getAtomicApi(config.aaUrl).getAssets(
      {
        ids: ids.join(','),
      },
      1,
      batchSize,
    );
    assets = [...assets, ...result];
    if (i !== batches.length - 1) {
      await timeUtils.sleep(500);
    }
  }
  return assets.reduce((map: Record<string, IAsset>, obj: IAsset) => {
    map[obj.asset_id] = obj;
    return map;
  }, {});
}

// @TODO: write less generic functions like: mintAssetsWithAttributes and
// mintAssetsWithoutAttributes instead of expecting the caller of this funtion
// to pass a valid and complete actionData, let them pass a "abstraction"
// that only has, for example: amount, templateId and immutable attributes
export async function mintAssets(mints: MintData[], config: CliConfig): Promise<TransactResult> {
  const authorization = [
    {
      actor: config.account,
      permission: config.permission,
    },
  ];
  const actions: AnyAction[] = mints.map((actionData) => {
    return {
      account: 'atomicassets',
      name: 'mintasset',
      authorization,
      data: actionData,
    };
  });
  const neftyActions = [
    {
      account: 'neftyblocksa',
      name: 'validate',
      authorization,
      data: {
        nonce: Math.floor(Math.random() * 1000000000),
      },
    },
    ...actions,
  ];
  return transact(neftyActions, config);
}

export async function setAssetsData(actionSetAssetDataArray: any, config: CliConfig): Promise<TransactResult> {
  const authorization = [
    {
      actor: config.account,
      permission: config.permission,
    },
  ];
  const actions = actionSetAssetDataArray.map((actionSetAssetData: any) => {
    return {
      account: 'atomicassets',
      name: 'setassetdata',
      authorization,
      data: actionSetAssetData,
    };
  });
  return transact(actions, config);
}

export async function burnAssets(assetIds: string[], config: CliConfig): Promise<TransactResult> {
  const authorization = [
    {
      actor: config.account,
      permission: config.permission,
    },
  ];

  const actions = assetIds.map((assetId: string) => {
    return {
      account: 'atomicassets',
      name: 'burnasset',
      authorization,
      data: {
        asset_owner: config.account,
        asset_id: assetId,
      },
    };
  });
  return transact(actions, config);
}

export async function getAssetsByTemplate(
  templateId: number,
  account: string,
  amount: number,
  config: SettingsConfig,
  batchSize = 100,
): Promise<IAsset[]> {
  let fetchAssets = true;
  let page = 1;
  let assets: IAsset[] = [];
  let left = amount;
  while (fetchAssets && left > 0) {
    const limit = Math.min(left, batchSize);
    const results = await getAtomicApi(config.aaUrl).getAssets(
      {
        owner: account,
        sort: AssetsSort.AssetId,
        order: OrderParam.Asc,
        template_id: templateId,
      },
      page,
      batchSize,
    );
    fetchAssets = results.length > 0;
    page += 1;
    left -= batchSize;
    assets = [...assets, ...results.slice(0, limit)];

    // avoid getting rate limited
    timeUtils.sleep(500);
  }
  return assets;
}

// @TODO: document params. it is weird how we have 2 different batch sizes
export async function getOwnedAssetsByTemplateIds(
  templateIds: (number | string)[],
  account: string,
  config: SettingsConfig,
  templateIdsBatchSize = 100,
  assetsBatchSize = 400,
): Promise<IAsset[]> {
  const templateIdsBatches = getBatchesFromArray(templateIds, templateIdsBatchSize);

  let allAssets: IAsset[] = [];
  for (const templateIdsBatch of templateIdsBatches) {
    const templateIdsString = templateIdsBatch.join(',');

    let assetsInPage = [];
    let page = 1;
    do {
      assetsInPage = await getAtomicApi(config.aaUrl).getAssets(
        {
          owner: account,
          sort: AssetsSort.AssetId,
          order: OrderParam.Asc,
          template_whitelist: templateIdsString,
        },
        page,
        assetsBatchSize,
      );
      page++;
      allAssets = [...allAssets, ...assetsInPage];
    } while (assetsInPage.length >= assetsBatchSize);
  }

  return allAssets;
}

export async function getUnburnedAssetsByTemplate(
  templateId: number,
  amount: number,
  config: SettingsConfig,
  batchSize = 100,
): Promise<IAsset[]> {
  let fetchAssets = true;
  let page = 1;
  let assets: IAsset[] = [];
  let left = amount;
  while (fetchAssets && left > 0) {
    const results = await getAtomicApi(config.aaUrl).getAssets(
      {
        burned: false,
        sort: AssetsSort.AssetId,
        order: OrderParam.Asc,
        template_id: templateId,
      },
      page,
      batchSize,
    );
    fetchAssets = results.length > 0;
    page += 1;
    left -= results.length;
    assets = [...assets, ...results];
    // avoid getting rate limited
    timeUtils.sleep(500);
  }
  return assets;
}
