import {Command, Flags, ux} from '@oclif/core'
import crypto from '../../utils/crypto-utils'
import fileUtils from '../../utils/file-utils'
import CliConfig from '../../types/cli-config'


export default class SetCommand extends Command {

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    property: Flags.string({char: 'p', description: 'Configuration property'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(SetCommand)
    const parameter = flags.property

    const password = await ux.prompt('Enter your CLI password', {type: 'mask'})
    const config:CliConfig = crypto.decryptConfigurationFile(password, this.config.configDir) as CliConfig
    if(!config){
        this.error('Invalid password, please try again...')
    }
    
    if (!parameter || parameter == undefined) {
        this.error('Invalid parameter, please enter a valid parameter...')
    }

    ux.action.start('Checking configurations...')
    const parts = parameter.split('=')
    const configKey:string = parts[0]
    const value:string = parts[1]
    if(!config.hasOwnProperty(configKey)){
        this.error(`Key: ${configKey} not found in properties`)
    }
    ux.action.stop()

    ux.action.start('Updating configurations...')
    const updatedConf = Object.keys(config).reduce((accumulator, key) => {
        if(key == configKey){
            return {...accumulator, [key]: value}
        }
        return {...accumulator, [key]: config[key as keyof CliConfig]}
    }, {});
    const encrypted = crypto.encrypt(JSON.stringify(updatedConf), password)
    fileUtils.writeFile(this.config.configDir, encrypted)
    ux.action.stop()
    this.log('Update completed!!')
  }
  
}

SetCommand.description = 'get a configuration property'
