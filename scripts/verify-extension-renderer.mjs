import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = 'build/chrome-mv3-prod';
const expectedCloudFallback = 'https://mcard.wlz.si/independent';
const expectedLocalPage = 'tabs/renderer.html';
const forbidden = 'http://localhost:1947/independent';

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  }))).flat();
}

const scripts = (await files(root)).filter((path) => path.endsWith('.js'));
const localPage = await readFile(join(root, expectedLocalPage), 'utf8');
const contents = await Promise.all(scripts.map(async (path) => [path, await readFile(path, 'utf8')]));
const fallbackFiles = contents.filter(([, content]) => content.includes(expectedCloudFallback)).map(([path]) => path);
const localPageFiles = contents.filter(([, content]) => content.includes(expectedLocalPage)).map(([path]) => path);
const forbiddenFiles = contents.filter(([, content]) => content.includes(forbidden)).map(([path]) => path);
const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
const packageVersion = JSON.parse(await readFile('package.json', 'utf8')).version;
const localPageExposed = manifest.web_accessible_resources?.some((entry) =>
  entry.matches?.includes('https://x.com/*') && entry.resources?.includes(expectedLocalPage));

const localPageHasBundle = /<script[^>]+src="[^"]+\.js"/.test(localPage);

if (manifest.version !== packageVersion || !fallbackFiles.length || !localPageFiles.length || !localPageExposed || !localPageHasBundle || forbiddenFiles.length) {
  console.error(JSON.stringify({ packageVersion, manifestVersion: manifest.version, expectedCloudFallback, fallbackFiles, expectedLocalPage, localPageFiles, localPageExposed, localPageHasBundle, forbiddenFiles }, null, 2));
  process.exit(1);
}
console.log(`Verified local-first renderer with cloud fallback in ${fallbackFiles.length} extension bundle(s).`);
