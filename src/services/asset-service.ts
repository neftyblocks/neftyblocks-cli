import { getApi, getAtomicApi, getRpc, transact } from "./antelope-service";
import timeUtils from "../utils/time-utils";
import { AssetsSort, OrderParam } from "atomicassets/build/API/Explorer/Enums";
import {
  AccountApiParams,
  AssetsApiParams,
  GreylistParams,
  HideOffersParams,
} from "atomicassets/build/API/Explorer/Params";
import { IAccountStats, IAsset } from "atomicassets/build/API/Explorer/Objects";
import { Action } from "eosjs/dist/eosjs-serialize";
import CliConfig from "../types/cli-config";
import {
  PushTransactionArgs,
  ReadOnlyTransactResult,
} from "eosjs/dist/eosjs-rpc-interfaces";
import { TransactResult } from "eosjs/dist/eosjs-api-interfaces";
import { getBatchesFromArray } from "../utils/array-utils";

export async function getAccountTemplates(
  account: string,
  options: GreylistParams & HideOffersParams,
  atomicUrl: string
): Promise<IAccountStats["templates"]> {
  const accountDetails = await getAtomicApi(atomicUrl).getAccount(
    account,
    options
  );
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
  atomicUrl: string
): Promise<IAsset[]> {
  const atomicApi = getAtomicApi(atomicUrl);
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
      pageSize
    );
    page++;
    allAssets = [...allAssets, ...assetsInPage];
  } while (assetsInPage.length >= pageSize);

  return allAssets;
}

export async function getAccounts(
  options: AccountApiParams,
  atomicUrl: string,
  page = 0,
  limit = 1000
): Promise<
  Array<{
    account: string;
    assets: string;
  }>
> {
  return getAtomicApi(atomicUrl).getAccounts(options, page, limit);
}

export async function getAssetsBySchema(
  collection: string,
  schema: string,
  atomicUrl: string,
  batchSize = 400
): Promise<IAsset[]> {
  let assetsInPage: IAsset[] = [];
  let allAssets: IAsset[] = [];
  let page = 1;
  do {
    assetsInPage = await getAtomicApi(atomicUrl).getAssets(
      {
        collection_name: collection,
        schema_name: schema,
        sort: AssetsSort.Updated,
        order: OrderParam.Asc,
      },
      page,
      batchSize
    );
    page++;
    allAssets = [...allAssets, ...assetsInPage];
  } while (assetsInPage.length >= batchSize);

  return allAssets;
}

export async function batchedGetAssets(
  options: AssetsApiParams,
  atomicUrl: string,
  batchSize = 400
): Promise<IAsset[]> {
  let assetsInPage: IAsset[] = [];
  let allAssets: IAsset[] = [];
  let page = 1;
  do {
    assetsInPage = await getAtomicApi(atomicUrl).getAssets(
      options,
      page,
      batchSize
    );
    page++;
    allAssets = [...allAssets, ...assetsInPage];
  } while (assetsInPage.length >= batchSize);

  return allAssets;
}

export async function getAccountsBySchema(
  collection: string,
  schema: string,
  atomicUrl: string
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
      atomicUrl,
      page
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

export async function getAssetsMap(
  assetIds: string[],
  atomicUrl: string
): Promise<Record<string, IAsset>> {
  if (assetIds.length === 0) {
    return {};
  }
  const batchSize = 500;
  const batches = getBatchesFromArray([...new Set(assetIds)], batchSize);
  let assets: IAsset[] = [];
  for (let i = 0; i < batches.length; i++) {
    const ids = batches[i];
    const result = await getAtomicApi(atomicUrl).getAssets(
      {
        ids: ids.join(","),
      },
      1,
      batchSize
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
export async function mintAssets(
  actionDataArray: any,
  config: CliConfig
): Promise<TransactResult | ReadOnlyTransactResult | PushTransactionArgs> {
  const rpc = getRpc(config.rpcUrl);
  const authorization = [
    {
      actor: config.account,
      permission: config.permission,
    },
  ];
  const actions: Action[] = actionDataArray.map((actionData: any) => {
    return {
      account: "atomicassets",
      name: "mintasset",
      authorization,
      data: actionData,
    };
  });
  const neftyActions = [
    {
      account: "neftyblocksa",
      name: "validate",
      authorization,
      data: {
        nonce: Math.floor(Math.random() * 1000000000),
      },
    },
    ...actions,
  ];
  return transact(getApi(rpc, config.privateKey), neftyActions);
}

export async function setAssetsData(
  actionSetAssetDataArray: any,
  config: CliConfig,
  broadcast = true
): Promise<TransactResult | ReadOnlyTransactResult | PushTransactionArgs> {
  const authorization = [
    {
      actor: config.account,
      permission: config.permission,
    },
  ];
  const actions = actionSetAssetDataArray.map((actionSetAssetData: any) => {
    return {
      account: "atomicassets",
      name: "setassetdata",
      authorization,
      data: actionSetAssetData,
    };
  });
  const rpc = getRpc(config.rpcUrl);
  const api = getApi(rpc, config.privateKey);
  return api.transact(
    {
      actions,
    },
    {
      blocksBehind: 3,
      expireSeconds: 30,
      broadcast,
    }
  );
}

export async function burnAssets(
  assetIds: string[],
  config: CliConfig,
  broadcast = true
): Promise<TransactResult | ReadOnlyTransactResult | PushTransactionArgs> {
  const rpc = getRpc(config.rpcUrl);
  const api = getApi(rpc, config.privateKey);
  const authorization = [
    {
      actor: config.account,
      permission: config.permission,
    },
  ];

  const actions = assetIds.map((assetId: string) => {
    return {
      account: "atomicassets",
      name: "burnasset",
      authorization,
      data: {
        asset_owner: config.account,
        asset_id: assetId,
      },
    };
  });
  return api.transact(
    {
      actions,
    },
    {
      blocksBehind: 3,
      expireSeconds: 120,
      broadcast,
    }
  );
}

export async function getAssetsByTemplate(
  templateId: number,
  account: string,
  amount: number,
  atomicUrl: string,
  batchSize = 100
): Promise<IAsset[]> {
  let fetchAssets = true;
  let page = 1;
  let assets: IAsset[] = [];
  let left = amount;
  while (fetchAssets && left > 0) {
    const limit = Math.min(left, batchSize);
    const results = await getAtomicApi(atomicUrl).getAssets(
      {
        owner: account,
        sort: AssetsSort.AssetId,
        order: OrderParam.Asc,
        template_id: templateId,
      },
      page,
      batchSize
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
  atomicUrl: string,
  templateIdsBatchSize = 100,
  assetsBatchSize = 400
): Promise<IAsset[]> {
  const templateIdsBatches = getBatchesFromArray(
    templateIds,
    templateIdsBatchSize
  );

  let allAssets: IAsset[] = [];
  for (const templateIdsBatch of templateIdsBatches) {
    const templateIdsString = templateIdsBatch.join(",");

    let assetsInPage = [];
    let page = 1;
    do {
      assetsInPage = await getAtomicApi(atomicUrl).getAssets(
        {
          owner: account,
          sort: AssetsSort.AssetId,
          order: OrderParam.Asc,
          template_whitelist: templateIdsString,
        },
        page,
        assetsBatchSize
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
  atomicUrl: string,
  batchSize = 100
): Promise<IAsset[]> {
  let fetchAssets = true;
  let page = 1;
  let assets: IAsset[] = [];
  let left = amount;
  while (fetchAssets && left > 0) {
    const results = await getAtomicApi(atomicUrl).getAssets(
      {
        burned: false,
        sort: AssetsSort.AssetId,
        order: OrderParam.Asc,
        template_id: templateId,
      },
      page,
      batchSize
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
