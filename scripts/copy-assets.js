const { cpSync, existsSync, mkdirSync } = require('node:fs')
const { join } = require('node:path')

const root = process.cwd()
const sourceDir = join(root, 'src', 'assets')
const targetDir = join(root, 'lib', 'assets')

if (!existsSync(sourceDir)) {
  process.exit(0)
}

mkdirSync(targetDir, { recursive: true })
cpSync(sourceDir, targetDir, { recursive: true, force: true })
