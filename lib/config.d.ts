import { Schema } from 'koishi';
export type RenderMode = 'text' | 'image' | 'auto';
export type RenderFallback = 'text' | 'drop';
export type RenderTheme = 'github-light' | 'github-dark' | 'aurora' | 'sunset' | 'matrix' | 'compact' | 'card' | 'terminal';
export type RenderStyle = 'auto' | 'github' | 'glass' | 'neon' | 'compact' | 'card' | 'terminal';
export interface Rule {
    repo: string;
    channelId: string;
    platform?: string;
    events: string[];
    renderTheme?: RenderTheme;
    renderStyle?: RenderStyle;
}
export interface Config {
    defaultOwner?: string;
    defaultRepo?: string;
    debug: boolean;
    logUnhandledEvents: boolean;
    defaultEvents: string[];
    enableSessionFallback: boolean;
    dedupRetentionHours: number;
    sendRetryCount: number;
    sendRetryBaseDelayMs: number;
    formatterLocale: 'zh-CN' | 'en-US';
    renderMode: RenderMode;
    renderFallback: RenderFallback;
    renderTheme: RenderTheme;
    renderStyle: RenderStyle;
    renderWidth: number;
    renderTimeoutMs: number;
    digestEnabled: boolean;
    digestWindowSec: number;
    digestMaxItems: number;
    rules?: Rule[];
}
export declare const Config: Schema<Config>;
