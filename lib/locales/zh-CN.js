"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    commands: {
        githubsth: {
            description: 'GitHub 交互插件',
            messages: {
                repo_info: '仓库: {0}/{1}\n描述: {2}\nStars: {3}',
                error: '获取信息失败: {0}',
                specify_repo: '请指定仓库名称。',
                not_found: '未找到仓库或无权限访问。'
            }
        },
        'githubsth.repo': {
            description: '获取仓库信息'
        }
    }
};
