import assert from 'node:assert/strict'
import test from 'node:test'

import { SwadeClient, SwadeError } from './client.ts'

test('SWADEBOTS client sends the credential and no tenant override', async () => {
  const seen: { url?: string; authorization?: string; client?: string; body?: string } = {}
  globalThis.fetch = async (input, init) => {
    const headers = new Headers(init?.headers)
    seen.url = String(input)
    seen.authorization = headers.get('authorization') ?? undefined
    seen.client = headers.get('x-swadebots-client') ?? undefined
    seen.body = typeof init?.body === 'string' ? init.body : undefined
    return new Response(JSON.stringify({ answerable: true, provenance: { agents: 'SWADEBOTS' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  const client = new SwadeClient({
    baseUrl: 'http://swade-ontology.internal',
    token: 'maestro-token-value',
  })
  const result = (await client.ask('how many spins aired')) as { provenance: { agents: string } }
  assert.equal(seen.url, 'http://swade-ontology.internal/v1/ask')
  assert.equal(seen.authorization, 'Bearer maestro-token-value')
  assert.equal(seen.client, 'swadebots')
  assert.deepEqual(JSON.parse(seen.body ?? '{}'), { question: 'how many spins aired' })
  assert.equal(result.provenance.agents, 'SWADEBOTS')
})

test('SWADEBOTS client refuses a tenant override', () => {
  assert.throws(
    () =>
      new SwadeClient({
        baseUrl: 'http://swade-ontology.internal',
        token: 'maestro-token-value',
        tenantId: 'tenant-other',
      } as unknown as { baseUrl: string; token: string; tenantId: string }),
    (error: unknown) => error instanceof SwadeError && error.status === 400
  )
})
