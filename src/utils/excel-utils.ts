import readXlsxFile, { Row, readSheetNames } from 'read-excel-file/node';
import { fileExists } from './file-utils';
import fetch from 'node-fetch';
import { Cell } from 'read-excel-file/types';

export interface SheetContents {
  name: string;
  rows: Row[];
}

const GOOGLE_DOCS_HOST = 'docs.google.com';
const GOOGLE_ACCOUNTS_HOST = 'accounts.google.com';

export async function readExcelContents(filePathOrSheetsId: string): Promise<SheetContents[]> {
  let excelInput: string | Buffer;
  // Check if file exists
  if (!fileExists(filePathOrSheetsId)) {
    let url;
    try {
      url = new URL(filePathOrSheetsId);
    } catch (err) {
      url = new URL(`https://${GOOGLE_DOCS_HOST}/spreadsheets/d/${filePathOrSheetsId}`);
    }

    // Check if it's a google sheets url
    if (url.host === GOOGLE_DOCS_HOST) {
      // Extract the sheet id
      const sheetId = url.pathname.split('/')[3];
      url = new URL(`https://${GOOGLE_DOCS_HOST}/spreadsheets/d/${sheetId}/export?format=xlsx`);
    }

    const res = await fetch(url);
    if (res.status !== 200) {
      throw new Error(`Error downloading ${url}`);
    }

    if (new URL(res.url).host === GOOGLE_ACCOUNTS_HOST && url.host === GOOGLE_DOCS_HOST) {
      throw new Error(`Error downloading ${url}. Make sure the file is public.`);
    }

    excelInput = await res.buffer();
  } else {
    excelInput = filePathOrSheetsId;
  }

  const sheetNames = await readSheetNames(excelInput);
  const sheetsRows = await Promise.all(sheetNames.map((name) => readXlsxFile(excelInput, { sheet: name })));
  return sheetNames.map((name, index) => ({
    name,
    rows: sheetsRows[index],
  }));
}

export function getSheetHeader(rows: Row[]): {
  headersMap: { [key: string]: number };
  validateHeaders: (requiredHeaders: string[]) => string;
} {
  const headerRow = rows[0];
  const headersMap: { [key: string]: number } = Object.fromEntries(
    headerRow
      .map((name: Cell, index: number) => ({
        name: name.valueOf() as string,
        index,
      }))
      .map((entry: { name: string; index: number }) => [entry.name, entry.index]),
  );

  const isHeaderPresent = (text: string) => {
    return headersMap[text] >= 0;
  };

  const validateHeaders = (requiredHeaders: string[]) => {
    const missingHeaders = requiredHeaders.filter((header) => isHeaderPresent(header) === false);
    if (missingHeaders.length > 0) {
      return `Missing headers: ${missingHeaders.join(', ')}`;
    }
    return '';
  };

  return {
    headersMap,
    validateHeaders,
  };
}
