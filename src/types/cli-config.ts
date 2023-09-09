class CliConfig {
  account: string;
  privateKey: string;
  permission: string;
  rpcUrl: string;
  explorerUrl: string;
  atomicUrl: string;

  constructor(
    account: string,
    privateKey: string,
    permission: string,
    rpcUrl: string,
    explorerUrl: string,
    atomicUrl: string,
  ) {
    this.account = account;
    this.privateKey = privateKey;
    this.permission = permission;
    this.explorerUrl = explorerUrl;
    this.rpcUrl = rpcUrl;
    this.atomicUrl = atomicUrl;
  }
}

export = CliConfig;
