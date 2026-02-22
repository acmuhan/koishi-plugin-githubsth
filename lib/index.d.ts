import { Context } from 'koishi';
import { Config } from './config';
export declare const name = "githubsth";
export declare const inject: {
    required: string[];
    optional: string[];
};
export * from './config';
export declare function apply(ctx: Context, config: Config): void;
