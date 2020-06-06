#!/usr/bin/env node
import * as path from 'path'
import * as fs from 'fs'
import { promisify } from 'util'

import { walk } from './walk'
import { run } from './run'
import { ensureDirectoryExists } from './ensure-directory-exists'

async function main() {
  const dest: string | undefined = process.argv[2]

  if (!dest) {
    console.error('Please provide a project name.')
    return
  }

  if (await promisify(fs.exists)(dest)) {
    console.error(`${dest} already exists. Please use another project name.`)
    return
  }

  await promisify(fs.mkdir)(dest, { recursive: true })

  const templatesRoot = path.join(__dirname, '../templates')

  await walk(templatesRoot, async (templateFullPath, templatePartialPath) => {
    const pattern = /(.*)\.tmpl$/
    const match = pattern.exec(templatePartialPath)

    if (match && match[1]) {
      const fileName = match[1]
      const destPath = path.join(dest, fileName)
      await ensureDirectoryExists(destPath)
      return promisify(fs.copyFile)(templateFullPath, destPath)
    }
  })

  const cwd = path.resolve(dest)

  const devPackages = [
    'typescript',
    'jest',
    'ts-jest',
    'eslint',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    '@types/jest',
  ]

  await run(cwd, 'yarn', ['add', '--dev', ...devPackages])
  await run(cwd, 'git', ['init'])
  await run(cwd, 'git', ['add', '.'])
  await run(cwd, 'git', ['commit', '-m', 'Initialize project'])
}

main().then().catch(e => console.error(e))
