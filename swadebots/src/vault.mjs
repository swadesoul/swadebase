import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'

// Credential broker over Supabase Vault (vault.create_secret / vault.decrypted_secrets).
// Secret values are returned only to a server-side tool callback, or to a super-admin
// who just passed re-auth. They are never copied into audit rows.

export function createMemoryVault() {
  const rows = new Map()
  return {
    source: 'test_double',
    async createSecret({ secret, name, description }) {
      const id = randomUUID()
      const now = new Date().toISOString()
      rows.set(id, { id, name, description: description || '', secret, created_at: now, updated_at: now, revoked: false })
      return id
    },
    async listMeta() {
      return [...rows.values()]
        .filter((row) => !row.revoked)
        .map(({ secret, ...meta }) => meta)
    },
    async decrypt(id) {
      const row = rows.get(id)
      if (!row || row.revoked) {
        const error = new Error('vault secret is missing')
        error.code = 'not_found'
        throw error
      }
      return row.secret
    },
    async revoke(id) {
      const row = rows.get(id)
      if (!row) return false
      row.revoked = true
      row.updated_at = new Date().toISOString()
      return true
    },
  }
}

export function createUnavailableVault() {
  return {
    source: 'unavailable',
    async createSecret() {
      const error = new Error('vault is not connected')
      error.code = 'vault_unavailable'
      throw error
    },
    async listMeta() {
      const error = new Error('vault is not connected')
      error.code = 'vault_unavailable'
      throw error
    },
    async decrypt() {
      const error = new Error('vault is not connected')
      error.code = 'vault_unavailable'
      throw error
    },
    async revoke() {
      const error = new Error('vault is not connected')
      error.code = 'vault_unavailable'
      throw error
    },
  }
}

export function namespaceFor(tenantId, systemSlug, leaf) {
  return `swadebots/${tenantId}/${systemSlug}/${leaf}`
}

export function tenantFromSecretName(name) {
  const parts = String(name || '').split('/')
  if (parts[0] !== 'swadebots' || !parts[1]) return null
  return parts[1]
}

export function createVaultBroker({ vault, audit, infoLog }) {
  return {
    source: vault.source,
    async listSystems(tenantId) {
      const meta = await vault.listMeta()
      const mine = meta.filter((row) => tenantFromSecretName(row.name) === tenantId)
      const systems = new Map()
      for (const row of mine) {
        const system = row.name.split('/')[2] || 'unknown'
        if (!systems.has(system)) {
          systems.set(system, { slug: system, credentials: [], grants: [] })
        }
        systems.get(system).credentials.push({
          id: row.id,
          name: row.name,
          description: row.description,
          updated_at: row.updated_at,
          write_only: true,
          secret_preview: null,
        })
      }
      return [...systems.values()]
    },
    async storeSecret({ tenantId, systemSlug, leaf, secret, description, actor }) {
      const name = namespaceFor(tenantId, systemSlug, leaf)
      const id = await vault.createSecret({ secret, name, description })
      audit({
        tenant_id: tenantId,
        actor: actor.id,
        kind: 'vault.store',
        data: { secret_id: id, name, system_slug: systemSlug },
      })
      return { id, name }
    },
    async reveal({ actor, secretId }) {
      const meta = await vault.listMeta()
      const row = meta.find((item) => item.id === secretId)
      if (!row || tenantFromSecretName(row.name) !== actor.tenant_id) {
        const error = new Error('secret not found')
        error.code = 'not_found'
        throw error
      }
      if (actor.role !== 'super_admin') {
        const error = new Error('reveal requires super-admin')
        error.code = 'forbidden'
        throw error
      }
      const secret = await vault.decrypt(secretId)
      audit({
        tenant_id: actor.tenant_id,
        actor: actor.id,
        kind: 'vault.reveal',
        data: { secret_id: secretId, name: row.name },
      })
      return secret
    },
    async revokeSecret({ actor, secretId }) {
      const meta = await vault.listMeta()
      const row = meta.find((item) => item.id === secretId)
      if (!row || tenantFromSecretName(row.name) !== actor.tenant_id) {
        const error = new Error('secret not found')
        error.code = 'not_found'
        throw error
      }
      await vault.revoke(secretId)
      audit({
        tenant_id: actor.tenant_id,
        actor: actor.id,
        kind: 'vault.revoke',
        data: { secret_id: secretId, name: row.name },
      })
      return { revoked: true }
    },
    async withGrant({ grant, actor, purpose, taskId, botId, fn }) {
      if (!grant || grant.tenant_id !== actor.tenant_id || grant.status !== 'approved') {
        const error = new Error('vault grant is not approved')
        error.code = 'forbidden'
        throw error
      }
      const meta = await vault.listMeta()
      const row = meta.find((item) => item.id === grant.secret_id)
      if (!row || tenantFromSecretName(row.name) !== actor.tenant_id) {
        const error = new Error('vault grant is outside this tenant')
        error.code = 'forbidden'
        throw error
      }
      const secret = await vault.decrypt(grant.secret_id)
      audit({
        tenant_id: actor.tenant_id,
        actor: actor.id,
        kind: 'vault.use',
        data: { grant_id: grant.id, secret_id: grant.secret_id, purpose },
      })
      infoLog?.append({
        tenant_id: actor.tenant_id,
        bot_id: botId || grant.bot_id,
        task_id: taskId,
        vault_entry_ids: [grant.secret_id],
        sources: [{ type: 'vault', ref: grant.secret_id }],
        tools: ['vault'],
        purpose,
      })
      const result = await fn(secret)
      return result
    },
  }
}

export function generatePassword() {
  return `${randomBytes(24).toString('base64url')}Aa1!`
}

export function hashToken(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function tokensEqual(left, right) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
