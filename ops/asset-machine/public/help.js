/* Public, contextual education. This module never reads form values or private APIs. */
(function (host) {
  'use strict';
  const BASE = '/adapters/asset-machine';
  const VERSION = 'help20261103';
  const TOPICS = ['proof', 'bonds', 'skr', 'sblc', 'inheritance', 'gold', 'gems', 'wallets', 'tokenization'];
  const NAMES = {proof:'Proof & evidence', bonds:'Bonds', skr:'SKRs', sblc:'SBLCs', inheritance:'Inheritance', gold:'Gold', gems:'Gems', wallets:'Wallets', tokenization:'Tokenization'};
  const doc = host.document;
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const normalize = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const cleanTitle = value => String(value || '').replace(/^(?:[A-Z]\d+\.?|\d+\.)\s+/, '');
  const validArticle = value => typeof value === 'string' && /^AM-[A-Z0-9-]+$/.test(value);
  const safeSourceURL = value => {
    try { const url = new URL(String(value)); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; }
    catch { return ''; }
  };
  const safeText = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
  let contentPromise = null, libraryPromise = null, content = {topics:[], placements:[]}, library = null;
  let initialized = false, dialog, body, launcher, tooltip, activeOpener = null, generation = 0, observer, enhanceFrame = 0;
  let state = {kind:'library', query:'', topic:'all'}, history = [];
  let tooltipTrigger = null, hoverTrigger = null, focusTrigger = null, dismissedTrigger = null, tooltipVersion = 0, hideTimer = 0;
  const placements = new Map();

  function publicContent(raw) {
    if (!raw || !Array.isArray(raw.topics)) throw Error('Help content is unavailable.');
    const used = new Set(), topics = raw.topics.filter(topic => {
      if (!topic || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(topic.id || '') || used.has(topic.id)) return false;
      if (!safeText(topic.title, 160) || !safeText(topic.summary, 900)) return false;
      used.add(topic.id); return true;
    }).map(topic => ({
      id:topic.id, title:safeText(topic.title, 160), summary:safeText(topic.summary, 900),
      details:(Array.isArray(topic.details) ? topic.details : []).map(value => safeText(value, 2400)).filter(Boolean).slice(0, 12),
      article_ids:[...new Set((Array.isArray(topic.article_ids) ? topic.article_ids : []).filter(validArticle))].slice(0, 12)
    }));
    const rules = (Array.isArray(raw.placements) ? raw.placements : []).filter(rule =>
      rule && used.has(rule.topic) && typeof rule.selector === 'string' && rule.selector.length <= 400 &&
      ['after', 'append'].includes(rule.position)
    ).map(rule => ({selector:rule.selector, topic:rule.topic, position:rule.position})).slice(0, 500);
    return {version:safeText(raw.version, 80), topics, placements:rules};
  }
  function matchingTopics(data, query, topic = 'all', reference = null) {
    const terms = [...new Set(normalize(String(query).slice(0, 200)).split(' ').filter(Boolean))];
    if (!terms.length) return [];
    return data.topics.map((item, order) => {
      if (topic !== 'all' && reference && !item.article_ids.some(id => reference.articles.some(article => article.id === id && article.topic_ids.includes(topic)))) return null;
      const title = normalize(item.title), text = normalize(item.title + ' ' + item.summary + ' ' + item.details.join(' '));
      if (!terms.every(term => text.includes(term))) return null;
      return {item, order, score:terms.reduce((score, term) => score + (title.includes(term) ? 3 : 1), 0)};
    }).filter(Boolean).sort((a,b) => b.score-a.score || a.order-b.order).map(match => match.item);
  }
  function topicMarkup(topic, reference) {
    const articles = topic.article_ids.map(id => reference?.articles.find(article => article.id === id)).filter(Boolean);
    return '<section class="am-help-explanation"><p class="am-help-kicker">ABOUT THIS STEP</p><h3 id="am-help-view-title" tabindex="-1">' + escapeHTML(topic.title) +
      '</h3><p class="am-help-summary">' + escapeHTML(topic.summary) + '</p>' +
      topic.details.map(detail => '<p>' + escapeHTML(detail) + '</p>').join('') +
      (articles.length ? '<div class="am-help-related"><h4>Read in depth</h4>' + articles.map(articleButton).join('') + '</div>' : '') +
      '<p class="am-help-small">Use the library to explore every subject and its source references.</p><button type="button" class="am-help-secondary" data-am-help-home>Browse all knowledge ↗</button></section>';
  }
  function articleButton(article) {
    return '<button type="button" class="am-help-result" data-am-help-article="' + escapeHTML(article.id) + '"><span>' +
      escapeHTML(cleanTitle(article.title)) + '</span><small>' + article.topic_ids.map(id => escapeHTML(NAMES[id] || id)).join(' · ') +
      '</small><span class="am-help-result-arrow" aria-hidden="true">↗</span></button>';
  }
  function articleMarkup(article, reference, knowledge = host.AssetKnowledge) {
    const sources = article.source_ids.map(id => reference.sources.find(source => source.id === id)).filter(Boolean);
    const rendered = knowledge.renderDocument(article.body_markdown, sources).html.replace(/\bid="kb-heading-(\d+)"/g, 'id="am-help-article-heading-$1"');
    return '<article class="am-help-article"><p class="am-help-kicker">' + article.topic_ids.map(id => escapeHTML(NAMES[id] || id)).join(' / ') +
      '</p><h3 id="am-help-view-title" tabindex="-1">' + escapeHTML(cleanTitle(article.title)) + '</h3><p class="am-help-small">Research date: ' +
      escapeHTML(article.research_date || reference.research_date || 'See source references') +
      '</p><div class="am-help-article-tools"><button type="button" class="am-help-secondary" data-am-help-download="' + escapeHTML(article.id) +
      '">Save article ↓</button><a href="https://assetmachine.live/#knowledge/article/' + escapeHTML(article.id) +
      '" target="_blank" rel="noopener noreferrer">Open in a new tab ↗</a></div><div class="kb-prose">' + rendered +
      '</div><section class="am-help-sources" aria-labelledby="am-help-sources-title"><h4 id="am-help-sources-title">Sources and scope</h4>' +
      (article.jurisdiction_scope ? '<p>' + escapeHTML(article.jurisdiction_scope) + '</p>' : '') +
      (sources.length ? '<ol>' + sources.map(source => {
        const url = safeSourceURL(source.url), title = '[' + source.id + '] ' + source.title;
        return '<li>' + (url ? '<a href="' + escapeHTML(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHTML(title) +
          ' ↗</a>' : escapeHTML(title)) + (source.publisher ? '<small>' + escapeHTML(source.publisher) + '</small>' : '') + '</li>';
      }).join('') + '</ol>' : '<p>This introduction explains the review approach. Follow the related articles for specific source evidence.</p>') +
      '<p class="am-help-small">Sources open in a new tab. General reference does not verify an individual asset or holding.</p></section></article>';
  }
  async function loadContent() {
    if (!contentPromise) contentPromise = host.fetch(BASE + '/help-content.json?v=' + VERSION, {credentials:'omit', cache:'no-cache'})
      .then(response => { if (!response.ok) throw Error('Help content could not load.'); return response.json(); })
      .then(publicContent).then(data => { content = data; scheduleEnhance(); return data; })
      .catch(error => { contentPromise = null; throw error; });
    return contentPromise;
  }
  async function loadLibrary() {
    if (!libraryPromise) {
      libraryPromise = Promise.resolve().then(() => {
        if (typeof host.AssetKnowledge?.load === 'function') return host.AssetKnowledge.load({base:BASE});
        if (!host.AssetKnowledge?.publicData) throw Error('The reference library could not load.');
        return host.fetch(BASE + '/knowledge-base.json?v=kb20261103', {credentials:'omit', cache:'no-cache'})
          .then(response => { if (!response.ok) throw Error('The reference library could not load.'); return response.json(); })
          .then(raw => host.AssetKnowledge.publicData(raw));
      }).then(data => { library = data; return data; }).catch(error => { libraryPromise = null; throw error; });
    }
    return libraryPromise;
  }
  function owned(node) {
    const element = node?.nodeType === 1 ? node : node?.parentElement;
    return Boolean(element?.closest?.('[data-am-help-owned]'));
  }
  function visible(element) {
    if (!element?.isConnected || element.closest('[hidden], [aria-hidden="true"]')) return false;
    if (element.getClientRects && !element.getClientRects().length) return false;
    const style = host.getComputedStyle?.(element);
    return !style || (style.display !== 'none' && style.visibility !== 'hidden');
  }
  function setHidden(element, hidden) {
    if (element.hidden !== hidden) element.hidden = hidden;
  }
  function createTrigger(id) {
    const button = doc.createElement('button');
    button.type = 'button'; button.className = 'am-help-trigger'; button.dataset.amHelp = id; button.dataset.amHelpOwned = 'true';
    button.innerHTML = '<span aria-hidden="true">?</span>';
    prepareTrigger(button);
    return button;
  }
  function prepareTrigger(button) {
    if (button.tagName !== 'BUTTON') return;
    const item = content.topics.find(topic => topic.id === button.dataset.amHelp);
    button.type = 'button'; button.classList.add('am-help-trigger');
    button.setAttribute('aria-label', 'Help: ' + (item?.title || 'Learn about this step'));
    button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', 'am-help-dialog');
    button.setAttribute('aria-expanded', String(dialog?.open && activeOpener === button));
  }
  function enhance() {
    if (!initialized) return;
    for (const [target, entries] of placements) {
      if (!target.isConnected) {
        for (const button of entries.values()) button.remove();
        placements.delete(target);
      } else for (const button of entries.values()) setHidden(button, !visible(target));
    }
    for (const rule of content.placements) {
      let targets;
      try { targets = doc.querySelectorAll(rule.selector); } catch { continue; }
      for (const matched of targets) {
        if (owned(matched)) continue;
        const interactive = matched.closest('button, a, summary, label, select, textarea, input, [role="button"], [role="tab"]');
        const target = interactive || matched;
        if (!target.parentNode || /^(OPTION|OPTGROUP|SCRIPT|STYLE|HEAD|HTML|BODY)$/.test(target.tagName)) continue;
        const position = interactive ? 'after' : rule.position;
        let entries = placements.get(target);
        if (!entries) { entries = new Map(); placements.set(target, entries); }
        let button = entries.get(rule.topic);
        if (!button?.isConnected) {
          button = createTrigger(rule.topic); button.dataset.amHelpGenerated = 'true';
          if (position === 'append') target.append(button);
          else target.after(button);
          if (target.tagName === 'LABEL' && !target.matches('.experience-control, .check')) {
            target.classList.add('am-help-label'); button.classList.add('am-help-label-trigger');
          }
          entries.set(rule.topic, button);
        }
        setHidden(button, !visible(target));
      }
    }
    for (const button of doc.querySelectorAll('button[data-am-help]')) prepareTrigger(button);
    for (const modal of doc.querySelectorAll('dialog[open]')) {
      if (modal === dialog || modal.querySelector('[data-am-help-modal-library]')) continue;
      const button = doc.createElement('button');
      button.type = 'button'; button.className = 'am-help-modal-library';
      button.dataset.amHelpLibrary = 'true'; button.dataset.amHelpModalLibrary = 'true'; button.dataset.amHelpOwned = 'true';
      button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', 'am-help-dialog');
      button.textContent = 'ⓘ Knowledge & help';
      modal.prepend(button);
    }
    if (tooltipTrigger && !visible(tooltipTrigger)) hideTooltip();
  }
  function scheduleEnhance() {
    if (!initialized || enhanceFrame) return;
    enhanceFrame = (host.requestAnimationFrame || (fn => host.setTimeout(fn, 16)))(() => { enhanceFrame = 0; enhance(); });
  }
  function describe(button, enabled) {
    if (!button) return;
    const ids = (button.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean).filter(id => id !== 'am-help-tooltip');
    if (enabled) ids.push('am-help-tooltip');
    if (ids.length) button.setAttribute('aria-describedby', ids.join(' ')); else button.removeAttribute('aria-describedby');
  }
  function hideTooltip() {
    host.clearTimeout(hideTimer); tooltipVersion++;
    describe(tooltipTrigger, false);
    tooltipTrigger = null;
    if (tooltip) tooltip.hidden = true;
  }
  function positionTooltip() {
    if (!tooltip || tooltip.hidden || !tooltipTrigger) return;
    const bounds = tooltipTrigger.getBoundingClientRect();
    const viewport = host.visualViewport, leftEdge = viewport?.offsetLeft || 0, topEdge = viewport?.offsetTop || 0;
    const width = viewport?.width || host.innerWidth, height = viewport?.height || host.innerHeight;
    const size = tooltip.getBoundingClientRect(), gap = 9, margin = 12;
    const left = Math.max(leftEdge + margin, Math.min(bounds.left + bounds.width / 2 - size.width / 2, leftEdge + width - size.width - margin));
    const above = bounds.top - size.height - gap;
    const top = above >= topEdge + margin ? above : Math.min(bounds.bottom + gap, topEdge + height - size.height - margin);
    tooltip.style.left = left + 'px'; tooltip.style.top = Math.max(topEdge + margin, top) + 'px';
  }
  async function showTooltip(button) {
    if (dialog?.open || button === dismissedTrigger || !visible(button)) return;
    host.clearTimeout(hideTimer);
    if (tooltipTrigger !== button) hideTooltip();
    tooltipTrigger = button;
    const token = ++tooltipVersion;
    try { await loadContent(); } catch { return; }
    if (token !== tooltipVersion || tooltipTrigger !== button || dialog.open || (hoverTrigger !== button && focusTrigger !== button)) return;
    const topic = content.topics.find(item => item.id === button.dataset.amHelp);
    if (!topic) return;
    const parent = button.closest('dialog[open]') || doc.body;
    if (tooltip.parentNode !== parent) parent.append(tooltip);
    tooltip.replaceChildren();
    const title = doc.createElement('strong'), summary = doc.createElement('span'), hint = doc.createElement('small');
    title.textContent = topic.title; summary.textContent = topic.summary; hint.textContent = 'Select ? for details and the full knowledge library.';
    tooltip.append(title, summary, hint); tooltip.hidden = false; describe(button, true); positionTooltip();
  }
  function scheduleTooltipHide() {
    host.clearTimeout(hideTimer);
    hideTimer = host.setTimeout(() => {
      if (tooltip.matches(':hover') || hoverTrigger === tooltipTrigger || focusTrigger === tooltipTrigger) return;
      hideTooltip();
    }, 180);
  }
  function createUI() {
    launcher = doc.createElement('button');
    launcher.id = 'am-help-launcher'; launcher.className = 'am-help-launcher'; launcher.type = 'button';
    launcher.dataset.amHelpLibrary = 'true'; launcher.dataset.amHelpOwned = 'true';
    launcher.setAttribute('aria-haspopup', 'dialog'); launcher.setAttribute('aria-controls', 'am-help-dialog');
    launcher.setAttribute('aria-label', 'Open knowledge and help');
    launcher.innerHTML = '<span aria-hidden="true">?</span><span class="am-help-launcher-full">Knowledge & help</span><span class="am-help-launcher-short" aria-hidden="true">Help</span>';
    tooltip = doc.createElement('div'); tooltip.id = 'am-help-tooltip'; tooltip.className = 'am-help-tooltip';
    tooltip.dataset.amHelpOwned = 'true'; tooltip.setAttribute('role', 'tooltip'); tooltip.hidden = true;
    dialog = doc.createElement('dialog'); dialog.id = 'am-help-dialog'; dialog.className = 'am-help-dialog';
    dialog.dataset.amHelpOwned = 'true'; dialog.setAttribute('aria-labelledby', 'am-help-heading'); dialog.setAttribute('aria-modal', 'true');
    dialog.innerHTML = '<header class="am-help-header"><div><p class="am-help-kicker">ASSET MACHINE</p><h2 id="am-help-heading">Knowledge & help</h2><p>Answers without leaving your place.</p></div><button type="button" class="am-help-close" data-am-help-close aria-label="Close knowledge and help">×</button></header>' +
      '<nav class="am-help-toolbar" aria-label="Help navigation"><button type="button" data-am-help-back hidden>← Back</button><button type="button" data-am-help-home>All knowledge</button><a href="' + BASE + '/evidence-checklists.csv" download="asset-machine-evidence-checklists.csv">Evidence checklist ↓</a></nav>' +
      '<div id="am-help-body" class="am-help-body" tabindex="-1"></div>';
    body = dialog.querySelector('#am-help-body');
    doc.body.append(launcher, tooltip, dialog);
    dialog.addEventListener('close', afterClose);
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    });
    tooltip.addEventListener('pointerenter', () => host.clearTimeout(hideTimer));
    tooltip.addEventListener('pointerleave', () => scheduleTooltipHide());
  }
  function afterClose() {
    generation++; hideTooltip(); doc.body.classList.remove('am-help-open');
    const opener = activeOpener; activeOpener = null;
    opener?.setAttribute('aria-expanded', 'false');
    if (opener?.isConnected && visible(opener)) opener.focus({preventScroll:true});
    else if (visible(launcher)) launcher.focus({preventScroll:true});
  }
  function ensureOpen(opener) {
    if (!initialized) init();
    hideTooltip();
    if (dialog.open) return !dialog.hasAttribute('data-am-help-fallback');
    activeOpener = opener || doc.activeElement;
    activeOpener?.setAttribute('aria-expanded', 'true');
    history = [];
    dialog.removeAttribute('data-am-help-fallback');
    dialog.setAttribute('aria-modal', 'true');
    dialog.querySelector('.am-help-toolbar').hidden = false;
    doc.body.classList.add('am-help-open');
    try { dialog.showModal(); return true; }
    catch {
      doc.body.classList.remove('am-help-open');
      dialog.setAttribute('data-am-help-fallback', 'true');
      dialog.setAttribute('aria-modal', 'false');
      dialog.querySelector('.am-help-toolbar').hidden = true;
      body.innerHTML = '<h3 id="am-help-view-title" tabindex="-1">Open the full library.</h3><p>This browser could not open in-place help. Your current work is still here.</p><p><a href="https://assetmachine.live/#knowledge" target="_blank" rel="noopener noreferrer">Open the knowledge base in a new tab ↗</a></p>';
      dialog.setAttribute('open', '');
      body.focus();
      return false;
    }
  }
  function openTopic(id, opener) { if (!ensureOpen(opener)) return Promise.resolve(); history = []; return navigate({kind:'topic', id}, false); }
  function openLibrary(opener) { if (!ensureOpen(opener)) return Promise.resolve(); history = []; return navigate({kind:'library', query:'', topic:'all'}, false); }
  function close() {
    if (!dialog?.open) return;
    if (typeof dialog.close === 'function') dialog.close();
    else { dialog.removeAttribute('open'); afterClose(); }
  }
  function navigate(next, remember = true) {
    if (remember && state) history.push({...state, scroll:body.scrollTop});
    state = {...next}; return renderState();
  }
  function focusView() {
    const title = body.querySelector('#am-help-view-title');
    if (title) title.focus({preventScroll:true}); else body.focus({preventScroll:true});
    body.scrollTop = state.scroll || 0;
  }
  function loadError(message) {
    return '<div class="am-help-empty"><h3 id="am-help-view-title" tabindex="-1">Let’s try that again.</h3><p>' + escapeHTML(message) +
      '</p><button type="button" class="am-help-secondary" data-am-help-retry>Retry help</button><p><a href="https://assetmachine.live/#knowledge" target="_blank" rel="noopener noreferrer">Open the knowledge base in a new tab ↗</a></p></div>';
  }
  async function renderState() {
    const token = ++generation;
    body.setAttribute('aria-busy', 'true');
    body.innerHTML = '<p class="am-help-loading" role="status">Opening the reference library…</p>';
    dialog.querySelector('[data-am-help-back]').hidden = history.length === 0;
    const [helpResult, referenceResult] = await Promise.allSettled([loadContent(), loadLibrary()]);
    if (token !== generation || !dialog.open) return;
    body.removeAttribute('aria-busy');
    const reference = referenceResult.status === 'fulfilled' ? referenceResult.value : null;
    if (state.kind === 'topic') {
      const topic = content.topics.find(item => item.id === state.id);
      if (topic) {
        body.innerHTML = topicMarkup(topic, reference) + (!reference ? '<p class="am-help-small">The longer references could not load. <button type="button" class="am-help-text" data-am-help-retry>Retry reference loading</button></p>' : '');
      } else body.innerHTML = helpResult.status === 'rejected' ? loadError('The short explanation could not load. Your work is still in place.') :
        '<h3 id="am-help-view-title" tabindex="-1">Explore the full library.</h3><p>This control has no short explanation in this version. Search the related subject below.</p><button type="button" class="am-help-secondary" data-am-help-home>Browse all knowledge</button>';
    } else if (!reference) body.innerHTML = loadError('The reference library could not load. Your work is still in place.');
    else if (state.kind === 'article') {
      const article = reference.articles.find(item => item.id === state.id);
      body.innerHTML = article ? articleMarkup(article, reference) : '<h3 id="am-help-view-title" tabindex="-1">Article not found.</h3><p>This link does not identify a published article.</p><button type="button" class="am-help-secondary" data-am-help-home>Browse all knowledge</button>';
    } else renderLibrary(reference);
    focusView();
  }
  function renderLibrary(reference) {
    body.innerHTML = '<section class="am-help-library"><h3 id="am-help-view-title" tabindex="-1">Find the next answer.</h3><p class="am-help-library-intro">Search the full articles and quick explanations, or choose a subject.</p>' +
      '<div class="am-help-search"><label for="am-help-search">Search knowledge and help</label><input id="am-help-search" type="search" maxlength="200" autocomplete="off" placeholder="Try SKR, wallet proof, inherited gold…" value="' + escapeHTML(state.query || '') + '">' +
      '<label for="am-help-filter">Subject</label><select id="am-help-filter"><option value="all">All subjects</option>' + TOPICS.map(id => '<option value="' + id + '"' + (state.topic === id ? ' selected' : '') + '>' + escapeHTML(NAMES[id]) + '</option>').join('') +
      '</select></div><p id="am-help-results-count" class="am-help-small" role="status" aria-live="polite"></p><div id="am-help-results"></div></section>';
    const input = body.querySelector('#am-help-search'), filter = body.querySelector('#am-help-filter');
    input.addEventListener('input', () => { state.query = input.value.slice(0, 200); state.scroll = 0; renderResults(reference); });
    filter.addEventListener('change', () => { state.topic = TOPICS.includes(filter.value) ? filter.value : 'all'; state.scroll = 0; renderResults(reference); });
    renderResults(reference);
  }
  function renderResults(reference) {
    const articles = host.AssetKnowledge.searchArticles(reference, state.query || '', state.topic || 'all');
    const quick = matchingTopics(content, state.query || '', state.topic || 'all', reference);
    const count = body.querySelector('#am-help-results-count'), results = body.querySelector('#am-help-results');
    if (!count || !results) return;
    count.textContent = articles.length + ' article' + (articles.length === 1 ? '' : 's') + (quick.length ? ' · ' + quick.length + ' quick explanation' + (quick.length === 1 ? '' : 's') : '');
    results.innerHTML = (quick.length ? '<section class="am-help-quick-results"><h4>Quick explanations</h4>' + quick.map(item => '<button type="button" class="am-help-result" data-am-help-open-topic="' +
      escapeHTML(item.id) + '"><span>' + escapeHTML(item.title) + '</span><small>' + escapeHTML(item.summary) + '</small><span class="am-help-result-arrow" aria-hidden="true">↗</span></button>').join('') + '</section>' : '') +
      (articles.length ? '<section><h4>In-depth articles</h4>' + articles.map(articleButton).join('') + '</section>' : '') +
      (!articles.length && !quick.length ? '<div class="am-help-empty"><h4>No matching explanation yet.</h4><p>Try fewer words, an acronym such as SKR, or choose All subjects.</p><button type="button" class="am-help-secondary" data-am-help-clear>Clear search and filters</button></div>' : '');
  }
  function saveArticle(id) {
    const article = library?.articles.find(item => item.id === id);
    if (!article || !host.AssetKnowledge?.articleExport) return;
    const url = host.URL.createObjectURL(new host.Blob([host.AssetKnowledge.articleExport(article, library)], {type:'text/markdown;charset=utf-8'}));
    const anchor = doc.createElement('a'); anchor.href = url; anchor.download = 'asset-machine-' + id.toLowerCase() + '.md';
    dialog.append(anchor); anchor.click(); anchor.remove(); host.setTimeout(() => host.URL.revokeObjectURL(url), 1000);
  }
  function init() {
    if (initialized || !doc?.body) return;
    initialized = true; createUI();
    doc.addEventListener('click', event => {
      const button = event.target.closest?.('button, a');
      if (!button) return;
      if (button.matches('button[data-am-help]')) {
        event.preventDefault(); event.stopPropagation(); openTopic(button.dataset.amHelp, button); return;
      }
      if (button.hasAttribute('data-am-help-library')) {
        event.preventDefault(); event.stopPropagation(); openLibrary(button); return;
      }
      if (!dialog.contains(button)) return;
      if (button.hasAttribute('data-am-help-close')) { event.preventDefault(); close(); }
      else if (button.hasAttribute('data-am-help-home')) { event.preventDefault(); navigate({kind:'library', query:'', topic:'all'}); }
      else if (button.hasAttribute('data-am-help-back')) { event.preventDefault(); const previous = history.pop(); if (previous) navigate(previous, false); }
      else if (button.hasAttribute('data-am-help-article')) { event.preventDefault(); navigate({kind:'article', id:button.dataset.amHelpArticle}); }
      else if (button.hasAttribute('data-am-help-open-topic')) { event.preventDefault(); navigate({kind:'topic', id:button.dataset.amHelpOpenTopic}); }
      else if (button.hasAttribute('data-am-help-retry')) { event.preventDefault(); renderState(); }
      else if (button.hasAttribute('data-am-help-clear')) {
        event.preventDefault(); state.query = ''; state.topic = 'all'; renderLibrary(library); body.querySelector('#am-help-search').focus();
      } else if (button.hasAttribute('data-am-help-download')) { event.preventDefault(); saveArticle(button.dataset.amHelpDownload); }
    });
    doc.addEventListener('pointerover', event => {
      if (event.pointerType === 'touch' || !host.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return;
      const button = event.target.closest?.('button[data-am-help]');
      if (!button || button.contains(event.relatedTarget)) return;
      hoverTrigger = button; showTooltip(button);
    });
    doc.addEventListener('pointerout', event => {
      const button = event.target.closest?.('button[data-am-help]');
      if (!button || button.contains(event.relatedTarget)) return;
      if (hoverTrigger === button) hoverTrigger = null;
      if (dismissedTrigger === button && focusTrigger !== button) dismissedTrigger = null;
      scheduleTooltipHide();
    });
    doc.addEventListener('focusin', event => {
      const button = event.target.closest?.('button[data-am-help]');
      if (!button) return;
      focusTrigger = button; showTooltip(button);
    });
    doc.addEventListener('focusout', event => {
      const button = event.target.closest?.('button[data-am-help]');
      if (!button || button.contains(event.relatedTarget)) return;
      if (focusTrigger === button) focusTrigger = null;
      if (dismissedTrigger === button && hoverTrigger !== button) dismissedTrigger = null;
      scheduleTooltipHide();
    });
    doc.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !tooltip || tooltip.hidden || dialog.open) return;
      dismissedTrigger = tooltipTrigger; hideTooltip(); event.preventDefault(); event.stopPropagation();
    }, true);
    host.addEventListener?.('resize', () => { scheduleEnhance(); positionTooltip(); }, {passive:true});
    host.addEventListener?.('scroll', positionTooltip, {passive:true, capture:true});
    host.addEventListener?.('hashchange', () => { hideTooltip(); scheduleEnhance(); });
    if (host.MutationObserver) {
      observer = new host.MutationObserver(records => {
        if (records.some(record => !owned(record.target) && (record.type !== 'childList' || [...record.addedNodes, ...record.removedNodes].some(node => !owned(node))))) scheduleEnhance();
      });
      observer.observe(doc.body, {childList:true, subtree:true, attributes:true, attributeFilter:['hidden', 'open', 'data-am-help']});
    }
    loadContent().catch(() => { /* The launcher and reference-library fallback remain available. */ });
    enhance();
  }
  host.AssetHelp = Object.freeze({init, enhance, openTopic, openLibrary, close, publicContent, matchingTopics, topicMarkup, articleMarkup, safeSourceURL});
  if (doc?.addEventListener) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, {once:true});
    else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
