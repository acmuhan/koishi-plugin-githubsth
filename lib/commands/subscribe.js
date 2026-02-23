"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = apply;
function apply(ctx, config) {
    const logger = ctx.logger('githubsth');
    const repoRegex = /^[\w-]+\/[\w-.]+$/;
    const validEvents = [
        'push', 'issues', 'issue_comment', 'pull_request',
        'pull_request_review', 'star', 'fork', 'release',
        'discussion', 'workflow_run',
    ];
    const defaultConfigEvents = config.defaultEvents || ['push', 'issues', 'issue_comment', 'pull_request', 'pull_request_review', 'release', 'star', 'fork'];
    ctx.command('githubsth.subscribe <repo> [events:text]', '订阅 GitHub 仓库事件')
        .alias('gh.sub')
        .usage(`
订阅 GitHub 仓库通知。若省略 events，将使用默认事件：${defaultConfigEvents.join(', ')}

示例：
- gh.sub koishijs/koishi
- gh.sub koishijs/koishi push,issues,star
`)
        .action(async ({ session }, repo, eventsStr) => {
        if (!repo)
            return session?.text('commands.githubsth.subscribe.messages.specify_repo');
        if (!repoRegex.test(repo))
            return session?.text('commands.githubsth.subscribe.messages.invalid_repo');
        if (!session?.channelId)
            return session?.text('commands.githubsth.subscribe.messages.run_in_channel');
        const trusted = await ctx.database.get('github_trusted_repo', { repo, enabled: true });
        if (trusted.length === 0)
            return session?.text('commands.githubsth.subscribe.messages.repo_not_trusted');
        let events;
        if (eventsStr) {
            events = eventsStr.split(/[,\s，]+/).map((e) => e.trim()).filter(Boolean).map((e) => e.replace(/-/g, '_'));
            const invalidEvents = events.filter((e) => !validEvents.includes(e) && e !== '*');
            if (invalidEvents.length) {
                return session?.text('commands.githubsth.subscribe.messages.invalid_events', [invalidEvents.join(', '), validEvents.join(', ')]);
            }
        }
        else {
            events = [...defaultConfigEvents];
        }
        try {
            const existing = await ctx.database.get('github_subscription', {
                repo,
                channelId: session.channelId,
                platform: session.platform || 'unknown',
            });
            if (existing.length > 0) {
                await ctx.database.set('github_subscription', { id: existing[0].id }, { events });
                return session?.text('commands.githubsth.subscribe.messages.updated', [repo, events.join(', ')]);
            }
            await ctx.database.create('github_subscription', {
                repo,
                channelId: session.channelId,
                platform: session.platform || 'unknown',
                events,
            });
            return session?.text('commands.githubsth.subscribe.messages.created', [repo, events.join(', ')]);
        }
        catch (error) {
            logger.warn(error);
            return session?.text('commands.githubsth.subscribe.messages.failed');
        }
    });
    ctx.command('githubsth.unsubscribe <repo>', '取消订阅 GitHub 仓库')
        .alias('gh.unsub')
        .action(async ({ session }, repo) => {
        if (!repo)
            return session?.text('commands.githubsth.unsubscribe.messages.specify_repo');
        if (!session?.channelId)
            return session?.text('commands.githubsth.unsubscribe.messages.run_in_channel');
        const result = await ctx.database.remove('github_subscription', {
            repo,
            channelId: session.channelId,
            platform: session.platform || 'unknown',
        });
        if (result.matched === 0)
            return session?.text('commands.githubsth.unsubscribe.messages.not_found');
        return session?.text('commands.githubsth.unsubscribe.messages.success', [repo]);
    });
    ctx.command('githubsth.list', '查看当前频道订阅')
        .alias('gh.list')
        .action(async ({ session }) => {
        if (!session?.channelId)
            return session?.text('commands.githubsth.list.messages.run_in_channel');
        const subs = await ctx.database.get('github_subscription', {
            channelId: session.channelId,
            platform: session.platform || 'unknown',
        });
        if (subs.length === 0)
            return session?.text('commands.githubsth.list.messages.empty');
        return subs
            .map((sub) => session?.text('commands.githubsth.list.messages.item', [
            sub.repo,
            sub.events.join(', '),
            sub.renderTheme || '默认',
            sub.renderStyle || '默认',
        ]) || `${sub.repo} [${sub.events.join(', ')}]`)
            .join('\n');
    });
}
