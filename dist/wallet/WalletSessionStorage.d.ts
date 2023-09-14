export declare const createSessionStorage: (sessionDir: string) => {
    write(key: string, data: string): Promise<void>;
    read(key: string): Promise<string | null>;
    remove(key: string): Promise<void>;
};
