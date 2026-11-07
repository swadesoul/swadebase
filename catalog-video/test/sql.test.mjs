import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { rm, writeFile } from 'node:fs/promises'
import test from 'node:test'

function exec(command, args, input) {
  return new Promise((resolve) => {
    execFile(command, args, { input, timeout: 20_000 }, (error, stdout, stderr) => {
      resolve({ code: error ? error.code ?? 1 : 0, stdout, stderr })
    })
  })
}

async function psql(database, sql) {
  const file = `/tmp/catalog-sql-${crypto.randomUUID()}.sql`
  await writeFile(file, sql, { mode: 0o644 })
  try {
    return await exec('sudo', ['-u', 'postgres', 'psql', '-d', database, '-q', '-v', 'ON_ERROR_STOP=1', '-tA', '-f', file])
  } finally {
    await rm(file, { force: true })
  }
}

test('migration enforces the quote, the duration-safe queue, and owner isolation', { timeout: 60_000 }, async () => {
  const clusters = await exec('sudo', ['pg_lsclusters'])
  if (!/online/.test(clusters.stdout)) {
    const started = await exec('sudo', ['pg_ctlcluster', '16', 'main', 'start'])
    if (started.code !== 0 && !/already running/i.test(`${started.stdout}${started.stderr}`)) {
      throw new Error(started.stderr || 'PostgreSQL did not start')
    }
  }
  await psql('postgres', "select pg_terminate_backend(pid) from pg_stat_activity where datname = 'catalog_video_test' and pid <> pg_backend_pid();")
  await psql('postgres', 'drop database if exists catalog_video_test;')
  const created = await psql('postgres', 'create database catalog_video_test;')
  assert.equal(created.code, 0, created.stderr)
  const setup = await psql('catalog_video_test', `
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
    end $$;
    create schema if not exists auth;
    create or replace function auth.uid() returns uuid language sql stable as $$ select 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid $$;
  `)
  assert.equal(setup.code, 0, setup.stderr)
  const applied = await exec('sudo', ['-u', 'postgres', 'psql', '-d', 'catalog_video_test', '-v', 'ON_ERROR_STOP=1', '-f', '/workspace/supabase/migrations/20261107210000_catalog_video.sql'])
  assert.equal(applied.code, 0, applied.stderr)

  const creator = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const other = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  const inserted = await psql('catalog_video_test', `
    insert into public.catalog_video_series (tenant, creator_user_id, title) values ('abagale', '${creator}', 'Story') returning id;
  `)
  assert.equal(inserted.code, 0, inserted.stderr)
  const activated = await psql('catalog_video_test', `
    insert into public.catalog_video_entitlements (tenant, creator_user_id, billing_status) values ('abagale', '${creator}', 'active');
  `)
  assert.notEqual(activated.code, 0)
  const quota = await psql('catalog_video_test', `
    insert into public.catalog_video_entitlements (tenant, creator_user_id, quota_bytes) values ('abagale', '${creator}', 1);
  `)
  assert.notEqual(quota.code, 0)
  const youtube = await psql('catalog_video_test', `
    insert into public.catalog_video_assets (tenant, creator_user_id, title, source_type, youtube_id, rights_web, rights_roku, status)
    values ('abagale', '${creator}', 'Clip', 'youtube_embed', 'dQw4w9Wgxcq', true, true, 'embed_only');
  `)
  assert.notEqual(youtube.code, 0)

  const asset = await psql('catalog_video_test', `
    insert into public.catalog_video_assets (tenant, creator_user_id, title, source_type, rights_web, rights_roku)
    values ('blacktales', '${creator}', 'Episode', 'original', true, true) returning id;
  `)
  assert.equal(asset.code, 0, asset.stderr)
  const assetId = asset.stdout.trim().split('\n')[0].trim()
  const job = await psql('catalog_video_test', `
    insert into public.catalog_video_jobs (asset_id, creator_user_id, kind, source_sha256)
    values ('${assetId}', '${creator}', 'probe', 'abc123abc123abc123abc123abc123ab');
    insert into public.catalog_video_jobs (asset_id, creator_user_id, kind, source_sha256)
    values ('${assetId}', '${other}', 'probe', 'def123def123def123def123def123de');
  `)
  assert.equal(job.code, 0, job.stderr)
  const claim = await psql('catalog_video_test', `select (public.claim_catalog_video_job('worker-1', 4)).id::text;`)
  assert.equal(claim.code, 0, claim.stderr)
  assert.ok(claim.stdout.trim().length > 10)
  const second = await psql('catalog_video_test', `select (public.claim_catalog_video_job('worker-2', 9)).id is null;`)
  assert.equal(second.code, 0, second.stderr)
  assert.equal(second.stdout.trim(), 't')
  const running = await psql('catalog_video_test', `select count(*) from public.catalog_video_jobs where status = 'running';`)
  assert.equal(running.stdout.trim(), '1')
  const motion = await psql('catalog_video_test', `select coalesce(to_regclass('public.motion_render_jobs')::text, '');`)
  assert.equal(motion.stdout.trim(), '')

  const hidden = await psql('catalog_video_test', `
    set role authenticated;
    select count(*) from public.catalog_video_assets;
  `)
  assert.equal(hidden.code, 0, hidden.stderr)
  assert.equal(hidden.stdout.trim(), '0')
})
