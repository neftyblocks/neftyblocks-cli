import { AbstractWalletPlugin, Cancelable, Checksum256, LoginContext, PermissionLevel, ResolvedSigningRequest, TransactContext, WalletPlugin, WalletPluginConfig, WalletPluginLoginResponse, WalletPluginMetadata, WalletPluginSignResponse } from '@wharfkit/session';
export declare class WalletPluginSecurePrivateKey extends AbstractWalletPlugin implements WalletPlugin {
    chain: Checksum256 | undefined;
    auth: PermissionLevel | undefined;
    encryptedPrivateKey: string | undefined;
    publicKey: string | undefined;
    id: string;
    readonly config: WalletPluginConfig;
    readonly metadata: WalletPluginMetadata;
    constructor();
    login(context: LoginContext): Cancelable<WalletPluginLoginResponse>;
    handleLogin(context: LoginContext): Promise<WalletPluginLoginResponse>;
    sign(resolved: ResolvedSigningRequest, context: TransactContext): Cancelable<WalletPluginSignResponse>;
    handleSign(resolved: ResolvedSigningRequest, context: TransactContext): Promise<WalletPluginSignResponse>;
}
