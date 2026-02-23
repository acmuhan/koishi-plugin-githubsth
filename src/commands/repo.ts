import { Context } from 'koishi'
import { Config } from '../config'

declare module 'koishi' {
  interface Context {
    github?: any
  }
}

export function apply(ctx: Context, config: Config) {
  ctx.command('githubsth.repo [name:string]', '获取仓库信息')
    .action(async ({ session }, name) => {
      if (!name && !config.defaultRepo) return session?.text('.specify_repo')

      const fullRepo = name || (config.defaultOwner ? `${config.defaultOwner}/${config.defaultRepo}` : name)
      if (!fullRepo) return session?.text('.specify_repo')

      try {
        let data: any
        if (ctx.github && typeof ctx.github.request === 'function') {
          data = await ctx.github.request('GET /repos/:owner/:repo', {
            owner: fullRepo.split('/')[0],
            repo: fullRepo.split('/')[1],
          })
        } else {
          const headers: Record<string, string> = { 'User-Agent': 'Koishi-Plugin-GithubSth' }
          data = await ctx.http.get(`https://api.github.com/repos/${fullRepo}`, { headers })
        }

        return session?.text('.repo_info', [data.owner.login, data.name, data.description || '无描述', data.stargazers_count])
      } catch (e: any) {
        if (e.response?.status === 404) return session?.text('.not_found')
        return session?.text('.error', [e.message])
      }
    })
}