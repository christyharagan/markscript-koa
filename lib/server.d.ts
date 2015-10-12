import * as mu from 'markscript-uservices';
export interface RunOptions {
    database: {
        databaseName: string;
        host: string;
        port: number;
        user: string;
        password: string;
    };
    middle: {
        host: string;
        port: number;
    };
    pkgDir?: string;
    serviceSpecs?: mu.MLServices;
    fileServerPath?: string;
}
export declare class Server {
    private options;
    private services;
    private httpServer;
    private client;
    getService<T>(name: string): T;
    callGet<T>(name: string, args?: {
        [name: string]: string | number | boolean;
    }): Promise<T>;
    callPost<T>(name: string, args?: {
        [name: string]: string | number | boolean;
    }, body?: string | Object | Buffer | NodeJS.ReadableStream): Promise<T>;
    callPut<T>(name: string, args?: {
        [name: string]: string | number | boolean;
    }, body?: string | Object | Buffer | NodeJS.ReadableStream): Promise<T>;
    callDelete<T>(name: string, args?: {
        [name: string]: string | number | boolean;
    }): Promise<T>;
    constructor(options: RunOptions);
    stop(): void;
    start(): Promise<Server>;
}
