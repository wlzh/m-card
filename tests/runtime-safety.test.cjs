const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');

const transpile = (file) => ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

test('thread style detection ignores inaccessible cross-origin stylesheets', () => {
  const exports = {};
  const inaccessibleSheet = {};
  Object.defineProperty(inaccessibleSheet, 'cssRules', {
    get() { throw new DOMException('Blocked', 'SecurityError'); },
  });
  class FakeCSSStyleRule {}

  vm.runInNewContext(transpile('src/app/utils/element.ts'), {
    exports,
    document: { styleSheets: [inaccessibleSheet] },
    CSSStyleRule: FakeCSSStyleRule,
  });

  assert.equal(exports.checkAppliedStyle({ matches: () => false }, [['width', '2px']]), false);
});

test('thread traversal is time sliced instead of scanning the entire DOM in one task', () => {
  const source = fs.readFileSync('src/app/utils/element.ts', 'utf8');
  const utils = fs.readFileSync('src/app/utils/index.ts', 'utf8');

  assert.match(source, /export async function traverseAndCheckAsync/);
  assert.match(source, /performance\.now\(\) - frameStartedAt >= frameBudgetMs/);
  assert.match(source, /await nextAnimationFrame\(\)/);
  assert.match(utils, /window\.getComputedStyle\(element\)/);
  assert.doesNotMatch(utils, /checkAppliedStyle\(element/);
});

test('tweet collection identity remains stable while editable text changes', () => {
  const exports = {};
  vm.runInNewContext(transpile('src/components/extension/use-tweet-collection.ts'), {
    exports,
    require,
  });
  const original = { url: '', authorUrl: 'https://x.com/wlzh', time: 42, text: 'before' };
  const edited = { ...original, text: 'after' };

  assert.equal(exports.getTweetIdentity(original), exports.getTweetIdentity(edited));
  assert.notEqual(
    exports.getTweetIdentity(original),
    exports.getTweetIdentity({ ...original, authorUrl: 'https://x.com/other' }),
  );
});
