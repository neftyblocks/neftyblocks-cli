import { Command } from '@oclif/core';
import { CliConfig } from '../types/cli-config';
export declare abstract class BaseCommand extends Command {
    getCliConfig(requireSession?: boolean): Promise<CliConfig>;
}
