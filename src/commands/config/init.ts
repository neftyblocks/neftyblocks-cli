import {Command, Flags, ux} from '@oclif/core'
import crypto from '../../utils/crypto-utils'
import fileUtils from '../../utils/file-utils'
import CliConfig from '../../types/cli-config'


export default class InitCommand extends Command {
  static description = 'Configure credentials'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    accountName: Flags.string({char: 'n', description: 'account name'}),
    privateKey: Flags.string({char: 'k', description: 'private key'}),
    password: Flags.string({char: 'p', description: 'CLI password'}),
    permission: Flags.string({char: 'j', description: 'account permission', default:'active'}),
    deleteConfig: Flags.boolean({char: 'd', description: 'deletes configuration file' })
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(InitCommand)

    let accountName = flags.accountName 
    let pKey = flags.privateKey 
    let password = flags.password
    const permission = flags.permission
    const deleteConfig = flags.deleteConfig

    if(deleteConfig) {
      const proceed = await ux.confirm('Are you sure you want to delete the configuration file? y/n')
      if(proceed){
        ux.action.start('Deleting configuration file...')
        fileUtils.removeConfiFile(this.config.configDir)
        ux.action.stop()
        this.log('Configuration file deleted!')
        this.exit()
      } else {
        this.log('Uff that was close! (｡•̀ᴗ-)✧')
      }
      return
    } 

    ux.action.start('Checking for configuration file')
    if(!fileUtils.configFileExists(this.config.configDir)){
      if (accountName == null) {
        accountName = await ux.prompt('Enter your account name')
      }
      if (pKey == null) {
        pKey = await ux.prompt('Enter your private key', {type: 'hide'})
      }
      if (password == null) {
        password = await ux.prompt('Enter your CLI password', {type: 'hide'})
      }
      const rpcrUrl = await ux.prompt('Enter a RPC URL', {required: false, default: 'https://wax.neftyblocks.com'})
      if(!rpcrUrl) this.log('Using default value')
      const explorerUrl = await ux.prompt('Enter a blocks explorer URL', {required: false, default: 'https://waxblock.io/'})
      if(!explorerUrl) this.log('Using default value')
      const atomicUrl = await ux.prompt('Enter an Atomic URL', {required: false, default: 'https://aa.neftyblocks.com'})
      if(!atomicUrl) this.log('Using default value')

      const conf = new CliConfig(accountName, pKey, permission, rpcrUrl, explorerUrl, atomicUrl)
      this.log('Creating configuration file...')
      const encrypted = crypto.encrypt(JSON.stringify(conf), password)
      fileUtils.writeFile(this.config.configDir, encrypted)
    } else {
      this.log('Configuration file already exists')
      this.exit(200)
    }
    ux.action.stop()

  }
  
}

module.exports = InitCommand
