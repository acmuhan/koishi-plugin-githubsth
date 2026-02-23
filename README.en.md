# koishi-plugin-githubsth

[![npm](https://img.shields.io/npm/v/koishi-plugin-githubsth?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-githubsth)

A Koishi plugin that delivers GitHub event notifications with repository-level subscription management.

## Features

- GitHub event notifications: `push`, `issues`, `issue_comment`, `pull_request`, `pull_request_review`, `release`, `star`, `fork`, `discussion`, `workflow_run`
- Trusted repository allowlist (admin-only)
- Channel-level subscription persistence (via Koishi `database`)
- Text/image/auto rendering mode
- Theme and style controls (global and per-subscription)
- Digest aggregation mode
- Built-in i18n (`zh-CN`, `en-US`)

## Installation

```bash
npm i koishi-plugin-githubsth
```

## Requirements

- `koishi` `^4.18.0`
- `koishi-plugin-adapter-github` `^1.0.0`
- Koishi `database` service (required)
- `puppeteer` service (optional, required for image rendering)

## Configuration

Main config fields:

- `defaultOwner`, `defaultRepo`
- `defaultEvents`
- `debug`, `logUnhandledEvents`
- `formatterLocale`
- `renderMode`, `renderFallback`
- `renderTheme`, `renderStyle`
- `renderWidth`, `renderTimeoutMs`
- `digestEnabled`, `digestWindowSec`, `digestMaxItems`

## Commands

User commands:

- `githubsth.subscribe <owner/repo> [events]`
- `githubsth.unsubscribe <owner/repo>`
- `githubsth.list`
- `githubsth.repo [owner/repo]`

Admin commands (authority `3`):

- `githubsth.trust.add <owner/repo>`
- `githubsth.trust.remove <owner/repo>`
- `githubsth.trust.list`
- `githubsth.trust.enable <owner/repo>`
- `githubsth.trust.disable <owner/repo>`
- `githubsth.render.*` (render mode/theme/style/preview/digest controls)

## Notes

- `githubsth.subscribe` only works for repositories in trusted list.
- If `renderMode=auto` and image rendering is unavailable, fallback behavior follows `renderFallback`.

## License

MIT
