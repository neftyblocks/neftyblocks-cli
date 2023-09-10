import { readFileSync, writeFileSync, unlink, existsSync } from 'node:fs';

export function writeFile(path: string, data: string): void {
  writeFileSync(path, data, {
    flag: 'w',
  });
}

export function readFile(path: string): string {
  const contents = readFileSync(path, 'utf-8');
  return contents;
}

export function removeConfiFile(path: string): void {
  unlink(path, function (err) {
    if (err) {
      console.log('Configuration file did not exist');
      console.log(err?.message);
    }
  });
}

export function fileExists(path: string): boolean {
  return existsSync(path);
}
