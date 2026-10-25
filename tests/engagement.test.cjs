const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const exportsObject = {};
const source = fs.readFileSync('src/app/utils/engagement.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
vm.runInNewContext(compiled, { exports: exportsObject });

const extract = html => exportsObject.extractEngagementStats(new JSDOM(html).window.document.body);

test('engagement extraction supports active like and retweet buttons', () => {
  const stats = extract(`
    <div role="group">
      <button data-testid="reply">41</button>
      <button data-testid="unretweet">55</button>
      <button data-testid="unlike">289</button>
    </div>
  `);

  assert.deepEqual({ ...stats }, { replies: '41', shares: '55', likes: '289' });
});

test('engagement extraction uses aria-label when X hides the visible count', () => {
  const stats = extract(`
    <div role="group">
      <button data-testid="reply" aria-label="0 回复。回复"></button>
      <button data-testid="retweet" aria-label="1.2万 次转帖。转帖"></button>
      <button data-testid="like" aria-label="3,456 喜欢次数。喜欢"></button>
    </div>
  `);

  assert.deepEqual({ ...stats }, { replies: '0', shares: '1.2万', likes: '3,456' });
});

test('engagement extraction ignores unrelated role groups', () => {
  const stats = extract(`
    <div role="group"><button aria-label="More"></button></div>
    <div role="group">
      <button data-testid="reply">7</button>
      <button data-testid="retweet">8</button>
      <button data-testid="like">9</button>
    </div>
  `);

  assert.deepEqual({ ...stats }, { replies: '7', shares: '8', likes: '9' });
});

test('article engagement prefers exact group counts over abbreviated visible values', () => {
  const stats = extract(`
    <div role="group" aria-label="41 回复、55 次转帖、289 喜欢、已喜欢、570 书签、76371 次观看">
      <button data-testid="reply">41</button>
      <button data-testid="retweet">55</button>
      <button data-testid="unlike">289</button>
      <a href="/wlzh/status/1/analytics" aria-label="76371 次查看。查看帖子分析">7.6万</a>
      <button data-testid="bookmark" aria-label="书签"></button>
    </div>
  `);
  assert.deepEqual({ ...stats }, { replies: '41', shares: '55', likes: '289', views: '76371', bookmarks: '570' });
});

test('optional engagement fields stay absent when X does not expose them', () => {
  const stats = extract('<div role="group"><button data-testid="reply">1</button><button data-testid="retweet">2</button><button data-testid="like">3</button></div>');
  assert.equal('views' in stats, false);
  assert.equal('bookmarks' in stats, false);
});
