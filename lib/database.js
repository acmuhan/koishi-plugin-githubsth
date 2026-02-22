"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = apply;
function apply(ctx) {
    ctx.model.extend('github_subscription', {
        id: 'unsigned',
        repo: 'string',
        channelId: 'string',
        platform: 'string',
        events: 'list',
    }, {
        autoInc: true,
    });
    ctx.model.extend('github_trusted_repo', {
        id: 'unsigned',
        repo: 'string',
        enabled: { type: 'boolean', initial: true },
        addedBy: 'string',
        addedAt: 'timestamp',
    }, {
        autoInc: true,
        unique: ['repo'],
    });
}
