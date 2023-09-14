import { Command } from '@oclif/core';
interface Preset {
    name: string;
    rpcUrl: string;
    explorerUrl: string;
    aaUrl: string;
    chainId: string;
}
export default class InitCommand extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        deleteConfig: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
    getCustomPreset(): Promise<Preset>;
}
export {};
