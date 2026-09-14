import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({
    entryPoints: ['resources/js/components/public-page-sections.tsx'],
    bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic',
    packages: 'external', alias: { '@': './resources/js' },
});
// Resolve external packages from this test's location, not the data URL.
const source = bundle.outputFiles[0].text.replace(/from "([^".][^"]*)"/g, (_, name) => `from "${import.meta.resolve(name)}"`);
const { PublicPartOfSection } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const render = (link_url) => renderToStaticMarkup(createElement(PublicPartOfSection, {
    homeContent: { part_of: { logos: [{ id: 1, name: 'Group', image_url: '/logo.png', link_url }] } },
}));
assert.match(render('https://example.com/group'), /href="https:\/\/example.com\/group"/);
assert.match(render(null), /src="\/logo.png"/);
assert.doesNotMatch(render(null), /<a /);
assert.doesNotMatch(render('javascript:alert(1)'), /<a /);
console.log('Part Of links: clickable logo, optional URL and unsafe scheme checks passed.');
