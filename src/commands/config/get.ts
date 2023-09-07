import { Command, Flags, ux } from "@oclif/core";
import CliConfig from "../../types/cli-config";
import { decryptConfigurationFile } from "../../utils/crypto-utils";

export default class GetCommand extends Command {
  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    property: Flags.string({
      char: "p",
      description: "Configuration property",
    }),
    password: Flags.string({
      char: "k",
      description: "CLI password",
      default: undefined,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(GetCommand);
    const parameter = flags.property;
    const pwd = flags.password;

    const password = pwd
      ? pwd
      : await ux.prompt("Enter your CLI password", { type: "mask" });
    const config: CliConfig = decryptConfigurationFile(
      password,
      this.config.configDir
    ) as CliConfig;
    if (!config) {
      this.error("Invalid password, please try again...");
    } 

    let params: any = []
    let columns: any = []

    Object.entries(config).forEach(([key, value]) => {
      if(key === 'privateKey'){
        params[key] = "****"
      }else{
        params[key] = value
      }
    })
    console.log(params)
    
  }
}

GetCommand.description = "get a configuration property";
