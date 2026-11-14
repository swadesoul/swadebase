export async function readBody(req, limit) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) {
      const error = new Error('payload too large')
      error.status = 413
      error.code = 'payload_too_large'
      throw error
    }
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

export function parseMultipart(buffer, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '')
  if (!match) {
    const error = new Error('Upload must be multipart form data')
    error.status = 400
    error.code = 'invalid_request'
    throw error
  }
  const boundary = `--${(match[1] || match[2]).trim()}`
  const text = buffer.toString('latin1')
  const parts = text.split(boundary).slice(1, -1)
  const files = []
  for (const part of parts) {
    const body = part.replace(/^\r\n/, '').replace(/\r\n$/, '')
    if (!body || body === '--') continue
    const splitAt = body.indexOf('\r\n\r\n')
    if (splitAt < 0) continue
    const headers = body.slice(0, splitAt)
    const data = body.slice(splitAt + 4).replace(/\r\n$/, '')
    const name = /name="([^"]*)"/.exec(headers)?.[1] || 'file'
    const filename = /filename="([^"]*)"/.exec(headers)?.[1] || 'upload.bin'
    const type = /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim() || ''
    if (name !== 'file') continue
    files.push({
      filename: filename || 'upload.bin',
      contentType: type,
      bytes: Buffer.from(data, 'latin1'),
    })
  }
  if (!files.length) {
    const error = new Error('Choose a file to upload')
    error.status = 400
    error.code = 'invalid_request'
    throw error
  }
  return files[0]
}

export function rejectExecutable(file) {
  const name = file.filename.toLowerCase()
  const magic = file.bytes.subarray(0, 2).toString('utf8')
  if (name.endsWith('.exe') || name.endsWith('.sh') || magic === 'MZ') {
    const error = new Error('That file type is not allowed')
    error.status = 400
    error.code = 'invalid_request'
    throw error
  }
}
