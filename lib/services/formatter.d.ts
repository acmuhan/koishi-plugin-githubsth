import { Context, Service } from 'koishi';
import type { Config } from '../config';
declare module 'koishi' {
    interface Context {
        githubsthFormatter: Formatter;
    }
}
export declare class Formatter extends Service {
    private readonly locale;
    constructor(ctx: Context, config?: Partial<Config>);
    formatPush(payload: any): string | null;
    formatIssue(payload: any): string;
    formatPullRequest(payload: any): string;
    formatStar(payload: any): string | null;
    formatFork(payload: any): string;
    formatRelease(payload: any): string | null;
    formatDiscussion(payload: any): string;
    formatWorkflowRun(payload: any): string | null;
    formatIssueComment(payload: any): string | null;
    formatPullRequestReview(payload: any): string | null;
    private summarizeCommentBody;
    private mapAction;
    private t;
    private render;
}
