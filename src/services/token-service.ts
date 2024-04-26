import { AnyAction, Asset, TransactResult } from '@wharfkit/session';
import { CliConfig, TokenSpec, TransferAction } from '../types/index.js';
import { getTableRows, transact } from './antelope-service.js';
import { SheetContents, getSheetHeader, readExcelContents } from '../utils/excel-utils.js';
import { validateAccountName } from '../utils/validation-utils.js';

export const contractField = 'contract';
export const symbolField = 'symbol';
export const amountField = 'amount';
export const recipientField = 'recipient';
export const memoField = 'memo';

export async function readTransferFile({
  filePathOrSheetsId,
  config,
}: {
  filePathOrSheetsId: string;
  config: CliConfig;
}): Promise<TransferAction[]> {
  const transfers: TransferAction[] = [];
  const sheets = await readExcelContents(filePathOrSheetsId);
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    transfers.push(...(await getTransferActions(sheet, config)));
  }
  return transfers;
}

export async function getTransferActions(sheet: SheetContents, config: CliConfig): Promise<TransferAction[]> {
  const { headersMap, validateHeaders } = getSheetHeader(sheet.rows);
  const validationError = validateHeaders([contractField, symbolField, amountField, recipientField]);

  const tokenSpecs: Record<
    string,
    {
      contract: string;
      symbol: string;
      decimals: number;
    }
  > = {};

  if (validationError) {
    throw new Error(`Error in sheet ${sheet.name}: ${validationError}`);
  }

  const contentRows = sheet.rows.slice(1);
  const contractIndex = headersMap[contractField];
  const symbolIndex = headersMap[symbolField];
  const amountIndex = headersMap[amountField];
  const recipientIndex = headersMap[recipientField];
  const memoIndex = headersMap[memoField];

  const transfers: TransferAction[] = [];
  for (let i = 0; i < contentRows.length; i++) {
    const row = contentRows[i];
    const tokenContract = (row[contractIndex] as string).toLowerCase();
    const tokenSymbol = (row[symbolIndex] as string).toUpperCase();
    const amount = row[amountIndex] as number;
    const recipient = (row[recipientIndex] as string).toLowerCase();
    const memo = (row[memoIndex] as string) || '';

    if (!tokenContract || !tokenSymbol || !amount || !recipient) {
      throw new Error(`Missing required field in row ${i + 2}`);
    }

    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Amount must be greater than 0 in row ${i + 2}`);
    }

    const validationResult = validateAccountName(recipient);
    if (validateAccountName(recipient) !== true) {
      throw new Error(`Invalid recipient account name in row ${i + 2}: ${validationResult}`);
    }

    const tokenKey = `${tokenContract}-${tokenSymbol}`;
    if (!tokenSpecs[tokenKey]) {
      try {
        tokenSpecs[tokenKey] = await getTokenSpecs({
          contract: tokenContract,
          symbol: tokenSymbol,
          config,
        });
      } catch (error: any) {
        throw new Error(`Error in row ${i + 2}: ${error.message}`);
      }
    }

    transfers.push({
      contract: tokenContract,
      data: {
        from: config.session.actor.toString(),
        to: recipient,
        quantity: Asset.from(`${amount.toFixed(tokenSpecs[tokenKey].decimals)} ${tokenSpecs[tokenKey].symbol}`),
        memo: memo,
      },
    });
  }

  return transfers;
}

export async function getTokenSpecs({
  contract,
  symbol,
  config,
}: {
  contract: string;
  symbol: string;
  config: CliConfig;
}): Promise<TokenSpec> {
  const { rows } = await getTableRows(config.rpcUrl, {
    code: contract,
    table: 'stat',
    scope: symbol,
    limit: 1,
    key_type: 'i64',
  });

  if (!rows.length) {
    throw new Error(`Token ${symbol} doesn't exist in contract ${contract}`);
  }

  const decimals = rows[0].supply.split(' ')[0].split('.')[1].length;
  return {
    contract,
    symbol,
    decimals: decimals,
  };
}

export async function transfer(transfers: TransferAction[], config: CliConfig): Promise<TransactResult> {
  const session = config.session;
  const authorization = [
    {
      actor: session.actor,
      permission: session.permission,
    },
  ];
  const actions: AnyAction[] = transfers.map((transfer) => {
    return {
      account: transfer.contract,
      name: 'transfer',
      authorization,
      data: transfer.data,
    };
  });
  return await transact(actions, config);
}
