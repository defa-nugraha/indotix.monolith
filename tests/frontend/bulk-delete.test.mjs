import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer';

const bundle = await build({
    entryPoints: ['tests/frontend/fixtures/bulk-delete-page.tsx'],
    bundle: true,
    write: false,
    format: 'iife',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"development"' },
    alias: {
        '@': './resources/js',
        '@inertiajs/react': './tests/frontend/fixtures/bulk-delete-inertia.tsx',
    },
});
const manifest = JSON.parse(
    await readFile('public/build/manifest.json', 'utf8'),
);
const cssPath =
    manifest['resources/css/app.css']?.file ??
    manifest['resources/js/app.tsx'].css[0];
const css = await readFile(resolve('public/build', cssPath));
const server = createServer((req, res) => {
    res.setHeader(
        'Content-Type',
        req.url === '/app.js'
            ? 'text/javascript'
            : req.url === '/app.css'
              ? 'text/css'
              : 'text/html',
    );
    res.end(
        req.url === '/app.js'
            ? bundle.outputFiles[0].text
            : req.url === '/app.css'
              ? css
              : '<!doctype html><html lang="id"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><body><div id="root"></div><script src="/app.js"></script></body></html>',
    );
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
});
const page = await browser.newPage();
const exceptions = [];
page.on('pageerror', (error) => exceptions.push(error.message));
const all = 'thead input[type=checkbox]';
const row = (id) => `input[aria-label="Pilih data ${id} untuk dihapus"]`;
const open = async (options = {}) => {
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(() => typeof window.configure === 'function');
    await page.evaluate((value) => window.configure(value), options);
    await page.waitForSelector(all);
};
const waitCalls = (count) =>
    page.waitForFunction((n) => window.calls().length === n, {}, count);
const result = () =>
    page.waitForFunction(() =>
        document
            .querySelector('.swal2-title')
            ?.textContent?.startsWith('Penghapusan'),
    );
try {
    await open({ ids: [1, 2, 99] });
    assert.equal(await page.$eval('button', (button) => button.disabled), true);
    await page.click(row(1));
    assert.equal(await page.$eval(all, (input) => input.indeterminate), true);
    await page.click('button');
    await page.waitForSelector('.swal2-cancel');
    await page.click('.swal2-cancel');
    await page.waitForSelector('.swal2-container', { hidden: true });
    assert.equal(await page.evaluate(() => window.calls().length), 0);
    await page.waitForFunction(
        () => !document.querySelector('button').disabled,
    );
    await page.click(all);
    assert.equal(
        await page.$$eval('tbody input:checked', (inputs) => inputs.length),
        2,
    );
    await page.evaluate(() => window.navigate());
    await page.waitForSelector(row(4));
    assert.equal(
        await page.$$eval('input:checked', (inputs) => inputs.length),
        0,
    );

    await open();
    await page.click(row(1));
    await page.click(row(3));
    await page.click('button');
    await page.waitForSelector('.swal2-confirm');
    await page.click('.swal2-confirm');
    await result();
    assert.deepEqual(
        await page.evaluate(() => window.calls().map((call) => call.url)),
        ['/admin/test/1', '/admin/test/3'],
    );
    assert.ok(await page.$(row(2)));

    for (const failureMode of ['validation', 'cancel', 'redirect', 'http']) {
        await open({ failure: '/admin/test/2', failureMode });
        await page.click(all);
        await page.click('button');
        await page.waitForSelector('.swal2-confirm');
        await page.click('.swal2-confirm');
        await result();
        assert.equal(
            await page.$eval('.swal2-title', (node) => node.textContent),
            'Penghapusan dihentikan',
        );
        assert.deepEqual(
            await page.evaluate(() => window.calls().map((call) => call.url)),
            ['/admin/test/1', '/admin/test/2'],
        );
    }

    await open({ reason: true, delay: 250 });
    await page.click(all);
    await page.click('button');
    await page.waitForSelector('.swal2-confirm');
    await page.click('.swal2-confirm');
    await page.waitForSelector('.swal2-validation-message', { visible: true });
    assert.equal(await page.evaluate(() => window.calls().length), 0);
    await page.type('textarea', 'Tiket tidak digunakan');
    await page.click('.swal2-confirm');
    await waitCalls(1);
    assert.equal(await page.$eval('button', (node) => node.disabled), true);
    await page.evaluate(() => document.querySelector('button').click());
    await result();
    assert.equal(await page.evaluate(() => window.calls().length), 3);
    assert.equal(
        await page.evaluate(() => window.calls()[0].data.reason),
        'Tiket tidak digunakan',
    );

    await open({ delay: 150 });
    await page.click(all);
    await page.click('button');
    await page.waitForSelector('.swal2-confirm');
    await page.click('.swal2-confirm');
    await waitCalls(1);
    await page.evaluate(() => window.leave());
    await new Promise((done) => setTimeout(done, 500));
    assert.equal(await page.evaluate(() => window.calls().length), 1);

    await open({ delay: 250 });
    await page.click(all);
    await page.click('button');
    await page.waitForSelector('.swal2-confirm');
    await page.click('.swal2-confirm');
    await waitCalls(1);
    await page.evaluate(() => window.navigate());
    await result();
    assert.equal(await page.evaluate(() => window.calls().length), 1);

    await open();
    await page.click(all);
    await page.click('button');
    await page.waitForSelector('.swal2-confirm');
    await page.evaluate(() => window.navigate());
    await page.click('.swal2-confirm');
    await page.waitForSelector('.swal2-container', { hidden: true });
    assert.equal(await page.evaluate(() => window.calls().length), 0);

    await open({ ids: [] });
    assert.equal(await page.$eval(all, (node) => node.disabled), true);
    const evidence = '/tmp/indotix-bulk-delete-evidence';
    await mkdir(evidence, { recursive: true });
    for (const width of [375, 1280]) {
        await page.setViewport({ width, height: 800 });
        await open();
        await page.click(row(1));
        assert.equal(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
        );
        await page.screenshot({
            path: `${evidence}/${width}.png`,
            fullPage: true,
        });
    }
    assert.deepEqual(exceptions, []);
    console.log(
        'Bulk delete browser tests passed: selection, cancellation, pagination, partial failure, reason, double submit, unmount and responsive layout.',
    );
} finally {
    await browser.close();
    await new Promise((done) => server.close(done));
}
