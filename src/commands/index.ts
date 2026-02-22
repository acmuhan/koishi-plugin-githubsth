import { Context } from 'koishi'
import { Config } from '../config'
import * as repo from './repo'

export function apply(ctx: Context, config: Config) {
  ctx.plugin(repo, config)
}
