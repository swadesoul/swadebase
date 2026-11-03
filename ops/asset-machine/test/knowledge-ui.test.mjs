import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../public/knowledge.js', import.meta.url), 'utf8');
const raw = JSON.parse(readFileSync(new URL('../public/knowledge-base.json', import.meta.url), 'utf8'));
const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
function instance(fetch = async () => ({ok:true, json:async () => raw})) {
  const window = {fetch, document:{title:'Asset Machine'}, requestAnimationFrame:fn => fn(), matchMedia:() => ({matches:true})};
  vm.runInNewContext(code, {window, URL, Intl, Date});
  return {api:window.AssetKnowledge, window};
}
function container() {
  const nodes = new Map();
  return {innerHTML:'', querySelector(selector) {
    if (!nodes.has(selector)) nodes.set(selector, {value:'', textContent:'', innerHTML:'', focus(){this.focused=true;}, scrollIntoView(){}});
    return nodes.get(selector);
  }, querySelectorAll:() => []};
}

test('public knowledge projection ignores operator articles and their exclusive sources', () => {
  const {api} = instance();
  const data = api.publicData({...raw, articles:[...raw.articles, {id:'AM-OPERATIONS-999', audience:'operator', title:'PRIVATE_OPERATOR_CANARY', body_markdown:'Internal procedures', topic_ids:['operations'], source_ids:['O99']}], sources:[...raw.sources, {id:'O99', title:'PRIVATE_SOURCE_CANARY', url:'https://example.com/private'}]});
  assert.equal(data.articles.length, 52);
  assert.doesNotMatch(JSON.stringify(data), /PRIVATE_OPERATOR_CANARY|PRIVATE_SOURCE_CANARY|Internal procedures/);
  assert.equal(data.taxonomy.length, 9);
  assert.equal(new Set(data.articles.map(a => a.id)).size, data.articles.length);
});

test('search covers reference text and aliases, while topic filters stay scoped', () => {
  const {api} = instance(), data = api.publicData(raw);
  assert.ok(api.searchArticles(data, 'MT799').some(a => /SBLC/.test(a.title)));
  assert.ok(api.searchArticles(data, 'safekeeping receipt', 'skr').some(a => a.id === 'AM-BANK-INSTRUMENTS-003'));
  assert.ok(api.searchArticles(data, '', 'gems').length >= 4);
  assert.ok(api.searchArticles(data, '', 'gems').every(a => a.topic_ids.includes('gems')));
  assert.equal(api.searchArticles(data, 'unfindable-phrase-zxy987').length, 0);
  assert.equal(api.searchArticles(data).length, 52);
});

test('renderer escapes raw HTML, blocks unsafe links, and resolves safe citations', () => {
  const {api} = instance();
  const source = {id:'F01', title:'A source " onmouseover="alert(1)', url:'https://example.com/reference'};
  const html = api.renderMarkdown('# Heading\n\n<img src=x onerror=alert(1)> <script>alert(1)</script>\n\n[unsafe](javascript:alert(1)) [bad](data:text/html,hello) [credentials](https://user:password@example.com/) [safe](https://example.com/) [F01]\n\n**Evidence** and `code <svg onload=x>`\n\n| Item | Limit |\n|---|---|\n| **Gold** | Scope [F01] |\n\n```js\n<script>unsafe()</script>\n```', [source]);
  assert.match(html, /&lt;img/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<img|<script|<svg|href="javascript:|href="data:|href="https:\/\/user:password| onmouseover="/);
  assert.match(html, /href="https:\/\/example\.com\/reference"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /<strong>Evidence<\/strong>/);
  assert.match(html, /<table>/);
  assert.match(html, /scope="col"/);
  assert.match(html, /<pre><code>/);
  const unsafeCitation = api.renderMarkdown('Do not trust [F02]', [{id:'F02', title:'Unsafe', url:'javascript:alert(1)'}]);
  assert.doesNotMatch(unsafeCitation, /<a|href=/);
});

test('renderer preserves ordered and nested lists, escaped pipes and unique heading IDs', () => {
  const {api} = instance();
  const rendered = api.renderDocument('### First\n\n1. Parent\n   - Child **detail**\n2. Next\n\n### Second\n\n| A | B |\n|---|---|\n| x\\|y | `a|b` |');
  assert.match(rendered.html, /<ol>/);
  assert.match(rendered.html, /<ul>/);
  assert.match(rendered.html, /Child <strong>detail<\/strong>/);
  assert.match(rendered.html, />x\|y<\/td>/);
  assert.match(rendered.html, /<code>a\|b<\/code>/);
  assert.equal(new Set(rendered.headings.map(h => h.id)).size, 2);
  assert.match(rendered.html, /<h2 id="kb-heading-0"/);
});

test('article downloads contain full content, research scope and valid source definitions', () => {
  const {api} = instance(), data = api.publicData(raw), article = data.articles.find(a => a.id === 'AM-FOUNDATIONS-003');
  const md = api.articleExport(article, data), text = api.articleExport(article, data, 'text');
  assert.ok(md.includes(article.body_markdown));
  assert.match(md, /Research date: 2026-11-03/);
  assert.match(md, /\[F01\]: <https:\/\/[^>]+> "[^"\n]+"/);
  assert.match(md, /#knowledge\/article\/AM-FOUNDATIONS-003/);
  assert.match(text, /Sources\n/);
  assert.match(text, /https:\/\//);
  assert.doesNotMatch(text, /PRIVATE_OPERATOR_CANARY/);
});

test('deep links are explicit; malformed routes never fall through to another article', () => {
  const {api} = instance();
  assert.equal(api.parseRoute('#knowledge').kind, 'browse');
  assert.equal(api.parseRoute('knowledge/topic/skr').topic, 'skr');
  assert.equal(api.parseRoute('knowledge/article/AM-BANK-INSTRUMENTS-003').id, 'AM-BANK-INSTRUMENTS-003');
  for (const value of ['knowledge/topic/operations', 'knowledge/article/../../private', 'knowledge/article/<script>', 'knowledge/anything', 'case/123']) assert.equal(api.parseRoute(value).kind, 'invalid');
});

test('leaving a loading library prevents late content and focus changes', async () => {
  let finish;
  const deferred = new Promise(resolve => {finish=resolve;});
  const {api, window} = instance(() => deferred), root = container();
  const request = api.show(root, 'knowledge');
  api.cancel();
  root.innerHTML = 'Current voice page';
  finish({ok:true, json:async () => raw});
  await request;
  assert.equal(root.innerHTML, 'Current voice page');
  assert.equal(window.document.title, 'Asset Machine');
  assert.doesNotMatch(app, /await showKnowledge\(hash\);window\.scrollTo/);
});

test('failed loading offers a working retry; later navigation replaces the older request', async () => {
  let calls = 0;
  const {api} = instance(async () => { calls++; if (calls === 1) throw Error('Temporary failure'); return {ok:true, json:async () => raw}; });
  const root = container();
  await api.show(root, 'knowledge/topic/skr');
  assert.match(root.innerHTML, /library could not load/);
  await root.querySelector('#kb-retry').onclick();
  assert.match(root.innerHTML, /Search the knowledge base/);
  assert.match(root.querySelector('#kb-results').innerHTML, /SKRs/);
  assert.equal(calls, 2);
  let finish;
  const delayed = instance(() => new Promise(resolve => {finish=resolve;})), other = container();
  const first = delayed.api.show(other, 'knowledge/article/AM-FOUNDATIONS-001');
  const second = delayed.api.show(other, 'knowledge/article/AM-BANK-INSTRUMENTS-003');
  finish({ok:true, json:async () => raw});
  await Promise.all([first, second]);
  assert.match(other.innerHTML, /SKRs: verify the custody relationship/);
  assert.doesNotMatch(other.innerHTML, /<h1[^>]*>Purpose and scope/);
});

test('integration retains starter routes and publishes links with fresh script versions', () => {
  assert.match(app, /hash==='learn'\|\|hash\.startsWith\('learn\/'\)/);
  assert.match(app, /window\.AssetKnowledge\.show/);
  assert.match(index, /knowledge\.js\?v=kb20261103/);
  assert.match(index, /public-voice\.js\?v=kb20261103/);
  assert.ok(index.indexOf('knowledge.js') < index.indexOf('app.js'));
  assert.match(code, /evidence-checklists\.csv/);
  assert.match(code, /credentials:'omit'/);
});
