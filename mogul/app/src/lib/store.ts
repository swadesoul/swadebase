// Player save: SWADEBASE when signed in, this browser when playing as a guest.
import type { Session } from '@supabase/supabase-js'
import { supa } from './supa'
import type { PathKey } from '../game/data'

export type Artist = { slug: string; display_name: string; artwork_url: string | null; artist_type: string; verified: boolean }
export type Milestone = { key: string; text: string; chapter: number; at: string }
export type Saved = { title: string; artist: string; art_url: string | null }
export type Player = {
  name: string; city: string; path: PathKey; artistSlug: string | null; artistName: string
  xp: number; rep: number; chapter: number; avoided: number; caused: number; listenSeconds: number
  promoCode: string | null; voices: boolean
}

const GUEST = 'mogul.guest.v1'
type GuestBlob = { player: Player; milestones: Milestone[]; saved: Saved[] }

export function loadGuest(): GuestBlob | null {
  try { const r = localStorage.getItem(GUEST); return r ? (JSON.parse(r) as GuestBlob) : null } catch { return null }
}
export function saveGuest(b: GuestBlob) { try { localStorage.setItem(GUEST, JSON.stringify(b)) } catch { /* private mode */ } }
export function clearGuest() { try { localStorage.removeItem(GUEST) } catch { /* ignore */ } }

export async function getSession(): Promise<Session | null> {
  try { const c = await supa(); return (await c.auth.getSession()).data.session } catch { return null }
}

// Map a DB row (artist_profile_id) to slug via the public artists list
export async function loadCloud(uid: string, artists: Artist[], idToSlug: Record<string, string>): Promise<GuestBlob | null> {
  const c = await supa()
  const { data: p } = await c.from('mogul_players').select('*').eq('user_id', uid).maybeSingle()
  if (!p) return null
  const [{ data: ms }, { data: ss }] = await Promise.all([
    c.from('mogul_milestones').select('key,text,chapter,created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(30),
    c.from('mogul_saved_songs').select('title,artist,art_url').eq('user_id', uid).order('saved_at', { ascending: false }).limit(100),
  ])
  const slug = p.artist_profile_id ? idToSlug[p.artist_profile_id] ?? null : null
  const a = artists.find((x) => x.slug === slug)
  return {
    player: {
      name: p.display_name || '', city: p.city || '', path: p.path, artistSlug: slug, artistName: a?.display_name || p.settings?.artist_name || '',
      xp: p.xp, rep: p.rep, chapter: p.chapter, avoided: p.avoided, caused: p.caused, listenSeconds: p.listen_seconds,
      promoCode: p.promo_code, voices: !!p.settings?.voices,
    },
    milestones: (ms || []).map((m: any) => ({ key: m.key, text: m.text, chapter: m.chapter, at: m.created_at })),
    saved: ss || [],
  }
}

export async function saveCloud(uid: string, pl: Player, profileId: string | null) {
  const c = await supa()
  const row = {
    user_id: uid, display_name: pl.name.slice(0, 40) || null, city: pl.city.slice(0, 60) || null, path: pl.path,
    artist_profile_id: profileId, xp: pl.xp, rep: pl.rep, chapter: pl.chapter, avoided: pl.avoided, caused: pl.caused,
    listen_seconds: pl.listenSeconds, settings: { voices: pl.voices, artist_name: pl.artistName.slice(0, 80) },
  }
  const { data, error } = await c.from('mogul_players').upsert(row, { onConflict: 'user_id' }).select('xp,promo_code').single()
  if (error) throw error
  return data as { xp: number; promo_code: string }
}

export async function addMilestoneCloud(uid: string, m: Milestone) {
  const c = await supa()
  await c.from('mogul_milestones').upsert({ user_id: uid, key: m.key.slice(0, 60), text: m.text.slice(0, 200), chapter: m.chapter }, { onConflict: 'user_id,key', ignoreDuplicates: true })
}
export async function saveSongCloud(uid: string, s: Saved) {
  const c = await supa()
  await c.from('mogul_saved_songs').upsert({ user_id: uid, title: s.title.slice(0, 200), artist: s.artist.slice(0, 200), art_url: s.art_url?.slice(0, 500) ?? null }, { onConflict: 'user_id,artist,title', ignoreDuplicates: true })
}
export async function removeSongCloud(uid: string, s: Saved) {
  const c = await supa()
  await c.from('mogul_saved_songs').delete().eq('user_id', uid).eq('artist', s.artist).eq('title', s.title)
}
export async function claimPromo(): Promise<{ follows: number; new_follows: number; xp_awarded: number; page_views: number; code: string; error?: string }> {
  const c = await supa()
  const { data, error } = await c.rpc('mogul_claim_promo')
  if (error) throw error
  return data
}
