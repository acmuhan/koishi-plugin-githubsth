"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Formatter = void 0;
const koishi_1 = require("koishi");
const I18N = {
    'zh-CN': {
        unknownRepo: '未知仓库',
        unknownUser: '未知用户',
        unknownTitle: '无标题',
        unknownState: '未知状态',
        unknownBranch: '未知分支',
        unknownResult: '未知结果',
        emptyComment: '（空评论）',
        hiddenMachinePayload: '检测到自动化签名或编码负载，已隐藏原始内容。',
        pushTitle: '[代码推送]',
        pushBy: '推送者',
        pushBranch: '分支',
        pushCommits: '提交',
        pushMore: '其余 {0} 条提交已省略',
        pushCompare: '比较链接',
        issueTitle: '[Issue 变更]',
        issueCommentTitle: '[Issue 评论]',
        prCommentTitle: '[PR 评论]',
        issueLabel: '议题',
        prTitle: '[PR 变更]',
        prLabel: '拉取请求',
        byUser: '发起人',
        reviewer: '审核人',
        commenter: '评论人',
        content: '内容摘要',
        status: '状态',
        action: '动作',
        link: '链接',
        starTitle: '[收到 Star]',
        starText: '{0} 为仓库点了 Star',
        starCount: '当前 Star',
        forkTitle: '[仓库 Fork]',
        forkText: '{0} Fork 了仓库',
        forkNewRepo: '新仓库',
        releaseTitle: '[版本发布]',
        releaseTag: '版本号',
        releaseName: '版本标题',
        discussionTitle: '[Discussion 变更]',
        workflowTitle: '[工作流完成]',
        workflowName: '工作流',
        workflowResult: '结果',
        workflowBranch: '分支',
        reviewTitle: '[PR Review]',
        actionMap: {
            opened: '已创建',
            closed: '已关闭',
            reopened: '已重新打开',
            edited: '已编辑',
            deleted: '已删除',
            pinned: '已置顶',
            unpinned: '已取消置顶',
            submitted: '已提交',
            created: '已创建',
            synchronize: '已同步',
            ready_for_review: '可审核',
            published: '已发布',
            completed: '已完成',
            started: '已开始',
            merged: '已合并',
            updated: '已更新',
        },
    },
    'en-US': {
        unknownRepo: 'Unknown repository',
        unknownUser: 'Unknown user',
        unknownTitle: 'Untitled',
        unknownState: 'Unknown state',
        unknownBranch: 'Unknown branch',
        unknownResult: 'Unknown result',
        emptyComment: '(empty comment)',
        hiddenMachinePayload: 'Detected automated signature/encoded payload. Raw content hidden.',
        pushTitle: '[Push Event]',
        pushBy: 'Pusher',
        pushBranch: 'Branch',
        pushCommits: 'Commits',
        pushMore: '{0} more commits omitted',
        pushCompare: 'Compare',
        issueTitle: '[Issue Update]',
        issueCommentTitle: '[Issue Comment]',
        prCommentTitle: '[PR Comment]',
        issueLabel: 'Issue',
        prTitle: '[PR Update]',
        prLabel: 'Pull Request',
        byUser: 'By',
        reviewer: 'Reviewer',
        commenter: 'Commenter',
        content: 'Summary',
        status: 'Status',
        action: 'Action',
        link: 'Link',
        starTitle: '[New Star]',
        starText: '{0} starred the repository',
        starCount: 'Stars',
        forkTitle: '[Repository Forked]',
        forkText: '{0} forked the repository',
        forkNewRepo: 'New repository',
        releaseTitle: '[Release Published]',
        releaseTag: 'Tag',
        releaseName: 'Release name',
        discussionTitle: '[Discussion Update]',
        workflowTitle: '[Workflow Completed]',
        workflowName: 'Workflow',
        workflowResult: 'Result',
        workflowBranch: 'Branch',
        reviewTitle: '[PR Review]',
        actionMap: {
            opened: 'opened',
            closed: 'closed',
            reopened: 'reopened',
            edited: 'edited',
            deleted: 'deleted',
            pinned: 'pinned',
            unpinned: 'unpinned',
            submitted: 'submitted',
            created: 'created',
            synchronize: 'synchronized',
            ready_for_review: 'ready for review',
            published: 'published',
            completed: 'completed',
            started: 'started',
            merged: 'merged',
            updated: 'updated',
        },
    },
};
class Formatter extends koishi_1.Service {
    // @ts-ignore
    constructor(ctx, config) {
        super(ctx, 'githubsthFormatter');
        this.locale = config?.formatterLocale === 'en-US' ? 'en-US' : 'zh-CN';
        ctx.logger('githubsth').info(`Formatter service initialized (${this.locale})`);
    }
    formatPush(payload) {
        const repository = payload.repository?.full_name || this.t('unknownRepo');
        const pusher = payload.pusher?.name || payload.sender?.login || this.t('unknownUser');
        const branch = payload.ref ? String(payload.ref).replace('refs/heads/', '') : this.t('unknownBranch');
        const commits = Array.isArray(payload.commits) ? payload.commits : [];
        if (commits.length === 0)
            return null;
        const preview = commits.slice(0, 5).map((commit) => {
            const hash = commit.id?.slice(0, 7) || '0000000';
            const message = (commit.message || 'No message').split('\n')[0];
            const author = commit.author?.name || this.t('unknownUser');
            return `- [${hash}] ${message} - ${author}`;
        }).join('\n');
        const restCount = commits.length - 5;
        const restLine = restCount > 0 ? `\n${this.t('pushMore', [restCount])}` : '';
        const compareLine = payload.compare ? `\n${this.t('pushCompare')}: ${payload.compare}` : '';
        return this.render([
            `${this.t('pushTitle')} ${repository}`,
            `${this.t('pushBy')}: ${pusher}`,
            `${this.t('pushBranch')}: ${branch}`,
            `${this.t('pushCommits')}:\n${preview}${restLine}${compareLine}`,
        ]);
    }
    formatIssue(payload) {
        const issue = payload.issue || {};
        const repository = payload.repository?.full_name || this.t('unknownRepo');
        const actor = payload.sender?.login || issue.user?.login || this.t('unknownUser');
        const action = this.mapAction(payload.action);
        return this.render([
            `${this.t('issueTitle')} ${repository}`,
            `${this.t('action')}: ${action}`,
            `${this.t('issueLabel')}: #${issue.number ?? '?'} ${issue.title || this.t('unknownTitle')}`,
            `${this.t('byUser')}: ${actor}`,
            `${this.t('link')}: ${issue.html_url || ''}`,
        ]);
    }
    formatPullRequest(payload) {
        const pr = payload.pull_request || {};
        const repository = payload.repository?.full_name || this.t('unknownRepo');
        const actor = payload.sender?.login || pr.user?.login || this.t('unknownUser');
        const action = this.mapAction(payload.action);
        return this.render([
            `${this.t('prTitle')} ${repository}`,
            `${this.t('action')}: ${action}`,
            `${this.t('prLabel')}: #${pr.number ?? '?'} ${pr.title || this.t('unknownTitle')}`,
            `${this.t('byUser')}: ${actor}`,
            `${this.t('status')}: ${pr.state || this.t('unknownState')}`,
            `${this.t('link')}: ${pr.html_url || ''}`,
        ]);
    }
    formatStar(payload) {
        if (payload.action !== 'created')
            return null;
        const repository = payload.repository?.full_name || this.t('unknownRepo');
        const actor = payload.sender?.login || this.t('unknownUser');
        const starCount = payload.repository?.stargazers_count ?? '?';
        return this.render([
            `${this.t('starTitle')} ${repository}`,
            this.t('starText', [actor]),
            `${this.t('starCount')}: ${starCount}`,
        ]);
    }
    formatFork(payload) {
        const repository = payload.repository?.full_name || this.t('unknownRepo');
        const actor = payload.sender?.login || this.t('unknownUser');
        const forkee = payload.forkee?.full_name || this.t('unknownRepo');
        return this.render([
            `${this.t('forkTitle')} ${repository}`,
            this.t('forkText', [actor]),
            `${this.t('forkNewRepo')}: ${forkee}`,
        ]);
    }
    formatRelease(payload) {
        if (payload.action !== 'published')
            return null;
        const repository = payload.repository?.full_name || this.t('unknownRepo');
        const release = payload.release || {};
        return this.render([
            `${this.t('releaseTitle')} ${repository}`,
            `${this.t('releaseTag')}: ${release.tag_name || 'unknown'}`,
            `${this.t('releaseName')}: ${release.name || this.t('unknownTitle')}`,
            `${this.t('link')}: ${release.html_url || ''}`,
        ]);
    }
    formatDiscussion(payload) {
        const discussion = payload.discussion || {};
        const repository = payload.repository?.full_name || this.t('unknownRepo');
        const actor = payload.sender?.login || discussion.user?.login || this.t('unknownUser');
        const action = this.mapAction(payload.action);
        return this.render([
            `${this.t('discussionTitle')} ${repository}`,
            `${this.t('action')}: ${action}`,
            `Discussion: #${discussion.number ?? '?'} ${discussion.title || this.t('unknownTitle')}`,
            `${this.t('byUser')}: ${actor}`,
            `${this.t('link')}: ${discussion.html_url || ''}`,
        ]);
    }
    formatWorkflowRun(payload) {
        if (payload.action !== 'completed')
            return null;
        const repository = payload.repository?.full_name || this.t('unknownRepo');
        const workflow = payload.workflow_run || {};
        const result = workflow.conclusion || this.t('unknownResult');
        const icon = result === 'success' ? '[OK]' : (result === 'failure' ? '[FAIL]' : '[INFO]');
        return this.render([
            `${this.t('workflowTitle')} ${repository}`,
            `${this.t('workflowName')}: ${workflow.name || 'Unknown'}`,
            `${this.t('workflowResult')}: ${icon} ${result}`,
            `${this.t('workflowBranch')}: ${workflow.head_branch || this.t('unknownBranch')}`,
            `${this.t('link')}: ${workflow.html_url || ''}`,
        ]);
    }
    formatIssueComment(payload) {
        if (payload.action !== 'created')
            return null;
        const issue = payload.issue || {};
        const comment = payload.comment || {};
        const repository = payload.repository?.full_name || this.t('unknownRepo');
        const actor = payload.sender?.login || comment.user?.login || this.t('unknownUser');
        const isPrComment = Boolean(issue.pull_request);
        return this.render([
            `${isPrComment ? this.t('prCommentTitle') : this.t('issueCommentTitle')} ${repository}`,
            `${isPrComment ? this.t('prLabel') : this.t('issueLabel')}: #${issue.number ?? '?'} ${issue.title || this.t('unknownTitle')}`,
            `${this.t('commenter')}: ${actor}`,
            `${this.t('content')}: ${this.summarizeCommentBody(comment.body || '')}`,
            `${this.t('link')}: ${comment.html_url || issue.html_url || ''}`,
        ]);
    }
    formatPullRequestReview(payload) {
        if (payload.action !== 'submitted')
            return null;
        const pr = payload.pull_request || {};
        const review = payload.review || {};
        const repository = payload.repository?.full_name || this.t('unknownRepo');
        const actor = payload.sender?.login || review.user?.login || this.t('unknownUser');
        return this.render([
            `${this.t('reviewTitle')} ${repository}`,
            `${this.t('prLabel')}: #${pr.number ?? '?'} ${pr.title || this.t('unknownTitle')}`,
            `${this.t('reviewer')}: ${actor}`,
            `${this.t('status')}: ${review.state || this.t('unknownState')}`,
            `${this.t('link')}: ${review.html_url || pr.html_url || ''}`,
        ]);
    }
    summarizeCommentBody(raw) {
        const content = String(raw || '').replace(/\r/g, '').trim();
        if (!content)
            return this.t('emptyComment');
        if (/^\[vc\]:\s*#[A-Za-z0-9+/=_:-]+/i.test(content)) {
            return this.t('hiddenMachinePayload');
        }
        const oneLine = content.replace(/\n+/g, ' ');
        const looksEncoded = oneLine.length > 120 && !/\s/.test(oneLine.slice(0, 80));
        if (looksEncoded)
            return this.t('hiddenMachinePayload');
        return oneLine.length > 180 ? `${oneLine.slice(0, 180)}...` : oneLine;
    }
    mapAction(action) {
        const normalized = action || 'updated';
        const mapped = I18N[this.locale].actionMap[normalized];
        return mapped || normalized;
    }
    t(key, params = []) {
        const template = I18N[this.locale][key];
        return template.replace(/\{(\d+)\}/g, (_, idx) => String(params[Number(idx)] ?? ''));
    }
    render(lines) {
        return `${lines.join('\n')}\n`;
    }
}
exports.Formatter = Formatter;
