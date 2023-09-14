import { Command } from '@oclif/core';
export default class SetCommand extends Command {
    static examples: {
        command: string;
        description: string;
    }[];
    static description: string;
    static args: {
        property: import("@oclif/core/lib/interfaces/parser").Arg<string | undefined, Record<string, unknown>>;
        value: import("@oclif/core/lib/interfaces/parser").Arg<string | undefined, Record<string, unknown>>;
    };
    run(): Promise<void>;
}
