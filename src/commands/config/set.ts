import { Command, Flags, ux } from "@oclif/core";
import CliConfig from "../../types/cli-config";
import { decryptConfigurationFile, encrypt } from "../../utils/crypto-utils";
import { writeFile } from "../../utils/file-utils";

export default class SetCommand extends Command {
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
    const { flags } = await this.parse(SetCommand);
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

    if (!parameter || parameter === undefined) {
      this.error("Invalid parameter, please enter a valid parameter...");
    }

    ux.action.start("Checking configurations...");
    const parts = parameter.split("=");
    const configKey: string = parts[0];
    const value: string = parts[1];
    if (!Object.prototype.hasOwnProperty.call(config, configKey)) {
      this.error(`Key: ${configKey} not found in properties`);
    }

    ux.action.stop();

    ux.action.start("Updating configurations...");
    const updatedConf = Object.keys(config).reduce((accumulator, key) => {
      if (key === configKey) {
        return { ...accumulator, [key]: value };
      }

      return { ...accumulator, [key]: config[key as keyof CliConfig] };
    }, {});
    const encrypted = encrypt(JSON.stringify(updatedConf), password);
    writeFile(this.config.configDir, encrypted);
    ux.action.stop();
    this.log("Update completed!!");
  }
}

SetCommand.description = "get a configuration property";
