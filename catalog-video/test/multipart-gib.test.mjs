import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import test from 'node:test'
import { planMultipart } from '../../docker/volumes/functions/catalog-video/_shared/policy.mjs'
import { createLocalStore } from '../localstore.mjs'

const ONE_GIB = 1024 * 1024 * 1024

async function hashFile(file) {
  const hash = createHash('sha256')
  await pipeline(createReadStream(file), hash)
  return hash.digest('hex')
}

test('local multipart store assembles a real 1GiB object', { timeout: 180_000 }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'catalog-gib-'))
  const store = createLocalStore(root)
  const key = 'catalog/abagale/11111111-1111-4111-8111-111111111111/masters/22222222-2222-4222-8222-222222222222/original'
  const plan = planMultipart(ONE_GIB)
  assert.equal(plan.parts.reduce((sum, part) => sum + part.size, 0), ONE_GIB)
  assert.ok(plan.partCount > 1)
  const hash = createHash('sha256')
  try {
    const opened = await store.createMultipart({ key })
    for (const part of plan.parts) {
      const bytes = Buffer.allocUnsafe(part.size)
      bytes.fill(part.partNumber & 0xff)
      hash.update(bytes)
      const stored = await store.putPart({ uploadId: opened.uploadId, partNumber: part.partNumber, bytes })
      part.etag = stored.etag
    }
    const finished = await store.complete({
      uploadId: opened.uploadId,
      parts: plan.parts.map((part) => ({ part_number: part.partNumber, etag: part.etag })),
    })
    assert.equal(finished.bytes, ONE_GIB)
    assert.equal(finished.sha256, hash.digest('hex'))
    const info = await store.stat(key)
    assert.equal(info.bytes, ONE_GIB)
    assert.equal(await hashFile(store.localPath(key)), finished.sha256)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
