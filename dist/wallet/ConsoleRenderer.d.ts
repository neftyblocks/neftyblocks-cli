import { Cancelable, LoginContext, PromptArgs, PromptResponse, UserInterface, UserInterfaceLoginResponse, UserInterfaceTranslateFunction } from '@wharfkit/session';
export declare function countdown(expirationTimeString?: string, interval?: number): () => void;
export declare class ConsoleUserInterface implements UserInterface {
    login(context: LoginContext): Promise<UserInterfaceLoginResponse>;
    onTransactComplete(): Promise<void>;
    onLoginComplete(): Promise<void>;
    onSignComplete(): Promise<void>;
    onBroadcastComplete(): Promise<void>;
    onSign(): Promise<void>;
    onBroadcast(): Promise<void>;
    translate(): string;
    getTranslate(): UserInterfaceTranslateFunction;
    addTranslations(): void;
    /**
     * onLogin
     *
     * @param options LoginOptions
     */
    onLogin(): Promise<void>;
    /**
     * onLoginResult
     */
    onLoginResult(): Promise<void>;
    /**
     * onTransact
     *
     * @param context TransactContext
     */
    onTransact(): Promise<void>;
    /**
     * onTransactResult
     */
    onTransactResult(): Promise<void>;
    /**
     * status
     *
     * @param message string
     */
    status(message: string): void;
    prompt(args: PromptArgs): Cancelable<PromptResponse>;
    onError(error: Error): Promise<void>;
    private getPermissionLevel;
    private getChain;
    private getWallet;
}
