const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function frame(message) {
  const body = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(body.length);
  return Buffer.concat([header, body]);
}

function parseFrames(output) {
  const messages = [];
  for (let offset = 0; offset < output.length;) {
    const length = output.readUInt32LE(offset);
    offset += 4;
    messages.push(JSON.parse(output.subarray(offset, offset + length).toString()));
    offset += length;
  }
  return messages;
}

test('Photos host accepts ordered image chunks and rejects invalid input without opening Photos',
  { skip: process.platform !== 'darwin' }, () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mcard-photos-test-'));
    try {
      const binary = path.join(directory, 'photos-host');
      const compile = spawnSync('swiftc', [path.join(root, 'native/photos-helper/main.swift'), '-o', binary], { encoding: 'utf8' });
      assert.equal(compile.status, 0, compile.stderr);

      const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
      const valid = spawnSync(binary, [], {
        input: Buffer.concat([
          frame({ type: 'start', format: 'png' }),
          frame({ type: 'chunk', index: 0, data: pngHeader.toString('base64') }),
        ]),
        timeout: 10_000,
      });
      assert.equal(valid.status, 0, valid.stderr.toString());
      assert.deepEqual(parseFrames(valid.stdout), [{ type: 'ready' }, { type: 'chunk', index: 0 }]);

      const invalid = spawnSync(binary, [], {
        input: Buffer.concat([
          frame({ type: 'start', format: 'png' }),
          frame({ type: 'chunk', index: 1, data: pngHeader.toString('base64') }),
        ]),
        timeout: 10_000,
      });
      assert.equal(invalid.status, 0, invalid.stderr.toString());
      assert.equal(parseFrames(invalid.stdout)[1].type, 'error');
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

test('Photos button uses a native host only for PNG/JPEG and declares permission', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const toast = fs.readFileSync(path.join(root, 'src/components/extension/x-cards-toast/index.tsx'), 'utf8');
  const background = fs.readFileSync(path.join(root, 'src/background/index.ts'), 'utf8');
  assert.ok(pkg.manifest.permissions.includes('nativeMessaging'));
  assert.match(toast, /importImageToPhotos\(data\.dataUrl\)/);
  assert.match(toast, /\['png', 'jpeg'\]\.includes\(activeFormat\)/);
  assert.match(background, /chrome\.runtime\.connectNative\(PHOTOS_HOST\)/);
});
