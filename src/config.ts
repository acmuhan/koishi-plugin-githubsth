import { Schema } from 'koishi'

export interface Rule {
  repo: string
  channelId: string
  platform?: string
  events: string[]
}

export interface Config {
  defaultOwner?: string
  defaultRepo?: string
  debug: boolean
  // rules is deprecated but kept for compatibility or migration
  rules?: Rule[]
}

export const Config: Schema<Config> = Schema.object({
  defaultOwner: Schema.string().description('默认仓库拥有者'),
  defaultRepo: Schema.string().description('默认仓库名称'),
  debug: Schema.boolean().default(false).description('启用调试模式，输出详细日志'),
  rules: Schema.array(Schema.object({
    repo: Schema.string().required(),
    channelId: Schema.string().required(),
    platform: Schema.string(),
    events: Schema.array(Schema.string()).default(['push', 'issues', 'pull_request']),
  })).hidden().description('已废弃，请使用数据库管理订阅'),
})
