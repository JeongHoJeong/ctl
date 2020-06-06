import { ChildProcess } from 'child_process'

// https://2ality.com/2018/05/child-process-streams.html
export async function onExit(childProcess: ChildProcess): Promise<void> {
  return new Promise((resolve, reject) => {
    childProcess.once('exit', (code: number) => {
      if (code === 0) {
        resolve(undefined)
      } else {
        reject(new Error('Exit with error code: '+code))
      }
    })

    childProcess.once('error', (err: Error) => {
      reject(err)
    })
  })
}
