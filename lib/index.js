"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = exports.name = void 0;
exports.apply = apply;
const commands_1 = require("./commands");
const database = __importStar(require("./database"));
const zh_CN_1 = __importDefault(require("./locales/zh-CN"));
const en_US_1 = __importDefault(require("./locales/en-US"));
const notifier_1 = require("./services/notifier");
const formatter_1 = require("./services/formatter");
const render_card_1 = require("./services/render-card");
exports.name = 'githubsth';
exports.inject = {
    required: ['database'],
    optional: ['github', 'puppeteer'],
};
__exportStar(require("./config"), exports);
function apply(ctx, config) {
    const logger = ctx.logger('githubsth');
    logger.info('Plugin loading...');
    ctx.i18n.define('zh-CN', zh_CN_1.default);
    ctx.i18n.define('en-US', en_US_1.default);
    ctx.plugin(database);
    ctx.plugin(formatter_1.Formatter, config);
    ctx.plugin(notifier_1.Notifier, config);
    ctx.on('ready', async () => {
        try {
            const subs = await ctx.database.get('github_subscription', {});
            for (const sub of subs) {
                if (sub.renderStyle)
                    continue;
                const theme = (0, render_card_1.normalizeRenderTheme)(sub.renderTheme) || (0, render_card_1.normalizeRenderTheme)(config.renderTheme) || 'github-dark';
                const style = (0, render_card_1.getThemeDefaultStyle)(theme);
                await ctx.database.set('github_subscription', { id: sub.id }, { renderStyle: style });
            }
        }
        catch (error) {
            logger.warn('Failed to backfill renderStyle for subscriptions:', error);
        }
        const normalizedGlobalStyle = (0, render_card_1.normalizeRenderStyle)(config.renderStyle);
        if (!normalizedGlobalStyle) {
            config.renderStyle = 'auto';
        }
    });
    try {
        ctx.plugin(commands_1.apply, config);
        logger.info('Plugin loaded successfully');
    }
    catch (error) {
        logger.error('Plugin failed to load:', error);
    }
}
