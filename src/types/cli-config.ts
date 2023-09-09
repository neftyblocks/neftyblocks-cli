class CliConfig {
  account: string;
  privateKey: string;
  permission: string;
  rpcUrl: string;
  explorerUrl: string;
  atomicUrl: string;
  hyperionUrl: string;

  constructor(
    account: string,
    privateKey: string,
    permission: string,
    rpcUrl: string,
    explorerUrl: string,
    atomicUrl: string,
    hyperionUrl = 'http://wax-testnet-hyperion.neftyblocks.com/',
  ) {
    this.account = account;
    this.privateKey = privateKey;
    this.permission = permission;
    this.explorerUrl = explorerUrl;
    this.rpcUrl = rpcUrl;
    this.atomicUrl = atomicUrl;
    this.hyperionUrl = hyperionUrl;
  }
}

export = CliConfig;
