import { ux } from "@oclif/core";
import { PasswordProtectedCommand } from "../../base/PasswordProtectedCommand";

export default class GetCommand extends PasswordProtectedCommand {
  static examples = ["<%= config.bin %> <%= command.id %>"];

  static description = "Display all the configuration parameters.";

  static flags = {};

  public async run(): Promise<void> {
    const { flags } = await this.parse(GetCommand);
    const pwd = flags.password;

    const config = await this.getCliConfig(pwd);

    const params: { name: string; value: string }[] = [];
    const columns = {
      name: { get: (row: { name: string; value: string }) => row.name },
      value: { get: (row: { name: string; value: string }) => row.value },
    };

    Object.entries(config).forEach(([key, value]) => {
      if (key === "privateKey") {
        const param: { name: string; value: string } = {
          name: key,
          value: "*****",
        };
        params.push(param);
      } else {
        const param: { name: string; value: string } = {
          name: key,
          value: value,
        };
        params.push(param);
      }
    });
    ux.table(params, columns);
  }
}
