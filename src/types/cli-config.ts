
class CliConfig {
    account: string
    privateKey: string
    permission: string
    rpcUrl: string
    explorerUrl: string
    atomicUrl: string
    cpuAccount: string
    cpuPrivateKey: string
    cpuPermission: string
    proposerAccount: string
    proposerPrivateKey: string
    proposerPermission: string
    hyperionUrl: string

    constructor(account: string, privateKey: string, permission: string, rpcUrl: string, explorerUrl: string, atomicUrl: string, cpuAccount: string = '', 
        cpuPrivateKey: string = '', cpuPermission: string = '', proposerAccount: string = 'nefty', proposerPrivateKey: string = '', 
        proposerPermission: string = 'proposer', hyperionUrl: string = '') {
        this.account = account
        this.privateKey = privateKey
        this.permission = permission
        this.explorerUrl = explorerUrl 
        this.rpcUrl = rpcUrl 
        this.atomicUrl = atomicUrl
        this.cpuAccount = cpuAccount
        this.cpuPrivateKey = cpuPrivateKey
        this.cpuPermission = cpuPermission
        this.proposerAccount = proposerAccount
        this.proposerPrivateKey = proposerPrivateKey
        this.proposerPermission = proposerPermission
        this.hyperionUrl = hyperionUrl

    }
}

export = CliConfig