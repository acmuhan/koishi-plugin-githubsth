import { Context } from 'koishi'
import type { RenderStyle, RenderTheme } from './config'

declare module 'koishi' {
  interface Tables {
    github_subscription: GithubSubscription
    github_trusted_repo: GithubTrustedRepo
    github_event_dedup: GithubEventDedup
  }
}

export interface GithubSubscription {
  id: number
  repo: string
  channelId: string
  platform: string
  events: string[]
  renderTheme?: RenderTheme
  renderStyle?: RenderStyle
}

export interface GithubTrustedRepo {
  id: number
  repo: string
  enabled: boolean
  addedBy: string
  addedAt: Date
}

export interface GithubEventDedup {
  id: number
  dedupKey: string
  event: string
  repo: string
  createdAt: Date
}

export function apply(ctx: Context) {
  ctx.model.extend('github_subscription', {
    id: 'unsigned',
    repo: 'string',
    channelId: 'string',
    platform: 'string',
    events: 'list',
    renderTheme: 'string',
    renderStyle: 'string',
  }, {
    autoInc: true,
    unique: ['repo', 'channelId', 'platform'],
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

  ctx.model.extend('github_event_dedup', {
    id: 'unsigned',
    dedupKey: 'string',
    event: 'string',
    repo: 'string',
    createdAt: 'timestamp',
  }, {
    autoInc: true,
    unique: ['dedupKey'],
  })
}