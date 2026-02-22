"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const koishi_1 = require("koishi");
exports.Config = koishi_1.Schema.object({
    defaultOwner: koishi_1.Schema.string().description('默认仓库拥有者'),
    defaultRepo: koishi_1.Schema.string().description('默认仓库名称'),
    debug: koishi_1.Schema.boolean().default(false).description('启用调试模式，输出详细日志'),
    rules: koishi_1.Schema.array(koishi_1.Schema.object({
        repo: koishi_1.Schema.string().required(),
        channelId: koishi_1.Schema.string().required(),
        platform: koishi_1.Schema.string(),
        events: koishi_1.Schema.array(koishi_1.Schema.string()).default(['push', 'issues', 'pull_request']),
    })).hidden().description('已废弃，请使用数据库管理订阅'),
});
