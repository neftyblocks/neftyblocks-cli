import { Session } from '@wharfkit/session';
export interface SettingsConfig {
    rpcUrl: string;
    aaUrl: string;
    explorerUrl: string;
    chainId: string;
    sessionDir: string;
}
export interface CliConfig extends SettingsConfig {
    session: Session;
}
