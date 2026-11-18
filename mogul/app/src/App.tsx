import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { signal, supa } from './lib/supa'
import {
  type Artist, type Milestone, type Player, type Saved, addMilestoneCloud, clearGuest, getSession, loadCloud,
  loadGuest, removeSongCloud, saveCloud, saveGuest, saveSongCloud,
} from './lib/store'
import Onboarding from './game/Onboarding'
import Block from './game/Block'

export type Ctx = {
  player: Player; milestones: Milestone[]; saved: Saved[]; artists: Artist[]; session: Session | null
  update: (p: Partial<Player> | ((p: Player) => Partial<Player>)) => void
  mile: (key: string, text: string) => void
  toggleSave: (s: Saved) => void
  restart: () => void
  refreshPromo: () => Promise<void>
}

export default function App() {
  const [boot, setBoot] = useState<'loading' | 'ready'>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [ids, setIds] = useState<{ slugToId: Record<string, string>; idToSlug: Record<string, string> }>({ slugToId: {}, idToSlug: {} })
  const [player, setPlayer] = useState<Player | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [saved, setSaved] = useState<Saved[]>([])
  const [note, setNote] = useState('')
  const saveT = useRef<number>()
  const playerRef = useRef<Player | null>(null)
  playerRef.current = player

  // Boot: roster, session, save
  useEffect(() => {
    (async () => {
      let list: Artist[] = []
      try { list = (await signal<{ artists: Artist[] }>('artists')).artists || [] } catch { setNote('Could not load the artist roster. You can still play.') }
      setArtists(list)
      const map = { slugToId: {} as Record<string, string>, idToSlug: {} as Record<string, string> }
      try {
        const c = await supa()
        const { data } = await c.from('artist_signal_profiles').select('id,slug').in('slug', list.map((a) => a.slug))
        for (const r of data || []) { map.slugToId[r.slug] = r.id; map.idToSlug[r.id] = r.slug }
      } catch { /* ids only needed for cloud save */ }
      setIds(map)
      const s = await getSession()
      setSession(s)
      let blob = s ? await loadCloud(s.user.id, list, map.idToSlug).catch(() => null) : null
      const guest = loadGuest()
      if (!blob && guest) {
        blob = guest
        if (s) setNote('Your guest progress is now saved to your Maestro account.')
      }
      if (blob) { setPlayer(blob.player); setMilestones(blob.milestones); setSaved(blob.saved) }
      setBoot('ready')
      const c = await supa().catch(() => null)
      c?.auth.onAuthStateChange((_e, ns) => setSession(ns))
    })()
  }, [])

  // Persist (debounced)
  useEffect(() => {
    if (!player) return
    window.clearTimeout(saveT.current)
    saveT.current = window.setTimeout(async () => {
      if (session) {
        try {
          const r = await saveCloud(session.user.id, player, player.artistSlug ? ids.slugToId[player.artistSlug] ?? null : null)
          if (r.promo_code !== player.promoCode || r.xp !== player.xp) setPlayer((p) => (p ? { ...p, promoCode: r.promo_code, xp: Math.max(p.xp, r.xp) } : p))
          clearGuest()
        } catch { setNote('Saving to your account failed. Progress is kept on this device for now.'); saveGuest({ player, milestones, saved }) }
      } else saveGuest({ player, milestones, saved })
    }, 1500)
  }, [player, milestones, saved, session, ids])

  // First sign-in after guest play: push milestones + saved songs up once
  const synced = useRef(false)
  useEffect(() => {
    if (!session || !player || synced.current) return
    synced.current = true
    milestones.forEach((m) => addMilestoneCloud(session.user.id, m).catch(() => null))
    saved.forEach((s) => saveSongCloud(session.user.id, s).catch(() => null))
  }, [session, player]) // eslint-disable-line react-hooks/exhaustive-deps

  const update: Ctx['update'] = useCallback((p) => {
    setPlayer((cur) => (cur ? { ...cur, ...(typeof p === 'function' ? p(cur) : p) } : cur))
  }, [])

  const mile: Ctx['mile'] = useCallback((key, text) => {
    setMilestones((cur) => {
      if (cur.some((m) => m.key === key)) return cur
      const m = { key, text, chapter: playerRef.current?.chapter ?? 0, at: new Date().toISOString() }
      if (session) addMilestoneCloud(session.user.id, m).catch(() => null)
      return [m, ...cur].slice(0, 40)
    })
  }, [session])

  const toggleSave: Ctx['toggleSave'] = useCallback((s) => {
    setSaved((cur) => {
      const has = cur.some((x) => x.title === s.title && x.artist === s.artist)
      if (session) (has ? removeSongCloud : saveSongCloud)(session.user.id, s).catch(() => null)
      return has ? cur.filter((x) => !(x.title === s.title && x.artist === s.artist)) : [s, ...cur]
    })
  }, [session])

  const refreshPromo = useCallback(async () => {
    if (!session) return
    const blob = await loadCloud(session.user.id, artists, ids.idToSlug).catch(() => null)
    if (blob) { setPlayer(blob.player); setMilestones(blob.milestones) }
  }, [session, artists, ids])

  const restart = useCallback(() => {
    if (!confirmRestart()) return
    setPlayer(null); setMilestones([]); clearGuest()
  }, [])

  if (boot === 'loading') return <main className="wrap"><p className="kicker">Music Mogul</p><h1 className="display">Loading the block…</h1></main>

  return (
    <>
      <TopBar session={session} />
      {note ? <div className="note" role="status">{note} <button className="link" onClick={() => setNote('')}>Dismiss</button></div> : null}
      {!player ? (
        <Onboarding artists={artists} session={session} onStart={(p) => { setPlayer(p); setMilestones([]) }} />
      ) : (
        <Block ctx={{ player, milestones, saved, artists, session, update, mile, toggleSave, restart, refreshPromo }} />
      )}
    </>
  )
}

// Inline confirm (no browser dialogs): second click within 4s confirms
let armed = 0
function confirmRestart() {
  const now = Date.now()
  if (now - armed < 4000) { armed = 0; return true }
  armed = now
  document.dispatchEvent(new CustomEvent('mogul-status', { detail: 'Tap “Start over” again to wipe this run.' }))
  return false
}

function TopBar({ session }: { session: Session | null }) {
  return (
    <header className="top">
      <a href="/" className="brand">Maestro Radio</a>
      <span className="kicker">Music Mogul</span>
      <nav>
        <a href="/radio">Listen</a>
        <a href="/artists">Artists</a>
        {session ? <span className="who-chip">Saved to your account</span> : <a className="btn sm" href="/login?next=/play/">Sign in to save</a>}
      </nav>
    </header>
  )
}
