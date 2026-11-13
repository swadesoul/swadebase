// Video Studio production pack. Five timed clips and four graphics.
// Pure ESM, no I/O, so the edge function and the render worker share one copy.

export const CLIP_DURATIONS = [15, 5, 5, 5, 15]
export const CLIP_ROLES = ['hook', 'teach', 'teach', 'teach', 'close']
export const GRAPHIC_COUNT = 4
export const TOTAL_SEC = CLIP_DURATIONS.reduce((sum, n) => sum + n, 0)

const ID = /^[A-Za-z0-9_-]{4,80}$/
const TEXT = (value, max) => String(value ?? '').trim().slice(0, max)

export function validatePack(input) {
  const errors = []
  const pack = input && typeof input === 'object' ? input : null
  if (!pack) return { ok: false, errors: ['pack is required'] }

  const packId = TEXT(pack.pack_id, 80)
  if (!ID.test(packId)) errors.push('pack_id must be 4-80 letters, numbers, _ or -')
  const title = TEXT(pack.title, 140)
  if (!title) errors.push('title is required')

  const clips = []
  if (!Array.isArray(pack.clips) || pack.clips.length !== CLIP_DURATIONS.length) {
    errors.push(`clips must be ${CLIP_DURATIONS.length} items with durations ${CLIP_DURATIONS.join('/')}`)
  } else {
    pack.clips.forEach((clip, i) => {
      const duration = Number(clip?.duration_sec)
      if (duration !== CLIP_DURATIONS[i]) errors.push(`clips[${i}].duration_sec must be ${CLIP_DURATIONS[i]}`)
      if (clip?.role !== CLIP_ROLES[i]) errors.push(`clips[${i}].role must be ${CLIP_ROLES[i]}`)
      const id = TEXT(clip?.id, 80)
      const narration = TEXT(clip?.narration, 2000)
      const onScreen = TEXT(clip?.on_screen, 280)
      if (!ID.test(id)) errors.push(`clips[${i}].id must be 4-80 letters, numbers, _ or -`)
      if (!narration) errors.push(`clips[${i}].narration is required`)
      if (!onScreen) errors.push(`clips[${i}].on_screen is required`)
      clips.push({ id, role: CLIP_ROLES[i], duration_sec: CLIP_DURATIONS[i], narration, on_screen: onScreen })
    })
  }

  const graphics = []
  if (!Array.isArray(pack.graphics) || pack.graphics.length !== GRAPHIC_COUNT) {
    errors.push(`graphics must be ${GRAPHIC_COUNT} items`)
  } else {
    pack.graphics.forEach((graphic, i) => {
      const id = TEXT(graphic?.id, 80)
      const text = TEXT(graphic?.text, 280)
      const kind = TEXT(graphic?.kind || 'card', 40)
      const start = Number(graphic?.start_sec)
      const duration = Number(graphic?.duration_sec)
      if (!ID.test(id)) errors.push(`graphics[${i}].id must be 4-80 letters, numbers, _ or -`)
      if (!text) errors.push(`graphics[${i}].text is required`)
      if (!Number.isFinite(start) || start < 0 || start >= TOTAL_SEC) errors.push(`graphics[${i}].start_sec is out of range`)
      if (!Number.isFinite(duration) || duration <= 0 || start + duration > TOTAL_SEC + 1e-6) {
        errors.push(`graphics[${i}].duration_sec must stay inside the ${TOTAL_SEC}s lesson`)
      }
      graphics.push({
        id,
        kind,
        text,
        start_sec: Math.round(start * 1000) / 1000,
        duration_sec: Math.round(duration * 1000) / 1000,
      })
    })
  }

  const voiceProvider = TEXT(pack.voice?.provider || 'kokoro', 40) || 'kokoro'
  const visualProvider = TEXT(pack.visuals?.provider || 'remotion', 40) || 'remotion'
  if (!['kokoro', 'elevenlabs'].includes(voiceProvider)) errors.push('voice.provider must be kokoro or elevenlabs')
  if (!['remotion', 'hyperframes', 'together'].includes(visualProvider)) {
    errors.push('visuals.provider must be remotion, hyperframes, or together')
  }
  const voiceId = TEXT(pack.voice?.voice_id, 80)
  if (voiceProvider === 'elevenlabs' && !voiceId) errors.push('voice.voice_id is required for elevenlabs')

  if (errors.length) return { ok: false, errors }
  return {
    ok: true,
    errors: [],
    pack: {
      pack_id: packId,
      title,
      course_ref: TEXT(pack.course_ref, 200) || null,
      clips,
      graphics,
      voice: { provider: voiceProvider, voice_id: voiceId || (voiceProvider === 'kokoro' ? 'af_heart' : '') },
      visuals: { provider: visualProvider },
    },
  }
}
