import { Context, Service } from 'koishi'
import { Config, Rule } from '../config'
import { Formatter } from './formatter'

declare module 'koishi' {
  interface Context {
    notifier: Notifier
  }
}

export class Notifier extends Service {
  // @ts-ignore
  constructor(ctx: Context, public config: Config) {
    super(ctx, 'notifier', true)
    this.registerListeners()
  }

  private registerListeners() {
    this.ctx.on('github/push' as any, (payload: any) => this.handleEvent('push', payload))
    this.ctx.on('github/issues' as any, (payload: any) => this.handleEvent('issues', payload))
    this.ctx.on('github/pull_request' as any, (payload: any) => this.handleEvent('pull_request', payload))
    this.ctx.on('github/star' as any, (payload: any) => this.handleEvent('star', payload))
    this.ctx.on('github/fork' as any, (payload: any) => this.handleEvent('fork', payload))
    this.ctx.on('github/release' as any, (payload: any) => this.handleEvent('release', payload))
    this.ctx.on('github/discussion' as any, (payload: any) => this.handleEvent('discussion', payload))
    this.ctx.on('github/workflow_run' as any, (payload: any) => this.handleEvent('workflow_run', payload))
  }

  private async handleEvent(event: string, payload: any) {
    const repoName = payload.repository?.full_name
    if (!repoName) return

    if (this.config.debug) {
      this.ctx.logger('notifier').info(`Received event ${event} for ${repoName}`)
      this.ctx.logger('notifier').debug(JSON.stringify(payload, null, 2))
    }

    // Get rules from database
    const dbRules = await this.ctx.database.get('github_subscription', {
      repo: repoName
    })

    // Combine with config rules (if any, for backward compatibility or static rules)
    const configRules = (this.config.rules || []).filter((r: any) => r.repo === repoName || r.repo === '*')

    const allRules: Rule[] = [
      ...dbRules.map(r => ({ ...r, platform: r.platform })), 
      ...configRules
    ]

    const matchedRules = allRules.filter(rule => {
      // Event match
      if (!rule.events.includes('*') && !rule.events.includes(event)) return false
      return true
    })

    if (matchedRules.length === 0) return

    let message: any = null
    // Ensure formatter is loaded
    if (!this.ctx.formatter) {
      this.ctx.logger('notifier').warn('Formatter service not available')
      return
    }

    switch (event) {
      case 'push':
        message = this.ctx.formatter.formatPush(payload)
        break
      case 'issues':
        message = this.ctx.formatter.formatIssue(payload)
        break
      case 'pull_request':
        message = this.ctx.formatter.formatPullRequest(payload)
        break
      case 'star':
        message = this.ctx.formatter.formatStar(payload)
        break
      case 'fork':
        message = this.ctx.formatter.formatFork(payload)
        break
      case 'release':
        message = this.ctx.formatter.formatRelease(payload)
        break
      case 'discussion':
        message = this.ctx.formatter.formatDiscussion(payload)
        break
      case 'workflow_run':
        message = this.ctx.formatter.formatWorkflowRun(payload)
        break
    }

    if (!message) return

    for (const rule of matchedRules) {
      await this.sendMessage(rule, message)
    }
  }

  private async sendMessage(rule: Rule, message: any) {
    // Find suitable bots
    const bots = this.ctx.bots.filter(bot => {
      if (rule.platform) return bot.platform === rule.platform
      return true // If platform not specified, try all
    })

    if (bots.length === 0) {
      if (this.config.debug) {
        this.ctx.logger('notifier').debug(`No bot found for channel ${rule.channelId} (platform: ${rule.platform})`)
      }
      return
    }

    let sent = false
    for (const bot of bots) {
      try {
        await bot.sendMessage(rule.channelId, message)
        sent = true
        if (this.config.debug) {
          this.ctx.logger('notifier').info(`Sent message to ${rule.channelId} via ${bot.platform}:${bot.selfId}`)
        }
        break // Break on first success
      } catch (e) {
        if (this.config.debug) {
          this.ctx.logger('notifier').warn(`Bot ${bot.sid} failed to send message: ${e}`)
        }
      }
    }
    
    if (!sent) {
       this.ctx.logger('notifier').warn(`Failed to send message to ${rule.channelId}`)
    }
  }
}
