import {Command, Flags, ux} from '@oclif/core'
import crypto from '../../utils/crypto-utils'
import CliConfig from '../../types/cli-config'

export default class GetCommand extends Command {
  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    property: Flags.string({char: 'p', description: 'Configuration property'}),
    password: Flags.string({char: 'k', description: 'CLI password', default: undefined}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(GetCommand)
    const parameter = flags.property
    const pwd = flags.password

    const password = pwd ? pwd : await ux.prompt('Enter your CLI password', {type: 'mask'})
    const config:CliConfig = crypto.decryptConfigurationFile(password, this.config.configDir) as CliConfig
    if (!config) {
      this.error('Invalid password, please try again...')
    }

    if (!parameter || parameter === undefined) {
      this.error('Invalid parameter, please enter a valid parameter...')
    }

    // if(!config.hasOwnProperty(parameter)){
    if (!Object.prototype.hasOwnProperty.call(config, parameter)) {
      this.error(`Key: ${parameter} not found in properties`)
    }

    const configVal = config[parameter as keyof CliConfig]
    this.log(`${parameter}: ${configVal}`)
  }
}

GetCommand.description = 'get a configuration property'
