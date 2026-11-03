const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');

const source = ts.transpileModule(fs.readFileSync('src/app/utils/IFrameMessageSystem.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

const createSystem = (postMessage) => {
  let onMessage;
  const listeners = new Map();
  const iframe = {
    src: 'chrome-extension://test/tabs/renderer.html',
    contentWindow: { postMessage },
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name, callback) {
      if (listeners.get(name) === callback) listeners.delete(name);
    },
  };
  const output = {};
  vm.runInNewContext(source, {
    exports: output,
    window: { addEventListener(_name, callback) { onMessage = callback; } },
    crypto: { randomUUID: () => 'request-1' },
    URL: class BrowserURL extends URL {
      get origin() {
        return this.protocol === 'chrome-extension:' ? `chrome-extension://${this.host}` : super.origin;
      }
    },
    setTimeout,
    clearTimeout,
  });
  return { system: output.iframeMessageSystem, iframe, listeners, onMessage: (event) => onMessage(event) };
};

test('retries an iframe origin mismatch after the frame loads', async () => {
  const sent = [];
  let attempts = 0;
  const { system, iframe, listeners, onMessage } = createSystem((message, origin) => {
    if (++attempts === 1) throw new Error("The target origin provided does not match the recipient window's origin");
    sent.push({ message, origin });
  });
  const result = system.publish(iframe, 'renderer-ping', {}, 100);
  assert.equal(listeners.has('load'), true);
  listeners.get('load')();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].origin, 'chrome-extension://test');
  onMessage({ origin: sent[0].origin, source: iframe.contentWindow, data: {
    action: 'renderer-ping', requestId: sent[0].message.requestId, value: { ready: true },
  } });
  assert.equal((await result).ready, true);
  assert.equal(listeners.has('load'), false);
});

test('a missing load event times out and removes its listener', async () => {
  const { system, iframe, listeners } = createSystem(() => {
    throw new Error("The target origin provided does not match the recipient window's origin");
  });
  await assert.rejects(system.publish(iframe, 'renderer-ping', {}, 10), /Iframe message timeout/);
  assert.equal(listeners.has('load'), false);
});
