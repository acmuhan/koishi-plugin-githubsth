# koishi-plugin-githubsth

[![npm](https://img.shields.io/npm/v/koishi-plugin-githubsth?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-githubsth)

Koishi 的 GitHub 集成插件，提供强大的事件通知服务和仓库管理命令。支持数据库存储订阅关系，并提供信任仓库管理功能。

## 功能特性

- **事件通知**: 实时接收 GitHub 事件通知 (Push, Issue, PR, Release, Star, Fork, Discussion, Workflow)。
- **数据库订阅**: 订阅关系持久化存储在 Koishi 数据库中，支持动态管理。
- **信任仓库管理**: 管理员可配置允许订阅的仓库白名单，确保安全。
- **灵活的规则**: 支持按仓库、目标频道和事件类型进行订阅。
- **丰富格式**: 消息格式美观，包含关键信息。
- **调试模式**: 支持开启详细日志输出，方便排查问题。

## 安装

```bash
npm install koishi-plugin-githubsth
```

## 配置

本插件需要 `database` 服务和 `koishi-plugin-adapter-github` 才能正常工作。

### 插件配置

在 Koishi 控制台中配置插件：

- **defaultOwner**: 默认仓库拥有者 (可选)。
- **defaultRepo**: 默认仓库名称 (可选)。
- **debug**: 启用调试模式，输出详细日志 (默认 false)。

### 订阅管理

插件使用数据库管理订阅。

#### 管理员命令 (权限等级 3)

- `githubsth.trust.add <repo>`: 添加信任仓库 (owner/repo)。
- `githubsth.trust.remove <repo>`: 移除信任仓库。
- `githubsth.trust.list`: 列出所有信任仓库。
- `githubsth.trust.enable <repo>`: 启用信任仓库。
- `githubsth.trust.disable <repo>`: 禁用信任仓库。

#### 用户命令

- `githubsth.subscribe <repo> [events]`: 订阅仓库事件。
  - `repo`: 仓库全名 (owner/repo)。
  - `events`: (可选) 订阅的事件列表，逗号分隔。默认为 `push, issues, pull_request`。
  - 注意：仅能订阅已添加到信任列表的仓库。
- `githubsth.unsubscribe <repo>`: 取消订阅仓库。
- `githubsth.list`: 查看当前频道的订阅列表。
- `githubsth.repo [name]`: 获取仓库信息。

### 支持的事件

- `push`: 代码推送
- `issues`: Issue 创建、关闭等
- `pull_request`: PR 创建、合并等
- `release`: 新版本发布
- `star`: 仓库标星
- `fork`: 仓库复刻
- `discussion`: 讨论区动态
- `workflow_run`: CI/CD 工作流状态

## 许可证

MIT
