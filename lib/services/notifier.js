"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notifier = void 0;
const node_buffer_1 = require("node:buffer");
const koishi_1 = require("koishi");
const render_card_1 = require("./render-card");
class Notifier extends koishi_1.Service {
    // @ts-ignore
    constructor(ctx, config) {
        super(ctx, 'githubsthNotifier', true);
        this.config = config;
        this.recentEventKeys = new Map();
        this.memoryDedupWindowMs = 5000;
        this.dedupWriteCounter = 0;
        this.runtimeRenderMode = null;
        this.digestBuckets = new Map();
        this.healthCheckTimer = null;
        this.ctx.logger('githubsth').info('Notifier service initialized');
        this.registerListeners();
        this.startHealthCheck();
    }
    /** 启动健康检查：定期检查数据库连接和订阅状态 */
    startHealthCheck() {
        const interval = 5 * 60 * 1000; // 每 5 分钟检查一次
        this.healthCheckTimer = setInterval(() => {
            void this.performHealthCheck();
        }, interval);
        // 启动后马上检查一次
        void this.performHealthCheck();
    }
    /** 执行健康检查 */
    async performHealthCheck() {
        try {
            // 检查数据库连通性
            const count = await this.ctx.database.get('github_subscription', {});
            if (this.config.debug) {
                this.ctx.logger('githubsth').debug(`Health check OK — ${count.length} active subscriptions`);
            }
        }
        catch (error) {
            this.ctx.logger('githubsth').error('Health check failed — database may be unavailable:', error);
            // 数据库不可用时，5 秒后重试一次，然后等下一轮
            setTimeout(() => {
                this.ctx.logger('githubsth').info('Retrying health check...');
                void this.performHealthCheck();
            }, 5000);
        }
    }
    listThemes() {
        return (0, render_card_1.listRenderThemes)();
    }
    normalizeTheme(theme) {
        return (0, render_card_1.normalizeRenderTheme)(theme);
    }
    listStyles() {
        return (0, render_card_1.listRenderStyles)();
    }
    normalizeStyle(style) {
        return (0, render_card_1.normalizeRenderStyle)(style);
    }
    setRenderMode(mode) {
        this.runtimeRenderMode = mode;
    }
    getRenderMode() {
        return this.runtimeRenderMode || this.config.renderMode;
    }
    getRenderStatus() {
        const puppeteer = this.ctx.puppeteer;
        return {
            mode: this.getRenderMode(),
            configuredMode: this.config.renderMode,
            fallback: this.config.renderFallback,
            theme: this.config.renderTheme,
            style: this.config.renderStyle,
            width: this.config.renderWidth,
            timeoutMs: this.config.renderTimeoutMs,
            digestEnabled: this.config.digestEnabled,
            digestWindowSec: this.config.digestWindowSec,
            digestMaxItems: this.config.digestMaxItems,
            hasPuppeteer: Boolean(puppeteer?.render),
        };
    }
    async renderPreview(event = 'issue_comment', theme) {
        const payload = this.getPreviewPayload(event);
        const text = this.formatByEvent(event, payload)
            || this.formatByEvent('issue_comment', this.getPreviewPayload('issue_comment'))
            || 'Preview unavailable.';
        const resolvedTheme = theme || this.config.renderTheme;
        const resolvedStyle = this.normalizeStyle(this.config.renderStyle) || 'auto';
        const preview = await this.prepareOutboundMessage(text, event, payload, resolvedTheme, resolvedStyle);
        return preview?.message || null;
    }
    registerListeners() {
        const bind = (name, event) => {
            this.ctx.on(name, (payload) => this.handleEvent(event, payload));
        };
        bind('github/issue', 'issues');
        bind('github/issue-comment', 'issue_comment');
        bind('github/pull-request', 'pull_request');
        bind('github/pull-request-review-comment', 'pull_request_review');
        bind('github/workflow-run', 'workflow_run');
        bind('github/push', 'push');
        bind('github/star', 'star');
        bind('github/fork', 'fork');
        bind('github/release', 'release');
        bind('github/discussion', 'discussion');
        if (this.config.enableSessionFallback !== false) {
            this.ctx.on('message-created', (session) => {
                if (session.platform !== 'github')
                    return;
                const payload = session.payload || session.extra || session.data;
                if (!payload)
                    return;
                // 新适配器的 session fallback：payload 已经是结构化事件数据
                // 包含 owner, repo, repoKey, actor, payload(原始), type, action
                const realPayload = payload.payload || payload;
                let eventType = 'unknown';
                if (realPayload.issue && realPayload.comment)
                    eventType = 'issue_comment';
                else if (realPayload.issue)
                    eventType = 'issues';
                else if (realPayload.pullRequest && realPayload.comment)
                    eventType = 'pull_request_review';
                else if (realPayload.pullRequest)
                    eventType = 'pull_request';
                else if (realPayload.commits)
                    eventType = 'push';
                else if (realPayload.forkee)
                    eventType = 'fork';
                else if (realPayload.release)
                    eventType = 'release';
                else if (realPayload.discussion)
                    eventType = 'discussion';
                else if (realPayload.workflowRun)
                    eventType = 'workflow_run';
                else if (realPayload.starred_at !== undefined || payload.action === 'started')
                    eventType = 'star';
                else if (realPayload.repository && (realPayload.action === 'created' || realPayload.action === 'started'))
                    eventType = 'star';
                if (eventType !== 'unknown')
                    void this.handleEvent(eventType, payload);
            });
        }
    }
    async handleEvent(event, payload) {
        // 新适配器 v1.1.2 的 payload 是结构化事件数据
        // 包含 owner, repo, repoKey, actor, action, timestamp
        // 以及对应的 issue, comment, pullRequest, discussion 等
        // realPayload 是原始 GitHub webhook payload（如果存在）
        const realPayload = payload.payload || payload;
        // 从结构化数据中提取 repo 信息
        const repoName = payload.repoKey
            || (payload.owner && payload.repo ? `${payload.owner}/${payload.repo}` : null)
            || this.extractRepoName(payload, realPayload, event)
            || realPayload.repository?.full_name
            || 'Unknown/Repo';
        // 确保 formatter 能读取到数据
        // 构造一个兼容新旧格式的扁平 payload 给 formatter 用
        const flatPayload = this.buildFlatPayload(payload, realPayload, event, repoName);
        if (!(await this.shouldProcessEvent(event, payload, flatPayload, repoName)))
            return;
        const repoNames = [repoName];
        if (repoName !== repoName.toLowerCase())
            repoNames.push(repoName.toLowerCase());
        const dbRules = await this.ctx.database.get('github_subscription', { repo: repoNames });
        const configRules = (this.config.rules || []).filter((rule) => rule.repo === repoName || rule.repo === repoName.toLowerCase() || rule.repo === '*');
        const allRules = [
            ...dbRules.map((rule) => ({ ...rule, platform: rule.platform })),
            ...configRules,
        ];
        const matchedRules = allRules.filter((rule) => rule.events.includes('*') || rule.events.includes(event));
        if (!matchedRules.length)
            return;
        const uniqueRules = Array.from(new Map(matchedRules.map((rule) => [`${repoName}|${rule.channelId}`, rule])).values());
        const textMessage = this.formatByEvent(event, flatPayload);
        if (!textMessage)
            return;
        for (const rule of uniqueRules) {
            const theme = this.resolveRuleTheme(rule);
            const style = this.resolveRuleStyle(rule);
            if (this.config.digestEnabled) {
                this.enqueueDigest({ event, repo: repoName, text: textMessage, payload: flatPayload, theme, style, rule });
                continue;
            }
            const outbound = await this.prepareOutboundMessage(textMessage, event, flatPayload, theme, style);
            if (!outbound)
                continue;
            await this.sendMessage(rule, outbound);
        }
    }
    /**
     * 将新适配器的结构化事件数据转换为 formatter 能用的扁平格式
     * 兼容旧格式 (repository.full_name, sender.login 等)
     */
    buildFlatPayload(payload, realPayload, event, repoName) {
        // 如果已经是旧格式（有 repository.full_name），直接返回
        if (realPayload.repository?.full_name)
            return realPayload;
        const flat = { ...realPayload };
        const actor = payload.actor || realPayload.actor || {};
        const actorLogin = actor.login || actor.name || 'GitHub';
        // 构造 repository 对象
        if (!flat.repository) {
            flat.repository = {
                full_name: repoName,
                stargazers_count: realPayload.repository?.stargazers_count
                    || payload.repository?.stargazers_count
                    || 0,
                html_url: `https://github.com/${repoName}`,
            };
        }
        // 构造 sender
        if (!flat.sender) {
            flat.sender = {
                login: actorLogin,
                id: actor.id || 0,
                avatar_url: actor.avatar_url || '',
            };
        }
        // 统一字段名：新适配器用 camelCase，旧格式用 snake_case
        // issue -> 已有，不变
        // pullRequest -> 需要映射到 pull_request
        if (payload.pullRequest && !flat.pull_request) {
            flat.pull_request = payload.pullRequest;
        }
        if (payload.workflowRun && !flat.workflow_run) {
            flat.workflow_run = payload.workflowRun;
        }
        if (payload.workflow && !flat.workflow) {
            flat.workflow = payload.workflow;
        }
        if (payload.headCommit && !flat.head_commit) {
            flat.head_commit = payload.headCommit;
        }
        // action
        if (payload.action && !flat.action) {
            flat.action = payload.action;
        }
        // 补全其他字段
        if (!flat.pusher && payload.actor) {
            flat.pusher = { name: actorLogin };
        }
        return flat;
    }
    resolveRuleTheme(rule) {
        return this.normalizeTheme(rule.renderTheme) || this.normalizeTheme(this.config.renderTheme) || 'github-dark';
    }
    resolveRuleStyle(rule) {
        return this.normalizeStyle(rule.renderStyle) || this.normalizeStyle(this.config.renderStyle) || 'auto';
    }
    formatByEvent(event, payload) {
        switch (event) {
            case 'push': return this.ctx.githubsthFormatter.formatPush(payload);
            case 'issues': return this.ctx.githubsthFormatter.formatIssue(payload);
            case 'pull_request': return this.ctx.githubsthFormatter.formatPullRequest(payload);
            case 'star': return this.ctx.githubsthFormatter.formatStar(payload);
            case 'fork': return this.ctx.githubsthFormatter.formatFork(payload);
            case 'release': return this.ctx.githubsthFormatter.formatRelease(payload);
            case 'discussion': return this.ctx.githubsthFormatter.formatDiscussion(payload);
            case 'workflow_run': return this.ctx.githubsthFormatter.formatWorkflowRun(payload);
            case 'issue_comment': return this.ctx.githubsthFormatter.formatIssueComment(payload);
            case 'pull_request_review': return this.ctx.githubsthFormatter.formatPullRequestReview(payload);
            default: return null;
        }
    }
    enqueueDigest(item) {
        const key = `${item.rule.platform || '*'}|${item.rule.channelId}|${item.repo}`;
        let bucket = this.digestBuckets.get(key);
        if (!bucket) {
            bucket = {
                key,
                repo: item.repo,
                rule: item.rule,
                theme: item.theme,
                style: item.style,
                items: [],
            };
            bucket.timer = setTimeout(() => void this.flushDigest(key), Math.max(5, this.config.digestWindowSec) * 1000);
            this.digestBuckets.set(key, bucket);
        }
        bucket.items.push(item);
        bucket.theme = item.theme;
        bucket.style = item.style;
        if (bucket.items.length >= Math.max(2, this.config.digestMaxItems)) {
            if (bucket.timer)
                clearTimeout(bucket.timer);
            bucket.timer = undefined;
            void this.flushDigest(key);
        }
    }
    async flushDigest(key) {
        const bucket = this.digestBuckets.get(key);
        if (!bucket)
            return;
        this.digestBuckets.delete(key);
        const items = bucket.items;
        if (!items.length)
            return;
        const summaryLines = items.slice(0, Math.max(2, this.config.digestMaxItems)).map((item) => {
            const firstLine = String(item.text || '').split('\n')[0].replace(/\s+/g, ' ').trim();
            return `- [${item.event}] ${firstLine.slice(0, 120)}`;
        });
        const digestText = [
            `[GitHub Digest] ${bucket.repo}`,
            `count: ${items.length}`,
            ...summaryLines,
        ].join('\n');
        const digestPayload = {
            action: 'digest',
            repository: { full_name: bucket.repo },
            sender: { login: 'digest-bot' },
            __digestItems: items.map((item) => ({ event: item.event, summary: String(item.text || '').split('\n')[0] })),
        };
        const outbound = await this.prepareOutboundMessage(digestText, 'digest', digestPayload, bucket.theme, bucket.style);
        if (!outbound)
            return;
        await this.sendMessage(bucket.rule, outbound);
    }
    async prepareOutboundMessage(textMessage, event, payload, theme, style) {
        const mode = this.getRenderMode();
        if (mode === 'text')
            return { message: textMessage, text: textMessage, isImage: false };
        const imageMessage = await this.renderTextAsImage(textMessage, event, payload, theme, style);
        if (imageMessage)
            return { message: imageMessage, text: textMessage, isImage: true };
        if (mode === 'image' && this.config.renderFallback === 'drop')
            return null;
        return { message: textMessage, text: textMessage, isImage: false };
    }
    async renderTextAsImage(textMessage, event, payload, theme, style) {
        const puppeteer = this.ctx.puppeteer;
        if (!puppeteer || typeof puppeteer.render !== 'function')
            return null;
        try {
            const html = (0, render_card_1.buildRenderHtml)(textMessage, event, payload, theme, this.config.renderWidth || 860, style);
            const task = puppeteer.render(html);
            const timeout = this.config.renderTimeoutMs || 12000;
            const rendered = await Promise.race([
                task,
                new Promise((resolve) => setTimeout(() => resolve(null), timeout)),
            ]);
            if (!rendered)
                return null;
            return this.normalizeRenderedImage(rendered);
        }
        catch (error) {
            this.ctx.logger('githubsth').warn('Image render failed:', error);
            return null;
        }
    }
    normalizeRenderedImage(rendered) {
        if (!rendered)
            return null;
        if (typeof rendered === 'string') {
            const trimmed = rendered.trim();
            if (trimmed.startsWith('<img'))
                return trimmed;
            if (trimmed.startsWith('data:image/'))
                return koishi_1.h.image(trimmed);
            return null;
        }
        if (node_buffer_1.Buffer.isBuffer(rendered))
            return koishi_1.h.image(rendered, 'image/png');
        if (rendered instanceof Uint8Array)
            return koishi_1.h.image(node_buffer_1.Buffer.from(rendered), 'image/png');
        return null;
    }
    extractRepoName(payload, realPayload, event) {
        let repoName = realPayload.repository?.full_name;
        if (!repoName && realPayload.issue?.repository_url) {
            const parts = String(realPayload.issue.repository_url).split('/');
            if (parts.length >= 2)
                repoName = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
        }
        if (!repoName && realPayload.pull_request?.base?.repo?.full_name)
            repoName = realPayload.pull_request.base.repo.full_name;
        if (!repoName && realPayload.pullRequest?.base?.repo?.full_name)
            repoName = realPayload.pullRequest.base.repo.full_name;
        if (!repoName && typeof payload.repoKey === 'string' && payload.repoKey.includes('/'))
            repoName = payload.repoKey;
        if (!repoName && typeof payload.owner === 'string' && typeof payload.repo === 'string')
            repoName = `${payload.owner}/${payload.repo}`;
        if (!repoName && typeof payload.repo === 'string' && payload.repo.includes('/'))
            repoName = payload.repo;
        if (!repoName && payload.repository?.full_name)
            repoName = payload.repository.full_name;
        if (!repoName && this.config.logUnhandledEvents) {
            this.ctx.logger('githubsth').warn(`Missing repo info for event: ${event}. Keys: ${Object.keys(realPayload).join(', ')}`);
        }
        return repoName;
    }
    buildEventDedupKey(event, payload, realPayload, repoName) {
        const keyRepo = repoName || payload.repoKey || `${payload.owner || ''}/${payload.repo || ''}` || realPayload.repository?.full_name || 'unknown/repo';
        const action = realPayload.action || payload.action || '';
        const commentId = realPayload.comment?.id || payload.comment?.id || '';
        const issueId = realPayload.issue?.id || realPayload.issue?.number || '';
        const prId = realPayload.pull_request?.id || realPayload.pull_request?.number
            || realPayload.pullRequest?.id || realPayload.pullRequest?.number || '';
        const releaseId = realPayload.release?.id || realPayload.release?.tag_name || '';
        const workflowId = realPayload.workflow_run?.id || realPayload.workflow_run?.run_id
            || payload.workflowRun?.id || '';
        const headCommit = realPayload.head_commit?.id || realPayload.after || payload.after
            || realPayload.commits?.[0]?.id || '';
        const explicitId = payload.id || realPayload.id || payload.timestamp || '';
        return [event, keyRepo, action, commentId, issueId, prId, releaseId, workflowId, headCommit, explicitId].join('|');
    }
    async shouldProcessEvent(event, payload, realPayload, repoName) {
        const now = Date.now();
        for (const [key, timestamp] of this.recentEventKeys) {
            if (now - timestamp > this.memoryDedupWindowMs)
                this.recentEventKeys.delete(key);
        }
        const dedupKey = this.buildEventDedupKey(event, payload, realPayload, repoName);
        const recent = this.recentEventKeys.get(dedupKey);
        if (recent && now - recent <= this.memoryDedupWindowMs)
            return false;
        this.recentEventKeys.set(dedupKey, now);
        const exists = await this.ctx.database.get('github_event_dedup', { dedupKey });
        if (exists.length > 0)
            return false;
        try {
            await this.ctx.database.create('github_event_dedup', {
                dedupKey,
                event,
                repo: repoName || realPayload.repository?.full_name || 'unknown/repo',
                createdAt: new Date(),
            });
            this.dedupWriteCounter += 1;
            if (this.dedupWriteCounter % 200 === 0)
                void this.cleanupDedupTable();
        }
        catch (error) {
            if (error?.code === 'SQLITE_CONSTRAINT')
                return false;
            this.ctx.logger('githubsth').warn('Dedup write error:', error?.message || error);
        }
        return true;
    }
    async cleanupDedupTable() {
        const cutoff = new Date(Date.now() - this.config.dedupRetentionHours * 60 * 60 * 1000);
        try {
            await this.ctx.database.remove('github_event_dedup', { createdAt: { $lt: cutoff } });
        }
        catch (error) {
            this.ctx.logger('githubsth').warn('Dedup cleanup error:', error);
        }
    }
    async sendMessage(rule, outbound) {
        const bots = this.ctx.bots.filter((bot) => !rule.platform || bot.platform === rule.platform);
        if (!bots.length)
            return;
        for (const bot of bots) {
            try {
                await this.sendWithRetry(bot, rule.channelId, outbound.message);
                if (this.config.debug)
                    this.ctx.logger('notifier').info(`Sent message to ${rule.channelId} via ${bot.platform}:${bot.selfId}`);
                return;
            }
            catch (sendError) {
                if (outbound.isImage && this.config.renderFallback === 'text') {
                    try {
                        await this.sendWithRetry(bot, rule.channelId, outbound.text);
                        this.ctx.logger('notifier').warn(`Image failed on ${bot.platform}:${bot.selfId}, fallback to text succeeded.`);
                        return;
                    }
                    catch (fallbackError) {
                        this.ctx.logger('notifier').error(`Image + text fallback both failed on ${bot.platform}:${bot.selfId}:`, fallbackError);
                    }
                }
                else {
                    this.ctx.logger('notifier').warn(`Send failed on ${bot.platform}:${bot.selfId}:`, sendError);
                }
            }
        }
        this.ctx.logger('notifier').warn(`Failed to send message to ${rule.channelId}`);
    }
    async sendWithRetry(bot, channelId, message) {
        const retryCount = Math.max(0, this.config.sendRetryCount ?? 0);
        const baseDelay = Math.max(100, this.config.sendRetryBaseDelayMs ?? 800);
        let lastError;
        for (let attempt = 0; attempt <= retryCount; attempt++) {
            try {
                await bot.sendMessage(channelId, message);
                return;
            }
            catch (error) {
                lastError = error;
                if (attempt < retryCount) {
                    const delay = baseDelay * Math.pow(2, attempt);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }
    getPreviewPayload(event) {
        const mockRepo = 'owner/repo';
        switch (event) {
            case 'push':
                return {
                    repository: { full_name: mockRepo, html_url: `https://github.com/${mockRepo}` },
                    sender: { login: 'octocat' },
                    ref: 'refs/heads/main',
                    commits: [
                        { id: 'abc123', message: 'feat: add new feature', author: { name: 'octocat' } },
                    ],
                    compare: `https://github.com/${mockRepo}/compare/old..new`,
                    pusher: { name: 'octocat' },
                };
            case 'issues':
                return {
                    repository: { full_name: mockRepo, html_url: `https://github.com/${mockRepo}` },
                    sender: { login: 'octocat' },
                    action: 'opened',
                    issue: { number: 1, title: 'Example Issue', html_url: `https://github.com/${mockRepo}/issues/1`, user: { login: 'octocat' } },
                };
            case 'issue_comment':
                return {
                    repository: { full_name: mockRepo, html_url: `https://github.com/${mockRepo}` },
                    sender: { login: 'octocat' },
                    action: 'created',
                    issue: { number: 1, title: 'Example Issue', html_url: `https://github.com/${mockRepo}/issues/1`, user: { login: 'octocat' } },
                    comment: { body: 'This is a sample comment', html_url: `https://github.com/${mockRepo}/issues/1#issuecomment-1` },
                };
            case 'pull_request':
                return {
                    repository: { full_name: mockRepo, html_url: `https://github.com/${mockRepo}` },
                    sender: { login: 'octocat' },
                    action: 'opened',
                    pull_request: { number: 1, title: 'Example PR', html_url: `https://github.com/${mockRepo}/pull/1`, user: { login: 'octocat' } },
                };
            case 'pull_request_review':
                return {
                    repository: { full_name: mockRepo, html_url: `https://github.com/${mockRepo}` },
                    sender: { login: 'octocat' },
                    action: 'submitted',
                    pull_request: { number: 1, title: 'Example PR', html_url: `https://github.com/${mockRepo}/pull/1`, user: { login: 'octocat' } },
                    review: { state: 'approved', html_url: `https://github.com/${mockRepo}/pull/1#pullrequestreview-1` },
                };
            case 'star':
                return {
                    repository: { full_name: mockRepo, stargazers_count: 42, html_url: `https://github.com/${mockRepo}` },
                    sender: { login: 'octocat' },
                    action: 'created',
                };
            case 'fork':
                return {
                    repository: { full_name: mockRepo, html_url: `https://github.com/${mockRepo}` },
                    sender: { login: 'octocat' },
                    forkee: { full_name: 'octocat/repo', html_url: `https://github.com/octocat/repo` },
                };
            case 'release':
                return {
                    repository: { full_name: mockRepo, html_url: `https://github.com/${mockRepo}` },
                    sender: { login: 'octocat' },
                    action: 'published',
                    release: { tag_name: 'v1.0.0', name: 'Initial Release', html_url: `https://github.com/${mockRepo}/releases/v1.0.0` },
                };
            case 'discussion':
                return {
                    repository: { full_name: mockRepo, html_url: `https://github.com/${mockRepo}` },
                    sender: { login: 'octocat' },
                    action: 'created',
                    discussion: { number: 1, title: 'Example Discussion', html_url: `https://github.com/${mockRepo}/discussions/1`, user: { login: 'octocat' } },
                };
            case 'workflow_run':
                return {
                    repository: { full_name: mockRepo, html_url: `https://github.com/${mockRepo}` },
                    sender: { login: 'octocat' },
                    action: 'completed',
                    workflow_run: { name: 'CI', conclusion: 'success', head_branch: 'main', html_url: `https://github.com/${mockRepo}/actions/runs/1` },
                };
            default:
                return null;
        }
    }
}
exports.Notifier = Notifier;
Notifier.inject = ['githubsthFormatter', 'database'];
