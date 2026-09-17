import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'docs/user-guide-mitra');
const target = path.join(root, 'public/guides/mitra');
const html = await readFile(path.join(source, 'user-guide-mitra.html'), 'utf8');
const screenshots = JSON.parse(await readFile(path.join(source, 'screenshot-map.json'), 'utf8'));
const assets = ['assets/logo/indotix.png'];
for (const entry of screenshots) {
    if (!/^[a-z0-9-]+\.png$/.test(entry.annotated)) throw new Error('Invalid guide screenshot filename.');
    assets.push(`assets/annotated/${entry.annotated}`);
}
// Validate the complete allowlist before replacing generated public output.
await Promise.all(assets.map(asset => readFile(path.join(source, asset))));
await rm(target, { recursive: true, force: true });
for (const asset of assets) {
    const destination = path.join(target, asset);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(path.join(source, asset), destination);
}
// Keep section anchors relative to the public route, not the static asset directory.
await writeFile(path.join(target, 'index.html'), html.replaceAll('"assets/', '"/guides/mitra/assets/'));
console.log(`Published Mitra guide and ${assets.length} public assets.`);
