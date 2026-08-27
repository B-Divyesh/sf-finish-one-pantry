import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');
const manifest = JSON.parse(await readFile(resolve(dist, '.vite/manifest.json'), 'utf8'));
const generated = new Set(['/index.html', '/privacy/index.html', '/terms/index.html']);
for (const entry of Object.values(manifest)) {
  if (entry.file) generated.add(`/${entry.file}`);
  for (const css of entry.css ?? []) generated.add(`/${css}`);
  for (const asset of entry.assets ?? []) generated.add(`/${asset}`);
}
const swPath = resolve(dist, 'sw.js');
const sw = await readFile(swPath, 'utf8');
await writeFile(swPath, sw.replace('__BUILD_ASSETS__', JSON.stringify([...generated])));
