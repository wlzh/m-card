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
  const previewHandler = source.indexOf('const handlePreview');
  const loadingGate = source.indexOf('await beginLoading()', previewHandler);
  const extraction = source.indexOf('await extractTweetThread(postElement)', previewHandler);

  assert.ok(loadingStart >= 0);
  assert.ok(paintWait > loadingStart);
  assert.ok(loadingGate > previewHandler);
  assert.ok(extraction > loadingGate);
  assert.match(source, /requestAnimationFrame\(\(\) => requestAnimationFrame/);
});

test('card button uses a synchronous ref guard and clears it after generation', () => {
  assert.match(source, /if \(isLoadingRef\.current\) return false/);
  assert.match(source, /isLoadingRef\.current = true/);
  assert.match(source, /isLoadingRef\.current = false/);
  assert.match(source, /onInitialGenerationEnd=\{endLoading\}/);
});

test('card button also stops from the generated preview store signal', () => {
  assert.match(source, /useTweetsStore\.subscribe/);
  assert.match(source, /if \(state\.imageSrc\) endLoading\(\)/);
  assert.match(source, /watchForGeneratedPreview\(\)/);
  assert.match(source, /window\.setTimeout\(endLoading, 65000\)/);
  assert.match(source, /clearGenerationWatcher\(\)/);
});

test('card extraction yields between DOM phases and reuses the selected post result', () => {
  assert.match(source, /await getPostThreadAsync\(postElement\)/);
  assert.match(source, /element === postElement \? tweetInfo : extractTweetInfo\(element\)/);
  assert.match(source, /await waitForNextFrame\(\)/);
  assert.doesNotMatch(source, /thread\?\.map\(e => extractTweetInfo\(e\)\)/);
  assert.match(source, /style=\{\{ willChange: 'transform' \}\}/);
});
