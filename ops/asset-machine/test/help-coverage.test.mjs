import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFileSync} from 'node:fs';
import routes from '../routes.mjs';

const help = JSON.parse(readFileSync(new URL('../public/help-content.json', import.meta.url), 'utf8'));
const library = JSON.parse(readFileSync(new URL('../public/knowledge-base.json', import.meta.url), 'utf8'));
const articles = new Map(library.articles.filter(article => article.audience === 'public_education').map(article => [article.id, article]));
const topics = new Map(help.topics.map(topic => [topic.id, topic]));
const selectors = help.placements.map(placement => String(placement.selector).replaceAll("'", '"'));
const targets = id => selectors.some(selector => new RegExp('#' + id + '(?![A-Za-z0-9_-])').test(selector) || selector.includes('[for="' + id + '"]'));
const textForTarget = id => help.placements.filter(placement => {
  const selector = String(placement.selector).replaceAll("'", '"');
  return new RegExp('#' + id + '(?![A-Za-z0-9_-])').test(selector) || selector.includes('[for="' + id + '"]');
}).map(placement => topics.get(placement.topic)).filter(Boolean).map(topic => [topic.title, topic.summary, ...(topic.details || [])].join(' ')).join(' ');

test('contextual explanations link only to public references and cover all nine knowledge subjects', () => {
  assert.equal(topics.size, help.topics.length, 'Topic identifiers must be unique');
  const coveredSubjects = new Set();
  for (const topic of help.topics) {
    assert.match(topic.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(typeof topic.title === 'string' && topic.title.trim(), topic.id + ': title is required');
    assert.ok(typeof topic.summary === 'string' && topic.summary.trim(), topic.id + ': summary is required');
    assert.ok(topic.summary.length <= 650, topic.id + ': quick help should remain concise');
    assert.ok(Array.isArray(topic.details), topic.id + ': details must be text paragraphs');
    assert.ok(topic.details.every(value => typeof value === 'string'), topic.id + ': details cannot contain objects');
    assert.ok(Array.isArray(topic.article_ids) && topic.article_ids.length > 0, topic.id + ': needs a public reference');
    assert.equal(new Set(topic.article_ids).size, topic.article_ids.length, topic.id + ': duplicate article');
    for (const id of topic.article_ids) {
      assert.ok(articles.has(id), topic.id + ': unknown or non-public article ' + id);
      for (const subject of articles.get(id).topic_ids) coveredSubjects.add(subject);
    }
    const prose = [topic.title, topic.summary, ...topic.details].join(' ');
    assert.doesNotMatch(prose, /<\/?(?:script|iframe|form|input|button|a)\b|AM-OPERATIONS-|\/opt\/swadebase|machine_sessions|Bearer\s/i);
  }
  for (const subject of ['proof','bonds','skr','sblc','inheritance','gold','gems','wallets','tokenization']) {
    assert.ok(coveredSubjects.has(subject), 'Missing public subject: ' + subject);
  }
  for (const placement of help.placements) {
    assert.ok(topics.has(placement.topic), 'Unknown placement topic: ' + placement.topic);
    assert.ok(typeof placement.selector === 'string' && placement.selector.trim(), 'A placement needs a selector');
    assert.ok(['after','append'].includes(placement.position), placement.selector + ': invalid insertion mode');
  }
});

test('help covers consequential fields and actions across public voice, intake, evidence, review and access', () => {
  const requiredTargets = [
    'public-voice-disc','public-voice-stop','public-voice-replay','public-voice-input',
    'asset_type','issuer','face_amount','chain','address','goal',
    'upload','extracted','screen','manifest',
    'private-notes','draft','draft-ai','save-review','approve','release','payment','engage',
    'source_url','interest','diligence',
    'member-email','member-role','chat-input','record'
  ];
  for (const id of requiredTargets) assert.ok(targets(id), 'Missing contextual help for ' + id);
  assert.ok(selectors.some(selector => selector.includes('label.experience-control')), 'Explanation style needs help outside its label');
});

test('decision-point help preserves the distinction between preparation, verification, approval and release', () => {
  assert.match(textForTarget('screen'), /not|doesn.t|does not|cannot/i);
  assert.match(textForTarget('screen'), /authentic|verif|ownership|title|guarantee/i);
  assert.match(textForTarget('manifest'), /metadata|preparation|draft/i);
  assert.match(textForTarget('manifest'), /mint|issu|token/i);
  assert.match(textForTarget('payment'), /external|receipt/i);
  assert.match(textForTarget('payment'), /not|doesn.t|does not/i);
  assert.match(textForTarget('approve'), /saved|version/i);
  assert.match(textForTarget('release'), /client|portal/i);
  assert.match(textForTarget('address'), /public/i);
  assert.match(textForTarget('address'), /private key|recovery phrase|seed phrase/i);
  assert.match(textForTarget('private-notes'), /private|assigned reviewer/i);
  assert.match(textForTarget('draft-ai'), /review|draft/i);
});

test('help assets are public static references with correct MIME types and no private-data access', async () => {
  const previousKey = process.env.ASSET_REVIEW_FILE_KEY;
  process.env.ASSET_REVIEW_FILE_KEY = '1'.repeat(64);
  let queries = 0;
  const handler = routes({pool:{query(){queries++; throw Error('Static help must not query private data');}}, publicOrigin:'https://swadebase.cloud', log:()=>{}});
  const server = http.createServer(async (req,res) => {
    if (!await handler(req,res,new URL(req.url, 'https://assetmachine.live'),null)) { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port + '/adapters/asset-machine';
  try {
    for (const [name,type] of [['help.js','text/javascript'],['help.css','text/css'],['help-content.json','application/json']]) {
      const response = await fetch(base + '/' + name);
      assert.equal(response.status, 200, name + ': public delivery failed');
      assert.ok(response.headers.get('content-type').startsWith(type), name + ': incorrect MIME type');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      if (name.endsWith('.json')) {
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.deepEqual(await response.json(), help);
      } else assert.ok((await response.text()).length > 0);
    }
    for (const name of ['knowledge-operations.json','voice-answers.json']) assert.equal((await fetch(base + '/' + name)).status, 401);
    assert.equal((await fetch(base + '/api/cases')).status, 401);
    assert.equal(queries, 0, 'Loading help must not access case, identity or review records');
  } finally {
    await new Promise(resolve => server.close(resolve));
    if (previousKey === undefined) delete process.env.ASSET_REVIEW_FILE_KEY;
    else process.env.ASSET_REVIEW_FILE_KEY = previousKey;
  }
});
