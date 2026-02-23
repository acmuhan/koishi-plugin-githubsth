import { Buffer } from 'node:buffer'
import { Context, Service, h } from 'koishi'
import { Config, RenderMode, RenderStyle, RenderTheme, Rule } from '../config'
import { buildRenderHtml, listRenderStyles, listRenderThemes, normalizeRenderStyle, normalizeRenderTheme } from './render-card'

type Outbound = {
  message: any
  text: string
  isImage: boolean
}

type RuleWithRender = Rule & { renderTheme?: RenderTheme; renderStyle?: RenderStyle }

type DigestItem = {
  event: string
  repo: string
  text: string
  payload: any
  theme: RenderTheme
  style: RenderStyle
  rule: RuleWithRender
}

type DigestBucket = {
  key: string
  repo: string
  rule: RuleWithRender
  theme: RenderTheme
  style: RenderStyle
  items: DigestItem[]
  timer?: NodeJS.Timeout
}

declare module 'koishi' {
  interface Context {
    githubsthNotifier: Notifier
  }
}

export class Notifier extends Service {
  static inject = ['githubsthFormatter', 'database']

  private readonly recentEventKeys = new Map<string, number>()
  private readonly memoryDedupWindowMs = 5000
  private dedupWriteCounter = 0
  private runtimeRenderMode: RenderMode | null = null
  private readonly digestBuckets = new Map<string, DigestBucket>()

  // @ts-ignore
  constructor(ctx: Context, public config: Config) {
    super(ctx, 'githubsthNotifier', true)
    this.ctx.logger('githubsth').info('Notifier service initialized')
    this.registerListeners()
  }

  public listThemes() {
    return listRenderThemes()
  }

  public normalizeTheme(theme?: string | null): RenderTheme | null {
    return normalizeRenderTheme(theme)
  }

  public listStyles() {
    return listRenderStyles()
  }

  public normalizeStyle(style?: string | null): RenderStyle | null {
    return normalizeRenderStyle(style)
  }

  public setRenderMode(mode: RenderMode) {
    this.runtimeRenderMode = mode
  }

  public getRenderMode() {
    return this.runtimeRenderMode || this.config.renderMode
  }

  public getRenderStatus() {
    const puppeteer = (this.ctx as any).puppeteer
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
    }
  }

  public async renderPreview(event: string = 'issue_comment', theme?: RenderTheme | null) {
    const payload = this.getPreviewPayload(event)
    const text = this.formatByEvent(event, payload)
      || this.formatByEvent('issue_comment', this.getPreviewPayload('issue_comment'))
      || 'Preview unavailable.'
    const resolvedTheme = theme || this.config.renderTheme
    const resolvedStyle = this.normalizeStyle(this.config.renderStyle) || 'auto'
    const preview = await this.prepareOutboundMessage(text, event, payload, resolvedTheme, resolvedStyle)
    return preview?.message || null
  }

  private registerListeners() {
    const bind = (name: string, event: string) => {
      this.ctx.on(name as any, (payload: any) => this.handleEvent(event, payload))
    }

    bind('github/issue', 'issues')
    bind('github/issue-comment', 'issue_comment')
    bind('github/pull-request', 'pull_request')
    bind('github/pull-request-review', 'pull_request_review')
    bind('github/workflow-run', 'workflow_run')
    bind('github/push', 'push')
    bind('github/star', 'star')
    bind('github/fork', 'fork')
    bind('github/release', 'release')
    bind('github/discussion', 'discussion')

    bind('github/issues', 'issues')
    bind('github/pull_request', 'pull_request')
    bind('github/workflow_run', 'workflow_run')
    bind('github/issue_comment', 'issue_comment')

    if (this.config.enableSessionFallback !== false) {
      this.ctx.on('message-created', (session) => {
        if (session.platform !== 'github') return
        const payload = (session as any).payload || (session as any).extra || (session as any).data
        if (!payload) return

        const realPayload = payload.payload || payload
        let eventType = 'unknown'
        if (realPayload.issue && realPayload.comment) eventType = 'issue_comment'
        else if (realPayload.issue) eventType = 'issues'
        else if (realPayload.pull_request && realPayload.review) eventType = 'pull_request_review'
        else if (realPayload.pull_request) eventType = 'pull_request'
        else if (realPayload.commits) eventType = 'push'
        else if (realPayload.starred_at !== undefined || realPayload.action === 'started') eventType = 'star'
        else if (realPayload.forkee) eventType = 'fork'
        else if (realPayload.release) eventType = 'release'
        else if (realPayload.discussion) eventType = 'discussion'
        else if (realPayload.workflow_run) eventType = 'workflow_run'
        else if (realPayload.repository && (realPayload.action === 'created' || realPayload.action === 'started')) eventType = 'star'

        if (eventType !== 'unknown') void this.handleEvent(eventType, payload)
      })
    }
  }

  private async handleEvent(event: string, payload: any) {
    const realPayload = payload.payload || payload

    if (payload.actor && !realPayload.sender) {
      const actorLogin = payload.actor.login || payload.actor.name || 'GitHub'
      realPayload.sender = { ...payload.actor, login: actorLogin }
    }

    if (payload.repository && !realPayload.repository) {
      realPayload.repository = payload.repository
    }

    let repoName = this.extractRepoName(payload, realPayload, event)
    if (!realPayload.repository) realPayload.repository = { full_name: repoName || 'Unknown/Repo' }
    else if (!realPayload.repository.full_name) realPayload.repository.full_name = repoName || 'Unknown/Repo'

    if (!realPayload.sender) {
      if (realPayload.issue?.user) realPayload.sender = realPayload.issue.user
      else if (realPayload.pull_request?.user) realPayload.sender = realPayload.pull_request.user
      else if (realPayload.discussion?.user) realPayload.sender = realPayload.discussion.user
      else if (realPayload.pusher) realPayload.sender = { login: realPayload.pusher.name || 'Pusher' }
      else realPayload.sender = { login: 'GitHub' }
    }

    if (!(await this.shouldProcessEvent(event, payload, realPayload, repoName))) return

    this.patchPayloadForEvent(event, realPayload, repoName || 'Unknown/Repo')
    repoName = repoName || realPayload.repository?.full_name
    if (!repoName) return

    const repoNames = [repoName]
    if (repoName !== repoName.toLowerCase()) repoNames.push(repoName.toLowerCase())

    const dbRules = await this.ctx.database.get('github_subscription', { repo: repoNames }) as RuleWithRender[]
    const configRules = (this.config.rules || []).filter((rule) =>
      rule.repo === repoName || rule.repo === repoName.toLowerCase() || rule.repo === '*'
    )

    const allRules: RuleWithRender[] = [
      ...dbRules.map((rule) => ({ ...rule, platform: rule.platform })),
      ...configRules,
    ]

    const matchedRules = allRules.filter((rule) => rule.events.includes('*') || rule.events.includes(event))
    if (!matchedRules.length) return

    const uniqueRules = Array.from(new Map(
      matchedRules.map((rule) => [`${repoName}|${rule.channelId}`, rule] as const)
    ).values())

    const textMessage = this.formatByEvent(event, realPayload)
    if (!textMessage) return

    for (const rule of uniqueRules) {
      const theme = this.resolveRuleTheme(rule)
      const style = this.resolveRuleStyle(rule)
      if (this.config.digestEnabled) {
        this.enqueueDigest({ event, repo: repoName, text: textMessage, payload: realPayload, theme, style, rule })
        continue
      }
      const outbound = await this.prepareOutboundMessage(textMessage, event, realPayload, theme, style)
      if (!outbound) continue
      await this.sendMessage(rule, outbound)
    }
  }

  private resolveRuleTheme(rule: RuleWithRender): RenderTheme {
    return this.normalizeTheme(rule.renderTheme) || this.normalizeTheme(this.config.renderTheme) || 'github-dark'
  }

  private resolveRuleStyle(rule: RuleWithRender): RenderStyle {
    return this.normalizeStyle(rule.renderStyle) || this.normalizeStyle(this.config.renderStyle) || 'auto'
  }

  private formatByEvent(event: string, payload: any) {
    switch (event) {
      case 'push': return this.ctx.githubsthFormatter.formatPush(payload)
      case 'issues': return this.ctx.githubsthFormatter.formatIssue(payload)
      case 'pull_request': return this.ctx.githubsthFormatter.formatPullRequest(payload)
      case 'star': return this.ctx.githubsthFormatter.formatStar(payload)
      case 'fork': return this.ctx.githubsthFormatter.formatFork(payload)
      case 'release': return this.ctx.githubsthFormatter.formatRelease(payload)
      case 'discussion': return this.ctx.githubsthFormatter.formatDiscussion(payload)
      case 'workflow_run': return this.ctx.githubsthFormatter.formatWorkflowRun(payload)
      case 'issue_comment': return this.ctx.githubsthFormatter.formatIssueComment(payload)
      case 'pull_request_review': return this.ctx.githubsthFormatter.formatPullRequestReview(payload)
      default: return null
    }
  }

  private enqueueDigest(item: DigestItem) {
    const key = `${item.rule.platform || '*'}|${item.rule.channelId}|${item.repo}`
    let bucket = this.digestBuckets.get(key)
    if (!bucket) {
      bucket = {
        key,
        repo: item.repo,
        rule: item.rule,
        theme: item.theme,
        style: item.style,
        items: [],
      }
      bucket.timer = setTimeout(() => void this.flushDigest(key), Math.max(5, this.config.digestWindowSec) * 1000)
      this.digestBuckets.set(key, bucket)
    }

    bucket.items.push(item)
    bucket.theme = item.theme
    bucket.style = item.style

    if (bucket.items.length >= Math.max(2, this.config.digestMaxItems)) {
      if (bucket.timer) clearTimeout(bucket.timer)
      bucket.timer = undefined
      void this.flushDigest(key)
    }
  }

  private async flushDigest(key: string) {
    const bucket = this.digestBuckets.get(key)
    if (!bucket) return
    this.digestBuckets.delete(key)

    const items = bucket.items
    if (!items.length) return

    const summaryLines = items.slice(0, Math.max(2, this.config.digestMaxItems)).map((item) => {
      const firstLine = String(item.text || '').split('\n')[0].replace(/\s+/g, ' ').trim()
      return `- [${item.event}] ${firstLine.slice(0, 120)}`
    })

    const digestText = [
      `[GitHub Digest] ${bucket.repo}`,
      `count: ${items.length}`,
      ...summaryLines,
    ].join('\n')

    const digestPayload = {
      action: 'digest',
      repository: { full_name: bucket.repo },
      sender: { login: 'digest-bot' },
      __digestItems: items.map((item) => ({ event: item.event, summary: String(item.text || '').split('\n')[0] })),
    }

    const outbound = await this.prepareOutboundMessage(digestText, 'digest', digestPayload, bucket.theme, bucket.style)
    if (!outbound) return
    await this.sendMessage(bucket.rule, outbound)
  }

  private async prepareOutboundMessage(textMessage: string, event: string, payload: any, theme: RenderTheme, style: RenderStyle): Promise<Outbound | null> {
    const mode = this.getRenderMode()
    if (mode === 'text') return { message: textMessage, text: textMessage, isImage: false }

    const imageMessage = await this.renderTextAsImage(textMessage, event, payload, theme, style)
    if (imageMessage) return { message: imageMessage, text: textMessage, isImage: true }

    if (mode === 'image' && this.config.renderFallback === 'drop') return null
    return { message: textMessage, text: textMessage, isImage: false }
  }

  private async renderTextAsImage(textMessage: string, event: string, payload: any, theme: RenderTheme, style: RenderStyle) {
    const puppeteer = (this.ctx as any).puppeteer
    if (!puppeteer || typeof puppeteer.render !== 'function') return null

    try {
      const html = buildRenderHtml(textMessage, event, payload, theme, this.config.renderWidth || 860, style)
      const task = puppeteer.render(html)
      const timeout = this.config.renderTimeoutMs || 12000
      const rendered = await Promise.race([
        task,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), timeout)),
      ])
      if (!rendered) return null
      return this.normalizeRenderedImage(rendered)
    } catch (error) {
      this.ctx.logger('githubsth').warn('Image render failed:', error)
      return null
    }
  }

  private normalizeRenderedImage(rendered: any) {
    if (!rendered) return null
    if (typeof rendered === 'string') {
      const trimmed = rendered.trim()
      if (trimmed.startsWith('<img')) return trimmed
      if (trimmed.startsWith('data:image/')) return h.image(trimmed)
      return null
    }
    if (Buffer.isBuffer(rendered)) return h.image(rendered, 'image/png')
    if (rendered instanceof Uint8Array) return h.image(Buffer.from(rendered), 'image/png')
    return null
  }

  private extractRepoName(payload: any, realPayload: any, event: string) {
    let repoName = realPayload.repository?.full_name
    if (!repoName && realPayload.issue?.repository_url) {
      const parts = String(realPayload.issue.repository_url).split('/')
      if (parts.length >= 2) repoName = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`
    }
    if (!repoName && realPayload.pull_request?.base?.repo?.full_name) repoName = realPayload.pull_request.base.repo.full_name
    if (!repoName && typeof payload.repoKey === 'string' && payload.repoKey.includes('/')) repoName = payload.repoKey
    if (!repoName && typeof payload.owner === 'string' && typeof payload.repo === 'string') repoName = `${payload.owner}/${payload.repo}`
    if (!repoName && typeof payload.repo === 'string' && payload.repo.includes('/')) repoName = payload.repo
    if (!repoName && payload.repository?.full_name) repoName = payload.repository.full_name
    if (!repoName && this.config.logUnhandledEvents) {
      this.ctx.logger('githubsth').warn(`Missing repo info for event: ${event}. Keys: ${Object.keys(realPayload).join(', ')}`)
    }
    return repoName
  }

  private patchPayloadForEvent(event: string, payload: any, repoName: string) {
    const defaultUser = { login: 'GitHub', id: 0, avatar_url: '' }
    if (!payload.sender) payload.sender = defaultUser
    const defaultRepo = { full_name: repoName, stargazers_count: 0, html_url: `https://github.com/${repoName}` }
    if (!payload.repository) payload.repository = defaultRepo

    switch (event) {
      case 'push':
        if (!payload.pusher) payload.pusher = { name: payload.sender.login }
        if (!payload.commits) payload.commits = []
        if (!payload.ref) payload.ref = 'refs/heads/unknown'
        if (!payload.compare) payload.compare = ''
        for (const commit of payload.commits) {
          if (!commit.author) commit.author = { name: 'Unknown' }
          if (!commit.id) commit.id = '0000000'
          if (!commit.message) commit.message = 'No message'
        }
        break
      case 'issues':
        if (!payload.action) payload.action = 'updated'
        if (!payload.issue) payload.issue = { number: 0, title: 'Unknown Issue', html_url: '', user: payload.sender }
        if (!payload.issue.user) payload.issue.user = payload.sender
        break
      case 'pull_request':
        if (!payload.action) payload.action = 'updated'
        if (!payload.pull_request) payload.pull_request = { number: 0, title: 'Unknown PR', state: 'unknown', html_url: '', user: payload.sender }
        if (!payload.pull_request.user) payload.pull_request.user = payload.sender
        break
      case 'star':
        if (!payload.action || payload.action === 'started') payload.action = 'created'
        if (payload.repository?.stargazers_count === undefined) payload.repository.stargazers_count = '?'
        break
      case 'fork':
        if (!payload.forkee) payload.forkee = { full_name: 'unknown/fork' }
        break
      case 'release':
        if (!payload.action) payload.action = 'published'
        if (!payload.release) payload.release = { tag_name: 'unknown', name: 'Unknown Release', html_url: '' }
        break
      case 'discussion':
        if (!payload.action) payload.action = 'updated'
        if (!payload.discussion) payload.discussion = { number: 0, title: 'Unknown Discussion', html_url: '', user: payload.sender }
        if (!payload.discussion.user) payload.discussion.user = payload.sender
        break
      case 'workflow_run':
        if (!payload.action) payload.action = 'completed'
        if (!payload.workflow_run) payload.workflow_run = { conclusion: 'unknown', name: 'Unknown Workflow', head_branch: 'unknown', html_url: '' }
        break
      case 'issue_comment':
        if (!payload.action) payload.action = 'created'
        if (!payload.issue) payload.issue = { number: 0, title: 'Unknown Issue', html_url: '', user: payload.sender }
        if (!payload.comment) payload.comment = { body: '', html_url: '' }
        if (!payload.issue.user) payload.issue.user = payload.sender
        break
      case 'pull_request_review':
        if (!payload.action) payload.action = 'submitted'
        if (!payload.pull_request) payload.pull_request = { number: 0, title: 'Unknown PR', html_url: '', user: payload.sender }
        if (!payload.review) payload.review = { state: 'unknown', html_url: '' }
        if (!payload.pull_request.user) payload.pull_request.user = payload.sender
        break
    }
  }

  private buildEventDedupKey(event: string, payload: any, realPayload: any, repoName?: string) {
    const keyRepo = repoName || payload.repoKey || `${payload.owner || ''}/${payload.repo || ''}` || realPayload.repository?.full_name || 'unknown/repo'
    const action = realPayload.action || payload.action || ''
    const commentId = realPayload.comment?.id || ''
    const issueId = realPayload.issue?.id || realPayload.issue?.number || ''
    const prId = realPayload.pull_request?.id || realPayload.pull_request?.number || ''
    const releaseId = realPayload.release?.id || realPayload.release?.tag_name || ''
    const workflowId = realPayload.workflow_run?.id || realPayload.workflow_run?.run_id || ''
    const headCommit = realPayload.head_commit?.id || realPayload.after || realPayload.commits?.[0]?.id || ''
    const explicitId = payload.id || realPayload.id || payload.timestamp || ''
    return [event, keyRepo, action, commentId, issueId, prId, releaseId, workflowId, headCommit, explicitId].join('|')
  }

  private async shouldProcessEvent(event: string, payload: any, realPayload: any, repoName?: string) {
    const now = Date.now()
    for (const [key, timestamp] of this.recentEventKeys) {
      if (now - timestamp > this.memoryDedupWindowMs) this.recentEventKeys.delete(key)
    }
    const dedupKey = this.buildEventDedupKey(event, payload, realPayload, repoName)
    const recent = this.recentEventKeys.get(dedupKey)
    if (recent && now - recent <= this.memoryDedupWindowMs) return false
    this.recentEventKeys.set(dedupKey, now)

    const exists = await this.ctx.database.get('github_event_dedup', { dedupKey })
    if (exists.length > 0) return false
    try {
      await this.ctx.database.create('github_event_dedup', {
        dedupKey,
        event,
        repo: repoName || realPayload.repository?.full_name || 'unknown/repo',
        createdAt: new Date(),
      })
      this.dedupWriteCounter += 1
      if (this.dedupWriteCounter % 200 === 0) void this.cleanupDedupTable()
    } catch (error: any) {
      if (error?.code === 'SQLITE_CONSTRAINT') return false
    }
    return true
  }

  private async cleanupDedupTable() {
    const cutoff = new Date(Date.now() - this.config.dedupRetentionHours * 60 * 60 * 1000)
    try {
      await this.ctx.database.remove('github_event_dedup', { createdAt: { $lt: cutoff } as any })
    } catch {}
  }

  private async sendMessage(rule: RuleWithRender, outbound: Outbound) {
    const bots = this.ctx.bots.filter((bot) => !rule.platform || bot.platform === rule.platform)
    if (!bots.length) return

    for (const bot of bots) {
      try {
        await this.sendWithRetry(bot, rule.channelId, outbound.message)
        if (this.config.debug) this.ctx.logger('notifier').info(`Sent message to ${rule.channelId} via ${bot.platform}:${bot.selfId}`)
        return
      } catch {
        if (outbound.isImage && this.config.renderFallback === 'text') {
          try {
            await this.sendWithRetry(bot, rule.channelId, outbound.text)
            this.ctx.logger('notifier').warn(`Image failed on ${bot.platform}:${bot.selfId}, fallback to text succeeded.`)
            return
          } catch {}
        }
      }
    }
    this.ctx.logger('notifier').warn(`Failed to send message to ${rule.channelId}`)
  }

  private async sendWithRetry(bot: any, channelId: string, message: any) {
    const retryCount = Math.max(0, this.config.sendRetryCount ?? 0)
    const baseDelay = Math.max(100, this.config.sendRetryBaseDelayMs ?? 800)
    let lastError: any
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        await bot.sendMessage(channelId, message)
        return
      } catch (error) {
        lastError = error
        if (attempt >= retryCount) break
        await this.sleep(baseDelay * Math.pow(2, attempt))
      }
    }
    throw lastError
  }

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
  }

  private getPreviewPayload(event: string) {
    const payload: any = {
      action: 'created',
      repository: { full_name: 'acmuhan/JackalClientDocs', stargazers_count: 128, forks_count: 12, open_issues_count: 3 },
      sender: { login: 'vercel[bot]' },
      issue: {
        number: 29,
        title: 'Delete demobot',
        html_url: 'https://github.com/acmuhan/JackalClientDocs/issues/29',
        pull_request: { html_url: 'https://github.com/acmuhan/JackalClientDocs/pull/29' },
      },
      comment: { body: '[vc]: digest payload hidden' },
      pull_request: {
        number: 29,
        title: 'Delete demobot',
        state: 'open',
        html_url: 'https://github.com/acmuhan/JackalClientDocs/pull/29',
      },
      workflow_run: {
        name: 'Deploy',
        conclusion: 'success',
        head_branch: 'main',
        html_url: 'https://github.com/acmuhan/JackalClientDocs/actions/runs/1',
      },
      commits: [{ id: 'ea5eaddca38f25ce013ee50d70addb49c8d28844', message: 'feat: delete demobot', author: { name: 'MuHan' } }],
      ref: 'refs/heads/main',
      compare: 'https://github.com/acmuhan/JackalClientDocs/compare/old...new',
      pusher: { name: 'acmuhan' },
      release: { tag_name: 'v1.2.0', name: 'Spring Patch', html_url: 'https://github.com/acmuhan/JackalClientDocs/releases/tag/v1.2.0' },
      forkee: { full_name: 'acmuhan/JackalClientDocs-fork' },
      discussion: { number: 7, title: 'Roadmap', html_url: 'https://github.com/acmuhan/JackalClientDocs/discussions/7' },
      review: { state: 'approved', html_url: 'https://github.com/acmuhan/JackalClientDocs/pull/29#pullrequestreview-1' },
    }

    if (event === 'workflow_run') payload.action = 'completed'
    if (event === 'pull_request_review') payload.action = 'submitted'
    if (event === 'release') payload.action = 'published'
    return payload
  }
}