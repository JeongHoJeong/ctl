import { spawn } from 'child_process'

import { onExit } from './on-exit'

export async function run(cwd: string, command: string, args: string[]): Promise<void> {
  const childProcess = spawn(command, args, {
    stdio: [process.stdin, process.stdout, process.stderr],
    cwd,
  })
  await onExit(childProcess)
}
