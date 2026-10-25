const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const source = ts.transpileModule(fs.readFileSync('src/hooks/useCardStore.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function context(database) {
  const exports = {};
  const storage = { get: async k => database.get(k), set: async (k,v) => { database.set(k,v); }, del: async k => { database.delete(k); } };
  vm.runInNewContext(source, { exports, console, Promise, setTimeout, clearTimeout, require: id => id === 'idb-keyval' ? storage : require(id) });
  return exports;
}
test('watermark presets are normalized, capped, and get stable fallback ids', async () => {
  const db = new Map();
  const module = context(db);
  assert.deepEqual(JSON.parse(JSON.stringify(module.normalizeWatermarkPresets([
    { id: 'brand', name: ' Brand ', text: ' @brand ' },
    { id: 'brand', name: '', text: '@brand-two' },
    { name: 'empty', text: '   ' },
    ...Array.from({ length: 6 }, (_, index) => ({ name: `extra-${index}`, text: `@extra-${index}` })),
  ]))), [
    { id: 'brand', name: 'Brand', text: '@brand' },
    { id: 'brand-2', name: '@brand-two', text: '@brand-two' },
    { id: 'watermark-4', name: 'extra-0', text: '@extra-0' },
    { id: 'watermark-5', name: 'extra-1', text: '@extra-1' },
    { id: 'watermark-6', name: 'extra-2', text: '@extra-2' },
  ]);
  assert.equal(module.normalizeWatermarkPresets(undefined).length, 0);
});

test('all persisted settings survive a fresh store, saved-default restore and temporary generation', async () => {
  const db = new Map();
  const first = context(db);
  await first.useCardStore.persist.rehydrate();
  const store = first.useCardStore;
  store.getState().updateBackgroundStyles({ padding: 48, backgroundOpacity: 0.4, backgroundBlur: 3, useGradient: true, backgroundGradientAngle: 57, backgroundStartColor: '#123456', backgroundEndColor: '#abcdef' });
  store.getState().updateCardStyles({ width: 768, fontSize: 24, fontFamily: 'Noto Sans SC', scale: 90, borderWidth: 3, borderColor: '#345678', borderRadius: 12, exportScale: 3, exportFormat: 'jpeg', hasNoiseTexture: true, noiseTextureOpacity: 0.2, imageLayout: 'vertical', watermark: { enabled: false, text: '@custom' }, controls: { showUser: false, showLogo: true, showFooter: true, showTime: false, showActions: true } });
  await store.getState().saveAsDefault();
  await store.persist.rehydrate();
  const expected = JSON.parse(db.get('card-settings')).state;
  const second = context(db);
  await second.useCardStore.persist.rehydrate();
  const actual = second.useCardStore.getState();
  for (const key of ['backgroundStyles', 'cardStyles', 'tabConfig', 'colorIndex']) {
    assert.deepEqual(JSON.parse(JSON.stringify(actual[key])), expected[key]);
  }
  first.setPersistencePaused(true);
  store.getState().updateCardStyles({ width: 440 });
  store.setState(expected);
  first.setPersistencePaused(false);
  await store.persist.rehydrate();
  assert.equal(store.getState().cardStyles.width, 768);
  store.getState().resetAll();
  await store.getState().loadDefault();
  assert.equal(store.getState().cardStyles.watermark.text, '@custom');
  assert.equal(store.getState().cardStyles.watermarkPresets.length, 0);
  assert.equal(store.getState().backgroundStyles.padding, 48);
});
