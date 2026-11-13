import { spawn } from 'node:child_process'

export function zipDirectory(dir, outFile) {
  return new Promise((resolve, reject) => {
    const child = spawn('zip', ['-r', '-q', outFile, '.'], { cwd: dir })
    let err = ''
    child.stderr.on('data', (chunk) => {
      err += chunk
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve(outFile)
      else reject(new Error(`zip failed (${code}) ${err.slice(-400)}`))
    })
  })
}
