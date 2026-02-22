import { Context } from 'koishi'

declare module 'koishi' {
  interface Tables {
    github_subscription: GithubSubscription
    github_trusted_repo: GithubTrustedRepo
  }
}

export interface GithubSubscription {
  id: number
  repo: string
  channelId: string
  platform: string
  events: string[]
}

export interface GithubTrustedRepo {
  id: number
  repo: string
  enabled: boolean
  addedBy: string
  addedAt: Date
}

export function apply(ctx: Context) {
  ctx.model.extend('github_subscription', {
    id: 'unsigned',
    repo: 'string',
    channelId: 'string',
    platform: 'string',
    events: 'list',
  }, {
    autoInc: true,
  })

  ctx.model.extend('github_trusted_repo', {
    id: 'unsigned',
    repo: 'string',
    enabled: { type: 'boolean', initial: true },
    addedBy: 'string',
    addedAt: 'timestamp',
  }, {
    autoInc: true,
    unique: ['repo'],
  })
}
