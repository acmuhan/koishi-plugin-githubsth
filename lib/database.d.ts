import { Context } from 'koishi';
import type { RenderStyle, RenderTheme } from './config';
declare module 'koishi' {
    interface Tables {
        github_subscription: GithubSubscription;
        github_trusted_repo: GithubTrustedRepo;
        github_event_dedup: GithubEventDedup;
    }
}
export interface GithubSubscription {
    id: number;
    repo: string;
    channelId: string;
    platform: string;
    events: string[];
    renderTheme?: RenderTheme;
    renderStyle?: RenderStyle;
}
export interface GithubTrustedRepo {
    id: number;
    repo: string;
    enabled: boolean;
    addedBy: string;
    addedAt: Date;
}
export interface GithubEventDedup {
    id: number;
    dedupKey: string;
    event: string;
    repo: string;
    createdAt: Date;
}
export declare function apply(ctx: Context): void;
