const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const ts = require('typescript');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../src/app/utils/conversation.ts'), 'utf8');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exportsObject, URL });
const select = exportsObject.getDetailConversationPosts;

const page = () => new JSDOM(`<main><aside><article data-testid="tweet" id="sidebar"></article></aside>
  <div data-testid="primaryColumn">
    <article data-testid="tweet" id="original"><article data-testid="tweet" id="quoted"></article></article>
    <article data-testid="tweet" id="ancestor"></article>
    <article data-testid="tweet" id="focused"></article>
    <article data-testid="tweet" id="other-reply"></article>
  </div></main>`).window.document;

test('opening a reply detail includes the original and visible ancestors with the focused reply', () => {
  const doc = page();
  const selected = select(doc.querySelector('#focused'),
    'https://x.com/annightyhq/status/2117254392781127732?s=20',
    'https://x.com/annightyhq/status/2117254392781127732');
  assert.deepEqual(Array.from(selected, element => element.id), ['original', 'ancestor', 'focused']);
});

test('clicking a reply on the original post detail exports only that reply', () => {
  const doc = page();
  const selected = select(doc.querySelector('#focused'),
    'https://x.com/wlzh/status/2117245109200920602',
    'https://x.com/annightyhq/status/2117254392781127732');
  assert.deepEqual(Array.from(selected, element => element.id), ['focused']);
});

test('the original post stays single and timelines retain the thread heuristic', () => {
  const doc = page();
  assert.deepEqual(Array.from(select(doc.querySelector('#original'),
    'https://x.com/wlzh/status/2117245109200920602',
    'https://x.com/wlzh/status/2117245109200920602'), element => element.id), ['original']);
  assert.equal(select(doc.querySelector('#focused'), 'https://x.com/home',
    'https://x.com/annightyhq/status/2117254392781127732'), null);
});

test('card button uses the detail-page rule before the general thread heuristic', () => {
  const button = fs.readFileSync(path.resolve(__dirname, '../src/components/extension/card-button.tsx'), 'utf8');
  assert.match(button, /getDetailConversationPosts\(postElement, window\.location\.href, tweetInfo\.url\)/);
  assert.match(button, /\?\? await getPostThreadAsync\(postElement\)/);
});
