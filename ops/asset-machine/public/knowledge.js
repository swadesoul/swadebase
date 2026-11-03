/* Public educational reference only. This module never reads private project state. */
(function (host) {
  'use strict';
  const TOPICS = ['proof', 'bonds', 'skr', 'sblc', 'inheritance', 'gold', 'gems', 'wallets', 'tokenization'];
  const SHORT_NAMES = {proof:'Proof & evidence', bonds:'Bonds', skr:'SKRs', sblc:'SBLCs', inheritance:'Inheritance', gold:'Gold', gems:'Gems', wallets:'Wallets', tokenization:'Tokenization'};
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const normalize = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const titleText = value => String(value ?? '').replace(/^(?:[A-Z]\d+\.?|\d+\.)\s+/, '');
  let pending = null, dataURL = '', generation = 0, originalTitle = null;
  const browseState = {query:'', topic:'all'};

  function safeURL(value) {
    try {
      const u = new URL(String(value));
      return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : '';
    } catch { return ''; }
  }
  function externalLink(label, url, attributes = '') {
    const href = safeURL(url);
    return href ? `<a href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer"${attributes}>${label}</a>` : label;
  }
  function sourceMap(sources) { return new Map((sources || []).map(s => [s.id, s])); }
  function inline(text, sources, depth = 0, links = true) {
    if (depth > 6) return escapeHTML(text);
    const tokens = /`[^`\n]+`|\[[^\]\n]+\]\([^\n)]+\)|\[[A-Z]\d+\]|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_/g;
    let html = '', position = 0, match;
    while ((match = tokens.exec(String(text)))) {
      html += escapeHTML(String(text).slice(position, match.index));
      const token = match[0];
      if (token.startsWith('`')) html += `<code>${escapeHTML(token.slice(1, -1))}</code>`;
      else if (token.startsWith('[') && token.includes('](')) {
        const parts = /^\[([^\]]+)\]\((\S+?)(?:\s+["'][^"']*["'])?\)$/.exec(token);
        html += parts ? (links ? externalLink(inline(parts[1], sources, depth + 1, false), parts[2]) : inline(parts[1], sources, depth + 1, false)) : escapeHTML(token);
      } else if (token.startsWith('[')) {
        const source = sources.get(token.slice(1, -1));
        html += source && links ? externalLink(escapeHTML(token), source.url, ` class="kb-citation" title="${escapeHTML(source.title)}" aria-label="${escapeHTML('Source ' + source.id + ': ' + source.title)}"`) : escapeHTML(token);
      } else if (token.startsWith('**') || token.startsWith('__')) html += `<strong>${inline(token.slice(2, -2), sources, depth + 1, links)}</strong>`;
      else html += `<em>${inline(token.slice(1, -1), sources, depth + 1, links)}</em>`;
      position = match.index + token.length;
    }
    return html + escapeHTML(String(text).slice(position));
  }
  function tableCells(line) {
    const text = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    const cells = []; let cell = '', code = false;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\\' && text[i + 1] === '|') { cell += '|'; i++; }
      else if (text[i] === '`') { code = !code; cell += text[i]; }
      else if (text[i] === '|' && !code) { cells.push(cell.trim()); cell = ''; }
      else cell += text[i];
    }
    cells.push(cell.trim()); return cells;
  }
  const listLine = line => /^(\s*)([-+*]|\d+[.)])\s+(.*)$/.exec(line);
  const isTable = (lines, i) => lines[i]?.includes('|') && lines[i + 1]?.includes('|') && tableCells(lines[i + 1]).every(c => /^:?-{3,}:?$/.test(c));
  function renderDocument(markdown, sourceList = []) {
    const sources = sourceList instanceof Map ? sourceList : sourceMap(sourceList), headings = [];
    const text = String(markdown ?? '').replace(/\r\n?/g, '\n');
    const levels = [...text.matchAll(/^\s{0,3}(#{1,6})\s+/gm)].map(m => m[1].length);
    const firstLevel = levels.length ? Math.min(...levels) : 2;
    function blocks(lines, depth = 0) {
      if (depth > 12) return `<p>${escapeHTML(lines.join('\n'))}</p>`;
      let html = '', i = 0;
      while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i++; continue; }
        const fence = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
        if (fence) {
          const content = []; i++;
          while (i < lines.length && !new RegExp('^\\s{0,3}' + fence[1][0] + '{' + fence[1].length + ',}\\s*$').test(lines[i])) content.push(lines[i++]);
          if (i < lines.length) i++;
          html += `<pre><code>${escapeHTML(content.join('\n'))}</code></pre>`; continue;
        }
        const heading = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
        if (heading) {
          const level = Math.min(6, Math.max(2, heading[1].length - firstLevel + 2));
          const id = 'kb-heading-' + headings.length;
          headings.push({id, text:plainText(heading[2])});
          html += `<h${level} id="${id}" tabindex="-1">${inline(heading[2], sources)}</h${level}>`; i++; continue;
        }
        if (/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) { html += '<hr>'; i++; continue; }
        if (isTable(lines, i)) {
          const headers = tableCells(line), align = tableCells(lines[i + 1]); i += 2;
          const cell = (value, tag, col) => `<${tag}${tag === 'th' ? ' scope="col"' : ''} class="${align[col]?.endsWith(':') ? (align[col].startsWith(':') ? 'kb-align-center' : 'kb-align-right') : 'kb-align-left'}">${inline(value, sources)}</${tag}>`;
          html += `<div class="kb-table-wrap" role="region" tabindex="0" aria-label="Reference table"><table><thead><tr>${headers.map((h, col) => cell(h, 'th', col)).join('')}</tr></thead><tbody>`;
          while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
            const values = tableCells(lines[i++]);
            html += `<tr>${headers.map((_, col) => cell(values[col] || '', 'td', col)).join('')}</tr>`;
          }
          html += '</tbody></table></div>'; continue;
        }
        if (/^\s{0,3}>/.test(line)) {
          const quote = [];
          while (i < lines.length && /^\s{0,3}>/.test(lines[i])) quote.push(lines[i++].replace(/^\s{0,3}>\s?/, ''));
          html += `<blockquote>${blocks(quote, depth + 1)}</blockquote>`; continue;
        }
        const first = listLine(line);
        if (first) {
          const indent = first[1].length, ordered = /^\d/.test(first[2]), tag = ordered ? 'ol' : 'ul';
          html += `<${tag}${ordered && parseInt(first[2], 10) !== 1 ? ` start="${parseInt(first[2], 10)}"` : ''}>`;
          while (i < lines.length) {
            const item = listLine(lines[i]);
            if (!item || item[1].length !== indent || /^\d/.test(item[2]) !== ordered) break;
            const content = [item[3]]; i++;
            while (i < lines.length) {
              const next = listLine(lines[i]);
              if (next && next[1].length <= indent) break;
              if (!lines[i].trim()) {
                const following = listLine(lines[i + 1] || '');
                if (following && following[1].length === indent) { i++; break; }
                if (!(lines[i + 1] || '').startsWith(' '.repeat(indent + 2))) break;
              }
              if (lines[i].trim() && !/^\s/.test(lines[i])) break;
              const continuation = lines[i++];
              content.push(continuation.slice(Math.min(indent + 2, continuation.match(/^\s*/)[0].length)));
            }
            html += `<li>${blocks(content, depth + 1)}</li>`;
          }
          html += `</${tag}>`; continue;
        }
        const paragraph = [line]; i++;
        while (i < lines.length && lines[i].trim() && !/^\s{0,3}(?:#{1,6}\s|>|`{3,}|~{3,})/.test(lines[i]) && !listLine(lines[i]) && !isTable(lines, i) && !/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(lines[i])) paragraph.push(lines[i++]);
        html += `<p>${inline(paragraph.join(' '), sources)}</p>`;
      }
      return html;
    }
    return {html:blocks(text.split('\n')), headings};
  }
  function plainText(value) {
    return String(value ?? '').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1').replace(/^\s{0,3}#{1,6}\s+/gm, '').replace(/\*\*|__|`/g, '').replace(/(^|\s)\*([^*]+)\*(?=\s|[.,;:]|$)/g, '$1$2');
  }
  function publicData(raw) {
    if (!raw || !Array.isArray(raw.articles) || !Array.isArray(raw.sources)) throw Error('Invalid knowledge library.');
    const articles = raw.articles.filter(a => a.audience === 'public_education' && typeof a.id === 'string' && /^[A-Z0-9-]+$/.test(a.id) && typeof a.body_markdown === 'string').map(a => ({
      id:a.id, title:String(a.title || a.id), body_markdown:a.body_markdown, topic_ids:(a.topic_ids || []).filter(t => TOPICS.includes(t)),
      source_ids:(a.source_ids || []).filter(s => typeof s === 'string'), research_date:a.research_date || raw.research_date || '',
      jurisdiction_scope:String(a.jurisdiction_scope || ''), word_count:Number(a.word_count) || a.body_markdown.split(/\s+/).length
    }));
    if (!articles.length) throw Error('No public articles are available.');
    const usedSources = new Set(articles.flatMap(a => a.source_ids));
    const sources = raw.sources.filter(s => usedSources.has(s.id)).map(s => ({id:String(s.id), title:String(s.title || s.id), publisher:String(s.publisher || ''), url:safeURL(s.url), accessed:String(s.accessed || s.retrieved_at || '')}));
    const taxonomy = TOPICS.map(id => (raw.taxonomy || []).find(t => t.id === id)).filter(Boolean).map(t => ({id:t.id, name:String(t.name || SHORT_NAMES[t.id]), aliases:(t.aliases || []).map(String)}));
    return {articles, sources, taxonomy, version:String(raw.version || ''), research_date:String(raw.research_date || '')};
  }
  function parseRoute(hash) {
    const path = String(hash || '').replace(/^#/, '').split('/');
    if (path[0] !== 'knowledge') return {kind:'invalid'};
    if (path.length === 1) return {kind:'browse', topic:'all'};
    if (path.length === 3 && path[1] === 'topic' && TOPICS.includes(path[2])) return {kind:'browse', topic:path[2]};
    if (path.length === 3 && path[1] === 'article' && /^[A-Z0-9-]+$/.test(path[2])) return {kind:'article', id:path[2]};
    return {kind:'invalid'};
  }
  function searchArticles(data, query = '', topic = 'all') {
    const terms = [...new Set(normalize(String(query).slice(0, 200)).split(' ').filter(Boolean))];
    return data.articles.map((article, order) => {
      if (topic !== 'all' && !article.topic_ids.includes(topic)) return null;
      const aliases = article.topic_ids.flatMap(t => { const info = data.taxonomy.find(x => x.id === t); return [t, info?.name, ...(info?.aliases || [])]; }).join(' ');
      const title = normalize(article.title), body = normalize(article.body_markdown), topics = normalize(aliases), all = title + ' ' + body + ' ' + topics;
      if (!terms.every(t => all.includes(t))) return null;
      const score = terms.reduce((sum, t) => sum + (title.includes(t) ? 6 : 0) + (topics.includes(t) ? 3 : 0) + (body.includes(t) ? 1 : 0), 0);
      return {article, score, order};
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.order - b.order).map(r => r.article);
  }
  function dateLabel(value) {
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + 'T00:00:00Z') : null;
    return iso && !Number.isNaN(iso.valueOf()) ? new Intl.DateTimeFormat('en-US', {dateStyle:'long', timeZone:'UTC'}).format(iso) : 'Date not recorded';
  }
  function excerpt(article) {
    const paragraphs = article.body_markdown.split(/\n\s*\n/);
    const first = paragraphs.find(p => !/^\s*[#|>*-]/.test(p)) || paragraphs[0] || '';
    const text = plainText(first).replace(/\[[A-Z]\d+\]/g, '').replace(/\s+/g, ' ').trim();
    return text.length > 190 ? text.slice(0, 187).replace(/\s+\S*$/, '') + '…' : text;
  }
  function articleSources(article, data) { const ids = new Set(article.source_ids); return data.sources.filter(s => ids.has(s.id)); }
  function articleExport(article, data, format = 'markdown') {
    const sources = articleSources(article, data);
    const body = format === 'text' ? plainText(article.body_markdown) : article.body_markdown;
    const sourceText = sources.map(s => {
      const title = s.title + (s.publisher ? ' — ' + s.publisher : '');
      return format === 'text' ? `[${s.id}] ${title}\n${s.url || 'Link unavailable'}` : (s.url ? `[${s.id}]: <${s.url}> "${title.replace(/"/g, '&quot;')}"` : `[${s.id}] ${title} — Link unavailable`);
    }).join('\n\n');
    return `${format === 'text' ? '' : '# '}Asset Machine — ${article.title}\n\nResearch date: ${article.research_date}\nVersion: ${data.version}\n${article.jurisdiction_scope ? 'Scope: ' + article.jurisdiction_scope + '\n' : ''}Educational reference; reading this article does not verify a particular asset.\n\n${body}\n\n${format === 'text' ? '' : '## '}Sources\n\n${sourceText}\n\nhttps://assetmachine.live/#knowledge/article/${article.id}\n`;
  }
  function card(article) {
    return `<a class="kb-card" href="#knowledge/article/${escapeHTML(article.id)}"><span class="kb-card-topic">${article.topic_ids.map(t => escapeHTML(SHORT_NAMES[t])).join(' · ')}</span><h3>${escapeHTML(titleText(article.title))}</h3><p>${escapeHTML(excerpt(article))}</p><span class="kb-card-foot">${Math.max(1, Math.ceil(article.word_count / 220))} min read <span aria-hidden="true">↗</span></span></a>`;
  }
  function focusTitle(container, token) {
    const focus = () => { if (token === generation) container.querySelector('#kb-page-title')?.focus({preventScroll:true}); };
    if (host.requestAnimationFrame) host.requestAnimationFrame(focus); else focus();
  }
  function setTitle(title) {
    if (!host.document) return;
    if (originalTitle === null) originalTitle = host.document.title;
    host.document.title = title + ' — Asset Machine';
  }
  function renderBrowse(container, data, route, token) {
    browseState.topic = route.topic;
    const totalSources = new Set(data.sources.map(s => s.url).filter(Boolean)).size;
    container.innerHTML = `<div class="knowledge-shell"><header class="kb-intro"><p class="eyebrow">ASSET MACHINE / THE KNOWLEDGE BASE</p><h1 id="kb-page-title" tabindex="-1">Understand the asset.<br><em>Examine the evidence.</em></h1><p class="kb-intro-copy">Explore bonds, SKRs, SBLCs, inherited documents, gold, gems, wallets and tokenization. Learn what each kind of evidence can establish and which questions still need an answer.</p><div class="kb-meta"><span>${data.articles.length} articles</span><span>${totalSources} primary source links</span><span>Research: ${escapeHTML(dateLabel(data.research_date))}</span></div><p class="fine">Educational reference. For a short introduction in plain language or professional terms, <a href="#learn">start with the introductory guides ↗</a>.</p><a class="button outline mini" href="${escapeHTML((data.base || '/adapters/asset-machine') + '/evidence-checklists.csv')}" download="Asset_Machine_Evidence_Checklists.csv">Download evidence checklists ↓</a></header><form id="kb-search-form" class="kb-search-form" role="search"><label for="kb-search">Search the knowledge base</label><div class="kb-search-row"><input id="kb-search" type="search" maxlength="200" placeholder="Try SKR, MT799, inherited bond, assay or token backing" autocomplete="off" aria-describedby="kb-search-help" value="${escapeHTML(browseState.query)}"><button class="outline mini" type="reset">Clear</button></div><p id="kb-search-help" class="fine">Searches article titles, reference text and topic terms.</p></form><nav class="kb-topics" aria-label="Knowledge topics"><a href="#knowledge"${route.topic === 'all' ? ' aria-current="page"' : ''}>All topics <span>${data.articles.length}</span></a>${TOPICS.map(t => `<a href="#knowledge/topic/${t}"${route.topic === t ? ' aria-current="page"' : ''}>${escapeHTML(SHORT_NAMES[t])} <span>${data.articles.filter(a => a.topic_ids.includes(t)).length}</span></a>`).join('')}</nav><div class="kb-results-heading"><h2 data-help-subject="${route.topic}">${route.topic === 'all' ? 'Explore the library' : escapeHTML(data.taxonomy.find(t => t.id === route.topic)?.name || SHORT_NAMES[route.topic])}</h2><p id="kb-results-status" role="status" aria-live="polite"></p></div><div id="kb-results" class="kb-grid"></div><p class="kb-library-scope fine">Sources have their own dates, purposes and jurisdictions. A document, laboratory report or ledger record supports only the facts within its scope. Reading an article does not authenticate, value or finance an asset.</p></div>`;
    const search = container.querySelector('#kb-search'), form = container.querySelector('#kb-search-form');
    const draw = () => {
      const matches = searchArticles(data, browseState.query, browseState.topic);
      container.querySelector('#kb-results-status').textContent = `${matches.length} article${matches.length === 1 ? '' : 's'}${browseState.query.trim() ? ' matching your search' : ''}`;
      container.querySelector('#kb-results').innerHTML = matches.length ? matches.map(card).join('') : '<div class="kb-empty"><h3>No articles match those terms.</h3><p>Try fewer words, clear the search, or choose another topic.</p><a class="button outline" href="#knowledge">Browse all topics ↗</a></div>';
    };
    search.oninput = () => { browseState.query = search.value.slice(0, 200); draw(); };
    form.onsubmit = e => { e.preventDefault(); draw(); };
    form.onreset = e => { e.preventDefault(); browseState.query = ''; search.value = ''; draw(); search.focus(); };
    draw(); setTitle('Knowledge base'); focusTitle(container, token);
  }
  function renderArticle(container, data, article, options, token) {
    const sources = articleSources(article, data), rendered = renderDocument(article.body_markdown, sources);
    const related = data.articles.filter(a => a.id !== article.id && a.topic_ids.some(t => article.topic_ids.includes(t))).slice(0, 3);
    const back = browseState.topic === 'all' ? '#knowledge' : '#knowledge/topic/' + browseState.topic;
    container.innerHTML = `<div class="knowledge-shell kb-reading"><nav class="kb-breadcrumbs" aria-label="Article navigation"><a href="${back}">← Knowledge base</a><a href="#learn">Introductory guides ↗</a></nav><header class="kb-article-header"><p class="eyebrow">${article.topic_ids.map(t => escapeHTML(SHORT_NAMES[t])).join(' / ')}</p><h1 id="kb-page-title" tabindex="-1">${escapeHTML(titleText(article.title))}</h1><div class="kb-meta"><span>Research: ${escapeHTML(dateLabel(article.research_date))}</span><span>${Math.max(1, Math.ceil(article.word_count / 220))} min read</span><span>${sources.length} source${sources.length === 1 ? '' : 's'}</span></div><div class="kb-article-tools"><button id="kb-download-md" class="outline mini" type="button">Download article .md ↓</button><button id="kb-download-text" class="outline mini" type="button">Save plain text ↓</button><a class="button outline mini" href="#ask-asset-machine">Ask Asset Machine ↗</a></div><p class="fine">Educational reference. This article does not establish the authenticity, ownership or value of a particular asset.</p></header><div class="kb-reading-layout"><article class="kb-article" aria-label="${escapeHTML(titleText(article.title))}"><div class="kb-prose">${rendered.html}</div><section class="kb-source-section" aria-labelledby="kb-sources-title"><p class="eyebrow">FOLLOW THE EVIDENCE</p><h2 id="kb-sources-title" tabindex="-1">Sources and scope</h2>${article.jurisdiction_scope ? `<p>${escapeHTML(article.jurisdiction_scope)}</p>` : ''}<p class="fine">Source links support the cited statements within their stated scope. The research date is not an independent confirmation of any holding.</p>${sources.length ? `<ol class="kb-sources">${sources.map(s => `<li><span class="kb-source-id">[${escapeHTML(s.id)}]</span><div>${externalLink(escapeHTML(s.title) + ' ↗', s.url)}<p>${escapeHTML(s.publisher)}${s.accessed ? ' · Accessed ' + escapeHTML(dateLabel(s.accessed)) : ''}</p></div></li>`).join('')}</ol>` : '<p>This section introduces the library’s review approach. Follow the source-linked articles for the underlying references.</p>'}</section></article><aside class="kb-reading-aside"><nav class="kb-on-page" aria-label="In this article"><p class="tiny">IN THIS ARTICLE</p>${rendered.headings.map(h => `<button type="button" data-kb-target="${h.id}">${escapeHTML(h.text)}</button>`).join('')}<button type="button" data-kb-target="kb-sources-title">Sources and scope</button></nav><div class="kb-reading-topics"><p class="tiny">CONTINUE EXPLORING</p>${article.topic_ids.map(t => `<a href="#knowledge/topic/${t}">${escapeHTML(SHORT_NAMES[t])} ↗</a>`).join('')}<a href="#knowledge">All topics ↗</a></div></aside></div>${related.length ? `<section class="kb-related" aria-labelledby="kb-related-title"><p class="eyebrow">KEEP READING</p><h2 id="kb-related-title">Related reference</h2><div class="kb-grid">${related.map(card).join('')}</div></section>` : ''}</div>`;
    container.querySelector('#kb-download-md').onclick = () => options.download?.('asset-machine-' + article.id.toLowerCase() + '.md', articleExport(article, data), 'text/markdown;charset=utf-8');
    container.querySelector('#kb-download-text').onclick = () => options.download?.('asset-machine-' + article.id.toLowerCase() + '.txt', articleExport(article, data, 'text'), 'text/plain;charset=utf-8');
    container.querySelectorAll('[data-kb-target]').forEach(button => { button.onclick = () => {
      const target = container.querySelector('#' + button.dataset.kbTarget);
      target?.focus({preventScroll:true});
      target?.scrollIntoView({block:'start', behavior:host.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    }; });
    setTitle(titleText(article.title)); focusTitle(container, token);
  }
  function renderMissing(container, token) {
    container.innerHTML = '<div class="knowledge-shell kb-empty"><p class="eyebrow">ASSET MACHINE / KNOWLEDGE BASE</p><h1 id="kb-page-title" tabindex="-1">Article not found.</h1><p>This link does not identify a public article in the current library.</p><a class="button primary" href="#knowledge">Open the knowledge base ↗</a></div>';
    setTitle('Article not found'); focusTitle(container, token);
  }
  // One public-data cache shared by the library page and contextual help drawer.
  function load(options = {}) {
    const url = (options.base || '/adapters/asset-machine') + '/knowledge-base.json?v=kb20261103';
    if (!pending || dataURL !== url) {
      dataURL = url;
      pending = host.fetch(url, {credentials:'omit', cache:'no-cache'}).then(response => {
        if (!response.ok) throw Error('Knowledge library request failed.');
        return response.json();
      }).then(publicData).catch(error => { pending = null; throw error; });
    }
    return pending;
  }
  async function show(container, hash, options = {}) {
    const token = ++generation, route = parseRoute(hash);
    if (route.kind === 'invalid') { renderMissing(container, token); return; }
    container.innerHTML = '<div class="knowledge-shell kb-loading" role="status"><p class="eyebrow">ASSET MACHINE / KNOWLEDGE BASE</p><h2>Opening the reference library…</h2><p>Loading the published articles and source links.</p></div>';
    try {
      const data = await load(options);
      if (token !== generation) return;
      if (route.kind === 'article') {
        const article = data.articles.find(a => a.id === route.id);
        if (article) renderArticle(container, data, article, options, token); else renderMissing(container, token);
      } else renderBrowse(container, data, route, token);
    } catch {
      if (token !== generation) return;
      container.innerHTML = '<div class="knowledge-shell kb-empty"><p class="eyebrow">ASSET MACHINE / KNOWLEDGE BASE</p><h1 id="kb-page-title" tabindex="-1">The library could not load.</h1><p>Please retry. The introductory guides are also available.</p><div class="actions"><button id="kb-retry" class="primary" type="button">Try again ↗</button><a class="button outline" href="#learn">Open introductory guides ↗</a></div></div>';
      container.querySelector('#kb-retry').onclick = () => show(container, hash, options);
      setTitle('Knowledge base'); focusTitle(container, token);
    }
  }
  function cancel() { generation++; if (originalTitle !== null && host.document) host.document.title = originalTitle; }
  host.AssetKnowledge = Object.freeze({show, cancel, load, publicData, parseRoute, searchArticles, renderDocument, renderMarkdown:(text, sources) => renderDocument(text, sources).html, articleExport, safeURL});
})(typeof window !== 'undefined' ? window : globalThis);
