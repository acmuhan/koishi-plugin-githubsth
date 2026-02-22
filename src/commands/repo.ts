import { Context } from 'koishi'
import { Config } from '../config'

export function apply(ctx: Context, config: Config) {
  ctx.command('githubsth.repo [name:string]')
    .action(async ({ session }, name) => {
      if (!name && !config.defaultRepo) {
        return session?.text('.specify_repo')
      }
      
      const fullRepo = name || (config.defaultOwner ? `${config.defaultOwner}/${config.defaultRepo}` : name)
      if (!fullRepo) return session?.text('.specify_repo')

      // 在实际实现中，我们将在此处使用 GitHub API。
      // 由于我们没有 API 客户端的具体设置细节（例如 Octokit 或适配器内部实现），
      // 我们将返回一个占位符，以确认命令结构正常工作。
      
      // TODO: 使用 session.bot 或专用服务实现实际的 GitHub API 调用。
      
      return session?.text('.repo_info', [fullRepo.split('/')[0], fullRepo.split('/')[1] || '?', 'Demo Description', '100'])
    })
}
