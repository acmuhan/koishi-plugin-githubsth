"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const koishi_1 = require("koishi");
const renderThemeSchema = koishi_1.Schema.union([
    koishi_1.Schema.const('github-light').description('GitHub 亮色'),
    koishi_1.Schema.const('github-dark').description('GitHub 暗色'),
    koishi_1.Schema.const('aurora').description('极光主题'),
    koishi_1.Schema.const('sunset').description('落日主题'),
    koishi_1.Schema.const('matrix').description('矩阵主题'),
    koishi_1.Schema.const('compact').description('紧凑主题（兼容）'),
    koishi_1.Schema.const('card').description('卡片主题（兼容）'),
    koishi_1.Schema.const('terminal').description('终端主题（兼容）'),
]);
const renderStyleSchema = koishi_1.Schema.union([
    koishi_1.Schema.const('auto').description('跟随主题默认排版'),
    koishi_1.Schema.const('github').description('GitHub 排版'),
    koishi_1.Schema.const('glass').description('玻璃排版'),
    koishi_1.Schema.const('neon').description('霓虹排版'),
    koishi_1.Schema.const('compact').description('紧凑排版'),
    koishi_1.Schema.const('card').description('卡片排版'),
    koishi_1.Schema.const('terminal').description('终端排版'),
]);
exports.Config = koishi_1.Schema.object({
    defaultOwner: koishi_1.Schema.string().description('默认仓库拥有者。'),
    defaultRepo: koishi_1.Schema.string().description('默认仓库名称。'),
    debug: koishi_1.Schema.boolean().default(false).description('启用调试日志。'),
    logUnhandledEvents: koishi_1.Schema.boolean().default(false).description('记录未处理的 Webhook 事件。'),
    enableSessionFallback: koishi_1.Schema.boolean().default(true).description('启用消息会话兜底解析。'),
    dedupRetentionHours: koishi_1.Schema.number().min(1).max(720).default(72).description('幂等去重记录保留时长（小时）。'),
    sendRetryCount: koishi_1.Schema.number().min(0).max(10).default(2).description('发送失败重试次数。'),
    sendRetryBaseDelayMs: koishi_1.Schema.number().min(100).max(30000).default(800).description('重试基准退避间隔（毫秒）。'),
    formatterLocale: koishi_1.Schema.union([
        koishi_1.Schema.const('zh-CN').description('中文'),
        koishi_1.Schema.const('en-US').description('英文'),
    ]).default('zh-CN').description('通知文案语言。'),
    renderMode: koishi_1.Schema.union([
        koishi_1.Schema.const('auto').description('优先图片，失败按策略回退'),
        koishi_1.Schema.const('image').description('仅图片'),
        koishi_1.Schema.const('text').description('仅文本'),
    ]).default('auto').description('渲染模式。'),
    renderFallback: koishi_1.Schema.union([
        koishi_1.Schema.const('text').description('图片失败时回退文本'),
        koishi_1.Schema.const('drop').description('图片失败时丢弃本条消息'),
    ]).default('text').description('图片渲染失败回退策略。'),
    renderTheme: renderThemeSchema.default('github-dark').description('默认主题。'),
    renderStyle: renderStyleSchema.default('auto').description('默认排版样式。'),
    renderWidth: koishi_1.Schema.number().min(480).max(1600).default(860).description('图片宽度（像素）。'),
    renderTimeoutMs: koishi_1.Schema.number().min(1000).max(60000).default(12000).description('图片渲染超时（毫秒）。'),
    digestEnabled: koishi_1.Schema.boolean().default(false).description('启用 Digest 聚合推送。'),
    digestWindowSec: koishi_1.Schema.number().min(5).max(3600).default(60).description('Digest 聚合窗口（秒）。'),
    digestMaxItems: koishi_1.Schema.number().min(2).max(100).default(12).description('每条 Digest 最大事件数。'),
    defaultEvents: koishi_1.Schema.array(koishi_1.Schema.string())
        .default(['push', 'issues', 'issue_comment', 'pull_request', 'pull_request_review', 'release', 'star', 'fork'])
        .description('订阅命令默认事件列表。'),
    rules: koishi_1.Schema.array(koishi_1.Schema.object({
        repo: koishi_1.Schema.string().required(),
        channelId: koishi_1.Schema.string().required(),
        platform: koishi_1.Schema.string(),
        events: koishi_1.Schema.array(koishi_1.Schema.string()).default(['push', 'issues', 'pull_request', 'issue_comment', 'pull_request_review']),
        renderTheme: renderThemeSchema,
        renderStyle: renderStyleSchema,
    })).hidden().description('已弃用兼容字段，请使用数据库订阅。'),
});
