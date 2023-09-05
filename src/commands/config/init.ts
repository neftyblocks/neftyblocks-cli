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
    accountName: Flags.string({char: 'n', description: 'account name', default: ''}),
    privateKey: Flags.string({char: 'k', description: 'private key', default: ''}),
    password: Flags.string({char: 'p', description: 'CLI password', default: ''}),
    permission: Flags.string({char: 'j', description: 'account permission', default: 'active'}),
    deleteConfig: Flags.boolean({char: 'd', description: 'deletes configuration file'}),
    skip: Flags.boolean({char: 's', description: 'skip', default: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(InitCommand)

    let accountName = flags.accountName
    let pKey = flags.privateKey
    let password = flags.password
    const permission = flags.permission
    const deleteConfig = flags.deleteConfig
    const skipConfig = flags.skip

    if (deleteConfig) {
      const proceed = skipConfig ? skipConfig : await ux.confirm('Are you sure you want to delete the configuration file? y/n')
      if (proceed) {
        if (fileUtils.configFileExists(this.config.configDir)) {
          ux.action.start('Deleting configuration file...')
          fileUtils.removeConfiFile(this.config.configDir)
        }

        ux.action.stop()
        this.log('Configuration file deleted!')
      } else {
        this.log('Uff that was close! (｡•̀ᴗ-)✧')
      }

      return
    }

    ux.action.start('Checking for configuration file')
    if (fileUtils.configFileExists(this.config.configDir)) {
      this.log('Configuration file already exists')
      this.exit(200)
    } else {
      if (accountName.length === 0) {
        accountName = await ux.prompt('Enter your account name')
      }

      if (pKey.length === 0) {
        pKey = await ux.prompt('Enter your private key', {type: 'hide'})
      }

      if (password.length === 0) {
        password = await ux.prompt('Enter your CLI password', {type: 'hide'})
      }

      const rpcrUrl = skipConfig ? 'https://wax.neftyblocks.com' : await ux.prompt('Enter a RPC URL', {required: false, default: 'https://wax.neftyblocks.com'})
      if (!rpcrUrl) this.log('Using default value')
      const explorerUrl = skipConfig ? 'https://waxblock.io/' : await ux.prompt('Enter a blocks explorer URL', {required: false, default: 'https://waxblock.io/'})
      if (!explorerUrl) this.log('Using default value')
      const atomicUrl = skipConfig ? 'https://aa.neftyblocks.com' : await ux.prompt('Enter an Atomic URL', {required: false, default: 'https://aa.neftyblocks.com'})
      if (!atomicUrl) this.log('Using default value')

      const conf = new CliConfig(accountName, pKey, permission, rpcrUrl, explorerUrl, atomicUrl)
      this.log('Creating configuration file...')
      const encrypted = crypto.encrypt(JSON.stringify(conf), password)
      fileUtils.writeFile(this.config.configDir, encrypted)
      if (fileUtils.configFileExists(this.config.configDir)) {
        this.log('Configuration file created!')
      }
    }

    ux.action.stop()
  }
}

module.exports = InitCommand
