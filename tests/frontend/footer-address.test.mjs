import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({
    entryPoints: ['resources/js/components/footer-address.tsx'],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
});
const { FooterAddress } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const render = (contact) => renderToStaticMarkup(createElement(FooterAddress, { contact }));

const rich = render({ address: 'unused raw value', address_html: '<p><strong>Kantor</strong></p><p>Jakarta<br>Indonesia</p>' });
assert.ok(rich.includes('<strong>Kantor</strong>'));
assert.ok(rich.includes('Jakarta<br>Indonesia'));
assert.ok(!rich.includes('&lt;p&gt;'));
assert.ok(!rich.includes('unused raw value'));

const legacy = render({ address: 'Kantor\nJakarta\\nIndonesia' });
assert.ok(legacy.includes('Kantor\nJakarta\nIndonesia'));
assert.ok(legacy.includes('whitespace-pre-line'));
assert.ok(render({ address: '<script>alert(1)</script>' }).includes('&lt;script&gt;'));
assert.ok(!render({ address: 'raw', address_html: '' }).includes('>raw<'));
assert.ok(render(null).includes('Neo Soho Capital'));
console.log('Footer address: rich HTML, legacy newlines, escaping and empty states passed.');
