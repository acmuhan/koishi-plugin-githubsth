"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    commands: {
        githubsth: {
            description: 'GitHub 订阅通知',
        },
        'githubsth.repo': {
            description: '获取仓库信息',
            messages: {
                repo_info: '仓库：{0}/{1}\n描述：{2}\nStars：{3}',
                error: '获取仓库信息失败：{0}',
                specify_repo: '请指定仓库，格式为 owner/repo。',
                not_found: '仓库不存在或无权限访问。',
            },
        },
        'githubsth.subscribe': {
            description: '订阅 GitHub 仓库事件',
            messages: {
                specify_repo: '请指定仓库，格式为 owner/repo。',
                invalid_repo: '仓库格式错误，应为 owner/repo。',
                run_in_channel: '请在群聊或频道中执行该命令。',
                repo_not_trusted: '该仓库不在信任列表中，请先由管理员添加。',
                invalid_events: '无效事件：{0}\n可选事件：{1}',
                updated: '已更新订阅：{0}\n事件：{1}',
                created: '已订阅：{0}\n事件：{1}',
                failed: '订阅失败，请稍后重试。',
            },
        },
        'githubsth.unsubscribe': {
            description: '取消订阅 GitHub 仓库',
            messages: {
                specify_repo: '请指定仓库，格式为 owner/repo。',
                run_in_channel: '请在群聊或频道中执行该命令。',
                not_found: '未找到该订阅。',
                success: '已取消订阅：{0}',
            },
        },
        'githubsth.list': {
            description: '查看当前频道订阅',
            messages: {
                run_in_channel: '请在群聊或频道中执行该命令。',
                empty: '当前频道没有订阅。',
                item: '{0} [{1}] 主题={2} 样式={3}',
            },
        },
        'githubsth.render': {
            description: '渲染设置',
            messages: {
                invalid_mode: '无效模式。可选：{0}',
                mode_set: '运行时渲染模式已设为 {0}（配置默认：{1}）。',
                invalid_theme: '无效主题，请先执行 githubsth.render.themes 查看列表。',
                theme_set: '默认主题已设置为：{0}',
                invalid_style: '无效样式，请先执行 githubsth.render.styles 查看列表。',
                style_set: '默认样式已设置为：{0}',
                invalid_width: '请提供有效的宽度数字。',
                width_set: '图片宽度已设置为 {0}px',
                digest_usage: '用法：githubsth.render.digest on|off',
                digest_set: 'Digest 模式：{0}',
                invalid_seconds: '请提供有效的秒数。',
                digest_window_set: 'Digest 窗口已设置为 {0}s',
                invalid_count: '请提供有效的数量。',
                digest_max_set: 'Digest 最大条目已设置为 {0}',
                themes_list: '主题列表：\n- {0}',
                styles_list: '样式列表：\n- {0}',
                status_text: '当前模式：{0}（配置默认：{1}）\n回退策略：{2}\n默认主题：{3}\n默认样式：{4}\n图片宽度：{5}\n渲染超时：{6}ms\nDigest：{7}（窗口 {8}s，最多 {9} 条）\nPuppeteer：{10}',
                unknown_event: '未知事件 {0}，已回退到 issue_comment。',
                unknown_theme: '未知主题 {0}，已回退到默认主题。',
                unknown_style: '未知样式 {0}，已回退到默认样式。',
                preview_failed: '预览失败，请检查 puppeteer 或渲染配置。',
                repo_required: '请提供仓库（owner/repo）。',
                no_sub_in_channel: '当前频道没有该仓库订阅。',
                repo_theme_set: '订阅主题已设置：{0} -> {1}',
                repo_theme_cleared: '订阅主题已清除：{0}',
                repo_style_set: '订阅样式已设置：{0} -> {1}',
                repo_style_cleared: '订阅样式已清除：{0}',
                no_matched_subs: '没有匹配的订阅。',
                repo_style_item: '{0} => 主题={1} 样式={2}',
            },
        },
        'githubsth.trust': {
            description: '管理信任仓库',
        },
    },
};
