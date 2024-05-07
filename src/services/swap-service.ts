import { AnyAction, ExtendedAsset, TransactResult } from '@wharfkit/session';
import { CliConfig, TokenSpec } from '../types/index.js';
import { transact } from './antelope-service.js';
import { SheetContents, getSheetHeader, readExcelContents } from '../utils/excel-utils.js';
import { NewLiquidityAction } from '../types/swaps.js';
import { getTokenSpecs } from './token-service.js';

export const token1ContractField = 'token1Contract';
export const token1SymbolField = 'token1Symbol';
export const token1AmountField = 'token1Amount';
export const token2ContractField = 'token2Contract';
export const token2SymbolField = 'token2Symbol';
export const token2AmountField = 'token2Amount';

export async function readNewLiquidityFile({
  filePathOrSheetsId,
  config,
}: {
  filePathOrSheetsId: string;
  config: CliConfig;
}): Promise<NewLiquidityAction[]> {
  const actions: NewLiquidityAction[] = [];
  const sheets = await readExcelContents(filePathOrSheetsId);
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    actions.push(...(await getNewLiquidityActions(sheet, config)));
  }
  return actions;
}

export async function getNewLiquidityActions(sheet: SheetContents, config: CliConfig): Promise<NewLiquidityAction[]> {
  const { headersMap, validateHeaders } = getSheetHeader(sheet.rows);
  const validationError = validateHeaders([
    token1ContractField,
    token1SymbolField,
    token1AmountField,
    token2ContractField,
    token2SymbolField,
    token2AmountField,
  ]);

  const tokenSpecs: Record<string, TokenSpec> = {};

  if (validationError) {
    throw new Error(`Error in sheet ${sheet.name}: ${validationError}`);
  }

  const contentRows = sheet.rows.slice(1);
  const token1ContractIndex = headersMap[token1ContractField];
  const token1SymbolIndex = headersMap[token1SymbolField];
  const token1AmountIndex = headersMap[token1AmountField];
  const token2ContractIndex = headersMap[token2ContractField];
  const token2SymbolIndex = headersMap[token2SymbolField];
  const token2AmountIndex = headersMap[token2AmountField];

  const actions: NewLiquidityAction[] = [];
  for (let i = 0; i < contentRows.length; i++) {
    const row = contentRows[i];
    const token1Contract = (row[token1ContractIndex] as string).toLowerCase();
    const token1Symbol = (row[token1SymbolIndex] as string).toUpperCase();
    const token1Amount = row[token1AmountIndex] as number;
    const token2Contract = (row[token2ContractIndex] as string).toLowerCase();
    const token2Symbol = (row[token2SymbolIndex] as string).toUpperCase();
    const token2Amount = row[token2AmountIndex] as number;

    if (!token1Contract || !token1Symbol || !token1Amount || !token2Contract || !token2Symbol || !token2Amount) {
      throw new Error(`Missing required field in row ${i + 2}`);
    }

    if (isNaN(token1Amount) || token1Amount <= 0) {
      throw new Error(`Token 1 amount must be greater than 0 in row ${i + 2}`);
    }

    if (isNaN(token2Amount) || token2Amount <= 0) {
      throw new Error(`Token 2 amount must be greater than 0 in row ${i + 2}`);
    }

    const token1Key = `${token1Contract}-${token1Symbol}`;
    if (!tokenSpecs[token1Key]) {
      try {
        tokenSpecs[token1Key] = await getTokenSpecs({
          contract: token1Contract,
          symbol: token1Symbol,
          config,
        });
      } catch (error: any) {
        throw new Error(`Error in row ${i + 2}: ${error.message}`);
      }
    }

    const extendedToken1 = ExtendedAsset.from({
      quantity: `${token1Amount.toFixed(tokenSpecs[token1Key].decimals)} ${tokenSpecs[token1Key].symbol}`,
      contract: token1Contract,
    });

    const token2Key = `${token2Contract}-${token2Symbol}`;
    if (!tokenSpecs[token2Key]) {
      try {
        tokenSpecs[token2Key] = await getTokenSpecs({
          contract: token2Contract,
          symbol: token2Symbol,
          config,
        });
      } catch (error: any) {
        throw new Error(`Error in row ${i + 2}: ${error.message}`);
      }
    }

    const extendedToken2 = ExtendedAsset.from({
      quantity: `${token2Amount.toFixed(tokenSpecs[token2Key].decimals)} ${tokenSpecs[token2Key].symbol}`,
      contract: token2Contract,
    });

    actions.push({
      token1Amount: extendedToken1,
      token2Amount: extendedToken2,
    });
  }

  return actions;
}

export async function createTacoLiquidity(
  liquidityActions: NewLiquidityAction[],
  config: CliConfig,
): Promise<TransactResult> {
  const session = config.session;
  const authorization = [
    {
      actor: session.actor,
      permission: session.permission,
    },
  ];
  const actions: AnyAction[] = liquidityActions.flatMap((action) => {
    return [
      {
        account: action.token1Amount.contract,
        name: 'transfer',
        authorization,
        data: {
          from: config.session.actor.toString(),
          to: 'swap.taco',
          quantity: action.token1Amount.quantity,
          memo: 'deposit',
        },
      },
      {
        account: action.token2Amount.contract,
        name: 'transfer',
        authorization,
        data: {
          from: config.session.actor.toString(),
          to: 'swap.taco',
          quantity: action.token2Amount.quantity,
          memo: 'deposit',
        },
      },
      {
        account: 'swap.taco',
        name: 'inittoken',
        authorization,
        data: {
          initial_pool1: action.token1Amount,
          initial_pool2: action.token2Amount,
          user: config.session.actor.toString(),
        },
      },
    ];
  });
  console.log('Actions', JSON.stringify(actions, null, 2));
  return await transact(actions, config);
}
