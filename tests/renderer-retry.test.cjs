const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');

const source = ts.transpileModule(fs.readFileSync('src/app/utils/index.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

const createSender = (publish) => {
  const iframe = {
    src: 'chrome-extension://test/tabs/renderer.html',
    contentWindow: {},
    dataset: { rendererMode: 'local', fallbackSrc: 'https://mcard.wlz.si/independent' },
  };
  const output = {};
  vm.runInNewContext(source, {
    exports: output,
    require: (id) => id === './IFrameMessageSystem' ? { iframeMessageSystem: { publish } } : {},
    document: { querySelector: () => ({ shadowRoot: { getElementById: () => iframe } }) },
    setTimeout: (fn) => { fn(); return 0; },
    console: { error() {}, warn() {} },
  });
  return { send: output.sendMessageToIframe, iframe };
};

test('a late local renderer gets multiple pings before cloud fallback', async () => {
  let pings = 0;
  const { send, iframe } = createSender(async (_iframe, action) => {
    if (action === 'renderer-ping' && ++pings < 3) throw new Error('Iframe message timeout');
    return action === 'generate-card-local' ? { dataUrl: 'data:image/png;base64,AA==' } : { ready: true };
  });
  assert.equal((await send('generate-card-local', {})).dataUrl, 'data:image/png;base64,AA==');
  assert.equal(pings, 3);
  assert.equal(iframe.dataset.rendererMode, 'local');
});

test('cloud fallback waits for a responding renderer instead of an iframe load event', async () => {
  let localPings = 0;
  let cloudPings = 0;
  const { send, iframe } = createSender(async (frame, action) => {
    if (action === 'export-card-settings') throw new Error('Iframe message timeout');
    if (action === 'renderer-ping' && frame.dataset.rendererMode === 'local') {
      localPings += 1;
      throw new Error('Iframe message timeout');
    }
    if (action === 'renderer-ping' && ++cloudPings < 3) throw new Error('Iframe message timeout');
    return action === 'generate-card-local' ? { dataUrl: 'data:image/png;base64,AA==' } : { ready: true };
  });
  assert.equal((await send('generate-card-local', {})).dataUrl, 'data:image/png;base64,AA==');
  assert.equal(localPings, 6);
  assert.equal(cloudPings, 3);
  assert.equal(iframe.dataset.rendererMode, 'cloud');
});

test('failed cloud fallback restores the local iframe for a later retry', async () => {
  const { send, iframe } = createSender(async () => { throw new Error('Iframe message timeout'); });
  await assert.rejects(send('generate-card-local', {}), /Cloud renderer did not become ready/);
  assert.equal(iframe.dataset.rendererMode, 'local');
  assert.equal(iframe.src, 'chrome-extension://test/tabs/renderer.html');
});
