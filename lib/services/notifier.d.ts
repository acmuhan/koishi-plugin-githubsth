import { Context, Service } from 'koishi';
import { Config, RenderMode, RenderStyle, RenderTheme } from '../config';
declare module 'koishi' {
    interface Context {
        githubsthNotifier: Notifier;
    }
}
export declare class Notifier extends Service {
    config: Config;
    static inject: string[];
    private readonly recentEventKeys;
    private readonly memoryDedupWindowMs;
    private dedupWriteCounter;
    private runtimeRenderMode;
    private readonly digestBuckets;
    private healthCheckTimer;
    constructor(ctx: Context, config: Config);
    /** 启动健康检查：定期检查数据库连接和订阅状态 */
    private startHealthCheck;
    /** 执行健康检查 */
    private performHealthCheck;
    listThemes(): RenderTheme[];
    normalizeTheme(theme?: string | null): RenderTheme | null;
    listStyles(): RenderStyle[];
    normalizeStyle(style?: string | null): RenderStyle | null;
    setRenderMode(mode: RenderMode): void;
    getRenderMode(): RenderMode;
    getRenderStatus(): {
        mode: RenderMode;
        configuredMode: RenderMode;
        fallback: import("../config").RenderFallback;
        theme: RenderTheme;
        style: RenderStyle;
        width: number;
        timeoutMs: number;
        digestEnabled: boolean;
        digestWindowSec: number;
        digestMaxItems: number;
        hasPuppeteer: boolean;
    };
    renderPreview(event?: string, theme?: RenderTheme | null): Promise<any>;
    private registerListeners;
    private handleEvent;
    /**
     * 将新适配器的结构化事件数据转换为 formatter 能用的扁平格式
     * 兼容旧格式 (repository.full_name, sender.login 等)
     */
    private buildFlatPayload;
    private resolveRuleTheme;
    private resolveRuleStyle;
    private formatByEvent;
    private enqueueDigest;
    private flushDigest;
    private prepareOutboundMessage;
    private renderTextAsImage;
    private normalizeRenderedImage;
    private extractRepoName;
    private buildEventDedupKey;
    private shouldProcessEvent;
    private cleanupDedupTable;
    private sendMessage;
    private sendWithRetry;
    private getPreviewPayload;
}
