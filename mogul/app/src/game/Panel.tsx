import { useEffect, useRef, useState } from 'react'
import type { Ctx } from '../App'
import type { NowPlaying } from '../lib/radio'
import { claimPromo } from '../lib/store'
import { makePoster } from '../lib/fx'
import { NAMES, PATHS, SPOTS, type SpotId } from './data'

type Props = { spot: SpotId; ctx: Ctx; np: NowPlaying | null; nextAir: string | null; listening: boolean; toggleRadio: () => void; onClose: () => void; addXp: (n: number) => void }

export default function Panel({ spot, ctx, np, nextAir, listening, toggleRadio, onClose }: Props) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [spot])
  const s = SPOTS.find((x) => x.id === spot)!
  return (
    <section ref={ref} tabIndex={-1} className="card panel" aria-label={s.label}>
      <div className="row between">
        <h2 className="display md">{s.label}</h2>
        <button type="button" className="btn sm" onClick={onClose}>Close</button>
      </div>
      {spot === 'shop' ? <Shop ctx={ctx} /> : null}
      {spot === 'radio' ? <Radio np={np} listening={listening} toggleRadio={toggleRadio} /> : null}
      {spot === 'booth' ? <Booth ctx={ctx} nextAir={nextAir} /> : null}
      {spot === 'lounge' ? <Lounge ctx={ctx} /> : null}
      {spot === 'tower' ? <Tower ctx={ctx} /> : null}
    </section>
  )
}

function Shop({ ctx }: { ctx: Ctx }) {
  if (!ctx.saved.length) return <p>No saved songs yet. Tune in and tap <strong>Save song</strong> when something hits.</p>
  return (
    <ul className="songs">
      {ctx.saved.map((s) => (
        <li key={`${s.artist}-${s.title}`}>
          {s.art_url ? <img src={s.art_url} alt="" loading="lazy" /> : <span className="art-ph sm" />}
          <span><strong>{s.title}</strong><br /><span className="muted">{s.artist}</span></span>
          <button type="button" className="btn sm" onClick={() => ctx.toggleSave(s)}>Remove</button>
        </li>
      ))}
    </ul>
  )
}

function Radio({ np, listening, toggleRadio }: { np: NowPlaying | null; listening: boolean; toggleRadio: () => void }) {
  return (
    <div className="stack">
      <p>WMRX is the block's name for <strong>Maestro Radio</strong>, playing live right now. Every minute you listen with this page open earns 5 XP.</p>
      {np?.now ? <p><span className="kicker">On air</span><br />{np.now.title} — {np.now.artist}</p> : null}
      {np?.next ? <p><span className="kicker">Up next</span><br />{np.next.title} — {np.next.artist}</p> : null}
      <div className="row wr">
        <button type="button" className={`btn ${listening ? 'live' : 'dark'}`} onClick={toggleRadio}>{listening ? '■ Stop radio' : '▶ Tune in live'}</button>
        <a className="btn" href="/radio">Open the full player</a>
      </div>
    </div>
  )
}

function Booth({ ctx, nextAir }: { ctx: Ctx; nextAir: string | null }) {
  const a = ctx.artists.find((x) => x.slug === ctx.player.artistSlug)
  if (!a) return (
    <div className="stack">
      <p><strong>{ctx.player.artistName || 'Your artist'}</strong> isn't on Maestro Radio yet. Once they have an artist page, their spins show up here and unlock the promo kit.</p>
      <a className="btn" href="/submit-music">Submit music</a>
    </div>
  )
  return (
    <div className="booth">
      {a.artwork_url ? <img src={a.artwork_url} alt="" /> : <span className="art-ph" />}
      <div className="stack">
        <p className="display md">{a.display_name} {a.artist_type === 'si' ? <span className="badge">SI</span> : null}</p>
        {a.artist_type === 'si' ? <p className="muted sm">SI artist: music made with AI tools by Swade Soul.</p> : null}
        <p>{nextAir ? <>Next scheduled spin: <strong>{nextAir}</strong></> : 'No scheduled spin posted yet. Rotation plays can land any time; you get XP the moment one hits.'}</p>
        <div className="row wr">
          <a className="btn dark" href={`/artist/${a.slug}`}>Artist page</a>
          <a className="btn" href={`/artist/${a.slug}`}>Follow for airplay alerts</a>
        </div>
      </div>
    </div>
  )
}

function Lounge({ ctx }: { ctx: Ctx }) {
  const { player, session } = ctx
  const a = ctx.artists.find((x) => x.slug === player.artistSlug)
  const [poster, setPoster] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  if (!a) return <p>The promo kit unlocks when your artist has a page on Maestro Radio. Only artists who've opted in can be promoted.</p>
  if (!session) return (
    <div className="stack">
      <p>Your promo kit gives you a personal link and poster for <strong>{a.display_name}</strong>. When people follow through your link, you earn 50 XP each. Sign in so we can credit you.</p>
      <a className="btn dark" href="/login?next=/play/">Sign in to unlock</a>
    </div>
  )
  if (!player.promoCode) return <p>Setting up your promo code…</p>
  const url = `https://themaestroradio.com/artist/${a.slug}?src=mm-${player.promoCode}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setMsg('Link copied.'); ctx.mile('promo-copy', 'Grabbed your first promo link') } catch { setMsg('Copy failed. Press and hold the link to copy it.') }
  }
  const share = async () => {
    if (!navigator.share) return copy()
    try { await navigator.share({ title: `${a.display_name} on Maestro Radio`, text: `Hear ${a.display_name} on Maestro Radio`, url }); ctx.mile('promo-share', 'Shared your first promo link') } catch { /* cancelled */ }
  }
  const mkPoster = async () => {
    setBusy(true); setMsg('')
    try { setPoster(await makePoster({ artist: a.display_name, art: a.artwork_url, url, city: player.city, si: a.artist_type === 'si' })); ctx.mile('poster', 'Made your first promo poster') }
    catch { setMsg('Poster failed. Try again.') }
    setBusy(false)
  }
  const claim = async () => {
    setBusy(true)
    try {
      const r = await claimPromo()
      if (r.error) setMsg('Play a moment first so your player is saved, then try again.')
      else {
        setMsg(r.new_follows ? `${r.new_follows} new follower${r.new_follows === 1 ? '' : 's'} through your link. +${r.xp_awarded} XP` : `${r.follows} follower${r.follows === 1 ? '' : 's'} and ${r.page_views} visit${r.page_views === 1 ? '' : 's'} through your link so far. Nothing new to claim.`)
        if (r.new_follows) await ctx.refreshPromo()
      }
    } catch { setMsg('Could not check right now.') }
    setBusy(false)
  }
  return (
    <div className="stack">
      <p>Promote <strong>{a.display_name}</strong> for real. Every person who follows through your link earns you 50 XP. Fake streams and bought follows don't count. That's Velvet's game.</p>
      <div className="linkbox"><code>{url}</code></div>
      <div className="row wr">
        <button type="button" className="btn dark" onClick={share}>Share link</button>
        <button type="button" className="btn" onClick={copy}>Copy link</button>
        <button type="button" className="btn" onClick={mkPoster} disabled={busy}>Make poster</button>
        <button type="button" className="btn" onClick={claim} disabled={busy}>Check my promo results</button>
      </div>
      <p aria-live="polite" className="status">{msg}</p>
      {poster ? (
        <div className="poster">
          <img src={poster} alt={`Promo poster for ${a.display_name} with a QR code`} />
          <a className="btn dark" href={poster} download={`${a.slug}-maestro-poster.png`}>Download poster</a>
        </div>
      ) : null}
    </div>
  )
}

function Tower({ ctx }: { ctx: Ctx }) {
  const P = PATHS[ctx.player.path]
  return (
    <div className="stack">
      <p><strong>{NAMES.vance}</strong> runs Velvet Tower. Every so often he corners one of the crew with a deal that sounds great and isn't: fake streams, rigged charts, contracts that eat your masters.</p>
      <p>When he's pitching, you have 10 seconds to send someone. Step in yourself ({P.ability.toLowerCase()}) for 60 XP, or send a crew member for 40. Let one slip and your rep drops 15.</p>
      <p className="muted sm">Record so far: stopped {ctx.player.avoided}, slipped {ctx.player.caused}. Rep {ctx.player.rep}/100.</p>
    </div>
  )
}
