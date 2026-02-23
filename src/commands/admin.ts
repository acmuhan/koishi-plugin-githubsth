import { Context } from 'koishi'

export function apply(ctx: Context) {
  const logger = ctx.logger('githubsth')
  const repoRegex = /^[\w-]+\/[\w-.]+$/

  ctx.command('githubsth.trust', '管理信任仓库', { authority: 3 }).alias('gh.trust')

  ctx.command('githubsth.trust.add <repo>', '添加信任仓库', { authority: 3 })
    .action(async ({ session }, repo) => {
      if (!repo) return '请指定仓库（owner/repo）。'
      if (!repoRegex.test(repo)) return '仓库格式错误，应为 owner/repo。'

      try {
        logger.debug(`Adding trusted repo: ${repo}`)
        const existing = await ctx.database.get('github_trusted_repo', { repo })
        if (existing.length > 0) return '该仓库已在信任列表中。'

        await ctx.database.create('github_trusted_repo', {
          repo,
          enabled: true,
          addedBy: session?.userId || 'unknown',
          addedAt: new Date(),
        })
        return `已添加信任仓库：${repo}`
      } catch (e: any) {
        logger.warn('Failed to add trusted repo:', e)
        if (e.code === 'SQLITE_CONSTRAINT') return '该仓库已在信任列表中。'
        return `添加失败：${e.message}`
      }
    })

  ctx.command('githubsth.trust.remove <repo>', '移除信任仓库', { authority: 3 })
    .action(async (_, repo) => {
      if (!repo) return '请指定仓库（owner/repo）。'

      const result = await ctx.database.remove('github_trusted_repo', { repo })
      if (result.matched === 0) return '未找到该信任仓库。'
      return `已移除信任仓库：${repo}`
    })

  ctx.command('githubsth.trust.list', '列出所有信任仓库', { authority: 3 })
    .action(async () => {
      const repos = await ctx.database.get('github_trusted_repo', {})
      if (repos.length === 0) return '暂无信任仓库。'
      return repos.map((r) => `${r.repo} [${r.enabled ? '启用' : '禁用'}]`).join('\n')
    })

  ctx.command('githubsth.trust.enable <repo>', '启用信任仓库', { authority: 3 })
    .action(async (_, repo) => {
      if (!repo) return '请指定仓库（owner/repo）。'
      const result = await ctx.database.set('github_trusted_repo', { repo }, { enabled: true })
      if (result.matched === 0) return '未找到该信任仓库。'
      return `已启用信任仓库：${repo}`
    })

  ctx.command('githubsth.trust.disable <repo>', '禁用信任仓库', { authority: 3 })
    .action(async (_, repo) => {
      if (!repo) return '请指定仓库（owner/repo）。'
      const result = await ctx.database.set('github_trusted_repo', { repo }, { enabled: false })
      if (result.matched === 0) return '未找到该信任仓库。'
      return `已禁用信任仓库：${repo}`
    })
}