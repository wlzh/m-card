const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const output = {};
const imageModule = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/(app)/components/ImageLayout.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
}).outputText, { exports: imageModule, require: () => ({ ...React, default: React }) });
const resultIconModule = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/(app)/components/ResultIcon.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
}).outputText, { exports: resultIconModule, require: () => ({ ...React, default: React }) });
const imports = {
  react: { ...React, default: React },
  '@/lib/utils': { cn: (...a) => a.join(' ') },
  '../ImageLayout': imageModule,
  '@assets/x-logo.svg': { default: { src: '/x.svg' } },
  '@assets/noise1.png': { default: { src: '/noise.png' } },
  '@src/app/utils/format': { formatTimestamp: () => 'TEST_TIME' },
  'lodash-es': { compact: a => a.filter(Boolean), uniq: a => [...new Set(a)], isArray: Array.isArray, last: a => a.at(-1) },
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/(app)/components/card-generator/twitter-card.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
}).outputText, { exports: output, require: id => { if (!imports[id]) throw new Error(id); return imports[id]; } });
function render(patch = {}) {
  const cardStyles = { width: 768, scale: 100, fontSize: 20, borderRadius: 12, controls: { showUser: true, showLogo: true, showFooter: true, showTime: true, showActions: true }, watermark: { enabled: true, text: '@wlzh' }, ...patch };
  return new JSDOM(renderToStaticMarkup(React.createElement(output.TwitterCard, { cardStyles, backgroundStyles: { padding: 32, borderRadius: 99, backgroundOpacity: 0.4, backgroundBlur: 3 }, xConfig: [{ username: 'AUTHOR', avatar: '/avatar.png', title: 'TITLE', text: 'BODY', images: [], time: 100, likes: 12 }] }))).window.document;
}
test('width, padding, body font and independent card radius are wired', () => {
  const doc = render();
  assert.equal(doc.querySelector('#card').style.width, '768px');
  assert.equal(doc.querySelector('#content').style.padding, '32px');
  assert.equal(doc.querySelector('.tweet-content').style.fontSize, '20px');
  assert.equal(doc.querySelector('.card-background-light').style.borderRadius, '12px');
});
test('footer sub-controls independently hide time and metrics', () => {
  const base = { showFooter: true, showUser: false, showLogo: false };
  const noTime = render({ controls: { ...base, showTime: false, showActions: true } }).body.textContent;
  assert.ok(!noTime.includes('TEST_TIME'));
  assert.ok(noTime.includes('likes'));
  const noActions = render({ controls: { ...base, showTime: true, showActions: false } }).body.textContent;
  assert.ok(noActions.includes('TEST_TIME'));
  assert.ok(!noActions.includes('likes'));
});
test('footer keeps time separate and aligns watermark with the final metrics row', () => {
  const doc = render();
  const footer = doc.querySelector('.card-footer');
  const time = doc.querySelector('.card-footer-time');
  const actions = doc.querySelector('.card-footer-actions');
  const bottom = doc.querySelector('.card-footer-bottom');
  const watermark = doc.querySelector('.card-footer-watermark');
  assert.equal(footer.style.display, 'flex');
  assert.equal(footer.style.flexDirection, 'column');
  assert.notEqual(footer.style.gap, '');
  assert.equal(time.style.whiteSpace, 'nowrap');
  assert.equal(actions.style.flexWrap, 'wrap');
  assert.notEqual(actions.style.gap, '');
  assert.equal(bottom.style.display, 'flex');
  assert.equal(bottom.style.alignItems, 'flex-end');
  assert.equal(watermark.style.marginLeft, 'auto');
});
test('watermark supports persisted custom value and off state independently of footer', () => {
  assert.ok(render({ watermark: { enabled: true, text: 'CUSTOM' }, controls: {} }).body.textContent.includes('CUSTOM'));
  assert.ok(!render({ watermark: { enabled: false, text: 'CUSTOM' } }).body.textContent.includes('CUSTOM'));
  const footerOff = render({ watermark: { enabled: true, text: 'CUSTOM' }, controls: { showFooter: false } });
  assert.ok(footerOff.querySelector('.card-footer-watermark'));
  assert.equal(footerOff.querySelector('.card-footer-time'), null);
  assert.equal(footerOff.querySelector('.card-footer-actions'), null);
});
test('background opacity and blur map to CSS, not unused custom attributes', () => {
  const doc = render();
  const bg = doc.querySelector('.absolute.inset-0');
  assert.equal(bg.style.opacity, '0.4');
  assert.equal(bg.style.filter, 'blur(3px)');
});
test('all layouts retain all eight article images', () => {
  for (const layout of ['vertical', 'grid2', 'grid4']) {
    const html = renderToStaticMarkup(React.createElement(imageModule.default, { layout, images: Array.from({ length: 8 }, (_, i) => `/image-${i}.png`) }));
    assert.equal(new JSDOM(html).window.document.querySelectorAll('img').length, 8);
  }
});
test('full articles render images between their surrounding text blocks', () => {
  const article = new JSDOM(renderToStaticMarkup(React.createElement(output.TwitterCard, {
    cardStyles: { width: 768, fontSize: 20, controls: {} },
    backgroundStyles: { padding: 24, backgroundOpacity: 1, backgroundBlur: 0 },
    xConfig: [{ username: 'AUTHOR', avatar: '', title: 'TITLE', text: 'FLAT', images: ['/cover.png'], articleMode: 'full', articleBlocks: [
      { type: 'paragraph', text: 'BEFORE' },
      { type: 'image', src: '/inline.png', alt: 'INLINE' },
      { type: 'paragraph', text: 'AFTER' },
    ], time: 0, replies: 0, shares: 0, likes: 0 }],
  }))).window.document;
  const body = article.querySelector('.tweet-content');
  assert.deepEqual(Array.from(body.children).map((node) => node.tagName === 'IMG' ? node.getAttribute('src') : node.textContent), ['BEFORE', '/inline.png', 'AFTER']);
  assert.equal(article.body.textContent.includes('FLAT'), false);
});
test('radial preset preview always emits a finite gradient stop', () => {
  const baseSettings = {
    backgroundFillType: 'Radial',
    backgroundStartColor: '#fff',
    backgroundEndColor: '#000',
    backgroundPosition: '50%,50%',
    backgroundRadius: 0,
  };
  const renderIcon = backgroundSpread => new JSDOM(renderToStaticMarkup(React.createElement(resultIconModule.default, {
    size: 20,
    isPreview: true,
    settings: { ...baseSettings, backgroundSpread },
  }))).window.document;

  assert.equal(renderIcon(undefined).querySelectorAll('stop')[1].getAttribute('offset'), '1');
  assert.equal(renderIcon(250).querySelectorAll('stop')[1].getAttribute('offset'), '1');
  assert.equal(renderIcon(-10).querySelectorAll('stop')[1].getAttribute('offset'), '0');
});
