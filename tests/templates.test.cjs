const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');

const load = (file, dependencies = {}) => {
  const exportsObject = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, {
    exports: exportsObject,
    console,
    Promise,
    setTimeout,
    clearTimeout,
    require: id => dependencies[id] || require(id),
  });
  return exportsObject;
};

test('template CRUD validates names and persists rapid changes in order', async () => {
  const database = new Map();
  const storage = {
    get: async key => database.get(key),
    set: async (key, value) => {
      await new Promise(resolve => setTimeout(resolve, 15));
      database.set(key, value);
    },
    del: async key => database.delete(key),
  };
  const { useTemplatesStore, normalizeTemplateName } = load('src/hooks/useTemplatesStore.tsx', { 'idb-keyval': storage });
  await useTemplatesStore.persist.rehydrate();
  const snapshot = { colorIndex: 1, backgroundStyles: {}, cardStyles: {}, tabConfig: {} };

  useTemplatesStore.getState().addTemplate({ ...snapshot, name: '  Morning  ' });
  useTemplatesStore.getState().addTemplate({ ...snapshot, name: 'morning' });
  useTemplatesStore.getState().addTemplate({ ...snapshot, name: 'Evening' });
  useTemplatesStore.getState().renameTemplate(1, 'MORNING');
  assert.equal(useTemplatesStore.getState().templates.length, 2);
  assert.equal(useTemplatesStore.getState().templates[0].name, 'Morning');
  assert.equal(useTemplatesStore.getState().templates[1].name, 'Evening');
  assert.equal(normalizeTemplateName(' '.repeat(3) + 'x'.repeat(70)).length, 60);

  useTemplatesStore.getState().renameTemplate(1, 'Night');
  useTemplatesStore.getState().delTemplate(0);
  await useTemplatesStore.persist.rehydrate();
  assert.deepEqual(useTemplatesStore.getState().templates.map(item => item.name), ['Night']);
  assert.deepEqual(JSON.parse(database.get('templates')).state.templates.map(item => item.name), ['Night']);
});

test('applying an old template merges nested styles and preserves personal watermark presets', () => {
  const { applyTemplateToSettings, isUsableTemplate } = load('src/app/(app)/components/template-settings.ts');
  const current = {
    colorIndex: 0,
    backgroundStyles: { padding: 20, backgroundFilter: { brightness: 1, contrast: 1 } },
    cardStyles: {
      width: 640,
      controls: { showTime: true, showActions: true },
      watermark: { enabled: true, text: '@wlzh' },
      watermarkPresets: [{ id: 'mine', name: 'Mine', text: '@mine' }],
    },
    tabConfig: { openCustomColor: false, activeTab: 'posts' },
  };
  const legacyTemplate = {
    name: 'Old',
    colorIndex: 3,
    backgroundStyles: { padding: 40, backgroundFilter: { contrast: 0.8 } },
    cardStyles: { width: 800, controls: { showTime: false }, watermark: { text: '@old' } },
    tabConfig: { openCustomColor: true },
  };
  assert.equal(isUsableTemplate(legacyTemplate), true);
  assert.equal(isUsableTemplate({ name: 'Broken' }), false);
  const applied = applyTemplateToSettings(current, legacyTemplate);
  assert.equal(applied.colorIndex, 3);
  assert.equal(applied.backgroundStyles.padding, 40);
  assert.equal(applied.backgroundStyles.backgroundFilter.brightness, 1);
  assert.equal(applied.backgroundStyles.backgroundFilter.contrast, 0.8);
  assert.equal(applied.cardStyles.width, 800);
  assert.equal(applied.cardStyles.controls.showActions, true);
  assert.equal(applied.cardStyles.controls.showTime, false);
  assert.equal(applied.cardStyles.watermark.enabled, true);
  assert.equal(applied.cardStyles.watermark.text, '@old');
  assert.deepEqual(applied.cardStyles.watermarkPresets.map(item => item.id), ['mine']);
  assert.equal(applied.tabConfig.openCustomColor, true);
  assert.equal(applied.tabConfig.activeTab, 'posts');
});

test('template manager is reachable from the default settings panel', () => {
  const generator = fs.readFileSync('src/app/(app)/components/card-generator/index.tsx', 'utf8');
  const list = fs.readFileSync('src/app/(app)/components/template-list.tsx', 'utf8');
  const background = fs.readFileSync('src/app/(app)/components/card-generator/controller/background-controller.tsx', 'utf8');
  assert.match(generator, /<TemplateList\s*\/>/);
  for (const action of ['Apply', 'Rename', 'Delete']) assert.match(list, new RegExp(`>${action}<`));
  assert.doesNotMatch(background, /type="file"\s+multiple/);
});
