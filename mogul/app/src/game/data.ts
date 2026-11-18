export type CharId = 'unc' | 'angie' | 'princess' | 'slide' | 'bright' | 'vance' | 'you'
export type PathKey = 'lover' | 'musician' | 'pro'

export const IDS: CharId[] = ['unc', 'angie', 'princess', 'slide', 'bright', 'vance', 'you']
export const CREW: CharId[] = ['unc', 'angie', 'princess', 'slide', 'bright']
export const NAMES: Record<CharId, string> = { unc: 'Unc Maestro', angie: 'DJ Angie', princess: 'DJ Princess Swade', slide: 'DJ Slide', bright: 'DJ Bright', vance: 'Velvet Vance', you: 'You' }
export const HOME0: Record<CharId, number> = { unc: 100, angie: 330, princess: 470, slide: 650, bright: 920, vance: 1210, you: 200 }
export const HELP: Partial<Record<CharId, string>> = { unc: 'Read the fine print.', angie: 'Real fans last longer.', slide: 'We do not fake numbers.', bright: 'Honest way. Every time.', princess: 'Not on my station.' }

// Distinct device voices (free). Swapped for Voice Studio clips later.
export const VOICE: Record<CharId, { pitch: number; rate: number }> = {
  unc: { pitch: 0.7, rate: 0.9 }, angie: { pitch: 1.3, rate: 1.05 }, princess: { pitch: 1.2, rate: 1 }, slide: { pitch: 0.9, rate: 1.15 },
  bright: { pitch: 1.05, rate: 1 }, vance: { pitch: 0.6, rate: 0.85 }, you: { pitch: 1, rate: 1 },
}

export const LEVELS: [string, number][] = [['Superfan', 0], ['Street Team', 100], ['Radio DJ', 250], ['Producer', 500], ['Indie Label Owner', 1000], ['Tour Manager', 2000], ['Executive', 3500], ['Music Mogul', 5000]]
export const levelIndex = (xp: number) => LEVELS.reduce((i, l, k) => (xp >= l[1] ? k : i), 0)

export const PATHS: Record<PathKey, { label: string; blurb: string; level: number; place: string; home: number; ability: string; line: string; reply: string; shirt: string; artistLabel: string }> = {
  lover: { label: 'Music lover', blurb: 'You live for the music and find new artists first.', level: 0, place: 'the record shop', home: 200, ability: 'Rally the fans', line: 'Real fans beat fakes!', reply: 'Telling everyone!', shirt: '#2F4F86', artistLabel: 'Pick an artist to champion' },
  musician: { label: 'Musician or artist', blurb: 'You make the music. Your artist joins the block.', level: 3, place: 'The Booth', home: 770, ability: 'Play them the real record', line: 'The music speaks for me.', reply: 'Thank you!', shirt: '#1F6F68', artistLabel: 'Your artist' },
  pro: { label: 'Industry pro', blurb: 'You have run labels, stations or tours. You start with more on the line.', level: 4, place: 'your label office', home: 1040, ability: 'Counter with a fair deal', line: 'Here is a fair deal.', reply: 'Let us talk terms.', shirt: '#7A2E5A', artistLabel: 'An artist on your roster' },
}

export const COLLABS: [string, string][] = [['Got a new mix for you!', 'Run it on air tonight!'], ['Collab this weekend?', 'Bet. I am in.'], ['Spin my new track?', 'Already queued it.'], ['Listening party Friday?', 'I will bring the crowd.'], ['Saw the New Music Hour?', 'Phones were ringing!']]
export const OFFERS = ['buy {artist} a million fake streams', 'put {artist} on a chart he controls', 'lock {artist} into a 50-year contract with no audit rights', 'pay {target} to play only his songs', 'buy fake followers for the {artist} launch', 'swap {artist}’s masters for a quick check', 'bump {artist} out of the New Music Hour for his own act']
export const PLACES = ['outside WMRX Radio', 'in the Listening Lounge', 'at the record shop counter', 'backstage at The Booth', 'on the corner by Velvet Tower']
export const STAKES = ['before Friday’s {city} release party', 'the night {artist} hits the New Music Hour', 'right before the sponsor meeting', 'an hour before the listening party', 'while the {city} block is watching']

// Buildings: x range on the street, label, what tapping it does
export const SPOTS = [
  { id: 'shop', x: 120, label: 'Record shop', tip: 'Your saved songs' },
  { id: 'radio', x: 405, label: 'WMRX Radio', tip: 'Tune in live' },
  { id: 'booth', x: 690, label: 'The Booth', tip: 'Your artist' },
  { id: 'lounge', x: 950, label: 'Listening Lounge', tip: 'Promo kit' },
  { id: 'tower', x: 1215, label: 'Velvet Tower', tip: 'Velvet’s file' },
] as const
export type SpotId = (typeof SPOTS)[number]['id']

export const pick = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)]
