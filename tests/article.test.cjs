const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/utils/article.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exportsObject });
const extract = html => exportsObject.extractPostContent(new JSDOM(html).window.document.body);

test('full article uses real X title and rich body, not first heading', () => {
  const result = extract('<div data-testid="twitter-article-title">Article title</div><div data-testid="twitterArticleRichTextView"><div data-testid="longformRichTextComponent"><h2>Section</h2><p>Body text</p></div></div>');
  assert.equal(result.title, 'Article title');
  assert.equal(result.text, 'SectionBody text');
  assert.equal(result.articleMode, 'full');
});
test('timeline article captures title and excerpt', () => {
  const result = extract('<div><div data-testid="article-cover-image"><img></div><div><div><div dir="auto">Title</div></div><div dir="auto">Excerpt...</div></div></div>');
  assert.equal(result.title, 'Title');
  assert.equal(result.text, 'Excerpt...');
  assert.equal(result.articleMode, 'preview');
});
test('ordinary post does not adopt page metadata or quoted text', () => {
  const result = extract('<meta property="og:description" content="Wrong"><div data-testid="tweetText">Original</div><div data-testid="tweetText">Quote</div>');
  assert.equal(result.title, undefined);
  assert.equal(result.text, 'Original');
});
test('a quoted article does not replace the author comment', () => {
  const result = extract('<div data-testid="tweetText">Comment</div><div data-testid="article-cover-image"></div><div><div dir="auto">Quoted title</div></div>');
  assert.equal(result.text, 'Comment');
  assert.equal(result.articleMode, undefined);
});
test('rendered line breaks are retained and nested body is not duplicated', () => {
  const doc = new JSDOM('<div data-testid="twitterArticleRichTextView"><div data-testid="longformRichTextComponent">fallback</div></div>').window.document;
  Object.defineProperty(doc.querySelector('[data-testid="twitterArticleRichTextView"]'), 'innerText', { value: 'Heading\n\nParagraph\nLast line' });
  assert.equal(exportsObject.extractPostContent(doc.body).text, 'Heading\n\nParagraph\nLast line');
});
