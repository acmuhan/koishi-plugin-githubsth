import { Context } from 'koishi'
import { Config } from '../config'
import * as repo from './repo'
import * as admin from './admin'
import * as subscribe from './subscribe'
import * as render from './render'

export function apply(ctx: Context, config: Config) {
  ctx.command('githubsth', 'GitHub 订阅通知')
    .action(({ session }) => session?.execute('help githubsth'))

  ctx.plugin(repo, config)
  ctx.plugin(admin, config)
  ctx.plugin(subscribe, config)
  ctx.plugin(render, config)
}