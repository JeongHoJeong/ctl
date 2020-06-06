import * as path from 'path'
import * as fs from 'fs'
import { promisify } from 'util'

export async function ensureDirectoryExists(filePath: string):
Promise<ReturnType<typeof fs.mkdirSync> | undefined> {
  const dirname = path.dirname(filePath)
  if (!await promisify(fs.exists)(dirname)) {
    return promisify(fs.mkdir)(dirname, { recursive: true })
  }
  return
}
