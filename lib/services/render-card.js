"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRenderThemes = listRenderThemes;
exports.listRenderStyles = listRenderStyles;
exports.getThemeDefaultStyle = getThemeDefaultStyle;
exports.normalizeRenderTheme = normalizeRenderTheme;
exports.normalizeRenderStyle = normalizeRenderStyle;
exports.buildRenderHtml = buildRenderHtml;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const NO_PATTERN = 'none';
const NO_TEXTURE = 'none';
const THEME_PRESETS = {
    'github-light': {
        key: 'github-light', title: 'GitHub Light', style: 'github',
        background: 'linear-gradient(145deg, #f6f8fa, #eef2f7)', card: '#ffffff', border: '#d0d7de',
        text: '#24292f', muted: '#57606a', accent: '#0969da', pillText: '#0969da', pillBg: '#ddf4ff',
        contentBg: 'rgba(246,248,250,0.72)', overlayPattern: NO_PATTERN, cardTexture: NO_TEXTURE,
        extraCss: '.theme-github-light .head { background: linear-gradient(180deg, #ffffff, #f9fbfd); }',
        font: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    },
    'github-dark': {
        key: 'github-dark', title: 'GitHub Dark', style: 'github',
        background: 'linear-gradient(145deg, #0d1117, #161b22)', card: '#161b22', border: '#30363d',
        text: '#c9d1d9', muted: '#8b949e', accent: '#58a6ff', pillText: '#58a6ff', pillBg: 'rgba(56,139,253,0.15)',
        contentBg: 'rgba(13,17,23,0.45)', overlayPattern: NO_PATTERN, cardTexture: NO_TEXTURE,
        extraCss: '.theme-github-dark .head { background: linear-gradient(180deg, rgba(88,166,255,0.07), rgba(22,27,34,0)); }',
        font: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    },
    aurora: {
        key: 'aurora', title: 'Aurora', style: 'glass',
        background: 'linear-gradient(155deg, #07203f, #2b5876)', card: 'rgba(12,24,42,0.86)', border: 'rgba(143,211,244,0.35)',
        text: '#e8f5ff', muted: '#b7d7ef', accent: '#7dd3fc', pillText: '#7dd3fc', pillBg: 'rgba(125,211,252,0.16)',
        contentBg: 'rgba(10,21,37,0.5)',
        overlayPattern: 'radial-gradient(circle at 18% 15%, rgba(125,211,252,0.24), transparent 30%), radial-gradient(circle at 82% 80%, rgba(56,189,248,0.24), transparent 26%)',
        cardTexture: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 32%, rgba(255,255,255,0.06) 70%, transparent 100%)',
        extraCss: '.theme-aurora .title { text-shadow: 0 2px 16px rgba(125,211,252,0.25); }',
        font: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    },
    sunset: {
        key: 'sunset', title: 'Sunset', style: 'card',
        background: 'linear-gradient(155deg, #3f2b96, #a83279)', card: 'rgba(46,16,57,0.9)', border: 'rgba(255,183,197,0.34)',
        text: '#fff1f6', muted: '#ffd2e4', accent: '#fda4af', pillText: '#fecdd3', pillBg: 'rgba(253,164,175,0.18)',
        contentBg: 'rgba(86,28,84,0.32)',
        overlayPattern: 'radial-gradient(circle at 85% 16%, rgba(255,219,234,0.28), transparent 28%), radial-gradient(circle at 10% 78%, rgba(249,115,22,0.2), transparent 34%)',
        cardTexture: 'linear-gradient(160deg, rgba(255,255,255,0.12), transparent 46%)',
        extraCss: '.theme-sunset .head { background: linear-gradient(120deg, rgba(253,164,175,0.2), rgba(168,85,247,0.12)); }',
        font: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    },
    matrix: {
        key: 'matrix', title: 'Matrix', style: 'neon',
        background: '#07140d', card: '#0a1e13', border: '#1f5136',
        text: '#b8f7cc', muted: '#7fd79f', accent: '#34d399', pillText: '#34d399', pillBg: 'rgba(52,211,153,0.16)',
        contentBg: 'rgba(9,30,18,0.62)',
        overlayPattern: 'repeating-linear-gradient(180deg, rgba(52,211,153,0.06), rgba(52,211,153,0.06) 1px, transparent 1px, transparent 6px)',
        cardTexture: 'linear-gradient(0deg, rgba(52,211,153,0.07), transparent 40%)',
        extraCss: '.theme-matrix .commit-item { letter-spacing: 0.2px; } .theme-matrix .title { color: #8af5b7; }',
        font: "'Consolas', 'Courier New', monospace",
    },
    compact: {
        key: 'compact', title: 'Compact', style: 'compact',
        background: 'linear-gradient(145deg, #1f2937, #111827)', card: 'rgba(17,24,39,0.92)', border: 'rgba(148,163,184,0.30)',
        text: '#e5e7eb', muted: '#94a3b8', accent: '#22d3ee', pillText: '#22d3ee', pillBg: 'rgba(34,211,238,0.15)',
        contentBg: 'rgba(15,23,42,0.5)', overlayPattern: NO_PATTERN, cardTexture: NO_TEXTURE,
        extraCss: '.theme-compact .meta { display: none; } .theme-compact .commit-item { margin-bottom: 4px; }',
        font: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    },
    card: {
        key: 'card', title: 'Card', style: 'card',
        background: 'linear-gradient(145deg, #0f172a, #1e293b)', card: 'rgba(15,23,42,0.92)', border: 'rgba(148,163,184,0.30)',
        text: '#e2e8f0', muted: '#94a3b8', accent: '#60a5fa', pillText: '#60a5fa', pillBg: 'rgba(96,165,250,0.16)',
        contentBg: 'rgba(30,41,59,0.42)',
        overlayPattern: 'radial-gradient(circle at 80% 20%, rgba(96,165,250,0.2), transparent 35%)',
        cardTexture: 'linear-gradient(180deg, rgba(255,255,255,0.07), transparent 18%)',
        extraCss: '.theme-card .title { font-size: 20px; } .theme-card .pill { border-width: 1px; }',
        font: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    },
    terminal: {
        key: 'terminal', title: 'Terminal', style: 'terminal',
        background: '#0b1020', card: '#0b1220', border: '#1f2a44',
        text: '#d1fae5', muted: '#6ee7b7', accent: '#34d399', pillText: '#34d399', pillBg: 'rgba(52,211,153,0.18)',
        contentBg: 'rgba(8,15,28,0.62)',
        overlayPattern: 'repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(52,211,153,0.08) 24px)',
        cardTexture: NO_TEXTURE,
        extraCss: '.theme-terminal .repo, .theme-terminal .title { text-transform: uppercase; }',
        font: "'Consolas', 'Courier New', monospace",
    },
};
const THEME_ALIASES = { 'gh-light': 'github-light', 'gh-dark': 'github-dark' };
const STYLE_ALIASES = { gh: 'github' };
let templateCache = '';
function getTemplate() {
    if (!templateCache) {
        const templatePath = (0, node_path_1.join)(__dirname, '..', 'assets', 'render-card.html');
        templateCache = (0, node_fs_1.readFileSync)(templatePath, 'utf8');
    }
    return templateCache;
}
function escapeHtml(input) {
    return String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function pickCommitIcon(message) {
    const lower = (message || '').toLowerCase();
    if (lower.startsWith('feat'))
        return '[F]';
    if (lower.startsWith('fix'))
        return '[X]';
    if (lower.startsWith('docs'))
        return '[D]';
    if (lower.startsWith('refactor'))
        return '[R]';
    if (lower.startsWith('test'))
        return '[T]';
    if (lower.startsWith('chore'))
        return '[C]';
    return '[*]';
}
function getToneColor(tone) {
    switch (tone) {
        case 'success': return '#22c55e';
        case 'danger': return '#ef4444';
        case 'warning': return '#f59e0b';
        case 'info': return '#3b82f6';
        default: return '#94a3b8';
    }
}
function getEventTitle(event, payload) {
    switch (event) {
        case 'push': return 'Push Event';
        case 'issues': return 'Issue Update';
        case 'issue_comment': return payload?.issue?.pull_request ? 'PR Comment' : 'Issue Comment';
        case 'pull_request': return 'Pull Request Update';
        case 'pull_request_review': return 'Pull Request Review';
        case 'release': return 'Release Published';
        case 'workflow_run': return 'Workflow Completed';
        case 'discussion': return 'Discussion Update';
        case 'star': return 'New Star';
        case 'fork': return 'Repository Forked';
        case 'digest': return 'Digest Summary';
        default: return 'GitHub Notification';
    }
}
function getCardType(event, payload) {
    if (event === 'digest')
        return 'DIGEST';
    if (event === 'pull_request' || event === 'pull_request_review')
        return 'PR';
    if (event === 'issues' || event === 'issue_comment')
        return 'ISSUE';
    if (event === 'push')
        return 'COMMIT';
    if (event === 'release')
        return 'RELEASE';
    return 'REPO';
}
function resolveTone(event, payload) {
    const action = String(payload?.action || '').toLowerCase();
    const state = String(payload?.pull_request?.state || payload?.issue?.state || '').toLowerCase();
    const result = String(payload?.workflow_run?.conclusion || payload?.review?.state || '').toLowerCase();
    if (result === 'success' || result === 'approved' || action === 'merged' || state === 'closed')
        return 'success';
    if (result === 'failure' || result === 'changes_requested')
        return 'danger';
    if (action === 'opened' || action === 'created' || action === 'published')
        return 'info';
    if (action === 'edited' || action === 'reopened')
        return 'warning';
    return 'neutral';
}
function pill(text, tone) {
    const color = getToneColor(tone);
    return `<span class="pill" style="border-color:${color};color:${color};background:${color}22;">${escapeHtml(text)}</span>`;
}
function buildStatusPills(event, payload) {
    const pills = [];
    if (event === 'pull_request' && payload?.pull_request?.state)
        pills.push(pill(String(payload.pull_request.state), resolveTone(event, payload)));
    if (event === 'workflow_run' && payload?.workflow_run?.conclusion)
        pills.push(pill(String(payload.workflow_run.conclusion), resolveTone(event, payload)));
    if (event === 'release' && payload?.release?.tag_name)
        pills.push(pill(String(payload.release.tag_name), 'info'));
    return pills.join('');
}
function row(k, v) {
    return `<div class="detail-row"><div class="detail-key">${escapeHtml(k)}</div><div class="detail-value">${escapeHtml(v)}</div></div>`;
}
function buildDetailBlock(event, payload) {
    const repo = payload?.repository || {};
    if (event === 'pull_request' || event === 'pull_request_review') {
        const pr = payload?.pull_request || {};
        const rows = [
            row('PR', `#${pr.number || '?'} ${pr.title || 'Untitled'}`),
            row('State', `${pr.state || 'unknown'}${pr.draft ? ' / draft' : ''}`),
            row('Author', pr.user?.login || payload?.sender?.login || 'unknown'),
            row('Link', pr.html_url || ''),
        ];
        return `<div class="detail-grid">${rows.join('')}</div>`;
    }
    if (event === 'issues' || event === 'issue_comment') {
        const issue = payload?.issue || {};
        const rows = [
            row('Issue', `#${issue.number || '?'} ${issue.title || 'Untitled'}`),
            row('State', issue.state || 'unknown'),
            row('Author', issue.user?.login || payload?.sender?.login || 'unknown'),
            row('Comments', String(issue.comments ?? 0)),
            row('Link', issue.html_url || payload?.comment?.html_url || ''),
        ];
        return `<div class="detail-grid">${rows.join('')}</div>`;
    }
    if (event === 'release') {
        const release = payload?.release || {};
        const rows = [
            row('Tag', release.tag_name || 'unknown'),
            row('Name', release.name || 'Untitled'),
            row('Prerelease', release.prerelease ? 'yes' : 'no'),
            row('Link', release.html_url || ''),
        ];
        return `<div class="detail-grid">${rows.join('')}</div>`;
    }
    const rows = [
        row('Repository', repo.full_name || 'unknown/repo'),
        row('Stars', String(repo.stargazers_count ?? '?')),
        row('Forks', String(repo.forks_count ?? '?')),
        row('Open Issues', String(repo.open_issues_count ?? '?')),
    ];
    return `<div class="detail-grid">${rows.join('')}</div>`;
}
function buildCommitBlock(event, payload) {
    if (event !== 'push' || !Array.isArray(payload?.commits) || payload.commits.length === 0)
        return '';
    const rows = payload.commits.slice(0, 8).map((commit) => {
        const hash = escapeHtml((commit.id || '0000000').slice(0, 7));
        const message = String(commit.message || '').split('\n')[0];
        const icon = pickCommitIcon(message);
        const author = escapeHtml(commit.author?.name || 'unknown');
        return `<div class="commit-item"><span class="commit-icon">${icon}</span><span class="commit-hash">${hash}</span><span class="commit-msg">${escapeHtml(message)}</span><span class="commit-author">- ${author}</span></div>`;
    }).join('');
    return `<div class="commit-list">${rows}</div>`;
}
function buildDigestBlock(payload) {
    const items = Array.isArray(payload?.__digestItems) ? payload.__digestItems : [];
    if (!items.length)
        return '';
    const rows = items.slice(0, 30).map((item) => {
        return `<div class="digest-item"><div class="digest-event">${escapeHtml(item.event || 'event')}</div><div>${escapeHtml(item.summary || '')}</div></div>`;
    }).join('');
    return `<div class="digest-list">${rows}</div>`;
}
function listRenderThemes() {
    return Object.keys(THEME_PRESETS);
}
function listRenderStyles() {
    return ['auto', 'github', 'glass', 'neon', 'compact', 'card', 'terminal'];
}
function getThemeDefaultStyle(theme) {
    return (THEME_PRESETS[theme] || THEME_PRESETS['github-dark']).style;
}
function normalizeRenderTheme(theme) {
    if (!theme)
        return null;
    const key = theme.trim().toLowerCase();
    const direct = listRenderThemes().find((item) => item === key);
    if (direct)
        return direct;
    return THEME_ALIASES[key] || null;
}
function normalizeRenderStyle(style) {
    if (!style)
        return null;
    const key = style.trim().toLowerCase();
    const direct = listRenderStyles().find((item) => item === key);
    if (direct)
        return direct;
    return STYLE_ALIASES[key] || null;
}
function buildRenderHtml(textMessage, event, payload, theme, width, style) {
    const preset = THEME_PRESETS[theme] || THEME_PRESETS['github-dark'];
    const resolvedStyle = (style && style !== 'auto' ? style : preset.style);
    const tone = resolveTone(event, payload);
    const actionText = String(payload?.action || 'updated');
    const content = escapeHtml(textMessage).replace(/\n/g, '<br/>');
    const variables = {
        width: String(width || 860),
        themeKey: preset.key,
        styleVariant: resolvedStyle,
        background: preset.background,
        card: preset.card,
        border: preset.border,
        text: preset.text,
        muted: preset.muted,
        accent: preset.accent,
        pillText: preset.pillText,
        pillBg: preset.pillBg,
        contentBg: preset.contentBg,
        overlayPattern: preset.overlayPattern,
        cardTexture: preset.cardTexture,
        extraCss: preset.extraCss,
        font: preset.font,
        statusAccent: getToneColor(tone),
        repo: escapeHtml(payload?.repository?.full_name || 'unknown/repo'),
        themeTitle: escapeHtml(preset.title),
        typeLabel: getCardType(event, payload),
        eventTitle: escapeHtml(getEventTitle(event, payload)),
        actor: escapeHtml(payload?.sender?.login || payload?.pusher?.name || 'github'),
        actionPill: pill(actionText, tone),
        statusPills: buildStatusPills(event, payload),
        content,
        detailBlock: buildDetailBlock(event, payload),
        commitBlock: buildCommitBlock(event, payload),
        digestBlock: buildDigestBlock(payload),
    };
    let html = getTemplate();
    for (const [key, value] of Object.entries(variables)) {
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return html;
}
