// Kinetta — the SWADEBASE Motion Graphics Agent.
// One job only: turn a request (idea, audio, or start image) into a finished, downloadable
// HyperFrames motion graphic using the 86-style library.
//
// Portable: this module is plain ESM with no dependencies. The motion-studio edge function
// uses it, and any agent program (SSS Brain Agent OS Workforce, the Grok-style agent adapter
// area, Sovereign Board) can load AGENT_MANIFEST + tools to host the same agent.

import { recommendStyles, FORMATS, normalizeRequest } from './adapter.mjs'

export const AGENT_MANIFEST = {
  id: 'motion-graphics-agent',
  name: 'Kinetta',
  role: 'Motion Graphics Agent',
  version: '1.0.0',
  scope: 'Manages SWADEBASE Motion Studio only: style selection, project setup, composition, rendering and downloads.',
  persona:
    'Kinetta is a confident, warm motion director. She listens for the story, offers 3 strong style options with one-line reasons, recommends one, and moves fast. If told "you pick", she picks and explains in one sentence. She never makes the user re-explain context she already has.',
  guardrails: [
    'Only touches Motion Studio resources (motion_* tables, swadesoul/motion-studio/ in B2).',
    'Every finished project is downloadable: MP4 plus the HyperFrames source ZIP.',
    'Renders run on the CPU render worker on Hostinger; no GPU spin-up is needed for HyperFrames.',
    'Never invents a style id; only the 86 library styles (or an explicit custom style from the founder).',
    'Frequency/number-code music themes are symbolic and creative only, never medical or financial claims.',
    'Secrets stay server-side; the agent never sees or prints keys.',
  ],
  entry: { ui: '/functions/v1/motion-studio/app', api: '/functions/v1/motion-studio', mcp: '/functions/v1/motion-studio/mcp' },
}

// Tool definitions shared by MCP, Agent OS and any OpenAI/Anthropic-style tool-calling host.
export const AGENT_TOOLS = [
  {
    name: 'motion_list_styles',
    description: 'List the 86 motion-graphic styles (optionally filter by category or keyword).',
    input_schema: { type: 'object', properties: { category: { type: 'string' }, query: { type: 'string' } } },
  },
  {
    name: 'motion_recommend_styles',
    description: 'Recommend the best-fitting styles for a brief. Free and instant.',
    input_schema: {
      type: 'object',
      properties: {
        idea: { type: 'string' },
        property: { type: 'string', description: 'Ecosystem property, e.g. black-tales, resing, sss-brain' },
        format: { type: 'string', enum: Object.keys(FORMATS) },
        limit: { type: 'number' },
      },
      required: ['idea'],
    },
  },
  {
    name: 'motion_create_project',
    description: 'Create a motion project. mode=idea|audio|start_image. Pass style_id, or style_id="auto" to let Kinetta pick.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        mode: { type: 'string', enum: ['idea', 'audio', 'start_image'] },
        idea: { type: 'string' },
        style_id: { type: 'string' },
        format: { type: 'string', enum: Object.keys(FORMATS) },
        duration_sec: { type: 'number' },
        property: { type: 'string' },
        audio_b2_key: { type: 'string' },
        start_image_b2_key: { type: 'string' },
        render: { type: 'boolean', description: 'Queue the render immediately (default true)' },
        quality: { type: 'string', enum: ['draft', 'standard', 'high'] },
      },
      required: ['mode'],
    },
  },
  {
    name: 'motion_get_project',
    description: 'Get project status and, when ready, download links (MP4 + source ZIP).',
    input_schema: { type: 'object', properties: { project_id: { type: 'string' } }, required: ['project_id'] },
  },
  {
    name: 'motion_list_projects',
    description: 'List recent motion projects with status.',
    input_schema: { type: 'object', properties: { limit: { type: 'number' } } },
  },
]

/* ───────────── Rule-based brain (works with no LLM at all) ───────────── */
const AUTO_PICK = /\b(you (pick|choose|decide)|pick (one|for me|it)|surprise me|your call|whatever fits|choose for me|go ahead)\b/i

export function parseHints(text) {
  const t = String(text || '').toLowerCase()
  const hints = {}
  if (/\b(vertical|9:16|9x16|tiktok|reels?|shorts|story)\b/.test(t)) hints.format = '9:16'
  else if (/\b(square|1:1|1x1)\b/.test(t)) hints.format = '1:1'
  else if (/\b(4:5|portrait post)\b/.test(t)) hints.format = '4:5'
  else if (/\b(widescreen|16:9|16x9|youtube|landscape)\b/.test(t)) hints.format = '16:9'
  const m = t.match(/(\d{1,3})\s*(s|sec|secs|seconds|second)\b/) || t.match(/(\d{1,2})\s*(min|minute|minutes)\b/)
  if (m) hints.durationSec = /min/.test(m[2]) ? Number(m[1]) * 60 : Number(m[1])
  if (/\bdraft\b/.test(t)) hints.quality = 'draft'
  if (/\b(high quality|final|4k|best quality)\b/.test(t)) hints.quality = 'high'
  return hints
}

export function findNamedStyle(library, text) {
  const t = ' ' + String(text || '').toLowerCase() + ' '
  let best = null
  for (const s of library) {
    const name = s.name.toLowerCase()
    if (t.includes(name) || t.includes(' ' + s.id.replaceAll('-', ' ') + ' ') || t.includes(s.id)) {
      if (!best || name.length > best.name.length) best = s
    }
  }
  return best
}

export function ruleBasedTurn(library, { message, context = {} }) {
  const hints = parseHints(message)
  const named = findNamedStyle(library, message)
  const brief = normalizeRequest({ ...context, idea: [context.idea, message].filter(Boolean).join('\n'), ...hints })
  const picks = recommendStyles(library, brief, 3)
  const autoPick = AUTO_PICK.test(message || '')
  let chosen = named ? named.id : autoPick ? picks[0]?.id : null
  const chosenStyle = chosen ? library.find((s) => s.id === chosen) : null
  let reply
  if (named) reply = `Locked in ${named.name}. ${named.look.split('. ')[0]}. Ready to build when you are.`
  else if (autoPick && chosenStyle)
    reply = `I'm going with ${chosenStyle.name} — ${picks[0].reasons[0] || 'it fits the feel of what you described'}. Building it now unless you want a different look.`
  else
    reply = `Here are my top looks for this: ${picks.map((p, i) => `${i + 1}) ${p.name}`).join('  ')}. I'd go with ${picks[0].name}. Tap one, or say "you pick".`
  return { reply, picks, chosen, hints, brain: 'rules' }
}

/* ───────────── LLM brain (optional; same output shape) ───────────── */
export function llmMessages(library, { message, context = {}, history = [] }) {
  const catalog = library.map((s) => `${s.id} | ${s.name} | ${s.category} | ${s.bestFor.slice(0, 6).join(', ')}`).join('\n')
  const system = `${AGENT_MANIFEST.persona}
You manage SWADEBASE Motion Studio only. Choose ONLY from this style catalog (id | name | category | best for):
${catalog}

Reply with strict JSON, no prose outside JSON:
{"reply": "<what you say to the user, 1-3 sentences; refer to styles by their names, never their ids>",
 "picks": ["<style id>", "<style id>", "<style id>"],
 "chosen": "<style id or null — set only if the user named a style or asked you to pick>",
 "title": "<short project title or null>",
 "format": "16:9|9:16|1:1|4:5|null",
 "durationSec": <number or null>,
 "ready": <true if enough info to build now>}`
  const ctx = JSON.stringify({
    mode: context.mode,
    property: context.property,
    format: context.format,
    durationSec: context.durationSec,
    hasAudio: !!context.audio,
    audio: context.audio ? { bpm: context.audio.bpm, energyMean: context.audio.energyMean, duration: context.audio.duration } : null,
    startImage: context.startImage?.description || null,
    currentStyle: context.styleId || null,
  })
  return {
    system,
    messages: [...history.slice(-8), { role: 'user', content: `Context: ${ctx}\n\nUser: ${message}` }],
  }
}

export function validateLlmTurn(library, raw, fallback) {
  try {
    const j = typeof raw === 'string' ? JSON.parse(raw.replace(/^```(json)?|```$/g, '').trim()) : raw
    const ids = new Set(library.map((s) => s.id))
    const picks = (j.picks || []).filter((id) => ids.has(id)).slice(0, 3)
    if (!picks.length) return fallback
    // Only lock a style when the user named one or asked Kinetta to pick (detected by the rule brain).
    const chosen = fallback.chosen ? (j.chosen && ids.has(j.chosen) ? j.chosen : fallback.chosen) : null
    // Speak in style names, never raw ids.
    let reply = String(j.reply || fallback.reply)
    for (const s of library) reply = reply.replaceAll(`'${s.id}'`, s.name).replaceAll(`"${s.id}"`, s.name).replaceAll(s.id, s.name)
    const hints = { ...fallback.hints }
    if (FORMATS[j.format]) hints.format = j.format
    if (Number(j.durationSec) > 0) hints.durationSec = Number(j.durationSec)
    return {
      reply: reply.slice(0, 1200),
      picks: picks.map((id) => {
        const s = library.find((x) => x.id === id)
        return { id, name: s.name, category: s.category, reasons: [] }
      }),
      chosen,
      title: j.title || null,
      ready: !!j.ready,
      hints,
      brain: 'llm',
    }
  } catch {
    return fallback
  }
}
