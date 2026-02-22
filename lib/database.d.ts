import { Context } from 'koishi';
declare module 'koishi' {
    interface Tables {
        github_subscription: GithubSubscription;
        github_trusted_repo: GithubTrustedRepo;
    }
}
export interface GithubSubscription {
    id: number;
    repo: string;
    channelId: string;
    platform: string;
    events: string[];
}
export interface GithubTrustedRepo {
    id: number;
    repo: string;
    enabled: boolean;
    addedBy: string;
    addedAt: Date;
}
export declare function apply(ctx: Context): void;
