// Live Maestro Radio: stream + now playing from the station engine.
export const ENGINE = 'https://radio.themaestroradio.com'
export const STATION = 'maestro_radio'
export const STREAM = `${ENGINE}/listen/${STATION}/radio.mp3`

export type Song = { title: string; artist: string; art: string | null; id: string }
export type NowPlaying = { now: Song | null; next: Song | null; playedAt: number; isLive: boolean; liveName: string; isBreak: boolean }

const toSong = (s: any): Song | null =>
  s?.title ? { title: String(s.title), artist: String(s.artist || ''), art: s.art || null, id: String(s.id || `${s.artist}-${s.title}`) } : null

export async function nowPlaying(): Promise<NowPlaying | null> {
  try {
    const r = await fetch(`${ENGINE}/api/nowplaying/${STATION}`, { cache: 'no-store' })
    if (!r.ok) return null
    const d = await r.json()
    const now = toSong(d?.now_playing?.song)
    return {
      now, next: toSong(d?.playing_next?.song), playedAt: Number(d?.now_playing?.played_at || 0),
      isLive: !!d?.live?.is_live, liveName: String(d?.live?.streamer_name || ''),
      isBreak: !!now && now.artist === 'Maestro Radio',
    }
  } catch { return null }
}

export const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
