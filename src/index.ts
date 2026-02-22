import { Context } from 'koishi'
import { Config } from './config'
import * as commands from './commands'
import * as admin from './commands/admin'
import * as subscribe from './commands/subscribe'
import * as database from './database'
import zhCN from './locales/zh-CN'
import { Notifier } from './services/notifier'
import { Formatter } from './services/formatter'

export const name = 'githubsth'

export const inject = {
  required: ['database', 'github'],
}

export * from './config'

export function apply(ctx: Context, config: Config) {
  // 本地化
  ctx.i18n.define('zh-CN', zhCN)

  // 数据库
  ctx.plugin(database)

  // 注册服务
  ctx.plugin(Formatter)
  ctx.plugin(Notifier, config)

  // 注册命令
  ctx.plugin(commands, config)
  ctx.plugin(admin)
  ctx.plugin(subscribe)
}
