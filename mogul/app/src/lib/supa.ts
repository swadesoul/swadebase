// SWADEBASE client, same origin + same storage as the Maestro site, so one sign-in covers both.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Runtime = { url: string; publicKey: string }
let client: SupabaseClient<any, any, any> | null = null
let runtime: Runtime | null = null

export async function supa(): Promise<SupabaseClient<any, any, any>> {
  if (client) return client
  const r = await fetch('https://swadebase.cloud/auth-config.json', { headers: { accept: 'application/json' } })
  if (!r.ok) throw new Error('Could not reach Maestro sign-in service.')
  runtime = (await r.json()) as Runtime
  const key = runtime.publicKey
  client = createClient(runtime.url || 'https://swadebase.cloud', key, {
    db: { schema: 'maestroradio' },
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storage: localStorage },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers)
        if (key.startsWith('sb_publishable_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization')
        h.set('apikey', key)
        return fetch(input, { ...init, headers: h })
      },
    },
  })
  return client!
}

export const SIGNAL = 'https://swadebase.cloud/functions/v1/artist-signal'
export async function signal<T = any>(action: string, params: Record<string, string> = {}): Promise<T> {
  const q = new URLSearchParams({ action, ...params })
  const r = await fetch(`${SIGNAL}?${q}`)
  const j = await r.json()
  if (!r.ok) throw new Error(j?.error || 'Request failed')
  return j as T
}
