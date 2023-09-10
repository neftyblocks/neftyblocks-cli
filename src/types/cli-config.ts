export interface AccountConfig {
  account: string;
  privateKey: string;
  permission: string;
}

export interface SettingsConfig {
  rpcUrl: string;
  aaUrl: string;
  explorerUrl: string;
}

export interface EncryptedConfig extends SettingsConfig {
  account: string;
  atomicUrl?: string;
}

export interface CliConfig extends AccountConfig, SettingsConfig {}
