# koishi-plugin-githubsth

[![npm](https://img.shields.io/npm/v/koishi-plugin-githubsth?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-githubsth)

一个用于 Koishi 的 GitHub 订阅通知插件，支持仓库级订阅管理与多样化渲染。

## 功能特性

- GitHub 事件通知：`push`、`issues`、`issue_comment`、`pull_request`、`pull_request_review`、`release`、`star`、`fork`、`discussion`、`workflow_run`
- 可信仓库白名单（管理员）
- 基于 Koishi `database` 的频道订阅持久化
- 文本/图片/自动渲染模式
- 全局与订阅级主题/样式控制
- Digest 聚合推送
- 内置中英文文案（`zh-CN`、`en-US`）

## 安装

```bash
npm i koishi-plugin-githubsth
```

## 依赖要求

- `koishi` `^4.18.0`
- `koishi-plugin-adapter-github` `^1.0.0`
- Koishi `database` 服务（必需）
- `puppeteer` 服务（可选，图片渲染需要）

## 配置项

主要配置包括：

- `defaultOwner`、`defaultRepo`
- `defaultEvents`
- `debug`、`logUnhandledEvents`
- `formatterLocale`
- `renderMode`、`renderFallback`
- `renderTheme`、`renderStyle`
- `renderWidth`、`renderTimeoutMs`
- `digestEnabled`、`digestWindowSec`、`digestMaxItems`

## 指令

用户指令：

- `githubsth.subscribe <owner/repo> [events]`
- `githubsth.unsubscribe <owner/repo>`
- `githubsth.list`
- `githubsth.repo [owner/repo]`

管理员指令（权限 `3`）：

- `githubsth.trust.add <owner/repo>`
- `githubsth.trust.remove <owner/repo>`
- `githubsth.trust.list`
- `githubsth.trust.enable <owner/repo>`
- `githubsth.trust.disable <owner/repo>`
- `githubsth.render.*`（渲染模式/主题/样式/预览/digest 控制）

## 使用说明

- `githubsth.subscribe` 仅允许订阅已加入可信列表的仓库。
- 当 `renderMode=auto` 且图片渲染不可用时，将按 `renderFallback` 回退。

## 许可证

MIT
