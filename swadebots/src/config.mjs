// Runtime configuration. Emails, keys, and database URLs come from the
// environment only. This module never reads a service-role key.

export function loadConfig(env = process.env) {
  const superAdminEmails = String(env.SWADEBOTS_SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  return {
    enabled: env.SWADEBOTS_CONSOLE_ENABLED === 'true',
    allowTestTokens: env.SWADEBOTS_ALLOW_TEST_TOKENS === 'true',
    superAdminEmails,
    ownerTenantId: 'swade-personal',
    authUrl: trimSlash(env.SWADEBASE_AUTH_URL || ''),
    anonKey: env.SWADEBASE_ANON_KEY || '',
    gatewayUrl: trimSlash(env.SWADE_AI_GATEWAY_URL || ''),
    gatewayKey: env.SWADE_AI_GATEWAY_KEY || '',
    facadeUrl: trimSlash(env.SWADE_FACADE_URL || ''),
    facadeToken: env.SWADE_FACADE_TOKEN || '',
    ledgerDatabaseUrl: env.SWADEBOTS_LEDGER_DATABASE_URL || '',
    vaultDatabaseUrl: env.SWADEBOTS_VAULT_DATABASE_URL || '',
    taskTimeoutMs: positive(env.SWADEBOTS_TASK_TIMEOUT_MS, 120000),
    uploadMaxBytes: positive(env.SWADEBOTS_UPLOAD_MAX_BYTES, 25 * 1024 * 1024),
    port: positive(env.PORT, 8787),
    host: env.HOST || '127.0.0.1',
    sessionIdleMs: positive(env.SWADEBOTS_SESSION_IDLE_MS, 30 * 24 * 60 * 60 * 1000),
    sessionAbsoluteMs: positive(env.SWADEBOTS_SESSION_ABSOLUTE_MS, 90 * 24 * 60 * 60 * 1000),
    reauthWindowMs: positive(env.SWADEBOTS_REAUTH_WINDOW_MS, 10 * 60 * 1000),
    cookieSecure: env.SWADEBOTS_COOKIE_SECURE !== 'false',
  }
}

function trimSlash(value) {
  return String(value || '').replace(/\/$/, '')
}

function positive(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : fallback
}
