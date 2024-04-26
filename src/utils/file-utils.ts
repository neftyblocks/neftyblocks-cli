import { readFileSync, writeFileSync, existsSync, unlinkSync, rmSync, mkdirSync, createWriteStream } from 'node:fs';
import fetch, { Response } from 'node-fetch';
import path from 'path';

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

export async function downloadImage(url: string, destination: string): Promise<void> {
  const ipfsUrl = `https://ipfs.neftyblocks.io/ipfs/${url}`;
  try {
    const filePath = path.join(destination, url);
    if (fileExists(filePath)) {
      return;
    }
    const response: Response = await fetch(ipfsUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image from ${ipfsUrl}: ${response.statusText}`);
    }
    if (!fileExists(destination)) {
      mkdirSync(destination, { recursive: true });
    }

    const fileStream = createWriteStream(filePath);
    await new Promise<void>((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on('error', (err: Error) => {
        reject(err);
      });
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    });
  } catch (error: any) {
    console.error(`Error downloading image from ${ipfsUrl}: ${error.message}`);
    throw error;
  }
}
