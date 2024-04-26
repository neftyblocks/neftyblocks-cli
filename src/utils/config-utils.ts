import fetch from 'node-fetch';
import { readFile, removeDir, removeFile, writeFile } from './file-utils.js';
import { SettingsConfig } from '../types/index.js';
import path, { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const neftyConfFileName = 'config.json';
const sessionDir = 'sessions';

export async function getChainId(rpcUrl: string): Promise<string> {
  const rpc = rpcUrl + '/v1/chain/get_info';
  try {
    const response = await fetch(rpc, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    if (response.ok) {
      const result = await response.json();
      return result.chain_id;
    }
  } catch (error) {
    // Ignore
  }
  return '';
}

export async function validateExplorerUrl(bloksUrl: string): Promise<boolean | string> {
  try {
    const response = await fetch(bloksUrl, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    return 'Invalid URL, please enter a valid URL as https://waxblock.io';
  }
}

export async function validateAtomicAssetsUrl(aaUrl: string): Promise<boolean | string> {
  const aa = aaUrl + '/health';
  try {
    const response = await fetch(aa, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    if (response.ok) {
      const result = await response.json();
      return result.data.chain.status === 'OK';
    }
    return 'Unable to connect to Atomic Assets API';
  } catch (error) {
    return 'Invalid URL, please enter a valid URL as https://aa.neftyblocks.com';
  }
}

export function normalizeUrl(url: string): string {
  if (url.endsWith('/')) {
    return url.slice(0, -1);
  }
  return url;
}

export function configFileExists(dir: string): boolean {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return false;
  }
  return existsSync(join(dir, neftyConfFileName));
}

export function removeConfigFile(dir: string): void {
  const configPath = path.join(dir, neftyConfFileName);
  removeFile(configPath);
  removeSession(dir);
}

export function removeSession(dir: string): void {
  const sessionsDir = getSessionDir(dir);
  removeDir(sessionsDir);
}

export async function validate(config: SettingsConfig): Promise<SettingsConfig | null> {
  const [chainId, validAaUrl, validExplorerUrl] = await Promise.all([
    getChainId(config.rpcUrl),
    validateAtomicAssetsUrl(config.aaUrl),
    validateExplorerUrl(config.explorerUrl),
  ]);

  const valid = !!chainId && validAaUrl && validExplorerUrl;
  if (!valid) {
    return null;
  }

  return {
    ...config,
    chainId: chainId,
  };
}

export function readConfiguration(dir: string): SettingsConfig | null {
  if (!configFileExists(dir)) {
    return null;
  }

  const configPath = path.join(dir, neftyConfFileName);
  const configContents = readFile(configPath);
  if (configContents === null) {
    return null;
  }

  return JSON.parse(configContents) as SettingsConfig;
}

export function writeConfiguration(config: SettingsConfig, dir: string): void {
  const normalizedConfig: SettingsConfig = {
    rpcUrl: normalizeUrl(config.rpcUrl),
    aaUrl: normalizeUrl(config.aaUrl),
    explorerUrl: normalizeUrl(config.explorerUrl),
    chainId: config.chainId,
    sessionDir: config.sessionDir,
  };

  const configPath = path.join(dir, neftyConfFileName);
  writeFile(configPath, JSON.stringify(normalizedConfig, null, 2));
}

export function getSessionDir(dir: string): string {
  return path.join(dir, sessionDir);
}
