const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (file) => fs.readFileSync(file, 'utf8');

test('watermark generation control is a session-only override', () => {
  const control = read('src/components/extension/x-cards-toast/watermark-control.tsx');
  const collection = read('src/components/extension/use-tweet-collection.ts');
  const renderer = read('src/app/(extension)/independent/components/index.tsx');
  const toast = read('src/components/extension/x-cards-toast/index.tsx');

  assert.match(collection, /watermark\?: WatermarkSettings/);
  assert.match(control, /value=\{selectedValue\}/);
  assert.match(control, /value="default"/);
  assert.match(control, /value="none"/);
  assert.match(control, /setCardConfig\(\{ watermark: \{ enabled: false, text: '' \} \}\)/);
  assert.match(control, /setCardConfig\(\{ watermark: undefined \}\)/);
  assert.match(renderer, /if \(cardConfig\?\.watermark\)/);
  assert.match(renderer, /watermark: \{/);
  assert.match(renderer, /setPersistencePaused\(true\)/);
  assert.match(renderer, /pendingGenerationSnapshot/);
  assert.match(toast, /<WatermarkControl onManage=/);
  assert.match(toast, /cardConfig\.watermark/);
});

test('renderer defaults expose watermark presets to the generation panel', () => {
  const renderer = read('src/app/(extension)/independent/components/index.tsx');
  assert.match(renderer, /watermark: cardStyles\.watermark/);
  assert.match(renderer, /watermarkPresets: cardStyles\.watermarkPresets/);
  assert.match(renderer, /normalizeWatermarkPresets/);
});

test('default settings UI manages a bounded named preset list', () => {
  const store = read('src/hooks/useCardStore.tsx');
  const controller = read('src/app/(app)/components/card-generator/controller/watermark-controller.tsx');
  assert.match(store, /MAX_WATERMARK_PRESETS = 5/);
  assert.match(store, /normalizeWatermarkPresets/);
  assert.match(controller, /添加水印预设/);
  assert.match(controller, /aria-label=\{`编辑预设/);
  assert.match(controller, /aria-label=\{`删除预设/);
  assert.match(controller, /presets\.length >= MAX_WATERMARK_PRESETS/);
  assert.match(controller, /watermarkPresets: editor\.id/);
});
