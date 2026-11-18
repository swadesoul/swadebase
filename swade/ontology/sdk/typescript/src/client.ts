export type SwadeClientOptions = {
  baseUrl: string
  token: string
}

export class SwadeError extends Error {
  status: number
  payload: unknown

  constructor(status: number, payload: unknown) {
    super('SWADE request failed')
    this.status = status
    this.payload = payload
  }
}

export class SwadeClient {
  private readonly baseUrl: string
  private readonly token: string

  constructor(options: SwadeClientOptions & { tenantId?: never; tenant_id?: never }) {
    if ('tenantId' in options || 'tenant_id' in options) {
      throw new SwadeError(400, { error: { code: 'tenant_override', service: 'SWADE' } })
    }
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.token = options.token
  }

  health(): Promise<unknown> {
    return this.request('GET', '/health', undefined, false)
  }

  terms(query = ''): Promise<unknown> {
    const path = query ? `/v1/terms?q=${encodeURIComponent(query)}` : '/v1/terms'
    return this.request('GET', path)
  }

  term(termId: string): Promise<unknown> {
    return this.request('GET', `/v1/terms/${encodeURIComponent(termId)}`)
  }

  answerable(question: string): Promise<unknown> {
    return this.request('POST', '/v1/answerable', { question })
  }

  ask(question: string): Promise<unknown> {
    return this.request('POST', '/v1/ask', { question })
  }

  searchDocuments(query: string, limit = 10): Promise<unknown> {
    return this.request('POST', '/v1/documents/search', { query, limit })
  }

  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    authenticated = true
  ): Promise<unknown> {
    if (body && ('tenant_id' in body || 'tenantId' in body)) {
      throw new SwadeError(400, { error: { code: 'tenant_override', service: 'SWADE' } })
    }
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-swadebots-client': 'swadebots',
    }
    if (authenticated) {
      headers.authorization = `Bearer ${this.token}`
    }
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const payload = await response.json()
    if (!response.ok) {
      throw new SwadeError(response.status, payload)
    }
    return payload
  }
}
