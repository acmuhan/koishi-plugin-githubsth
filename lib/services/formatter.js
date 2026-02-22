"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Formatter = void 0;
const koishi_1 = require("koishi");
class Formatter extends koishi_1.Service {
    constructor(ctx) {
        super(ctx, 'formatter');
    }
    formatPush(payload) {
        const { repository, pusher, commits, compare } = payload;
        if (!commits || commits.length === 0)
            return null;
        const commitLines = commits.map((c) => {
            const shortHash = c.id.substring(0, 7);
            const message = c.message.split('\n')[0];
            return `[${shortHash}] ${message} - ${c.author.name}`;
        }).join('\n');
        return (0, koishi_1.h)('message', [
            (0, koishi_1.h)('text', { content: `[GitHub] ${repository.full_name} 收到新的推送\n` }),
            (0, koishi_1.h)('text', { content: `提交者: ${pusher.name}\n` }),
            (0, koishi_1.h)('text', { content: `分支: ${payload.ref.replace('refs/heads/', '')}\n` }),
            (0, koishi_1.h)('text', { content: `详情: ${compare}\n` }),
            (0, koishi_1.h)('text', { content: commitLines })
        ]);
    }
    formatIssue(payload) {
        const { action, issue, repository, sender } = payload;
        return (0, koishi_1.h)('message', [
            (0, koishi_1.h)('text', { content: `[GitHub] ${repository.full_name} Issue ${action}\n` }),
            (0, koishi_1.h)('text', { content: `标题: #${issue.number} ${issue.title}\n` }),
            (0, koishi_1.h)('text', { content: `发起人: ${sender.login}\n` }),
            (0, koishi_1.h)('text', { content: `链接: ${issue.html_url}` })
        ]);
    }
    formatPullRequest(payload) {
        const { action, pull_request, repository, sender } = payload;
        return (0, koishi_1.h)('message', [
            (0, koishi_1.h)('text', { content: `[GitHub] ${repository.full_name} PR ${action}\n` }),
            (0, koishi_1.h)('text', { content: `标题: #${pull_request.number} ${pull_request.title}\n` }),
            (0, koishi_1.h)('text', { content: `发起人: ${sender.login}\n` }),
            (0, koishi_1.h)('text', { content: `状态: ${pull_request.state}\n` }),
            (0, koishi_1.h)('text', { content: `链接: ${pull_request.html_url}` })
        ]);
    }
    formatStar(payload) {
        const { action, repository, sender } = payload;
        if (action !== 'created')
            return null;
        return (0, koishi_1.h)('message', [
            (0, koishi_1.h)('text', { content: `[GitHub] ${sender.login} Star 了仓库 ${repository.full_name} 🌟\n` }),
            (0, koishi_1.h)('text', { content: `当前 Star 数: ${repository.stargazers_count}` })
        ]);
    }
    formatFork(payload) {
        const { forkee, repository, sender } = payload;
        return (0, koishi_1.h)('message', [
            (0, koishi_1.h)('text', { content: `[GitHub] ${sender.login} Fork 了仓库 ${repository.full_name}\n` }),
            (0, koishi_1.h)('text', { content: `新仓库: ${forkee.full_name}` })
        ]);
    }
    formatRelease(payload) {
        const { action, release, repository } = payload;
        if (action !== 'published')
            return null;
        return (0, koishi_1.h)('message', [
            (0, koishi_1.h)('text', { content: `[GitHub] ${repository.full_name} 发布了新版本 ${release.tag_name} 🎉\n` }),
            (0, koishi_1.h)('text', { content: `标题: ${release.name}\n` }),
            (0, koishi_1.h)('text', { content: `链接: ${release.html_url}` })
        ]);
    }
    formatDiscussion(payload) {
        const { action, discussion, repository, sender } = payload;
        return (0, koishi_1.h)('message', [
            (0, koishi_1.h)('text', { content: `[GitHub] ${repository.full_name} Discussion ${action}\n` }),
            (0, koishi_1.h)('text', { content: `标题: #${discussion.number} ${discussion.title}\n` }),
            (0, koishi_1.h)('text', { content: `发起人: ${sender.login}\n` }),
            (0, koishi_1.h)('text', { content: `链接: ${discussion.html_url}` })
        ]);
    }
    formatWorkflowRun(payload) {
        const { action, workflow_run, repository } = payload;
        if (action !== 'completed')
            return null;
        const statusIcon = workflow_run.conclusion === 'success' ? '✅' : '❌';
        return (0, koishi_1.h)('message', [
            (0, koishi_1.h)('text', { content: `[GitHub] ${repository.full_name} 工作流运行完成 ${statusIcon}\n` }),
            (0, koishi_1.h)('text', { content: `工作流: ${workflow_run.name}\n` }),
            (0, koishi_1.h)('text', { content: `结果: ${workflow_run.conclusion}\n` }),
            (0, koishi_1.h)('text', { content: `分支: ${workflow_run.head_branch}\n` }),
            (0, koishi_1.h)('text', { content: `链接: ${workflow_run.html_url}` })
        ]);
    }
}
exports.Formatter = Formatter;
