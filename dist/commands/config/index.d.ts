import { Command } from '@oclif/core';
export default class Config extends Command {
    static description: string;
    run(): Promise<void>;
}
