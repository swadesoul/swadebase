import { spawn } from 'node:child_process'
import { hyperframesArgs } from './hyperframes.mjs'

export function renderWithHyperframes(dir, outFile, options = {}) {
  const args = hyperframesArgs(dir, outFile, options)
  return new Promise((resolve, reject) => {
    const child = spawn('npx', args, { cwd: dir })
    let err = ''
    child.stderr.on('data', (chunk) => {
      err += chunk
    })
    child.stdout.on('data', () => {})
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve(outFile)
      else reject(new Error(`hyperframes render failed (${code}) ${err.slice(-500)}`))
    })
  })
}
