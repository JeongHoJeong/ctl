import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'

function isPromise(object: unknown): object is Promise<any> {
  return (
    (typeof object === 'function' || typeof object === 'object') &&
    object !== null &&
    typeof (object as any).then === 'function'
  )
}

export async function walk(
  dir: string,
  callback: (path: string, relativePath: string) => any,
  partialPath = '',
): Promise<void> {
  const paths = await util.promisify(fs.readdir)(dir)

  await Promise.all(paths.map(async childPath => {
    const childPartialPath = path.join(partialPath, childPath)
    const childFullPath = path.join(dir, childPath)
    const stat = await util.promisify(fs.stat)(childFullPath)

    if (stat.isDirectory()) {
      return walk(childFullPath, callback, childPartialPath)
    } else if (stat.isFile()) {
      const promise = callback(childFullPath, childPartialPath)
      if (isPromise(promise)) {
        return promise
      }
    }
  }))
}
