import { createServer } from 'node:http'
import { loadConfig } from './config.mjs'
import { MemoryStore } from './store.mjs'
import { createAuth } from './auth.mjs'
import { createSpendGate, createFailClosedLedger } from './spend.mjs'
import { createKnowledge } from './knowledge.mjs'
import { createUnavailableVault, createVaultBroker } from './vault.mjs'
import { createTaskRunner } from './tasks.mjs'
import { createOps } from './ops.mjs'
import { createHandler } from './http.mjs'

export async function createApp(options = {}) {
  const config = loadConfig(options.env || process.env)
  const store = options.store || new MemoryStore()
  store.seedOwnerBots(config.ownerTenantId)
  store.ensureSettings(config.ownerTenantId, 'owner', 'paid')
  const ledger = options.ledger || createFailClosedLedger()
  const spend = createSpendGate({ ledger, founderEmails: config.superAdminEmails })
  const knowledge = options.knowledge || createKnowledge({
    facadeUrl: config.facadeUrl,
    facadeToken: config.facadeToken,
    fetchImpl: options.fetchImpl,
    infoLog: store.infoUse,
  })
  const vault = options.vault || createUnavailableVault()
  const broker = createVaultBroker({ vault, audit: (entry) => store.audit(entry), infoLog: store.infoUse })
  const auth = createAuth({ config, store, fetchImpl: options.fetchImpl })
  const tasks = createTaskRunner({
    store,
    knowledge,
    spend,
    broker,
    config,
    fetchImpl: options.fetchImpl || fetch,
    lookup: options.lookup,
  })
  const ctx = { config, store, ledger, spend, knowledge, vault, broker, auth, tasks }
  ctx.ops = createOps(ctx)
  const server = createServer(createHandler(ctx))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  return {
    server,
    url: `http://127.0.0.1:${address.port}`,
    config,
    store,
    tasks,
    broker,
    vault,
    ops: ctx.ops,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}
