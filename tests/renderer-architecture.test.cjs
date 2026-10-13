const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('extension exposes and selects the bundled renderer by default', () => {
  const pkg = JSON.parse(read('package.json'));
  const overlay = read('src/contents/plasmo-overlay.tsx');
  const renderer = read('src/tabs/renderer.tsx');

  assert.equal(pkg.version, '0.4.1');
  assert.ok(pkg.manifest.web_accessible_resources.some((entry) =>
    entry.matches.includes('https://x.com/*') && entry.resources.includes('tabs/renderer.html')));
  assert.match(overlay, /src=\{localRendererURL\}/);
  assert.match(overlay, /data-fallback-src=\{CLOUD_RENDERER_URL\}/);
  assert.match(renderer, /IndependentRenderer/);
});

test('renderer fallback preserves settings and old cloud settings can migrate once', () => {
  const overlay = read('src/contents/plasmo-overlay.tsx');
  const sender = read('src/app/utils/index.ts');
  const receiver = read('src/app/(extension)/independent/components/index.tsx');

  assert.match(overlay, /mcard-cloud-settings-migrated-v1/);
  assert.match(overlay, /export-card-settings/);
  assert.match(overlay, /import-card-settings/);
  assert.match(sender, /switchToCloud/);
  assert.match(sender, /renderer-ping/);
  assert.match(receiver, /event\.origin !== 'https:\/\/x\.com'/);
  assert.match(receiver, /location\.protocol === 'chrome-extension:'/);
});
