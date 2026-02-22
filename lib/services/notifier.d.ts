import { Context, Service } from 'koishi';
import { Config } from '../config';
declare module 'koishi' {
    interface Context {
        notifier: Notifier;
    }
}
export declare class Notifier extends Service {
    config: Config;
    constructor(ctx: Context, config: Config);
    private registerListeners;
    private handleEvent;
    private sendMessage;
}
