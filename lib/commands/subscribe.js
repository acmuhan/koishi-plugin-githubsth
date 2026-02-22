"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = apply;
function apply(ctx) {
    const logger = ctx.logger('githubsth');
    ctx.command('githubsth.subscribe <repo> [events:text]', '订阅 GitHub 仓库')
        .alias('gh.sub')
        .action(async ({ session }, repo, eventsStr) => {
        if (!repo)
            return '请指定仓库名称 (owner/repo)。';
        if (!session?.channelId)
            return '请在群组中使用此命令。';
        // Check trusted repo
        const trusted = await ctx.database.get('github_trusted_repo', { repo, enabled: true });
        if (trusted.length === 0) {
            return '该仓库不在信任列表中，无法订阅。请联系管理员添加。';
        }
        // Parse events
        const events = eventsStr ? eventsStr.split(',').map(e => e.trim()) : ['push', 'issues', 'pull_request']; // Default events
        try {
            await ctx.database.create('github_subscription', {
                repo,
                channelId: session.channelId,
                platform: session.platform || 'unknown',
                events,
            });
            return `已订阅 ${repo} 的 ${events.join(', ')} 事件。`;
        }
        catch (e) {
            logger.warn(e);
            return '订阅失败。';
        }
    });
    ctx.command('githubsth.unsubscribe <repo>', '取消订阅 GitHub 仓库')
        .alias('gh.unsub')
        .action(async ({ session }, repo) => {
        if (!repo)
            return '请指定仓库名称 (owner/repo)。';
        if (!session?.channelId)
            return '请在群组中使用此命令。';
        const result = await ctx.database.remove('github_subscription', {
            repo,
            channelId: session.channelId,
            platform: session.platform || 'unknown',
        });
        if (result.matched === 0)
            return '未找到该订阅。';
        return `已取消订阅 ${repo}。`;
    });
    ctx.command('githubsth.list', '查看当前频道的订阅')
        .alias('gh.list')
        .action(async ({ session }) => {
        if (!session?.channelId)
            return '请在群组中使用此命令。';
        const subs = await ctx.database.get('github_subscription', {
            channelId: session.channelId,
            platform: session.platform || 'unknown',
        });
        if (subs.length === 0)
            return '当前频道没有订阅。';
        return subs.map(s => `${s.repo} [${s.events.join(', ')}]`).join('\n');
    });
}
