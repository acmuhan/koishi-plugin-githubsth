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
    constructor(ctx: Context, config: Config);
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
    private resolveRuleTheme;
    private resolveRuleStyle;
    private formatByEvent;
    private enqueueDigest;
    private flushDigest;
    private prepareOutboundMessage;
    private renderTextAsImage;
    private normalizeRenderedImage;
    private extractRepoName;
    private patchPayloadForEvent;
    private buildEventDedupKey;
    private shouldProcessEvent;
    private cleanupDedupTable;
    private sendMessage;
    private sendWithRetry;
    private sleep;
    private getPreviewPayload;
}
