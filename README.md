# koishi-plugin-githubsth

[![npm](https://img.shields.io/npm/v/koishi-plugin-githubsth)](https://www.npmjs.com/package/koishi-plugin-githubsth)

> GitHub 订阅通知插件 — 监控仓库事件，推送到你的聊天频道 ✨

## 安装

```bash
npm install koishi-plugin-githubsth
# 或者
yarn add koishi-plugin-githubsth
# 或
pipx install ...  # 开玩笑的，Koishi 用 npm 啦！
```

然后在 Koishi 配置中添加插件：

```yaml
plugins:
  githubsth:
    # 见下方配置
```

## 前置依赖

| 依赖 | 版本要求 | 说明 |
|:----|:-------:|:----|
| koishi | ^4.18.0 | 嗯，就是 Koishi 本体 |
| koishi-plugin-adapter-github | ^1.0.0 | GitHub 适配器，提供事件源 |
| database | — | 任意 Koishi 数据库（内置 memory 也行） |
| puppeteer | *可选* | 需要图片渲染时加这个 |

> 💡 如果不需要图片渲染（纯文本模式），puppeteer 可以不装。

## 快速开始

### 1. 添加可信仓库

只有添加到可信列表的仓库才能被订阅：

```
gh.trust add owner/repo
```

### 2. 订阅仓库事件

```
gh.sub owner/repo
gh.sub owner/repo push,issues,star
```

### 3. 查看效果

当仓库有 push、issue、PR 等事件时，插件会自动推送到当前频道～

## 命令列表

### 订阅管理

| 命令 | 别名 | 说明 |
|:----|:----|:----|
| `githubsth.subscribe <repo> [events]` | `gh.sub` | 订阅仓库事件 |
| `githubsth.unsubscribe <repo>` | `gh.unsub` | 取消订阅 |
| `githubsth.list` | `gh.list` | 查看当前频道的订阅列表 |

### 可信仓库管理

| 命令 | 别名 | 说明 |
|:----|:----|:----|
| `githubsth.trust add <repo>` | `gh.trust add` | 添加可信仓库 |
| `githubsth.trust remove <repo>` | `gh.trust remove` | 移除可信仓库 |
| `githubsth.trust list` | `gh.trust list` | 查看可信仓库列表 |

### 渲染设置

| 命令 | 别名 | 说明 |
|:----|:----|:----|
| `githubsth.render.mode <mode>` | `gh.render mode` | 设置渲染模式（text/image/auto） |
| `githubsth.render.theme <theme>` | `gh.render theme` | 切换主题 |
| `githubsth.render.style <style>` | `gh.render style` | 切换排版风格 |
| `githubsth.render.preview [event]` | `gh.render preview` | 预览渲染效果 |
| `githubsth.render.status` | `gh.render status` | 查看当前渲染配置 |

### 管理命令

| 命令 | 说明 |
|:----|:----|
| `githubsth.admin.subscribe <channel> <repo>` | 强制给指定频道订阅 |
| `githubsth.admin.unsubscribe <channel> <repo>` | 强制取消订阅 |
| `githubsth.admin.cleanup` | 清理失效的频道订阅 |

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|:------|:---:|:-----:|:----|
| `defaultEvents` | `string[]` | push, issues, pull_request 等 | 订阅时默认监听的事件 |
| `renderMode` | `'auto' \| 'image' \| 'text'` | `'auto'` | 渲染模式 |
| `renderTheme` | `string` | `'github-dark'` | 默认主题 |
| `renderStyle` | `string` | `'auto'` | 默认排版风格 |
| `renderWidth` | `number` | `860` | 图片宽度(px) |
| `renderTimeoutMs` | `number` | `12000` | 图片渲染超时 |
| `renderFallback` | `'text' \| 'drop'` | `'text'` | 图片渲染失败时的策略 |
| `digestEnabled` | `boolean` | `false` | 启用聚合推送 |
| `digestWindowSec` | `number` | `60` | 聚合窗口(秒) |
| `digestMaxItems` | `number` | `12` | 每条聚合最大事件数 |
| `formatterLocale` | `'zh-CN' \| 'en-US'` | `'zh-CN'` | 通知语言 |
| `debug` | `boolean` | `false` | 调试日志 |
| `logUnhandledEvents` | `boolean` | `false` | 记录未处理的事件 |
| `enableSessionFallback` | `boolean` | `true` | 启用消息会话兜底解析 |
| `dedupRetentionHours` | `number` | `72` | 去重记录保留时间 |
| `sendRetryCount` | `number` | `2` | 发送失败重试次数 |
| `sendRetryBaseDelayMs` | `number` | `800` | 重试基准延迟 |

## 主题与排版

### 内置主题

| 主题 | 说明 |
|:----|:----|
| `github-light` | GitHub 亮色 ✨ |
| `github-dark` | GitHub 暗色 🌙 |
| `aurora` | 极光主题 🌌 |
| `sunset` | 落日主题 🌅 |
| `matrix` | 矩阵主题 💚 |
| `compact` | 紧凑主题 |
| `card` | 卡片主题 |
| `terminal` | 终端主题 💻 |

### 排版风格

| 风格 | 说明 |
|:----|:----|
| `auto` | 跟随主题默认排版 |
| `github` | GitHub 风格 |
| `glass` | 玻璃风格 |
| `neon` | 霓虹风格 |
| `compact` | 紧凑风格 |
| `card` | 卡片风格 |
| `terminal` | 终端风格 |

## 支持的事件类型

| 事件 | 说明 |
|:----|:----|
| `push` | 代码推送 🚀 |
| `issues` | Issue 相关 |
| `issue_comment` | Issue 评论 💬 |
| `pull_request` | PR 相关 |
| `pull_request_review` | PR 审核 👀 |
| `star` | Star ⭐ |
| `fork` | Fork 🍴 |
| `release` | 版本发布 🏷️ |
| `discussion` | Discussion 💭 |
| `workflow_run` | Actions 工作流 ⚙️ |

## 常见问题

### Q: 事件收不到？

1. 检查是否添加了可信仓库：`gh.trust list`
2. 检查是否订阅了：`gh.list`
3. 确认 GitHub 适配器配置正确，Webhook 或 Pull 模式已启用
4. 看日志有没有报错：开启 `debug: true`

### Q: 图片渲染不出来？

1. 确认装了 puppeteer 插件
2. 检查 `renderTimeoutMs` 是否太短
3. 插件会自动回退到文本模式（如果 `renderFallback` 是 `'text'`）

### Q: 同一个事件收到了多次？

内置去重机制：
- 内存去重：5 秒内相同事件自动过滤
- 数据库去重：按 `dedupRetentionHours` 保留记录

## License

MIT
