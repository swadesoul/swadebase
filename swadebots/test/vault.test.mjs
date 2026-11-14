import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { api, boot, createMemoryVault, ownerToken, publicToken } from './helpers.mjs'

const secret = 'vault-sentinel-value'
const app = await boot({}, { vault: createMemoryVault() })
after(() => app.close())

async function vaultGrant() {
  const created = await api(app, 'POST', '/v1/bots', {
    token: ownerToken(),
    body: { name: 'Vault bot' },
  })
  const grant = await api(app, 'POST', `/v1/bots/${created.json.data.id}/grants`, {
    token: ownerToken(),
    body: { kind: 'vault', resource: 'default' },
  })
  return { botId: created.json.data.id, grantId: grant.json.data.id }
}

test('an unapproved vault grant is denied, an approved one is allowed, and a revoked one is denied again', async () => {
  const { botId, grantId } = await vaultGrant()
  const denied = await api(app, 'POST', `/v1/bots/${botId}/vault/use`, { token: ownerToken() })
  assert.equal(denied.status, 403)
  const approved = await api(app, 'POST', `/v1/approvals/${grantId}/decision`, {
    token: ownerToken(),
    body: { decision: 'approve' },
  })
  assert.equal(approved.json.data.status, 'approved')
  const stored = await api(app, 'POST', '/v1/vault/secrets', {
    token: ownerToken(),
    body: { system_slug: 'notes', leaf: 'password', secret },
  })
  await api(app, 'POST', `/v1/approvals/${grantId}/bind`, {
    token: ownerToken(),
    body: { secret_id: stored.json.data.id },
  })
  const used = await api(app, 'POST', `/v1/bots/${botId}/vault/use`, { token: ownerToken() })
  assert.equal(used.status, 200)
  assert.equal(used.text.includes(secret), false)
  await api(app, 'POST', `/v1/approvals/${grantId}/decision`, {
    token: ownerToken(),
    body: { decision: 'revoke' },
  })
  const again = await api(app, 'POST', `/v1/bots/${botId}/vault/use`, { token: ownerToken() })
  assert.equal(again.status, 403)
  const decisions = app.store.auditLog.map((row) => row.kind)
  assert.ok(decisions.includes('grant.approved'))
  assert.ok(decisions.includes('grant.revoked'))
  assert.equal(JSON.stringify(app.store.auditLog).includes(secret), false)
})

test('a public tenant cannot decide or read the owner approval', async () => {
  const { grantId } = await vaultGrant()
  const list = await api(app, 'GET', '/v1/approvals', { token: publicToken() })
  assert.equal(list.json.data.some((grant) => grant.id === grantId), false)
  const decide = await api(app, 'POST', `/v1/approvals/${grantId}/decision`, {
    token: publicToken(),
    body: { decision: 'approve' },
  })
  assert.equal(decide.status, 403)
})

test('vault values stay masked until owner re-auth, and the reveal is audited without the value', async () => {
  const stored = await api(app, 'POST', '/v1/vault/secrets', {
    token: ownerToken(),
    body: { system_slug: 'mail', leaf: 'password', secret },
  })
  const systems = await api(app, 'GET', '/v1/vault/systems', { token: ownerToken() })
  assert.equal(systems.text.includes(secret), false)
  const blocked = await api(app, 'POST', `/v1/vault/secrets/${stored.json.data.id}/reveal`, {
    token: ownerToken(),
    body: {},
  })
  assert.equal(blocked.status, 401)
  const reauth = await api(app, 'POST', '/v1/auth/reauth', {
    token: ownerToken(),
    body: { confirmation: 'reveal' },
  })
  const revealed = await api(app, 'POST', `/v1/vault/secrets/${stored.json.data.id}/reveal`, {
    token: ownerToken(),
    body: { reauth_token: reauth.json.data.reauth_token },
  })
  assert.equal(revealed.json.data.secret, secret)
  const revealAudit = app.store.auditLog.filter((row) => row.kind === 'vault.reveal')
  assert.ok(revealAudit.length > 0)
  assert.equal(JSON.stringify(revealAudit).includes(secret), false)
})

test('an approved email sign-up stores a password in the vault and does not return it', async () => {
  await api(app, 'PATCH', '/v1/settings', {
    token: ownerToken(),
    body: { signup_policy: { prefer_google: false }, owner_default_email: 'owner@example.test' },
  })
  const signup = await api(app, 'POST', '/v1/vault/signups', {
    token: ownerToken(),
    body: { system_slug: 'example-notes' },
  })
  assert.equal(signup.json.data.status, 'pending')
  assert.equal(signup.text.includes('password'), false)
  const decided = await api(app, 'POST', `/v1/vault/signups/${signup.json.data.id}/decision`, {
    token: ownerToken(),
    body: { decision: 'approve' },
  })
  assert.equal(decided.json.data.status, 'approved')
  assert.equal(decided.text.includes('Aa1!'), false)
  const stored = await app.vault.decrypt(decided.json.data.secret_id)
  assert.match(stored, /Aa1!/)
  assert.equal(JSON.stringify(app.store.auditLog).includes(stored), false)
})
