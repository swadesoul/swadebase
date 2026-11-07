// Catalog video worker. One job at a time. Does not claim motion_render_jobs.
import { processNext } from './encode.mjs'

const pollMs = Number(process.env.CATALOG_VIDEO_POLL_MS || 4000)

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Catalog worker needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. It does not start against production from this checkout by itself.')
    process.exit(1)
  }
  const { createProductionDeps } = await import('../../docker/volumes/functions/catalog-video/_shared/production.mjs')
  const deps = await createProductionDeps(process.env)
  deps.workerId = process.env.CATALOG_VIDEO_WORKER_ID || 'catalog-video-worker'
  console.log('catalog-video worker polling. concurrency=1. 4K disabled. billing unconfigured.')
  for (;;) {
    try {
      const job = await processNext(deps)
      if (!job) await new Promise((resolve) => setTimeout(resolve, pollMs))
    } catch (error) {
      console.error(error)
      await new Promise((resolve) => setTimeout(resolve, pollMs))
    }
  }
}

const invoked = process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll('\\', '/').split('/').pop())
if (invoked && process.argv[1].endsWith('worker.mjs')) {
  main()
}
