import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { CatalogError, assertPublishableKey, assertStorageKey } from '../docker/volumes/functions/catalog-video/_shared/policy.mjs'

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex')
}

export function createLocalStore(root) {
  const objects = path.resolve(root, 'objects')
  const uploads = new Map()

  function objectPath(key) {
    assertStorageKey(key)
    const full = path.resolve(objects, key)
    const base = objects.endsWith(path.sep) ? objects : objects + path.sep
    if (full !== objects && !full.startsWith(base)) {
      throw new CatalogError(400, 'Storage key is invalid.')
    }
    return full
  }

  return {
    kind: 'local',
    async createMultipart({ key }) {
      assertPublishableKey(key)
      const uploadId = crypto.randomUUID()
      const dir = path.join(root, 'parts', uploadId)
      await mkdir(dir, { recursive: true })
      uploads.set(uploadId, { key, dir, parts: new Map() })
      return { uploadId }
    },
    async putPart({ uploadId, partNumber, bytes }) {
      const upload = uploads.get(uploadId)
      if (!upload) throw new CatalogError(404, 'Upload session not found. Start the upload again.')
      if (!Number.isInteger(partNumber) || partNumber < 1) {
        throw new CatalogError(400, 'Part number must be 1 or greater.')
      }
      const file = path.join(upload.dir, String(partNumber))
      await writeFile(file, bytes)
      const etag = sha256(bytes)
      upload.parts.set(partNumber, { etag, size: bytes.length, file })
      return { etag, size: bytes.length }
    },
    async complete({ uploadId, parts }) {
      const upload = uploads.get(uploadId)
      if (!upload) throw new CatalogError(404, 'Upload session not found. Start the upload again.')
      const ordered = [...parts].sort((a, b) => a.part_number - b.part_number)
      if (ordered.length !== upload.parts.size) {
        throw new CatalogError(400, 'The part list does not match the uploaded parts.')
      }
      const dest = objectPath(upload.key)
      await mkdir(path.dirname(dest), { recursive: true })
      const tmp = `${dest}.partial`
      const hash = createHash('sha256')
      const out = createWriteStream(tmp)
      let size = 0
      try {
        for (const part of ordered) {
          const stored = upload.parts.get(part.part_number)
          if (!stored || stored.etag !== String(part.etag).replaceAll('"', '')) {
            throw new CatalogError(400, `Part ${part.part_number} does not match the uploaded bytes.`)
          }
          const chunk = await readFile(stored.file)
          hash.update(chunk)
          size += chunk.length
          if (!out.write(chunk)) {
            await new Promise((resolve, reject) => {
              out.once('drain', resolve)
              out.once('error', reject)
            })
          }
        }
        await new Promise((resolve, reject) => out.end((err) => (err ? reject(err) : resolve())))
        await rename(tmp, dest)
      } catch (error) {
        out.destroy()
        await rm(tmp, { force: true })
        throw error
      }
      await rm(upload.dir, { recursive: true, force: true })
      uploads.delete(uploadId)
      return { key: upload.key, bytes: size, sha256: hash.digest('hex') }
    },
    async remove(key) {
      await rm(objectPath(key), { force: true })
    },
    async putBytes(key, bytes) {
      assertPublishableKey(key)
      const dest = objectPath(key)
      await mkdir(path.dirname(dest), { recursive: true })
      await writeFile(dest, bytes)
    },
    localPath(key) {
      return objectPath(key)
    },
    async stat(key) {
      const file = objectPath(key)
      try {
        const info = await stat(file)
        return { bytes: info.size }
      } catch {
        return null
      }
    },
    async get(key) {
      return readFile(objectPath(key))
    },
    async open(key) {
      const file = objectPath(key)
      const info = await stat(file)
      return { file, bytes: info.size, stream: (start, end) => createReadStream(file, { start, end }) }
    },
    async exists(key) {
      return !!(await this.stat(key))
    },
  }
}
