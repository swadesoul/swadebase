// Local render. Does not call ElevenLabs, Together, or Backblaze.
//   node cli.mjs pack.json
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createLedger } from './ledger.mjs'
import { readPackFile, runSwadeLearnPack } from './pipeline.mjs'
import { localStore } from './store.mjs'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node cli.mjs pack.json')
  process.exit(1)
}
const pack = await readPackFile(file)
const renderId = `local${Date.now().toString(36)}`.slice(0, 40)
const dir = join(tmpdir(), `swade-learn-${renderId}`)
await mkdir(dir, { recursive: true })
const root = process.env.SWADE_LEARN_LOCAL_ROOT || join(tmpdir(), 'swade-learn-renders')
const result = await runSwadeLearnPack({
  pack,
  ledger: createLedger(),
  store: localStore(root),
  dir,
  renderId,
  premiumEnabled: false,
  renderer: process.env.SWADE_LEARN_RENDERER || 'remotion',
})
const printable = {
  status: result.status,
  video_b2_key: result.video_b2_key,
  source_zip_b2_key: result.source_zip_b2_key,
  checksums: result.checksums,
  renderer: result.renderer,
  paid_calls: result.paid_calls,
  narration: result.narration,
}
console.log(JSON.stringify(printable, null, 2))
