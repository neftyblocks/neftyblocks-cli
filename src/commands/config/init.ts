import { Command, Flags, ux } from "@oclif/core";
import CliConfig from "../../types/cli-config";
import { encrypt } from "../../utils/crypto-utils";
import { validateAccountName } from "../../utils/config-utils";
import {
  configFileExists,
  removeConfiFile,
  writeFile,
} from "../../utils/file-utils";

import { 
  validateRpcUrl, 
  validateBloksUrl,
  validateAtomicUrl 
} from "../../utils/config-utils";

export default class InitCommand extends Command {
  static description = "Configure credentials";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    accountName: Flags.string({
      char: "n",
      description: "account name",
      default: "",
    }),
    privateKey: Flags.string({
      char: "k",
      description: "private key",
      default: "",
    }),
    password: Flags.string({
      char: "p",
      description: "CLI password",
      default: "",
    }),
    permission: Flags.string({
      char: "j",
      description: "account permission",
      default: "active",
    }),
    deleteConfig: Flags.boolean({
      char: "d",
      description: "deletes configuration file",
    }),
    skip: Flags.boolean({ char: "s", description: "skip", default: false }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(InitCommand);

    let accountName = flags.accountName;
    let pKey = flags.privateKey;
    let password = flags.password;
    const permission = flags.permission;
    const deleteConfig = flags.deleteConfig;
    const skipConfig = flags.skip;

    if (deleteConfig) {
      const proceed = skipConfig
        ? skipConfig
        : await ux.confirm(
            "Are you sure you want to delete the configuration file? y/n"
          );
      if (proceed) {
        if (configFileExists(this.config.configDir)) {
          ux.action.start("Deleting configuration file...");
          removeConfiFile(this.config.configDir);
        }

        ux.action.stop();
        this.log("Configuration file deleted!");
      } else {
        this.log("Uff that was close! (｡•̀ᴗ-)✧");
      }

      return;
    }
    ux.action.start("Checking for configuration file");
    
    if (configFileExists(this.config.configDir)) {
      ux.action.stop()
      this.log("Configuration file already exists");
      this.exit(200);
    } else {
      ux.action.stop()
      let validAccountName = false
      //accountName.length === 0
      while(!validAccountName){
        accountName = await ux.prompt("Enter your account name");
        validAccountName = validateAccountName(accountName)
      }
      while(pKey.length === 0) {
        pKey = await ux.prompt("Enter your private key", { type: "hide" });
      }
      while(password.length === 0) {
        password = await ux.prompt("Enter your CLI password", { type: "hide" });
      }
      let validRpcUrl = false
      let rpcrUrl = ""
      while(!validRpcUrl){
        rpcrUrl = skipConfig
        ? "https://wax.neftyblocks.com"
        : await ux.prompt("Enter a RPC URL", {
            required: false,
            default: "https://wax.neftyblocks.com",
          });
        if (!rpcrUrl) this.log("Using default value");
        validRpcUrl = await validateRpcUrl(rpcrUrl)
      }
      let validBloksUrl = false
      let explorerUrl = ""
      while(!validBloksUrl){
        explorerUrl = skipConfig
        ? "https://waxblock.io/"
        : await ux.prompt("Enter a blocks explorer URL", {
            required: false,
            default: "https://waxblock.io/",
          });
        if (!explorerUrl) this.log("Using default value");
        validBloksUrl = await validateBloksUrl(explorerUrl)
      }
      let validAtomicUrl = false
      let atomicUrl = ""
      while(!validAtomicUrl){
        atomicUrl = skipConfig
          ? "https://aa.neftyblocks.com"
          : await ux.prompt("Enter an Atomic URL", {
              required: false,
              default: "https://aa.neftyblocks.com",
            });
        if (!atomicUrl) this.log("Using default value");
        validAtomicUrl = await validateAtomicUrl(atomicUrl)
      }

      const conf = new CliConfig(
        accountName,
        pKey,
        permission,
        rpcrUrl,
        explorerUrl,
        atomicUrl
      );
      this.log("Creating configuration file...");
      const encrypted = encrypt(JSON.stringify(conf), password);
      writeFile(this.config.configDir, encrypted);
      if (configFileExists(this.config.configDir)) {
        this.log("Configuration file created!");
      }
    }
    ux.action.stop();
  }
}

module.exports = InitCommand;
