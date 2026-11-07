import { createServer } from 'node:http'
import { handle } from '../docker/volumes/functions/catalog-video/_shared/handler.mjs'

export function startCatalogServer(deps) {
  const server = createServer(async (req, res) => {
    try {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const body = Buffer.concat(chunks)
      const request = new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
      })
      const response = await handle(request, deps)
      const headers = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })
      const payload = Buffer.from(await response.arrayBuffer())
      res.writeHead(response.status, headers)
      res.end(payload)
    } catch (error) {
      res.writeHead(500, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'Catalog video request failed. The original file was not deleted.' }))
      console.error(error)
    }
  })
  return server
}
