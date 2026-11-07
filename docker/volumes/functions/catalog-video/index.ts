// Edge entry for SWADEBASE. Business rules live in _shared so the Node worker and tests use the same code.
import { handle } from './_shared/handler.mjs'
import { createProductionDeps } from './_shared/production.mjs'

const env = {
  SUPABASE_URL: Deno.env.get('SUPABASE_URL') ?? '',
  SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  SUPABASE_PUBLIC_URL: Deno.env.get('SUPABASE_PUBLIC_URL') ?? '',
  CATALOG_VIDEO_SIGNING_KEY: Deno.env.get('CATALOG_VIDEO_SIGNING_KEY') ?? '',
  CATALOG_VIDEO_PUBLIC_BASE: Deno.env.get('CATALOG_VIDEO_PUBLIC_BASE') ?? '',
  CATALOG_VIDEO_MAX_MASTER_BYTES: Deno.env.get('CATALOG_VIDEO_MAX_MASTER_BYTES') ?? '',
  CATALOG_VIDEO_S3_ENDPOINT: Deno.env.get('CATALOG_VIDEO_S3_ENDPOINT') ?? '',
  CATALOG_VIDEO_S3_BUCKET: Deno.env.get('CATALOG_VIDEO_S3_BUCKET') ?? '',
  CATALOG_VIDEO_S3_REGION: Deno.env.get('CATALOG_VIDEO_S3_REGION') ?? '',
  CATALOG_VIDEO_S3_ACCESS_KEY_ID: Deno.env.get('CATALOG_VIDEO_S3_ACCESS_KEY_ID') ?? '',
  CATALOG_VIDEO_S3_SECRET_ACCESS_KEY: Deno.env.get('CATALOG_VIDEO_S3_SECRET_ACCESS_KEY') ?? '',
}

const deps = await createProductionDeps(env)

Deno.serve((req) => handle(req, deps))
