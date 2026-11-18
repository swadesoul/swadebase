import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Artist, Player } from '../lib/store'
import { LEVELS, PATHS, type PathKey } from './data'

export default function Onboarding({ artists, session, onStart }: { artists: Artist[]; session: Session | null; onStart: (p: Player) => void }) {
  const [path, setPath] = useState<PathKey | null>(null)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [slug, setSlug] = useState<string>('')
  const [own, setOwn] = useState('')
  const [err, setErr] = useState('')
  const p = path ? PATHS[path] : null

  const start = () => {
    if (!path) return setErr('Pick a path first so we know where to start you.')
    const a = artists.find((x) => x.slug === slug)
    const artistName = a?.display_name || own.trim()
    if (!artistName) return setErr(path === 'musician' ? 'Pick your artist from the roster, or type your artist name.' : 'Pick an artist to champion.')
    onStart({
      name: name.trim().slice(0, 40), city: city.trim().slice(0, 60), path, artistSlug: a?.slug ?? null, artistName,
      xp: LEVELS[PATHS[path].level][1], rep: 70, chapter: 0, avoided: 0, caused: 0, listenSeconds: 0, promoCode: null, voices: false,
    })
  }

  return (
    <main className="wrap onboard">
      <div className="stack">
        <p className="kicker">Music Mogul · Unc Maestro says</p>
        <h1 className="display xl">Welcome to the block. Who are you?</h1>
        <p className="lede">The block runs on real Maestro Radio. When your artist hits the air, you feel it here. Everyone plays the same block; what you can do on it depends on your path.</p>
      </div>
      <div className="grid3">
        {(Object.keys(PATHS) as PathKey[]).map((k) => {
          const q = PATHS[k]
          return (
            <button key={k} type="button" className={`path ${path === k ? 'picked' : ''}`} aria-pressed={path === k} onClick={() => { setPath(k); setErr('') }}>
              <span className="display md">{q.label}</span>
              <span>{q.blurb}</span>
              <strong>Starts as {LEVELS[q.level][0]} at {q.place}</strong>
              <span className="muted">Your move against Velvet: {q.ability}</span>
            </button>
          )
        })}
      </div>
      <div className="grid3">
        <label className="fieldset">Your name<input className="field" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="What should the crew call you?" /></label>
        <label className="fieldset">Your city<input className="field" value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} placeholder="The block takes its name" /></label>
        <div className="fieldset">
          <span>{p?.artistLabel ?? 'Pick an artist to champion'}</span>
          {path === 'musician' && !slug ? (
            <input className="field" value={own} maxLength={80} onChange={(e) => setOwn(e.target.value)} placeholder="Your artist name" aria-label="Your artist name" />
          ) : null}
        </div>
      </div>
      <fieldset className="roster">
        <legend>{path === 'musician' ? 'On the Maestro roster? Pick yourself. Not yet? Type your name above.' : 'Artists on Maestro Radio'}</legend>
        <div className="roster-grid">
          {artists.map((a) => (
            <button key={a.slug} type="button" className={`artist ${slug === a.slug ? 'picked' : ''}`} aria-pressed={slug === a.slug}
              onClick={() => { setSlug(slug === a.slug ? '' : a.slug); setErr('') }}>
              {a.artwork_url ? <img src={a.artwork_url} alt="" loading="lazy" /> : <span className="art-ph" />}
              <span className="a-name">{a.display_name}</span>
              {a.artist_type === 'si' ? <span className="badge" title="AI-generated artist">SI</span> : null}
            </button>
          ))}
        </div>
        {path === 'musician' && !slug && own.trim() ? <p className="muted">Your artist isn't on Maestro yet, so the promo kit stays locked. <a href="/submit-music">Submit your music</a> to get a page.</p> : null}
      </fieldset>
      <div className="row">
        <button type="button" className="btn dark" onClick={start}>Step onto the block</button>
        {!session ? <span className="muted">Playing as a guest. <a href="/login?next=/play/">Sign in</a> to keep your progress everywhere.</span> : null}
      </div>
      <p role="alert" className="err">{err}</p>
    </main>
  )
}
