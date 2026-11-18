import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Ctx } from '../App'
import { STREAM, nowPlaying, norm, type NowPlaying } from '../lib/radio'
import { signal } from '../lib/supa'
import { hush, speak } from '../lib/fx'
import { Character, LOOKS, youLook } from './characters'
import {
  COLLABS, CREW, HELP, HOME0, IDS, LEVELS, NAMES, OFFERS, PATHS, PLACES, SPOTS, STAKES,
  levelIndex, pick, type CharId, type SpotId,
} from './data'
import Panel from './Panel'

type Scene = { x: Record<CharId, number>; dur: Partial<Record<CharId, number>>; walk: Partial<Record<CharId, boolean>>; say: Partial<Record<CharId, string>> }
type Drama = { target: CharId; phase: 'walking' | 'pitch' | 'help' | 'done'; deadline?: number } | null
const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Block({ ctx }: { ctx: Ctx }) {
  const { player, update, mile } = ctx
  const P = PATHS[player.path]
  const home = useMemo(() => ({ ...HOME0, you: P.home }), [P.home])

  const [scene, setScene] = useState<Scene>({ x: { ...home }, dur: {}, walk: {}, say: {} })
  const [drama, setDrama] = useState<Drama>(null)
  const [story, setStory] = useState({ title: player.chapter ? `Chapter ${player.chapter}` : 'Prologue', text: 'Unc Maestro shows you around. The crew is working the block, and Velvet Vance is watching from his tower.' })
  const [status, setStatus] = useState('')
  const [paused, setPaused] = useState(false)
  const [spot, setSpot] = useState<SpotId | null>(null)
  const [np, setNp] = useState<NowPlaying | null>(null)
  const [nextAir, setNextAir] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [selected, setSelected] = useState<CharId>('you')

  const timers = useRef<number[]>([])
  const busy = useRef<Partial<Record<CharId, boolean>>>({})
  const clock = useRef(0)
  const failT = useRef<number>()
  const sceneRef = useRef(scene); sceneRef.current = scene
  const dramaRef = useRef(drama); dramaRef.current = drama
  const pl = useRef(player); pl.current = player
  const npRef = useRef(np); npRef.current = np
  const audio = useRef<HTMLAudioElement | null>(null)
  const svg = useRef<SVGSVGElement | null>(null)

  const later = useCallback((ms: number, fn: () => void) => { const t = window.setTimeout(fn, ms); timers.current.push(t); return t }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); hush() }, [])
  useEffect(() => {
    const h = (e: Event) => setStatus(String((e as CustomEvent).detail))
    document.addEventListener('mogul-status', h); return () => document.removeEventListener('mogul-status', h)
  }, [])

  const artist = player.artistName || 'your artist'
  const short = artist.length > 12 ? `${artist.slice(0, 11)}…` : artist
  const fill = (t: string) => t.replace(/\{artist\}/g, artist).replace(/\{city\}/g, player.city || 'your city')

  const addXp = useCallback((n: number) => {
    const before = levelIndex(pl.current.xp)
    const after = levelIndex(pl.current.xp + n)
    update((p) => ({ xp: p.xp + n }))
    if (after > before) { mile(`lvl${after}`, `Reached ${LEVELS[after][0]}`); setStatus(`Level up: you're now ${LEVELS[after][0]}.`) }
  }, [update, mile])

  const moveTo = useCallback((id: CharId, x: number, done?: () => void) => {
    x = Math.max(50, Math.min(1294, x))
    const from = sceneRef.current.x[id]
    const d = reduced ? 0.01 : Math.max(0.4, Math.abs(x - from) / 220)
    setScene((s) => ({ ...s, x: { ...s.x, [id]: x }, dur: { ...s.dur, [id]: d }, walk: { ...s.walk, [id]: !reduced } }))
    later(d * 1000, () => { setScene((s) => ({ ...s, walk: { ...s.walk, [id]: false } })); done?.() })
  }, [later])

  const say = useCallback((id: CharId, text: string, ms = 2400) => {
    setScene((s) => ({ ...s, say: { ...s.say, [id]: text } }))
    if (pl.current.voices) speak(id, text)
    later(ms, () => setScene((s) => (s.say[id] === text ? { ...s, say: { ...s.say, [id]: '' } } : s)))
  }, [later])

  // Opening walk-on
  useEffect(() => {
    mile('join', `Joined as a ${P.label.toLowerCase()}${player.city ? ` in ${player.city}` : ''}`)
    later(600, () => {
      mile('unc', 'Met Unc Maestro')
      busy.current.unc = true
      moveTo('unc', Math.max(60, home.you - 110), () => {
        say('unc', player.chapter ? 'Welcome back!' : 'Welcome to the block!', 2600)
        later(1400, () => say('you', 'Glad to be here.', 2200))
        later(3000, () => moveTo('unc', home.unc, () => { busy.current.unc = false }))
      })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Real radio: now playing every 15s ----
  const lastSong = useRef('')
  useEffect(() => {
    let alive = true
    const poll = async () => {
      const d = await nowPlaying()
      if (!alive || !d) return
      setNp(d)
      const s = d.now
      if (!s || s.id === lastSong.current) return
      const first = lastSong.current === ''
      lastSong.current = s.id
      if (!d.isBreak && norm(s.artist).includes(norm(pl.current.artistName)) && pl.current.artistName) {
        let seen = ''
        try { seen = localStorage.getItem('mogul.onair') || '' } catch { /* ignore */ }
        if (seen !== `${s.id}:${d.playedAt}`) {
          try { localStorage.setItem('mogul.onair', `${s.id}:${d.playedAt}`) } catch { /* ignore */ }
          addXp(25)
          mile(`onair-${s.id}`.slice(0, 60), `${pl.current.artistName} played on Maestro Radio: “${s.title}”`)
          setStatus(`${pl.current.artistName} is on the air right now with “${s.title}”. +25 XP`)
          later(300, () => say('princess', `${short} on WMRX!`, 3000))
        }
      } else if (!first && !dramaRef.current) {
        const dj = pick(CREW.filter((c) => !busy.current[c]))
        if (dj) say(dj, `Now: ${s.title.slice(0, 18)}`, 2600)
      }
    }
    poll(); const t = window.setInterval(poll, 15000)
    return () => { alive = false; clearInterval(t) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Next scheduled airplay for the championed artist
  useEffect(() => {
    if (!player.artistSlug) return
    signal<any>('profile', { slug: player.artistSlug }).then((d) => {
      const n = d?.next_airplay
      if (n?.scheduled_at) setNextAir(new Date(n.scheduled_at).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }))
    }).catch(() => null)
  }, [player.artistSlug])

  // ---- Listening XP: every 60s while audio plays and tab visible ----
  useEffect(() => {
    if (!listening) return
    const t = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || audio.current?.paused) return
      const secs = pl.current.listenSeconds + 60
      update({ listenSeconds: secs })
      addXp(5)
      if (secs >= 600) mile('listen10', 'Listened to Maestro Radio for 10 minutes')
      if (secs >= 3600) mile('listen60', 'Listened to Maestro Radio for an hour')
    }, 60000)
    return () => clearInterval(t)
  }, [listening, update, addXp, mile])

  const toggleRadio = () => {
    if (!audio.current) { audio.current = new Audio(); audio.current.preload = 'none' }
    const a = audio.current
    if (listening) { a.pause(); a.src = ''; setListening(false); setStatus('Radio off.'); return }
    a.src = `${STREAM}?t=${Date.now()}`
    a.play().then(() => { setListening(true); setStatus('Tuned in to Maestro Radio. You earn XP for every minute you listen.'); mile('tunein', 'Tuned in to Maestro Radio') })
      .catch(() => setStatus('Your browser blocked playback. Tap Tune in again.'))
  }

  // ---- Game loop ----
  const free = () => CREW.filter((id) => !busy.current[id])

  const collab = () => {
    const pool = free(); if (!pool.length) return
    const a = pick(pool)
    if (!busy.current.you && Math.random() < 0.35) {
      busy.current[a] = true; busy.current.you = true
      const youX = sceneRef.current.x.you
      const at = youX + (home[a] < youX ? -110 : 110)
      moveTo(a, at, () => {
        const song = npRef.current?.now
        say(a, Math.random() < 0.5 || !song ? `Playing ${short}!` : `Hear “${song.title.slice(0, 14)}”?`, 2400)
        later(1200, () => say('you', P.reply, 2200))
        mile(`played-${a}`, `${NAMES[a]} played ${artist}`)
        addXp(10)
        later(2800, () => moveTo(a, home[a], () => { busy.current[a] = false; busy.current.you = false }))
      })
      return
    }
    const rest = pool.filter((id) => id !== a); if (!rest.length) return
    const b = pick(rest)
    busy.current[a] = true; busy.current[b] = true
    const lines = pick(COLLABS)
    moveTo(a, home[b] + (home[a] < home[b] ? -100 : 100), () => {
      say(a, lines[0], 2200)
      later(1100, () => say(b, lines[1], 2200))
      mile('collab', 'Watched your first crew collab')
      addXp(5)
      later(2600, () => moveTo(a, home[a], () => { busy.current[a] = false; busy.current[b] = false }))
    })
  }

  const startDrama = () => {
    const pool = free(); if (!pool.length) return
    const target = pick(pool)
    busy.current[target] = true; busy.current.vance = true
    const chapter = pl.current.chapter + 1
    update({ chapter })
    const song = npRef.current?.now
    const stakes = song && !npRef.current?.isBreak && Math.random() < 0.4 ? `while “${song.title}” is playing on WMRX` : fill(pick(STAKES))
    const offer = fill(pick(OFFERS).replace('{target}', NAMES[target]))
    setStory({ title: `Chapter ${chapter}`, text: `Velvet Vance cornered ${NAMES[target]} ${pick(PLACES)}. He wants to ${offer} ${stakes}.` })
    setDrama({ target, phase: 'walking' })
    setStatus(`Velvet Vance is heading for ${NAMES[target]}.`)
    moveTo('vance', home[target] + 90, () => {
      say('vance', 'Sign here. Instant fame.', 10000)
      say(target, 'Hmm... tempting.', 10000)
      setDrama({ target, phase: 'pitch', deadline: Date.now() + 10000 })
      setStatus(`Velvet is pitching ${NAMES[target]}. Pick who steps in.`)
      failT.current = later(10000, fail)
    })
  }

  const wrap = (t: CharId, helper: CharId | null) => {
    moveTo('vance', home.vance, () => { busy.current.vance = false })
    if (helper) {
      say(helper, 'Collab later?', 1800)
      later(1800, () => moveTo(helper, home[helper], () => { busy.current[helper] = false }))
    }
    busy.current[t] = false
    setDrama(null)
  }

  const fail = () => {
    const d = dramaRef.current
    if (!d || d.phase !== 'pitch') return
    const t = d.target
    say(t, 'Wait, I signed that?', 2600)
    say('vance', 'Ha! Pleasure doing biz.', 2600)
    setDrama({ target: t, phase: 'done' })
    update((p) => ({ caused: p.caused + 1, rep: Math.max(0, p.rep - 15) }))
    setStatus(`Nobody stepped in. ${NAMES[t]} signed a bad deal. Rep −15.`)
    setStory((s) => ({ ...s, text: `${s.text} Nobody stepped in, and the deal went through.` }))
    mile('slip', 'Velvet got one past the crew')
    later(2600, () => wrap(t, null))
  }

  const help = (helper: CharId) => {
    const d = dramaRef.current
    if (!d || d.phase !== 'pitch') return
    clearTimeout(failT.current)
    const t = d.target
    const you = helper === 'you'
    busy.current[helper] = true
    setDrama({ target: t, phase: 'help' })
    setStatus(`${you ? 'You are' : `${NAMES[helper]} is`} on the way.`)
    moveTo(helper, Math.max(60, home[t] - 90), () => {
      say(helper, you ? P.line : HELP[helper] || 'No deal.', 2600)
      later(1300, () => say(t, 'You are right. No deal.', 2400))
      later(2600, () => {
        say('vance', 'Tch. Fine.', 1800)
        const who = you ? 'You' : NAMES[helper]
        const avoided = pl.current.avoided + 1
        update((p) => ({ avoided: p.avoided + 1, rep: Math.min(100, p.rep + 5) }))
        setStatus(`${who} and ${NAMES[t]} shut it down together. +${you ? 60 : 40} XP`)
        setStory((s) => ({ ...s, text: `${s.text} ${who} stepped in with ${NAMES[t]}, and they turned him down together.` }))
        addXp(you ? 60 : 40)
        mile('first-stop', 'Stopped your first Velvet pitch')
        if (you) mile('self', `Stepped in yourself: ${P.ability.toLowerCase()}`)
        if (avoided >= 3) mile('three', 'Stopped three Velvet pitches')
        if (avoided >= 10) mile('ten', 'Stopped ten Velvet pitches')
        later(1200, () => wrap(t, helper))
      })
    })
  }

  const tick = useRef<() => void>(() => {})
  tick.current = () => {
    if (paused || document.visibilityState !== 'visible') return
    clock.current += 1
    const d = dramaRef.current
    if (d?.phase === 'pitch') { setNow(Date.now()); return }
    if (!d && !busy.current.vance && clock.current % 12 === 0) return startDrama()
    if (!d && clock.current % 5 === 0) collab()
  }
  useEffect(() => { const t = window.setInterval(() => tick.current(), 1000); return () => clearInterval(t) }, [])

  // ---- Player control: tap street / keys ----
  const svgX = (clientX: number, clientY: number) => {
    const el = svg.current; if (!el) return null
    const pt = el.createSVGPoint(); pt.x = clientX; pt.y = clientY
    const m = el.getScreenCTM(); if (!m) return null
    return pt.matrixTransform(m.inverse())
  }
  const walkSelected = (x: number) => {
    const id = selected
    if (busy.current[id] && id !== 'you') return setStatus(`${NAMES[id]} is busy right now.`)
    if (id === 'you' && busy.current.you) return
    moveTo(id, x)
  }
  const onScene = (e: React.MouseEvent<SVGSVGElement>) => {
    const p = svgX(e.clientX, e.clientY); if (!p) return
    if (p.y < 600) {
      const s = SPOTS.find((b) => Math.abs(b.x - p.x) < 110 && p.y > 90)
      if (s) { openSpot(s.id); return }
    }
    walkSelected(p.x)
  }
  const openSpot = (id: SpotId) => {
    setSpot(id)
    const s = SPOTS.find((b) => b.id === id)!
    if (!busy.current.you) moveTo('you', s.x)
    mile(`visit-${id}`, `Visited ${s.label}`)
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      if (busy.current.you) return
      const x = sceneRef.current.x.you
      if (e.key === 'ArrowLeft' || e.key === 'a') moveTo('you', x - 120)
      if (e.key === 'ArrowRight' || e.key === 'd') moveTo('you', x + 120)
    }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [moveTo])

  // ---- Render ----
  const li = levelIndex(player.xp)
  const next = LEVELS[li + 1]
  const pct = next ? Math.round(((player.xp - LEVELS[li][1]) / (next[1] - LEVELS[li][1])) * 100) : 100
  const pitching = drama?.phase === 'pitch'
  const left = pitching && drama?.deadline ? Math.max(0, Math.ceil((drama.deadline - now) / 1000)) : 0
  const song = np?.now
  const marqueeRaw = np?.isLive ? `LIVE: ${np.liveName || 'DJ'}` : song ? `${song.artist} · ${song.title}` : 'MAESTRO RADIO'
  const marquee = marqueeRaw.length > 26 ? `${marqueeRaw.slice(0, 25)}…` : marqueeRaw
  const cityUpper = (player.city || 'Maestro').toUpperCase()
  const helpers = CREW.filter((id) => id !== drama?.target && !busy.current[id])

  return (
    <main className="wrap play">
      <div className="head">
        <div className="stack tight">
          <p className="kicker">{P.label} · {player.name || 'Player'}</p>
          <h1 className="display lg">The {player.city || 'Maestro'} block</h1>
        </div>
        <div className="meter">
          <div className="meter-row"><span>{LEVELS[li][0]}</span><span>{player.xp} XP · Rep {player.rep}</span></div>
          <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next level"><div style={{ width: `${pct}%` }} /></div>
          <div className="muted sm">{next ? `${next[1] - player.xp} XP to ${next[0]}` : 'Top of the game. Music Mogul.'}</div>
        </div>
      </div>

      <div className="onair">
        <button type="button" className={`btn ${listening ? 'live' : 'dark'}`} onClick={toggleRadio} aria-pressed={listening}>{listening ? '■ Stop radio' : '▶ Tune in live'}</button>
        <div className="np" aria-live="polite">
          {song?.art ? <img src={song.art} alt="" /> : null}
          <div><div className="kicker">{np?.isLive ? 'Live DJ on air' : 'Now on Maestro Radio'}</div><div className="np-t">{song ? `${song.title} — ${song.artist}` : 'Connecting…'}</div></div>
        </div>
        {song && !np?.isBreak ? (
          <button type="button" className="btn sm" onClick={() => { ctx.toggleSave({ title: song.title, artist: song.artist, art_url: song.art }); mile('save1', 'Saved your first song') }}>
            {ctx.saved.some((s) => s.title === song.title && s.artist === song.artist) ? '★ Saved' : '☆ Save song'}
          </button>
        ) : null}
      </div>

      <div className="scene-wrap">
        <svg ref={svg} viewBox="0 0 1344 700" className="scene" role="img" aria-label={`The ${player.city || 'Maestro'} block. Tap a building to open it, tap the street to walk.`} onClick={onScene}>
          <text x="672" y="120" textAnchor="middle" fontFamily="'Bebas Neue', sans-serif" fontSize="150" fill="#E2E1DA">{cityUpper.slice(0, 14)}</text>
          <g stroke="#111" strokeWidth="4" strokeLinejoin="round" className="bldg">
            <rect x="20" y="300" width="200" height="300" fill="#F6E7B8" />
            <path d="M14 300 L226 300 L214 340 L26 340 Z" fill="#B23A26" />
            <rect x="60" y="440" width="70" height="160" fill="#fff" />
            <rect x="150" y="380" width="54" height="54" fill="#fff" />
            <rect x="270" y="170" width="270" height="430" fill="#CDEBE7" />
            <path d="M405 170 L405 90" fill="none" />
            <circle className={listening || np?.isLive ? 'blinker' : ''} cx="405" cy="84" r="9" fill="#B23A26" />
            <rect x="290" y="230" width="230" height="44" fill="#111" />
            <rect x="300" y="460" width="80" height="140" fill="#fff" />
            <rect x="590" y="330" width="200" height="270" fill="#F4D3CD" />
            <circle cx="690" cy="430" r="40" fill="#111" className={listening ? 'spin' : ''} />
            <circle cx="690" cy="430" r="10" fill="#F4D3CD" />
            <rect x="850" y="300" width="200" height="300" fill="#D5DFEF" />
            <rect x="880" y="420" width="140" height="70" fill="#fff" />
            <rect x="1100" y="110" width="230" height="490" fill="#3A3340" />
            {[[1130, 160, 1], [1195, 160, 0], [1260, 160, 1], [1130, 230, 0], [1195, 230, 1], [1260, 230, 0]].map(([x, y, on]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width="40" height="40" fill={on ? '#E8B021' : '#4D4556'} />
            ))}
            <rect x="0" y="600" width="1344" height="100" fill="#CFCFC8" />
          </g>
          <g fontFamily="'Bebas Neue', sans-serif" textAnchor="middle" pointerEvents="none">
            <text x="120" y="328" fontSize="26" fill="#fff">Record shop</text>
            <text x="405" y="210" fontSize="30" fill="#111">WMRX Radio</text>
            <text x="405" y="261" fontSize="20" fill="#E8B021">{marquee}</text>
            <text x="690" y="370" fontSize="30" fill="#111">The Booth</text>
            <text x="950" y="340" fontSize="26" fill="#111">Listening Lounge</text>
            <text x="950" y="463" fontSize="18" fill="#111">{(player.artistName || 'Promo kit').slice(0, 16)}</text>
            <text x="1215" y="140" fontSize="26" fill="#fff">Velvet Tower</text>
          </g>
          <g stroke="#111" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
            {IDS.map((id) => (
              <g key={id} onClick={(e) => { if (id !== 'vance') { e.stopPropagation(); setSelected(id); setStatus(`${NAMES[id]} selected. Tap the street to move ${id === 'you' ? 'yourself' : 'them'}.`) } }} style={{ cursor: id === 'vance' ? 'default' : 'pointer' }}>
                <Character
                  look={id === 'you' ? youLook(P.shirt) : LOOKS[id]}
                  x={scene.x[id]} dur={scene.dur[id] ?? 1} walking={!!scene.walk[id]} bubble={scene.say[id] || ''}
                  tag={id === 'you' ? 'You' : selected === id ? NAMES[id].replace('DJ ', '') : undefined}
                  tagColor={id === 'you' ? P.shirt : '#111'}
                  lift={id === 'vance' ? 48 : 0}
                />
              </g>
            ))}
          </g>
        </svg>
        <nav className="spots" aria-label="Buildings">
          {SPOTS.map((s) => <button key={s.id} type="button" className={`chip ${spot === s.id ? 'on' : ''}`} onClick={() => openSpot(s.id)}>{s.label}<small>{s.tip}</small></button>)}
        </nav>
      </div>

      <div className="cols">
        <section className="card">
          <p className="kicker">{story.title}</p>
          <p className="story">{story.text}</p>
          {pitching ? (
            <div className="stack">
              <strong>Who steps in? {left} seconds left.</strong>
              <div className="row wr">
                <button type="button" className="btn" style={{ background: P.shirt, color: '#fff' }} onClick={() => help('you')} disabled={!!busy.current.you}>You: {P.ability}</button>
                {helpers.map((h) => <button key={h} type="button" className="btn" onClick={() => help(h)}>{NAMES[h]}</button>)}
              </div>
            </div>
          ) : null}
          <p aria-live="polite" className="status">{status}</p>
          <div className="row wr">
            <button type="button" className="btn" onClick={() => setPaused((p) => !p)}>{paused ? 'Resume' : 'Pause'}</button>
            <button type="button" className="btn" onClick={() => { update({ voices: !player.voices }); if (player.voices) hush() }} aria-pressed={player.voices}>Voices: {player.voices ? 'On' : 'Off'}</button>
            <button type="button" className="btn" onClick={ctx.restart}>Start over</button>
          </div>
        </section>
        <section className="card">
          <h2 className="display md">Milestones</h2>
          <p className="muted sm">Drama stopped {player.avoided} · Slipped past {player.caused} · Listened {Math.floor(player.listenSeconds / 60)} min</p>
          <ol className="miles">
            {ctx.milestones.slice(0, 12).map((m) => <li key={m.key}><strong>{m.chapter ? `Ch. ${m.chapter}` : 'Start'}</strong> · {m.text}</li>)}
          </ol>
        </section>
      </div>

      {spot ? <Panel spot={spot} ctx={ctx} np={np} nextAir={nextAir} listening={listening} toggleRadio={toggleRadio} onClose={() => setSpot(null)} addXp={addXp} /> : null}
    </main>
  )
}
