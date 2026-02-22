import { Context, Service, h } from 'koishi';
declare module 'koishi' {
    interface Context {
        formatter: Formatter;
    }
}
export declare class Formatter extends Service {
    constructor(ctx: Context);
    formatPush(payload: any): h | null;
    formatIssue(payload: any): h;
    formatPullRequest(payload: any): h;
    formatStar(payload: any): h | null;
    formatFork(payload: any): h;
    formatRelease(payload: any): h | null;
    formatDiscussion(payload: any): h;
    formatWorkflowRun(payload: any): h | null;
}
