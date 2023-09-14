import { readFileSync, writeFileSync, existsSync, unlinkSync, rmSync } from 'node:fs';

export function writeFile(path: string, data: string): void {
  writeFileSync(path, data, {
    flag: 'w',
  });
}

export function readFile(path: string): string {
  const contents = readFileSync(path, 'utf-8');
  return contents;
}

export function removeFile(path: string): void {
  if (!existsSync(path)) {
    return;
  }
  unlinkSync(path);
}

export function removeDir(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true });
  }
}

export function fileExists(path: string): boolean {
  return existsSync(path);
}
