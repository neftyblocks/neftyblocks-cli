import { Command } from '@oclif/core';
export default class SetCommand extends Command {
    static examples: {
        command: string;
        description: string;
    }[];
    static description: string;
    run(): Promise<void>;
}
