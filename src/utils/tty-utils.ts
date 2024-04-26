import { confirm, input, password } from '@inquirer/prompts';
import { ux } from '@oclif/core';
import ora, { Ora, Options } from 'ora';
import terminalLink from 'terminal-link';

let currentSpinner: Ora | undefined = undefined;

export type Columns<T extends Record<string, unknown>> = {
  [key: string]: Partial<Column<T>>;
};

export interface Column<T extends Record<string, unknown>> {
  extended: boolean;
  get(row: T): any;
  header: string;
  minWidth: number;
}

export function printTable(columns: Columns<any>, rows: Record<string, any>[]): void {
  ux.table(rows, columns);
}

export async function confirmPrompt(message: string, skip = false): Promise<boolean> {
  if (skip) {
    return true;
  }

  const value = await confirm({
    message: message,
    default: false,
  });

  return value;
}

export async function passwordPrompt(message: string): Promise<string> {
  if (currentSpinner) {
    currentSpinner.stopAndPersist();
  }

  const value = await password({
    message: message,
    mask: true,
  });

  if (currentSpinner) {
    currentSpinner.start();
  }

  return value;
}

export async function inputPrompt(message: string): Promise<string> {
  if (currentSpinner) {
    currentSpinner.stopAndPersist();
  }
  const value = await input({
    message: message,
  });
  if (currentSpinner) {
    currentSpinner.start();
  }
  return value;
}

export function makeSpinner(options?: string | Options): Ora {
  currentSpinner = ora(options);
  return currentSpinner;
}

export function printLink(text: string, uri: string): void {
  const link = terminalLink(text, uri, {
    fallback: (_, url) => url,
  });
  console.log(link);
}
