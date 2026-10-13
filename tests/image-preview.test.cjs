const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');

const source = ts.transpileModule(
  fs.readFileSync('src/components/extension/x-cards-toast/image-preview.tsx', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } },
).outputText;

function loadPreview(imageSrc) {
  const output = {};
  const icon = (props) => React.createElement('svg', props);
  const imports = {
    react: { ...React, default: React },
    'lucide-react': { ZoomIn: icon, ZoomOut: icon, RotateCcw: icon },
    '../use-tweet-collection': { useTweetsStore: selector => selector({ imageSrc }) },
  };
  vm.runInNewContext(source, {
    exports: output,
    require: id => {
      if (!imports[id]) throw new Error(id);
      return imports[id];
    },
  });
  return output.default;
}

function render(imageSrc, format = 'png') {
  const Component = loadPreview(imageSrc);
  return new JSDOM(renderToStaticMarkup(React.createElement(Component, { format }))).window.document;
}

test('an empty image source is a loading state, not a load failure', () => {
  const doc = render('');
  assert.equal(doc.querySelector('img'), null);
  assert.match(doc.body.textContent, /Generating preview/);
  assert.doesNotMatch(doc.body.textContent, /Failed to load image/);
});

test('image and data export formats render the matching preview mode', () => {
  assert.equal(render('data:image/png;base64,AA==', 'png').querySelector('img').getAttribute('src'), 'data:image/png;base64,AA==');
  const dataExport = render('data:image/png;base64,AA==', 'json');
  assert.equal(dataExport.querySelector('img'), null);
  assert.match(dataExport.body.textContent, /JSON is a data export/);
});

test('a stale image error is scoped to the source that actually failed', () => {
  const componentSource = fs.readFileSync('src/components/extension/x-cards-toast/image-preview.tsx', 'utf8');
  assert.match(componentSource, /failedSrc === imageSrc/);
  assert.match(componentSource, /failedImage\.naturalWidth === 0/);
  assert.match(componentSource, /current === loadedSrc \? null : current/);
});

test('initial generation completion is settled on success, failure, or toast unmount', () => {
  const toastSource = fs.readFileSync('src/components/extension/x-cards-toast/index.tsx', 'utf8');

  assert.match(toastSource, /const finishInitialGeneration/);
  assert.match(toastSource, /finally \{[\s\S]*finishInitialGeneration\(\)/);
  assert.match(toastSource, /return \(\) => finishInitialGeneration\(\)/);
});
