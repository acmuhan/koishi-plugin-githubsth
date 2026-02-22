import { Schema } from 'koishi';
export interface Rule {
    repo: string;
    channelId: string;
    platform?: string;
    events: string[];
}
export interface Config {
    defaultOwner?: string;
    defaultRepo?: string;
    debug: boolean;
    rules?: Rule[];
}
export declare const Config: Schema<Config>;
