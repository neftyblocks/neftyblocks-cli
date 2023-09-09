import { Command, run } from "@oclif/core";

export default class Config extends Command {
  static description = "Manages the configuration.";

  async run(): Promise<void> {
    run([Config.id, "--help"]);
  }
}
