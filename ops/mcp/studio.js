const element = id => document.getElementById(id);
let offset = 0, nextOffset = null, busy = false;
const money = value => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(4) : 'Unavailable';
function cell(row, value) { const td = document.createElement('td'); td.textContent = value ?? 'Not recorded'; row.append(td); }
function render(data) {
  const inventory = data.inventory;
  element('inventory-summary').textContent = `${inventory.total} registered adapters; ${inventory.enabled} enabled. Showing ${inventory.adapters.length} from position ${offset + 1}.`;
  element('coverage').replaceChildren();
  for (const note of Object.values(data.coverage)) { const li = document.createElement('li'); li.textContent = note; element('coverage').append(li); }
  element('adapters').replaceChildren();
  for (const adapter of inventory.adapters) {
    const row = document.createElement('tr'); cell(row, adapter.name); cell(row, adapter.owner_site);
    cell(row, `${adapter.registry_status} · ${adapter.enabled ? 'enabled' : 'disabled'}`); cell(row, 'Not attached'); element('adapters').append(row);
  }
  element('rates').replaceChildren();
  for (const rate of data.rates.items) { const row = document.createElement('tr'); cell(row, `${rate.provider} / ${rate.model || 'default'}`); cell(row, money(rate.usd)); cell(row, rate.per); cell(row, rate.verified ? 'Recorded verification' : 'Unverified'); element('rates').append(row); }
  const usage = data.usage;
  element('project-costs').replaceChildren();
  if (usage.status === 'available') {
    element('usage-summary').textContent = `${usage.totals?.calls ?? 'Unknown'} recorded calls · USD ${money(usage.totals?.cost_usd)} recorded cost · ${usage.totals?.unpriced_calls ?? 'Unknown'} unpriced · ${usage.totals?.blocked_calls ?? 'Unknown'} blocked.`;
    for (const item of usage.by_project || []) { const row = document.createElement('tr'); cell(row, item.project); cell(row, item.calls); cell(row, money(item.cost_usd)); element('project-costs').append(row); }
  } else element('usage-summary').textContent = usage.note;
  element('rate-summary').textContent = data.rates.status === 'available' ? `${data.rates.total} existing rate-card entries; ${data.rates.items.filter(rate => rate.verified).length} verified among the first ${data.rates.items.length} listed here.` : data.rates.note;
  nextOffset = inventory.next_offset;
  element('studio-state').textContent = `Read-only snapshot: ${new Date(data.generated_at).toLocaleString()}.`;
}
async function load() {
  if (busy) return; busy = true;
  element('previous').disabled = true; element('next-page').disabled = true;
  element('studio-state').textContent = 'Loading registered connections and recorded usage…';
  try {
    const response = await fetch(`/adapters/api/mcp-connect/studio?offset=${offset}&limit=20&period=${encodeURIComponent(element('period').value)}`, { credentials: 'same-origin', cache: 'no-store' });
    const result = await response.json(); if (!response.ok || !result.ok) throw Error('Owner access or Studio data is unavailable.'); render(result.data);
  } catch (error) {
    // Clear the previous snapshot so failed refreshes never present stale success.
    nextOffset = null; element('adapters').replaceChildren(); element('project-costs').replaceChildren();
    element('inventory-summary').textContent = 'Inventory unavailable.'; element('usage-summary').textContent = 'Recorded usage unavailable.';
    element('rate-summary').textContent = ''; element('rates').replaceChildren(); element('coverage').replaceChildren(); element('studio-state').textContent = error.message;
  } finally { busy = false; element('previous').disabled = offset === 0; element('next-page').disabled = nextOffset === null; }
}
element('usage-filter').addEventListener('submit', event => { event.preventDefault(); offset = 0; load(); });
element('previous').addEventListener('click', () => { if (!busy) { offset = Math.max(0, offset - 20); load(); } });
element('next-page').addEventListener('click', () => { if (!busy && nextOffset !== null) { offset = nextOffset; load(); } });
load();
