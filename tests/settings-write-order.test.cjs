const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');

test('rehydration waits for a pending IndexedDB settings write', async () => {
  const database = new Map();
  const exportsObject = {};
  const storage = {
    get: async key => database.get(key),
    set: async (key, value) => {
      await new Promise(resolve => setTimeout(resolve, 20));
      database.set(key, value);
    },
    del: async key => database.delete(key),
  };
  const source = ts.transpileModule(fs.readFileSync('src/hooks/useCardStore.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, {
    exports: exportsObject,
    console,
    Promise,
    setTimeout,
    clearTimeout,
    require: id => id === 'idb-keyval' ? storage : require(id),
  });

  const store = exportsObject.useCardStore;
  await store.persist.rehydrate();
  store.getState().updateCardStyles({ width: 768 });
  await store.persist.rehydrate();

  assert.equal(store.getState().cardStyles.width, 768);
  assert.equal(JSON.parse(database.get('card-settings')).state.cardStyles.width, 768);
});

test('remote settings replace an older pending local write', async () => {
  const database = new Map();
  const exportsObject = {};
  let channel;
  class FakeBroadcastChannel {
    constructor() { channel = this; }
    postMessage() {}
  }
  const storage = {
    get: async key => database.get(key),
    set: async (key, value) => { database.set(key, value); },
    del: async key => database.delete(key),
  };
  const source = ts.transpileModule(fs.readFileSync('src/hooks/useCardStore.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, {
    exports: exportsObject,
    console,
    Promise,
    setTimeout,
    clearTimeout,
    BroadcastChannel: FakeBroadcastChannel,
    require: id => id === 'idb-keyval' ? storage : require(id),
  });

  const store = exportsObject.useCardStore;
  await store.persist.rehydrate();
  store.getState().updateCardStyles({ width: 768 });
  const state = store.getState();
  const remote = JSON.stringify({
    state: {
      colorIndex: state.colorIndex,
      backgroundStyles: state.backgroundStyles,
      cardStyles: { ...state.cardStyles, width: 1024 },
      tabConfig: state.tabConfig,
    },
    version: 1,
  });
  await channel.onmessage({ data: { type: 'updated', value: remote } });
  await new Promise(resolve => setTimeout(resolve, 350));

  assert.equal(store.getState().cardStyles.width, 1024);
  assert.equal(JSON.parse(database.get('card-settings')).state.cardStyles.width, 1024);
});

test('clearing storage waits for an in-flight settings write', async () => {
  const database = new Map();
  const exportsObject = {};
  const operations = [];
  const storage = {
    get: async key => database.get(key),
    set: async (key, value) => {
      operations.push('set-start');
      await new Promise(resolve => setTimeout(resolve, 25));
      database.set(key, value);
      operations.push('set-end');
    },
    del: async key => {
      operations.push('delete');
      database.delete(key);
    },
  };
  const source = ts.transpileModule(fs.readFileSync('src/hooks/useCardStore.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, {
    exports: exportsObject,
    console,
    Promise,
    setTimeout,
    clearTimeout,
    require: id => id === 'idb-keyval' ? storage : require(id),
  });

  const store = exportsObject.useCardStore;
  await store.persist.rehydrate();
  store.getState().updateCardStyles({ width: 768 });
  const write = exportsObject.persistSettingsNow();
  store.persist.clearStorage();
  await write;
  await new Promise(resolve => setTimeout(resolve, 50));

  assert.equal(database.has('card-settings'), false, operations.join(', '));
});
