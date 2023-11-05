import { getAtomicApi, transact } from './antelope-service';
import timeUtils from '../utils/time-utils';
import { AssetsApiParams } from 'atomicassets/build/API/Explorer/Params';
import { IAsset } from 'atomicassets/build/API/Explorer/Objects';
import { getBatchesFromArray } from '../utils/array-utils';
import { AssetTransferData, AssetTransferRow, CliConfig, MintData, SettingsConfig } from '../types';
import { TransactResult, AnyAction } from '@wharfkit/session';
import { SheetContents, getSheetHeader, readExcelContents } from '../utils/excel-utils';

export const assetIdField = 'assetId';
export const recipientField = 'recipient';
export const memoField = 'memo';

export async function getAllAssets(
  options: AssetsApiParams,
  config: SettingsConfig,
  batchSize = 1000,
  limit = 10000,
): Promise<IAsset[]> {
  let assetsInPage: IAsset[] = [];
  let allAssets: IAsset[] = [];
  let page = 1;
  do {
    assetsInPage = await getAtomicApi(config.aaUrl).getAssets(options, page, batchSize);
    page++;
    allAssets = [...allAssets, ...assetsInPage];
  } while (assetsInPage.length >= batchSize || allAssets.length >= limit);

  return allAssets;
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

export async function mintAssets(mints: MintData[], config: CliConfig): Promise<TransactResult> {
  const session = config.session;
  const authorization = [
    {
      actor: session.actor,
      permission: session.permission,
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

export async function transferAssets(transfers: AssetTransferData[], config: CliConfig): Promise<TransactResult> {
  const session = config.session;
  const authorization = [
    {
      actor: session.actor,
      permission: session.permission,
    },
  ];
  const actions: AnyAction[] = transfers.map((data) => ({
    account: 'atomicassets',
    name: 'transfer',
    authorization,
    data,
  }));
  return session.transact({ actions });
}

export async function setAssetsData(actionSetAssetDataArray: any, config: CliConfig): Promise<TransactResult> {
  const session = config.session;
  const authorization = [
    {
      actor: session.actor,
      permission: session.permission,
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
  return await transact(actions, config);
}

export async function readAssetsTransferFile({
  filePathOrSheetsId,
}: {
  filePathOrSheetsId: string;
  config: CliConfig;
}): Promise<AssetTransferRow[]> {
  const transfers: AssetTransferRow[] = [];
  const sheets = await readExcelContents(filePathOrSheetsId);
  for (const element of sheets) {
    const sheet = element;
    transfers.push(...(await getTransferRows(sheet)));
  }
  return transfers;
}

async function getTransferRows(sheet: SheetContents): Promise<AssetTransferRow[]> {
  const { headersMap, validateHeaders } = getSheetHeader(sheet.rows);
  const validationError = validateHeaders([assetIdField, recipientField]);

  if (validationError) {
    throw new Error(`Error in sheet ${sheet.name}: ${validationError}`);
  }

  const contentRows = sheet.rows.slice(1);
  const assetIdIndex = headersMap[assetIdField];
  const recipientIndex = headersMap[recipientField];
  const memoIndex = headersMap[memoField];

  const transfers: AssetTransferRow[] = [];
  contentRows.forEach((row: any, index: number) => {
    const assetId = row[assetIdIndex] as string;
    const recipient = row[recipientIndex] as string;
    const memo = memoIndex ? row[memoIndex] : '';

    if (!assetId) {
      throw new Error(`Missing required field in row ${index + 2}: ${assetIdField}`);
    }

    if (!recipient) {
      throw new Error(`Missing required field in row ${index + 2}: ${recipientField}`);
    }

    transfers.push({
      assetId,
      recipient,
      memo,
    });
  });

  return transfers;
}
