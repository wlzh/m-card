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
  assert.equal(result.text, 'Section\n\nBody text');
  assert.equal(result.articleMode, 'full');
  assert.deepEqual(JSON.parse(JSON.stringify(result.articleBlocks)), [
    { type: 'heading', text: 'Section' },
    { type: 'paragraph', text: 'Body text' },
  ]);
});
test('full article keeps text, lists and images in DOM order', () => {
  const result = extract(`<div data-testid="twitterArticleRichTextView"><div><div>
    <p data-block="true">Before</p>
    <section data-block="true"><img src="https://pbs.twimg.com/media/a?name=medium" alt="Step"></section>
    <h2 data-block="true">Next</h2>
    <ol><li>One</li><li>Two</li></ol>
    <blockquote data-block="true">Quote</blockquote>
    <section data-block="true"><div role="separator"></div></section>
    <p data-block="true">After</p>
  </div></div></div>`);
  assert.deepEqual(JSON.parse(JSON.stringify(result.articleBlocks)), [
    { type: 'paragraph', text: 'Before' },
    { type: 'image', src: 'https://pbs.twimg.com/media/a?name=medium', alt: 'Step' },
    { type: 'heading', text: 'Next' },
    { type: 'list', items: ['One', 'Two'], ordered: true },
    { type: 'quote', text: 'Quote' },
    { type: 'divider' },
    { type: 'paragraph', text: 'After' },
  ]);
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
test('nested quoted article cannot become the main post body or title', () => {
  const doc = new JSDOM(`<article data-testid="tweet">
    <div role="link" tabindex="0">
      <div data-testid="Tweet-User-Avatar"></div>
      <div data-testid="twitter-article-title">Quoted title</div>
      <div data-testid="twitterArticleRichTextView"><p>Quoted body</p></div>
      <div data-testid="tweetText">Quoted text</div>
    </div>
    <div data-testid="tweetText">Main comment</div>
  </article>`).window.document;
  const result = exportsObject.extractPostContent(doc.querySelector('article'));
  assert.equal(result.title, undefined);
  assert.equal(result.text, 'Main comment');
  assert.equal(result.articleMode, undefined);
});
test('rendered line breaks are retained and nested body is not duplicated', () => {
  const doc = new JSDOM('<div data-testid="twitterArticleRichTextView"><div data-testid="longformRichTextComponent">fallback</div></div>').window.document;
  Object.defineProperty(doc.querySelector('[data-testid="twitterArticleRichTextView"]'), 'innerText', { value: 'Heading\n\nParagraph\nLast line' });
  assert.equal(exportsObject.extractPostContent(doc.body).text, 'Heading\n\nParagraph\nLast line');
});
