# Changelog

## [1.1.0] — 2026-04-28

### ✨ 新特性
- **健康检查**：插件启动时自动检测数据库连通性，每 5 分钟定时检查，异常时自动重连
- **README 文档**：完整的中英文安装指南、命令列表、配置项说明、主题一览、常见问题
- **错误处理增强**：所有空 catch 补全日志，各环节异常均有详细 waring 记录
- **重连机制**：webhook 事件处理出错时自动重试，session 发送失败时降级并记录

### 🔄 适配器兼容
- 适配 `koishi-plugin-adapter-github` `^1.1.2` 结构化事件数据格式
- 新增 `buildFlatPayload()` 桥接函数，保证旧版格式兼容
- 事件名修正：`pull-request-review` → `pull-request-review-comment`
- 支持 camelCase 字段名的 session fallback

### 🐛 修复
- 图片发送失败时添加文本回退，双重失败打日志
- dedup 记录、清理过期事件等错误现在会被记录下来

### 📝 文档
- 新增 `CHANGELOG.md`
- 新增 `README.md`（完整文档）

## [1.0.7] — 之前版本
