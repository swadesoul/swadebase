import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { chargeCredits, insufficientCreditsBody } from '../vsw-_shared/credits.ts'

// Orchestrator: enqueue one generation_jobs row per requested kind and process them in background.
// Ebook & audivid finalization (PDF/video render) happens client-side; this function produces the
// generated text and marks the job completed. Podcast audio is queued on the SWADE voice service
// (via voicebox-proxy/queue), which fills podcasts.audio_path when the render finishes.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = req.headers.get('Authorization') || ''
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(url, serviceKey)
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    })
    const { data: userData } = await userClient.auth.getUser()
    const user = userData.user
    if (!user) return json({ error: 'unauthorized' }, 401)

    const body = await req.json()
    const { capture_id, kinds = [], voice_profile_id = null, image_path = null, eq_style = 'bars' } = body || {}
    if (!capture_id || !Array.isArray(kinds) || kinds.length === 0) return json({ error: 'capture_id and kinds required' }, 400)

    const { data: capture } = await supabase.from('captures').select('*').eq('id', capture_id).eq('user_id', user.id).maybeSingle()
    if (!capture) return json({ error: 'capture not found' }, 404)

    // Create job rows
    const jobRows = kinds.map((k: string) => ({
      user_id: user.id, capture_id, kind: k, status: 'pending', progress: 0,
      metadata: { voice_profile_id, image_path, eq_style },
    }))
    const { data: jobs, error: jobsErr } = await supabase.from('generation_jobs').insert(jobRows).select()
    if (jobsErr) return json({ error: jobsErr.message }, 500)

    // Meter: audivid renders cost 5 credits, e-book/podcast text 1 each.
    for (const job of jobs || []) {
      const featureKey = job.kind === 'audivid' ? 'audivid_render' : 'audivid_text'
      const charge = await chargeCredits(supabase, {
        userId: user.id,
        featureKey,
        idempotencyKey: `audivid:${job.id}`,
        jobId: null,
      })
      if (!charge.ok) {
        await supabase.from('generation_jobs')
          .update({ status: 'failed', error: 'Insufficient credits' })
          .in('id', (jobs || []).map((j: any) => j.id))
        return json(insufficientCreditsBody(charge, featureKey), 402)
      }
    }

    // Kick off async processing (fire and forget)
    ;(async () => {
      for (const job of jobs || []) {
        try {
          await supabase.from('generation_jobs').update({ status: 'processing', progress: 10 }).eq('id', job.id)
          const hermesMode = job.kind === 'ebook' ? 'ebook_chapter' : job.kind === 'podcast' ? 'podcast_script' : 'audivid_narration'
          const hermesRes = await fetch(`${url}/functions/v1/hermes-generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({ mode: hermesMode, transcript: capture.transcript || '' }),
          })
          const hermesData = await hermesRes.json()
          const text = hermesData?.text || ''
          await supabase.from('generation_jobs').update({ progress: 50 }).eq('id', job.id)

          let outputId: string | null = null
          if (job.kind === 'ebook') {
            const { data: eb } = await supabase.from('ebooks').insert({
              user_id: user.id, capture_id, title: capture.title || 'Untitled e-book', content_markdown: text,
            }).select().single()
            outputId = eb?.id ?? null
          } else if (job.kind === 'podcast') {
            // Save the script now; the SWADE voice service renders the audio in the background
            // (long scripts outlive edge-function limits) and fills podcasts.audio_path when done.
            const { data: pod, error: podErr } = await supabase.from('podcasts').insert({
              user_id: user.id, capture_id, voice_profile_id, title: capture.title || 'Untitled podcast',
              script: text, audio_path: null, show_notes: capture.show_notes,
              chapters: capture.chapter_markers || [],
            }).select().single()
            if (podErr || !pod) throw new Error(podErr?.message || 'Could not save podcast')
            outputId = pod.id
            let engineVoice: string | null = null
            if (voice_profile_id) {
              const { data: vp } = await supabase.from('voice_profiles').select('voicebox_profile_id')
                .eq('id', voice_profile_id).eq('user_id', user.id).maybeSingle()
              engineVoice = vp?.voicebox_profile_id ?? null
            }
            if (text.trim()) {
              const q = await fetch(`${url}/functions/v1/voicebox-proxy/queue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
                body: JSON.stringify({ text, voice_profile_id: engineVoice, row_id: pod.id, path_prefix: `${user.id}/podcast` }),
              })
              if (!q.ok) throw new Error(`Podcast audio could not be queued (${q.status})`)
            }
          } else if (job.kind === 'audivid') {
            // Row is created without video_path; client will render + upload video, then update video_path.
            const { data: av } = await supabase.from('audivids').insert({
              user_id: user.id, capture_id, voice_profile_id, title: capture.title || 'Untitled audivid',
              script: text, image_path, eq_style,
            }).select().single()
            outputId = av?.id ?? null
          }

          await supabase.from('generation_jobs').update({ status: 'completed', progress: 100, output_id: outputId }).eq('id', job.id)
        } catch (e) {
          await supabase.from('generation_jobs').update({ status: 'failed', error: (e as Error).message }).eq('id', job.id)
        }
      }
    })()

    return json({ jobs })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}