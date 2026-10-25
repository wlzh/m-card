const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

test('renderer replies to failed requests and restores temporary settings', () => {
  const source = fs.readFileSync('src/app/(extension)/independent/components/index.tsx', 'utf8');
  assert.match(source, /const reportRequestFailure = async/);
  assert.match(source, /useCardStore\.setState\(pendingGenerationSnapshot\)/);
  assert.match(source, /setPersistencePaused\(false\)/);
  assert.match(source, /requestId: event\.data\.requestId/);
  assert.match(source, /queue = queue\.then\(\(\) => fn\(event\)\)\.catch\(error => reportRequestFailure\(event, error\)\)/);
});

test('business errors do not trigger a cloud rendering retry', () => {
  const source = fs.readFileSync('src/app/utils/index.ts', 'utf8');
  assert.match(source, /renderError\.message !== 'Iframe message timeout'/);
});
