// Render objects use one key prefix. The default store is a local directory so
// development never calls Backblaze. Set SWADE_LEARN_B2=b2 to upload with the
// same keys the Motion Studio worker already uses.

import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export const RENDER_PREFIX = 'teachvirt/swade-learn/renders'

export function renderKey(jobId, name) {
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(jobId)) throw new Error('invalid render id')
  if (!/^[a-z0-9][a-z0-9._-]{0,80}$/.test(name)) throw new Error('invalid object name')
  return `${RENDER_PREFIX}/${jobId}/${name}`
}

export function assertRenderKey(key) {
  if (typeof key !== 'string' || key.includes('..') || key.startsWith('/') || !key.startsWith(`${RENDER_PREFIX}/`)) {
    throw new Error('refusing a key outside teachvirt/swade-learn/renders/')
  }
  return key
}

export function localStore(root) {
  return {
    kind: 'local',
    async put(key, file) {
      const safe = assertRenderKey(key)
      const dest = join(root, safe)
      await mkdir(dirname(dest), { recursive: true })
      await copyFile(file, dest)
      return safe
    },
    async read(key) {
      return readFile(join(root, assertRenderKey(key)))
    },
  }
}

export async function b2Store({ keyId, appKey, bucket, endpoint, region }) {
  if (!keyId || !appKey || !bucket || !endpoint) throw new Error('Backblaze B2 is not configured')
  const { AwsClient } = await import('aws4fetch')
  const s3 = new AwsClient({ accessKeyId: keyId, secretAccessKey: appKey, service: 's3', region: region || 'us-east-005' })
  const base = endpoint.replace(/\/$/, '').replace(/^(?!https?:\/\/)/, 'https://')
  return {
    kind: 'b2',
    async put(key, file, type = 'application/octet-stream') {
      const safe = assertRenderKey(key)
      const body = await readFile(file)
      const url = `${base}/${bucket}/${safe.split('/').map(encodeURIComponent).join('/')}`
      const response = await s3.fetch(url, {
        method: 'PUT',
        body,
        headers: { 'content-type': type, 'content-length': String(body.length) },
      })
      if (!response.ok) throw new Error(`B2 upload failed (${response.status})`)
      return safe
    },
  }
}

export function createStore(env = process.env) {
  if (env.SWADE_LEARN_B2 === 'b2') {
    throw new Error('Use b2Store() from the worker when SWADE_LEARN_B2=b2. The CLI stays local unless a store is passed in.')
  }
  const root = env.SWADE_LEARN_LOCAL_ROOT || '/tmp/swade-learn-renders'
  return localStore(root)
}
