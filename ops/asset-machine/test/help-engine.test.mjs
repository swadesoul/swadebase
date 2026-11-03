import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const helpCode = readFileSync(new URL('../public/help.js', import.meta.url), 'utf8');
const knowledgeCode = readFileSync(new URL('../public/knowledge.js', import.meta.url), 'utf8');
const raw = JSON.parse(readFileSync(new URL('../public/knowledge-base.json', import.meta.url), 'utf8'));
const rawHelp = JSON.parse(readFileSync(new URL('../public/help-content.json', import.meta.url), 'utf8'));
function instance() {
  const window = {document:{title:'Asset Machine'}};
  const context = vm.createContext({window, URL, Intl, Date});
  vm.runInContext(knowledgeCode, context);
  vm.runInContext(helpCode, context);
  return {help:window.AssetHelp, knowledge:window.AssetKnowledge};
}

test('help projects a bounded public schema without arbitrary fields or invalid references', () => {
  const {help} = instance();
  const data = help.publicContent({
    version:'1', private_case:'PRIVATE_CASE_CANARY',
    topics:[
      {id:'safe', title:'A topic', summary:'A short explanation', details:['Useful detail', {private:'not text'}], article_ids:['AM-FOUNDATIONS-001','AM-FOUNDATIONS-001','../../private','javascript:alert(1)'], secret:'PRIVATE_TOPIC_CANARY'},
      {id:'safe', title:'Duplicate', summary:'Do not duplicate this'},
      {id:'<script>', title:'Invalid ID', summary:'Invalid'},
      {id:'missing-summary', title:'No summary'}
    ],
    placements:[
      {selector:'#title', topic:'safe', position:'after'},
      {selector:'#title', topic:'unknown', position:'after'},
      {selector:'#title', topic:'safe', position:'execute'},
      {selector:'a'.repeat(401), topic:'safe', position:'after'}
    ]
  });
  assert.equal(data.topics.length, 1);
  assert.equal(data.placements.length, 1);
  assert.equal(data.topics[0].article_ids.length, 1);
  assert.equal(data.topics[0].details.length, 1);
  assert.doesNotMatch(JSON.stringify(data), /PRIVATE_CASE_CANARY|PRIVATE_TOPIC_CANARY|javascript:|\.\.\/|Duplicate/);
});

test('short explanations escape injected markup and only link published related articles', () => {
  const {help, knowledge} = instance(), reference = knowledge.publicData(raw);
  const html = help.topicMarkup({
    id:'test', title:'<img src=x onerror=alert(1)>', summary:'<script>unsafe()</script>',
    details:['" onmouseover="bad" <svg onload=x>'],
    article_ids:['AM-BANK-INSTRUMENTS-003','AM-OPERATIONS-002','AM-NOT-PUBLISHED-001']
  }, reference);
  assert.match(html, /&lt;img/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<img|<script|<svg| onmouseover="/);
  assert.match(html, /data-am-help-article="AM-BANK-INSTRUMENTS-003"/);
  assert.doesNotMatch(html, /AM-OPERATIONS|AM-NOT-PUBLISHED/);
});

test('full drawer reading preserves complete article and sources with separate heading IDs', () => {
  const {help, knowledge} = instance(), reference = knowledge.publicData(raw);
  const article = reference.articles.find(item => item.id === 'AM-BANK-INSTRUMENTS-003');
  const html = help.articleMarkup(article, reference, knowledge);
  assert.match(html, /SKRs: verify the custody relationship/);
  assert.match(html, /am-help-article-heading-0/);
  assert.doesNotMatch(html, /\bid="kb-heading-/);
  assert.match(html, /Sources and scope/);
  assert.match(html, /data-am-help-download="AM-BANK-INSTRUMENTS-003"/);
  assert.match(html, /https:\/\/assetmachine\.live\/#knowledge\/article\/AM-BANK-INSTRUMENTS-003/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  assert.ok(html.length > article.body_markdown.length);
  for (const sourceID of article.source_ids) assert.ok(html.includes('[' + sourceID + ']'));
});

test('source bibliography refuses credential-bearing, script, data and insecure URLs', () => {
  const {help, knowledge} = instance();
  for (const value of ['javascript:alert(1)', 'data:text/html,hello', 'https://user:password@example.com/private', 'http://example.com', 'not a URL']) {
    assert.equal(help.safeSourceURL(value), '');
  }
  assert.equal(help.safeSourceURL('https://example.com/reference'), 'https://example.com/reference');
  const article = {id:'AM-FOUNDATIONS-999', title:'<script>title</script>', body_markdown:'# Heading\n\n<img src=x onerror=alert(1)>', topic_ids:['proof'], source_ids:['F99'], research_date:'2026-11-03'};
  const html = help.articleMarkup(article, {articles:[article], sources:[{id:'F99', title:'<svg onload=x>', publisher:'Test', url:'javascript:alert(1)'}]}, knowledge);
  assert.doesNotMatch(html, /<script|<img|<svg|href="javascript:/);
  assert.match(html, /&lt;svg/);
});

test('global help search finds workflow explanations and respects article subject filters', () => {
  const {help, knowledge} = instance(), content = help.publicContent(rawHelp), reference = knowledge.publicData(raw);
  const skr = help.matchingTopics(content, 'safekeeping receipt', 'skr', reference);
  assert.ok(skr.length > 0);
  assert.ok(skr.every(topic => topic.article_ids.some(id => reference.articles.some(article => article.id === id && article.topic_ids.includes('skr')))));
  assert.equal(help.matchingTopics(content, '').length, 0);
  assert.equal(help.matchingTopics(content, 'notarealtermz987').length, 0);
  assert.ok(help.matchingTopics(content, 'evidence').length > 0);
  assert.ok(content.topics.length >= 80);
});
