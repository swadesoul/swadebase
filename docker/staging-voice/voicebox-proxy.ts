import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// AudiVid voice actions -> SWADE voice service (SWADEBASE). Voicebox is being retired.
//   POST /voicebox-proxy/speak       {text, voice_profile_id}  -> audio/wav
//   POST /voicebox-proxy/transcribe  multipart file            -> {transcript, language, duration}
//   POST /voicebox-proxy/profiles    multipart name, sample    -> {profile_id, name}
//   GET  /voicebox-proxy/profiles                              -> {profiles: [...]} (caller's voices)
//   DELETE /voicebox-proxy/profiles?id=<profile_id>            -> {deleted} (caller's own voice only)
//   POST /voicebox-proxy/queue  {text, voice_profile_id, row_id, path_prefix} (service role only) -> {job_id}
//   GET  /voicebox-proxy/ping                                  -> {ok}
// Requires a signed-in user (or the service role for server-side callers such as audivid-generate).
// Failures return real errors: no more silent stub audio or sample transcripts.

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const action = new URL(req.url).pathname.split('/').filter(Boolean).pop() || 'ping'
    if (action === 'ping') return json({ ok: true, provider: 'swade-voice-service' })

    const base = (Deno.env.get('VOICE_SERVICE_URL') || 'http://172.16.0.1:8790').replace(/\/$/, '')
    const token = Deno.env.get('VOICE_SERVICE_TOKEN')
    if (!token) return json({ error: 'Voice service is not configured' }, 503)

    // Who is calling?
    const auth = req.headers.get('Authorization') || ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    let owner: string | null = null
    if (!(serviceKey && auth === `Bearer ${serviceKey}`)) {
      const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
      const { data } = await client.auth.getUser()
      if (!data?.user) return json({ error: 'Sign in to use voices' }, 401)
      owner = data.user.id
    }
    const headers = { Authorization: `Bearer ${token}` }

    if (action === 'speak') {
      const { text, voice_profile_id } = await req.json()
      if (!text || typeof text !== 'string') return json({ error: 'text is required' }, 400)
      const r = await fetch(`${base}/v1/voicebox/speak`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_profile_id }), signal: AbortSignal.timeout(28 * 60_000),
      })
      if (!r.ok) return json({ error: 'Voice generation failed', detail: (await r.text()).slice(0, 300) }, r.status === 422 ? 422 : 502)
      return new Response(await r.arrayBuffer(), {
        headers: { ...corsHeaders, 'Content-Type': r.headers.get('content-type') || 'audio/wav', 'X-Engine': r.headers.get('x-engine') || '' },
      })
    }

    if (action === 'queue') {
      // Server-side only (audivid-generate): long podcast render written straight to storage + podcasts row.
      if (owner) return json({ error: 'forbidden' }, 403)
      const { text, voice_profile_id, row_id, path_prefix } = await req.json()
      const r = await fetch(`${base}/v1/jobs`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'audivid_podcast', row_id, path_prefix, text, voice: voice_profile_id, format: 'mp3' }),
      })
      return json(await r.json(), r.status)
    }

    if (action === 'transcribe' || action === 'profiles') {
      if (action === 'profiles' && req.method === 'DELETE') {
        const id = new URL(req.url).searchParams.get('id') || ''
        const q = new URLSearchParams({ id, ...(owner ? { owner } : {}) })
        const r = await fetch(`${base}/v1/voicebox/profiles?${q}`, { method: 'DELETE', headers })
        return json(r.ok ? await r.json() : { error: 'Voice not found' }, r.status)
      }
      if (action === 'profiles' && req.method === 'GET') {
        const q = owner ? `?owner=${encodeURIComponent(owner)}` : ''
        const r = await fetch(`${base}/v1/voicebox/profiles${q}`, { headers })
        return json(await r.json(), r.status)
      }
      const form = await req.formData()
      if (action === 'profiles') {
        form.set('app', 'audivid')
        if (owner) form.set('owner', owner)
      }
      const r = await fetch(`${base}/v1/voicebox/${action}`, { method: 'POST', headers, body: form, signal: AbortSignal.timeout(30 * 60_000) })
      return json(await r.json(), r.status)
    }

    return json({ error: `unknown action ${action}` }, 404)
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
