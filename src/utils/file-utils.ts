import { readFileSync, writeFileSync, unlink, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const neftyConfFileName = 'nefty-keystore';

export function writeFile(path: string, data: string, fileName?: string): void {
  fileName = fileName ? fileName : neftyConfFileName;
  writeFileSync(join(path, fileName), data, {
    flag: 'w',
  });
}

export function readFile(path: string, fileName?: string): string {
  fileName = fileName ? fileName : neftyConfFileName;
  const contents = readFileSync(join(path, fileName), 'utf-8');
  return contents;
}

export function removeConfiFile(path: string, fileName?: string): void {
  fileName = fileName ? fileName : neftyConfFileName;
  unlink(join(path, fileName), function (err) {
    if (err) {
      console.log('Configuration file did not exist');
      console.log(err?.message);
    }
  });
}

export function fileExists(path: string): boolean {
  return existsSync(path);
}

export function configFileExists(path: string, fileName?: string): boolean {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
    return false;
  }

  fileName = fileName ? fileName : neftyConfFileName;
  return existsSync(join(path, fileName));
}
