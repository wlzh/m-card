const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(
  path.resolve(__dirname, '../src/components/extension/card-button.tsx'),
  'utf8',
);

test('card button paints its loading indicator before synchronous post extraction', () => {
  const loadingStart = source.indexOf('setIsLoading(true)');
  const paintWait = source.indexOf('await waitForLoadingIndicator()');
  const extraction = source.indexOf('extractTweetInfo(postElement)');

  assert.ok(loadingStart >= 0);
  assert.ok(paintWait > loadingStart);
  assert.ok(extraction > paintWait);
  assert.match(source, /requestAnimationFrame\(\(\) => requestAnimationFrame/);
});

test('card button uses a synchronous ref guard and clears it after generation', () => {
  assert.match(source, /if \(isLoadingRef\.current\) return false/);
  assert.match(source, /isLoadingRef\.current = true/);
  assert.match(source, /isLoadingRef\.current = false/);
  assert.match(source, /onInitialGenerationEnd=\{endLoading\}/);
});
