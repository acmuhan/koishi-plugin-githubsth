import { Context } from 'koishi'
import { Config, RenderMode } from '../config'

const modes: RenderMode[] = ['text', 'image', 'auto']
const events = ['push', 'issues', 'issue_comment', 'pull_request', 'pull_request_review', 'star', 'fork', 'release', 'discussion', 'workflow_run', 'digest']

export function apply(ctx: Context, config: Config) {
  ctx.command('githubsth.render', '渲染设置', { authority: 3 }).alias('gh.render')

  ctx.command('githubsth.render.status', '查看渲染状态', { authority: 3 })
    .action(async ({ session }) => {
      const status = ctx.githubsthNotifier.getRenderStatus()
      return session?.text('commands.githubsth.render.messages.status_text', [
        status.mode,
        status.configuredMode,
        status.fallback,
        status.theme,
        status.style,
        status.width,
        status.timeoutMs,
        status.digestEnabled ? 'on' : 'off',
        status.digestWindowSec,
        status.digestMaxItems,
        status.hasPuppeteer ? 'ready' : 'missing',
      ])
    })

  ctx.command('githubsth.render.mode <mode:string>', '设置渲染模式', { authority: 3 })
    .action(async ({ session }, mode) => {
      if (!mode || !modes.includes(mode as RenderMode)) {
        return session?.text('commands.githubsth.render.messages.invalid_mode', [modes.join(', ')])
      }
      ctx.githubsthNotifier.setRenderMode(mode as RenderMode)
      return session?.text('commands.githubsth.render.messages.mode_set', [mode, config.renderMode])
    })

  ctx.command('githubsth.render.theme <theme:string>', '设置默认主题', { authority: 3 })
    .action(async ({ session }, theme) => {
      const normalized = ctx.githubsthNotifier.normalizeTheme(theme)
      if (!normalized) return session?.text('commands.githubsth.render.messages.invalid_theme')
      config.renderTheme = normalized
      return session?.text('commands.githubsth.render.messages.theme_set', [normalized])
    })

  ctx.command('githubsth.render.style <style:string>', '设置默认样式', { authority: 3 })
    .action(async ({ session }, style) => {
      const normalized = ctx.githubsthNotifier.normalizeStyle(style)
      if (!normalized) return session?.text('commands.githubsth.render.messages.invalid_style')
      config.renderStyle = normalized
      return session?.text('commands.githubsth.render.messages.style_set', [normalized])
    })

  ctx.command('githubsth.render.width <width:number>', '设置图片宽度', { authority: 3 })
    .action(async ({ session }, width) => {
      if (!width || Number.isNaN(width)) return session?.text('commands.githubsth.render.messages.invalid_width')
      const normalized = Math.max(480, Math.min(1600, Math.floor(width)))
      config.renderWidth = normalized
      return session?.text('commands.githubsth.render.messages.width_set', [normalized])
    })

  ctx.command('githubsth.render.digest <enabled:string>', '切换 digest 模式（on/off）', { authority: 3 })
    .action(async ({ session }, enabled) => {
      const key = String(enabled || '').toLowerCase()
      if (!['on', 'off', 'true', 'false', '1', '0'].includes(key)) return session?.text('commands.githubsth.render.messages.digest_usage')
      config.digestEnabled = ['on', 'true', '1'].includes(key)
      return session?.text('commands.githubsth.render.messages.digest_set', [config.digestEnabled ? 'on' : 'off'])
    })

  ctx.command('githubsth.render.digest.window <seconds:number>', '设置 digest 窗口秒数', { authority: 3 })
    .action(async ({ session }, seconds) => {
      if (!seconds || Number.isNaN(seconds)) return session?.text('commands.githubsth.render.messages.invalid_seconds')
      config.digestWindowSec = Math.max(5, Math.min(3600, Math.floor(seconds)))
      return session?.text('commands.githubsth.render.messages.digest_window_set', [config.digestWindowSec])
    })

  ctx.command('githubsth.render.digest.max <count:number>', '设置 digest 最大条目数', { authority: 3 })
    .action(async ({ session }, count) => {
      if (!count || Number.isNaN(count)) return session?.text('commands.githubsth.render.messages.invalid_count')
      config.digestMaxItems = Math.max(2, Math.min(100, Math.floor(count)))
      return session?.text('commands.githubsth.render.messages.digest_max_set', [config.digestMaxItems])
    })

  ctx.command('githubsth.render.themes', '查看主题列表', { authority: 3 })
    .action(async ({ session }) => session?.text('commands.githubsth.render.messages.themes_list', [ctx.githubsthNotifier.listThemes().join('\n- ')]))

  ctx.command('githubsth.render.styles', '查看样式列表', { authority: 3 })
    .action(async ({ session }) => session?.text('commands.githubsth.render.messages.styles_list', [ctx.githubsthNotifier.listStyles().join('\n- ')]))

  ctx.command('githubsth.render.preview [event:string] [theme:string] [style:string]', '预览渲染效果', { authority: 3 })
    .action(async ({ session }, event, theme, style) => {
      const selectedEvent = event && events.includes(event) ? event : 'issue_comment'
      if (event && !events.includes(event)) await session?.send(session?.text('commands.githubsth.render.messages.unknown_event', [event]) || '')

      const normalizedTheme = theme ? ctx.githubsthNotifier.normalizeTheme(theme) : null
      if (theme && !normalizedTheme) await session?.send(session?.text('commands.githubsth.render.messages.unknown_theme', [theme]) || '')

      const normalizedStyle = style ? ctx.githubsthNotifier.normalizeStyle(style) : null
      if (style && !normalizedStyle) await session?.send(session?.text('commands.githubsth.render.messages.unknown_style', [style]) || '')

      const prevTheme = config.renderTheme
      const prevStyle = config.renderStyle
      if (normalizedTheme) config.renderTheme = normalizedTheme
      if (normalizedStyle) config.renderStyle = normalizedStyle

      const preview = await ctx.githubsthNotifier.renderPreview(selectedEvent, normalizedTheme || undefined)

      config.renderTheme = prevTheme
      config.renderStyle = prevStyle
      return preview || session?.text('commands.githubsth.render.messages.preview_failed')
    })

  ctx.command('githubsth.render.repo-theme <repo:string> <theme:string>', '设置订阅专属主题', { authority: 3 })
    .action(async ({ session }, repo, theme) => {
      if (!repo) return session?.text('commands.githubsth.render.messages.repo_required')
      if (!session?.channelId) return session?.text('commands.githubsth.subscribe.messages.run_in_channel')
      const normalized = ctx.githubsthNotifier.normalizeTheme(theme)
      if (!normalized) return session?.text('commands.githubsth.render.messages.invalid_theme')

      const target = await ctx.database.get('github_subscription', {
        repo,
        channelId: session.channelId,
        platform: session.platform || 'unknown',
      })
      if (!target.length) return session?.text('commands.githubsth.render.messages.no_sub_in_channel')

      await ctx.database.set('github_subscription', { id: target[0].id }, { renderTheme: normalized })
      return session?.text('commands.githubsth.render.messages.repo_theme_set', [repo, normalized])
    })

  ctx.command('githubsth.render.repo-theme.clear <repo:string>', '清除订阅专属主题', { authority: 3 })
    .action(async ({ session }, repo) => {
      if (!repo) return session?.text('commands.githubsth.render.messages.repo_required')
      if (!session?.channelId) return session?.text('commands.githubsth.subscribe.messages.run_in_channel')

      const target = await ctx.database.get('github_subscription', {
        repo,
        channelId: session.channelId,
        platform: session.platform || 'unknown',
      })
      if (!target.length) return session?.text('commands.githubsth.render.messages.no_sub_in_channel')

      await ctx.database.set('github_subscription', { id: target[0].id }, { renderTheme: null as any })
      return session?.text('commands.githubsth.render.messages.repo_theme_cleared', [repo])
    })

  ctx.command('githubsth.render.repo-style <repo:string> <style:string>', '设置订阅专属样式', { authority: 3 })
    .action(async ({ session }, repo, style) => {
      if (!repo) return session?.text('commands.githubsth.render.messages.repo_required')
      if (!session?.channelId) return session?.text('commands.githubsth.subscribe.messages.run_in_channel')
      const normalized = ctx.githubsthNotifier.normalizeStyle(style)
      if (!normalized) return session?.text('commands.githubsth.render.messages.invalid_style')

      const target = await ctx.database.get('github_subscription', {
        repo,
        channelId: session.channelId,
        platform: session.platform || 'unknown',
      })
      if (!target.length) return session?.text('commands.githubsth.render.messages.no_sub_in_channel')

      await ctx.database.set('github_subscription', { id: target[0].id }, { renderStyle: normalized })
      return session?.text('commands.githubsth.render.messages.repo_style_set', [repo, normalized])
    })

  ctx.command('githubsth.render.repo-style.clear <repo:string>', '清除订阅专属样式', { authority: 3 })
    .action(async ({ session }, repo) => {
      if (!repo) return session?.text('commands.githubsth.render.messages.repo_required')
      if (!session?.channelId) return session?.text('commands.githubsth.subscribe.messages.run_in_channel')

      const target = await ctx.database.get('github_subscription', {
        repo,
        channelId: session.channelId,
        platform: session.platform || 'unknown',
      })
      if (!target.length) return session?.text('commands.githubsth.render.messages.no_sub_in_channel')

      await ctx.database.set('github_subscription', { id: target[0].id }, { renderStyle: null as any })
      return session?.text('commands.githubsth.render.messages.repo_style_cleared', [repo])
    })

  ctx.command('githubsth.render.repo-theme.list [repo:string]', '查看订阅主题/样式', { authority: 3 })
    .action(async ({ session }, repo) => {
      if (!session?.channelId) return session?.text('commands.githubsth.subscribe.messages.run_in_channel')

      const query: any = {
        channelId: session.channelId,
        platform: session.platform || 'unknown',
      }
      if (repo) query.repo = repo

      const subs = await ctx.database.get('github_subscription', query)
      if (!subs.length) return session?.text('commands.githubsth.render.messages.no_matched_subs')

      return subs
        .map((sub: any) => session?.text('commands.githubsth.render.messages.repo_style_item', [
          sub.repo,
          sub.renderTheme || '默认',
          sub.renderStyle || '默认',
        ]) || `${sub.repo}`)
        .join('\n')
    })
}