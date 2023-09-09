import { Command, run } from "@oclif/core";

export default class Templates extends Command {
  static description = "Manages a collection's templates.";

  async run(): Promise<void> {
    run([Templates.id, "--help"]);
  }
}
