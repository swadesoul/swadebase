const state = {
  token: '',
  screen: 'bots',
  bots: [],
  botId: '',
  messages: [],
  tasks: [],
  approvals: [],
  notes: [],
  vault: [],
  settings: null,
  role: '',
}

const app = document.querySelector('#app')

boot()

async function boot() {
  const params = new URLSearchParams(location.search)
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''))
  const access = hash.get('access_token')
  if (access) {
    state.token = access
    history.replaceState({}, '', location.pathname + location.search)
  }
  if (!state.token && params.get('demo') === '1') {
    const demo = await get('/v1/demo-session')
    if (demo.ok) {
      state.token = demo.data.token
      state.role = demo.data.role
    }
  }
  if (!state.token) return renderGate()
  const screen = location.hash.replace('#', '')
  if (['bots', 'vault', 'inbox', 'about', 'settings', 'admin'].includes(screen))
    state.screen = screen
  await refresh()
  render()
}

async function refresh() {
  const bots = await get('/v1/bots?include=hidden')
  state.bots = bots.data || []
  if (!state.botId && state.bots[0]) state.botId = state.bots[0].id
  if (state.botId) {
    const messages = await get(`/v1/bots/${state.botId}/messages`)
    const tasks = await get(`/v1/bots/${state.botId}/tasks`)
    state.messages = messages.data || []
    state.tasks = tasks.data || []
  }
  const approvals = await get('/v1/approvals')
  state.approvals = approvals.data || []
  const notes = await get('/v1/notifications')
  state.notes = notes.data || []
  const settings = await get('/v1/settings')
  state.settings = settings.data || null
  if (state.role === 'super_admin' || state.settings) {
    const vault = await get('/v1/vault/systems')
    state.vault = vault.ok ? vault.data : []
    state.vaultError = vault.ok ? '' : vault.error?.message
  }
}

function renderGate() {
  app.innerHTML = `
    <main class="gate">
      <section class="card">
        <div class="mark"><span class="gem">S</span><b>SWADEBOTS</b></div>
        <p>Sign in with the Google account already connected to SWADEBASE.</p>
        <button class="primary" id="google" type="button">Continue with Google</button>
        <p class="muted">Owner access is the verified Google account configured for this deployment. It is not stored in the app.</p>
      </section>
    </main>`
  document.querySelector('#google').onclick = async () => {
    const redirect = location.origin + location.pathname
    const result = await get('/v1/auth/google?redirect_to=' + encodeURIComponent(redirect))
    if (result.data?.url) location.href = result.data.url
    else
      document
        .querySelector('.card')
        .insertAdjacentHTML(
          'beforeend',
          '<p class="warn">Google sign-in is not configured on this server yet.</p>'
        )
  }
}

function render() {
  if (state.screen === 'vault') return renderVault()
  if (state.screen === 'about') return renderAbout()
  if (state.screen === 'settings') return renderSettings()
  if (state.screen === 'admin') return renderAdmin()
  if (state.screen === 'inbox') return renderInbox()
  renderBots()
}

function frame(body) {
  const pending = state.approvals.filter((item) => item.status === 'pending').length
  app.innerHTML = `
    <div class="shell">
      <header class="top">
        <div class="mark"><span class="gem">S</span><b>SWADEBOTS</b></div>
        <nav class="nav">
          ${nav('bots', 'Bots')}
          ${nav('vault', 'Vault')}
          ${nav('inbox', `Inbox${pending ? ` (${pending})` : ''}`)}
          ${nav('about', 'About SWADE')}
          ${nav('settings', 'Settings')}
          ${state.role === 'super_admin' ? nav('admin', 'Admin') : ''}
        </nav>
        <span class="bell muted">${state.notes.length} updates</span>
      </header>
      ${body}
    </div>`
  for (const button of app.querySelectorAll('[data-screen]')) {
    button.onclick = () => {
      state.screen = button.dataset.screen
      render()
    }
  }
}

function nav(screen, label) {
  return `<button class="ghost" type="button" data-screen="${screen}" aria-current="${state.screen === screen ? 'page' : 'false'}">${label}</button>`
}

function renderBots() {
  const bot = state.bots.find((item) => item.id === state.botId)
  frame(`
    <div class="workspace">
      <aside class="side">
        <div class="row"><button class="primary" id="new-bot" type="button">New bot</button></div>
        ${state.bots
          .map(
            (item) => `
          <button class="bot" type="button" data-bot="${item.id}" aria-current="${item.id === state.botId}">
            <span class="avatar">${escapeHtml(item.avatar || 'S')}</span>
            <span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.title || '')}</small><small>${escapeHtml(item.description || '')}</small></span>
          </button>`
          )
          .join('')}
      </aside>
      <section class="main">
        <div class="thread" id="thread">
          ${(state.messages || []).map(drawMessage).join('') || '<p class="muted">Give this bot a task. It starts with no access until you approve a grant.</p>'}
          ${state.tasks
            .map(
              (task) => `
            <article class="result" data-task="${task.id}"><strong>${escapeHtml(task.title || 'Task')}</strong>
              <p class="muted">${escapeHtml(task.status)}</p>
              ${(task.information_use || []).map((entry) => `<p>${escapeHtml((entry.tools || []).join(', ') || 'no tools')} · ${escapeHtml((entry.sources || []).map((source) => source.ref).join(', '))}</p>`).join('') || '<p class="muted">No information used yet.</p>'}
            </article>`
            )
            .join('')}
          ${state.tasks
            .filter((task) => task.status === 'queued' && task.approval)
            .map(
              (task) => `
            <article class="progress"><strong>Needs approval</strong><p>${escapeHtml(task.approval.action || '')}</p></article>`
            )
            .join('')}
        </div>
        <form class="composer" id="composer">
          <label class="file ghost">Attach<input id="file" type="file" name="file" /></label>
          <input id="prompt" type="text" name="prompt" placeholder="Give this bot a task or a URL" autocomplete="off" />
          <button class="primary" type="submit">Send</button>
        </form>
      </section>
      <aside class="info">
        ${bot ? info(bot) : '<p class="muted">No bot selected.</p>'}
      </aside>
    </div>`)
  bindBotEvents()
}

function info(bot) {
  return `
    <h2>${escapeHtml(bot.name)}</h2>
    <p>${escapeHtml(bot.description || '')}</p>
    <p><span class="pill">${escapeHtml(bot.registry?.status || 'draft')}</span></p>
    <h3>Knowledge</h3>
    <p class="muted">${bot.knowledge_scope ? escapeHtml(bot.knowledge_scope) : 'No approved SWADE scope.'}</p>
    <h3>Routines</h3>
    ${(bot.routines || []).map((routine) => `<p>${escapeHtml(routine.name)} <small>${escapeHtml(routine.cron)}</small></p>`).join('') || '<p class="muted">None</p>'}
    <h3>Information used</h3>
    <div id="bot-info-use"><p class="muted">Loading.</p></div>
    <h3>Tools</h3>
    <p>${(bot.tools || []).map((tool) => `<span class="pill">${escapeHtml(tool)}</span>`).join(' ') || '<span class="muted">No grants yet</span>'}</p>
    <div class="row">
      <button class="ghost" id="rename" type="button">Rename</button>
      <button class="ghost" id="hide" type="button">Hide</button>
      <button class="danger" id="archive" type="button">Archive</button>
    </div>`
}

function drawMessage(message) {
  return `<article class="bubble ${message.role}"><p>${escapeHtml(message.text || '')}</p></article>`
}

function bindBotEvents() {
  for (const button of app.querySelectorAll('[data-bot]')) {
    button.onclick = async () => {
      state.botId = button.dataset.bot
      await refresh()
      render()
    }
  }
  const form = document.querySelector('#composer')
  if (!form) return
  form.onsubmit = async (event) => {
    event.preventDefault()
    const prompt = document.querySelector('#prompt').value.trim()
    const file = document.querySelector('#file').files[0]
    if (file) {
      const data = new FormData()
      data.append('file', file, file.name || 'upload.jpg')
      await fetch(`/v1/bots/${state.botId}/uploads`, {
        method: 'POST',
        headers: authHeaders(),
        body: data,
      })
    }
    if (prompt) {
      await fetch(`/v1/bots/${state.botId}/chat`, {
        method: 'POST',
        headers: { ...authHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
    }
    await refresh()
    render()
  }
  const rename = document.querySelector('#rename')
  if (rename)
    rename.onclick = async () => {
      const name = window.prompt('New name')
      if (!name) return
      await send('PATCH', `/v1/bots/${state.botId}`, { name })
      await refresh()
      render()
    }
  const hide = document.querySelector('#hide')
  if (hide)
    hide.onclick = async () => {
      await send('PATCH', `/v1/bots/${state.botId}`, { hidden: true })
      await refresh()
      render()
    }
  const archive = document.querySelector('#archive')
  if (archive)
    archive.onclick = async () => {
      await send('POST', `/v1/bots/${state.botId}/archive`, {})
      await refresh()
      render()
    }
  const infoUse = document.querySelector('#bot-info-use')
  if (infoUse && state.botId) {
    get(`/v1/bots/${state.botId}/information-use`).then((result) => {
      const rows = result.data || []
      infoUse.innerHTML = rows.length
        ? rows
            .map(
              (entry) =>
                `<p>${escapeHtml(entry.purpose || '')}<br><small>${escapeHtml(entry.tools.join(', '))} ${escapeHtml(entry.vault_entry_ids.join(', '))}</small></p>`
            )
            .join('')
        : '<p class="muted">No information used yet.</p>'
    })
  }
  const create = document.querySelector('#new-bot')
  if (create)
    create.onclick = async () => {
      const name = window.prompt('Bot name')
      if (!name) return
      const created = await send('POST', '/v1/bots', {
        name,
        description: 'New SWADEBOT',
        role: 'Assistant',
      })
      state.botId = created.data?.id
      await refresh()
      render()
    }
}

function renderVault() {
  frame(`<main class="page"><h1>Vault</h1><p class="muted">${escapeHtml(state.vaultError || 'Credentials stay in SWADEBASE Vault. Values are write-only here.')}</p>
    <div class="grid">${
      (state.vault || [])
        .map(
          (system) => `
      <article class="system"><h2>${escapeHtml(system.name || system.slug)}</h2>
        <p><span class="pill">${escapeHtml(system.sign_in_method || 'google')}</span> <span class="pill">${escapeHtml(system.status || '')}</span></p>
        <p class="muted">${(system.credentials || []).length} stored · ${(system.bots || []).length} bot grants</p>
      </article>`
        )
        .join('') || '<p>No systems in this tenant vault yet.</p>'
    }</div></main>`)
}

function renderInbox() {
  frame(
    `<main class="page"><h1>Approval inbox</h1><div class="grid">${
      state.approvals
        .map(
          (grant) => `
    <article class="panel"><h2>${escapeHtml(grant.kind)} · ${escapeHtml(grant.resource)}</h2>
      <p>${escapeHtml(grant.status)} · bot ${escapeHtml(grant.bot_id)}</p>
      ${
        grant.status === 'pending' || grant.status === 'approved'
          ? `<div class="row">
        ${grant.status === 'pending' ? '<button class="primary" data-decide="approve" data-id="' + grant.id + '" type="button">Approve</button><button class="ghost" data-decide="deny" data-id="' + grant.id + '" type="button">Deny</button>' : ''}
        ${grant.status === 'approved' ? '<button class="danger" data-decide="revoke" data-id="' + grant.id + '" type="button">Revoke</button>' : ''}
      </div>`
          : ''
      }</article>`
        )
        .join('') || '<p>No grant requests.</p>'
    }</div></main>`
  )
  for (const button of app.querySelectorAll('[data-decide]')) {
    button.onclick = async () => {
      await send('POST', `/v1/approvals/${button.dataset.id}/decision`, {
        decision: button.dataset.decide,
      })
      await refresh()
      render()
    }
  }
}

async function renderAbout() {
  const about = await get('/v1/about-swade')
  frame(
    `<main class="page"><h1>About SWADE</h1><article class="panel"><p>${escapeHtml(about.data?.primer || '').replaceAll('\n', '</p><p>')}</p></article></main>`
  )
}

function renderSettings() {
  const settings = state.settings || {}
  frame(`<main class="page"><h1>Settings</h1>
    <section class="panel"><h2>Account</h2><p>Signed in with Google. The owner account is configured at runtime.</p></section>
    <section class="panel"><h2>Appearance</h2><p>Theme ${escapeHtml(settings.theme || 'ink')} · accent ${escapeHtml(settings.accent || 'amber')}</p></section>
    <section class="panel"><h2>Model</h2><p>${(settings.models || []).map((model) => `<span class="pill">${escapeHtml(model.label)}</span>`).join(' ')}</p><p class="muted">Free plans stay on local models. There is no silent paid fallback.</p></section>
    <section class="panel"><h2>Usage</h2><p>${settings.usage?.connected ? 'Ledger connected' : 'Paid calls are blocked until the ledger is connected.'}</p></section>
    <section class="panel"><h2>Sign-up policy</h2><p>Prefer Google: ${settings.signup_policy?.prefer_google !== false ? 'yes' : 'no'}</p></section>
  </main>`)
}

async function renderAdmin() {
  const overview = await get('/v1/admin/overview')
  frame(`<main class="page"><h1>Admin</h1>
    <section class="panel"><h2>Spend</h2><p>${overview.data?.paid_calls === 'blocked' ? 'Fail closed. The AI ledger is not connected, so paid models cannot run.' : 'Spend gate is connected.'}</p></section>
    <section class="panel"><h2>Sites</h2><p class="muted">Permissions were not re-checked. None of these connectors are verified.</p>
      ${(overview.data?.sites || []).map((site) => `<p>${escapeHtml(site.name)} <small>${escapeHtml((site.domains || []).join(', ') || 'domain not confirmed')}</small></p>`).join('')}
    </section>
    <section class="panel"><h2>Audit</h2><p>${(overview.data?.audit || []).length} events</p></section>
    <section class="panel"><h2>Information used</h2>
      <form id="info-filter" class="row">
        <input id="filter-bot" type="text" placeholder="Bot" />
        <input id="filter-tool" type="text" placeholder="Tool" />
        <input id="filter-source" type="text" placeholder="Source" />
        <button class="primary" type="submit">Filter</button>
      </form>
      <div id="admin-info"></div>
    </section>
  </main>`)
  const form = document.querySelector('#info-filter')
  if (!form) return
  form.onsubmit = async (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    const bot = document.querySelector('#filter-bot').value.trim()
    const tool = document.querySelector('#filter-tool').value.trim()
    const source = document.querySelector('#filter-source').value.trim()
    if (bot) params.set('bot_id', bot)
    if (tool) params.set('tool', tool)
    if (source) params.set('source', source)
    const rows = await get('/v1/admin/information-use?' + params.toString())
    document.querySelector('#admin-info').innerHTML =
      (rows.data || [])
        .map(
          (entry) =>
            `<p>${escapeHtml(entry.bot_id)} · ${escapeHtml(entry.tools.join(', '))} · ${escapeHtml(entry.sources.map((item) => item.ref).join(', '))}</p>`
        )
        .join('') || '<p class="muted">No matching records.</p>'
  }
}

async function get(path) {
  const response = await fetch(path, { headers: authHeaders() })
  const json = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, data: json.data, error: json.error }
}

async function send(method, path, body) {
  const response = await fetch(path, {
    method,
    headers: { ...authHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  })
  const json = await response.json().catch(() => ({}))
  return { ok: response.ok, data: json.data, error: json.error }
}

function authHeaders() {
  return state.token ? { authorization: `Bearer ${state.token}` } : {}
}

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
  )
}
