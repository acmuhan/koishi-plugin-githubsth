import { Context, Service, h } from 'koishi'

declare module 'koishi' {
  interface Context {
    formatter: Formatter
  }
}

export class Formatter extends Service {
  constructor(ctx: Context) {
    super(ctx, 'formatter')
  }

  formatPush(payload: any) {
    const { repository, pusher, commits, compare } = payload
    if (!commits || commits.length === 0) return null

    const commitLines = commits.map((c: any) => {
      const shortHash = c.id.substring(0, 7)
      const message = c.message.split('\n')[0]
      return `[${shortHash}] ${message} - ${c.author.name}`
    }).join('\n')

    return h('message', [
      h('text', { content: `[GitHub] ${repository.full_name} 收到新的推送\n` }),
      h('text', { content: `提交者: ${pusher.name}\n` }),
      h('text', { content: `分支: ${payload.ref.replace('refs/heads/', '')}\n` }),
      h('text', { content: `详情: ${compare}\n` }),
      h('text', { content: commitLines })
    ])
  }

  formatIssue(payload: any) {
    const { action, issue, repository, sender } = payload
    return h('message', [
      h('text', { content: `[GitHub] ${repository.full_name} Issue ${action}\n` }),
      h('text', { content: `标题: #${issue.number} ${issue.title}\n` }),
      h('text', { content: `发起人: ${sender.login}\n` }),
      h('text', { content: `链接: ${issue.html_url}` })
    ])
  }

  formatPullRequest(payload: any) {
    const { action, pull_request, repository, sender } = payload
    return h('message', [
      h('text', { content: `[GitHub] ${repository.full_name} PR ${action}\n` }),
      h('text', { content: `标题: #${pull_request.number} ${pull_request.title}\n` }),
      h('text', { content: `发起人: ${sender.login}\n` }),
      h('text', { content: `状态: ${pull_request.state}\n` }),
      h('text', { content: `链接: ${pull_request.html_url}` })
    ])
  }

  formatStar(payload: any) {
    const { action, repository, sender } = payload
    if (action !== 'created') return null
    return h('message', [
      h('text', { content: `[GitHub] ${sender.login} Star 了仓库 ${repository.full_name} 🌟\n` }),
      h('text', { content: `当前 Star 数: ${repository.stargazers_count}` })
    ])
  }

  formatFork(payload: any) {
    const { forkee, repository, sender } = payload
    return h('message', [
      h('text', { content: `[GitHub] ${sender.login} Fork 了仓库 ${repository.full_name}\n` }),
      h('text', { content: `新仓库: ${forkee.full_name}` })
    ])
  }

  formatRelease(payload: any) {
    const { action, release, repository } = payload
    if (action !== 'published') return null
    return h('message', [
      h('text', { content: `[GitHub] ${repository.full_name} 发布了新版本 ${release.tag_name} 🎉\n` }),
      h('text', { content: `标题: ${release.name}\n` }),
      h('text', { content: `链接: ${release.html_url}` })
    ])
  }

  formatDiscussion(payload: any) {
    const { action, discussion, repository, sender } = payload
    return h('message', [
      h('text', { content: `[GitHub] ${repository.full_name} Discussion ${action}\n` }),
      h('text', { content: `标题: #${discussion.number} ${discussion.title}\n` }),
      h('text', { content: `发起人: ${sender.login}\n` }),
      h('text', { content: `链接: ${discussion.html_url}` })
    ])
  }

  formatWorkflowRun(payload: any) {
    const { action, workflow_run, repository } = payload
    if (action !== 'completed') return null
    
    const statusIcon = workflow_run.conclusion === 'success' ? '✅' : '❌'
    return h('message', [
      h('text', { content: `[GitHub] ${repository.full_name} 工作流运行完成 ${statusIcon}\n` }),
      h('text', { content: `工作流: ${workflow_run.name}\n` }),
      h('text', { content: `结果: ${workflow_run.conclusion}\n` }),
      h('text', { content: `分支: ${workflow_run.head_branch}\n` }),
      h('text', { content: `链接: ${workflow_run.html_url}` })
    ])
  }
}
