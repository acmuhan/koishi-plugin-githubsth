import { Context } from 'koishi'
import { Config } from './config'
import { apply as commands } from './commands'
import * as database from './database'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import { Notifier } from './services/notifier'
import { Formatter } from './services/formatter'
import { getThemeDefaultStyle, normalizeRenderStyle, normalizeRenderTheme } from './services/render-card'

export const name = 'githubsth'

export const inject = {
  required: ['database'],
  optional: ['github', 'puppeteer'],
}

export * from './config'

export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger('githubsth')
  logger.info('Plugin loading...')

  ctx.i18n.define('zh-CN', zhCN)
  ctx.i18n.define('en-US', enUS)

  ctx.plugin(database)
  ctx.plugin(Formatter, config)
  ctx.plugin(Notifier, config)

  ctx.on('ready', async () => {
    try {
      const subs = await ctx.database.get('github_subscription', {}) as any[]
      for (const sub of subs) {
        if (sub.renderStyle) continue
        const theme = normalizeRenderTheme(sub.renderTheme) || normalizeRenderTheme(config.renderTheme) || 'github-dark'
        const style = getThemeDefaultStyle(theme)
        await ctx.database.set('github_subscription', { id: sub.id }, { renderStyle: style })
      }
    } catch (error) {
      logger.warn('Failed to backfill renderStyle for subscriptions:', error)
    }

    const normalizedGlobalStyle = normalizeRenderStyle(config.renderStyle)
    if (!normalizedGlobalStyle) {
      config.renderStyle = 'auto'
    }
  })

  try {
    ctx.plugin(commands, config)
    logger.info('Plugin loaded successfully')
  } catch (error) {
    logger.error('Plugin failed to load:', error)
  }
}