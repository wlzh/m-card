import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = 'build/chrome-mv3-prod';
const expected = 'https://mcard.wlz.si/independent';
const forbidden = 'http://localhost:1947/independent';

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  }))).flat();
}

const scripts = (await files(root)).filter((path) => path.endsWith('.js'));
const contents = await Promise.all(scripts.map(async (path) => [path, await readFile(path, 'utf8')]));
const expectedFiles = contents.filter(([, content]) => content.includes(expected)).map(([path]) => path);
const forbiddenFiles = contents.filter(([, content]) => content.includes(forbidden)).map(([path]) => path);

if (!expectedFiles.length || forbiddenFiles.length) {
  console.error(JSON.stringify({ expected, expectedFiles, forbiddenFiles }, null, 2));
  process.exit(1);
}
console.log(`Verified production renderer in ${expectedFiles.length} extension bundle(s).`);
