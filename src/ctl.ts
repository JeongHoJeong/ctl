#!/usr/bin/env node
import * as path from 'path'
import * as fs from 'fs'
import { promisify } from 'util'

import * as Sqrl from 'squirrelly'
import * as prompts from 'prompts'

import { walk } from './walk'
import { run } from './run'
import { ensureDirectoryExists } from './ensure-directory-exists'

const { error } = console
const templatesRoot = path.join(__dirname, '../templates')

interface TemplateData {
  projectName: string
  isReactLibrary: boolean
}

async function getDest(): Promise<string> {
  const dest: string | undefined = process.argv[2]

  if (dest) {
    return dest
  }

  const result = await prompts({ type: 'text', name: 'name', message: 'What is the name of your project?' })
  return result.name
}

async function getIsReactLibrary(): Promise<boolean> {
  const result = await prompts({
    type: 'toggle',
    name: 'result',
    message: 'Is this a React library?',
    active: 'yes',
    inactive: 'no',
  })
  return result.result
}

async function loadJSONFile(filePath: string) {
  const jsonRaw = await promisify(fs.readFile)(filePath, 'utf-8')
  return JSON.parse(jsonRaw)
}

async function writeJSONFile(json: any, filePath: string) {
  const content = JSON.stringify(json, null, 2)
  return promisify(fs.writeFile)(filePath, content)
}

async function writeTsconfigFile(dest: string, isReactLibrary: boolean) {
  const tsconfig = await loadJSONFile(path.join(templatesRoot, 'tsconfig.json'))

  if (isReactLibrary) {
    tsconfig.compilerOptions.jsx = 'react'
  }

  return writeJSONFile(tsconfig, path.join(dest, 'tsconfig.json'))
}

async function main() {
  const dest = await getDest()
  const isReactLibrary = await getIsReactLibrary()

  if (await promisify(fs.exists)(dest)) {
    error(`${dest} already exists. Please use another project name.`)
    return
  }

  await promisify(fs.mkdir)(dest, { recursive: true })

  const templateData: TemplateData = {
    projectName: dest,
    isReactLibrary,
  }

  await walk(templatesRoot, async (templateFullPath, templatePartialPath) => {
    const pattern = /(.*)\.tmpl$/
    const match = pattern.exec(templatePartialPath)

    if (match && match[1]) {
      const template = await promisify(fs.readFile)(templateFullPath, 'utf-8')
      const result: unknown = Sqrl.render(template, templateData)

      if (typeof result === 'string') {
        const matchedFileName = match[1]
        const fileName = (isReactLibrary && /\.tsx?$/.test(matchedFileName)) ?
          matchedFileName :
          matchedFileName.replace(/x$/, '')

        const destPath = path.join(dest, fileName)
        await ensureDirectoryExists(destPath)
        return promisify(fs.writeFile)(destPath, result)
      } else {
        error(`Failed to compile template ${templateFullPath}.`)
      }
    }
  })

  await writeTsconfigFile(dest, isReactLibrary)

  const reactDevPackages = [
    'react',
    'react-dom',
    '@types/react',
    '@types/react-dom',
    '@testing-library/react',
    '@testing-library/react-hooks',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'react-test-renderer',
  ]

  const devPackages = [
    'typescript',
    'jest',
    'ts-jest',
    'eslint',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    '@types/jest',
    ...isReactLibrary ? reactDevPackages : [],
  ]

  const cwd = path.resolve(dest)
  await run(cwd, 'yarn', ['add', '--dev', ...devPackages])
  await run(cwd, 'git', ['init'])
  await run(cwd, 'git', ['add', '.'])
  await run(cwd, 'git', ['commit', '-m', 'Initialize project'])
}

main().then().catch(e => error(e))
