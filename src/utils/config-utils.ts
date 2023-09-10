import fetch from 'node-fetch';
import { readFile, removeFile, writeFile } from './file-utils';
import { decrypt, encrypt } from './crypto-utils';
import { AccountConfig, CliConfig, EncryptedConfig, SettingsConfig } from '../types/cli-config';
import path, { join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { PrivateKey } from 'eosjs/dist/PrivateKey';

const neftyConfFileName = 'config.json';

export async function validateRpcUrl(rpcUrl: string): Promise<boolean> {
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
      return !!result.chain_id;
    }
  } catch (error) {
    console.log('Invalid URL, please enter a valid URL as https://wax.neftyblocks.com');
  }
  return false;
}

export async function validateExplorerUrl(bloksUrl: string): Promise<boolean> {
  try {
    const response = await fetch(bloksUrl, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.log('Invalid URL, please enter a valid URL as https://waxblock.io');
  }
  return false;
}

export async function validateAtomicAssetsUrl(aaUrl: string): Promise<boolean> {
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
  } catch (error) {
    console.log('Invalid URL, please enter a valid URL as https://aa.neftyblocks.com');
  }
  return false;
}

export function normalizeUrl(url: string): string {
  if (url.endsWith('/')) {
    return url.slice(0, -1);
  }
  return url;
}

export function validateAccountName(account: string): boolean {
  const regex = new RegExp('^[a-z1-5.]{0,12}$');
  const match = regex.test(account);
  const lastChar = account.at(-1);
  if (lastChar === '.' || !match) {
    console.log(
      '- Account name can contain letters "a-z" and numbers betwen "1-5" and "." \n- Account name cannot end with a "." \n- Account name can contain a max of 12 characters',
    );
  }
  return match && lastChar != '.';
}

export function validatePrivateKey(pkString: string): boolean {
  try {
    const privateKey = PrivateKey.fromString(pkString);
    return privateKey.isValid();
  } catch (error) {
    console.log('Invalid private key');
    return false;
  }
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
}

export async function validate(config: CliConfig): Promise<boolean> {
  const [validRpcUrl, validAaUrl, validExplorerUrl, validAccountName, validPrivateKey] = await Promise.all([
    validateRpcUrl(config.rpcUrl),
    validateAtomicAssetsUrl(config.aaUrl),
    validateExplorerUrl(config.explorerUrl),
    validateAccountName(config.account),
    validatePrivateKey(config.privateKey),
  ]);

  return (
    validRpcUrl &&
    validAaUrl &&
    validExplorerUrl &&
    validAccountName &&
    validPrivateKey &&
    config.permission !== undefined
  );
}

export function readConfiguration(password: string, dir: string): CliConfig | null {
  const configPath = path.join(dir, neftyConfFileName);
  const configContents = readFile(configPath);
  if (configContents === null) {
    return null;
  }

  const encryptedConfig = JSON.parse(configContents) as EncryptedConfig;
  const accountContents = encryptedConfig.account;
  const decryptedAccountContents = decrypt(accountContents, password);

  if (!decryptedAccountContents) {
    return null;
  }

  const accountInfo = JSON.parse(decryptedAccountContents) as AccountConfig;

  return {
    rpcUrl: encryptedConfig.rpcUrl,
    aaUrl: encryptedConfig.aaUrl || encryptedConfig.atomicUrl || '',
    explorerUrl: encryptedConfig.explorerUrl,
    account: accountInfo.account,
    permission: accountInfo.permission,
    privateKey: accountInfo.privateKey,
  };
}

export function readSettings(dir: string): SettingsConfig | null {
  const configPath = path.join(dir, neftyConfFileName);
  const configContents = readFile(configPath);
  if (configContents === null) {
    return null;
  }

  const encryptedConfig = JSON.parse(configContents) as EncryptedConfig;
  return {
    rpcUrl: encryptedConfig.rpcUrl,
    aaUrl: encryptedConfig.aaUrl || encryptedConfig.atomicUrl || '',
    explorerUrl: encryptedConfig.explorerUrl,
  };
}

export function writeConfiguration(config: CliConfig, password: string, dir: string): void {
  const accountInfo = {
    account: config.account,
    permission: config.permission,
    privateKey: config.privateKey,
  };

  const encryptedConfig = {
    rpcUrl: config.rpcUrl,
    aaUrl: config.aaUrl,
    explorerUrl: config.explorerUrl,
    account: encrypt(JSON.stringify(accountInfo), password),
  };

  const configPath = path.join(dir, neftyConfFileName);
  writeFile(configPath, JSON.stringify(encryptedConfig, null, 2));
}
