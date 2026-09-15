import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';
import {baseUrl, guidePassword, output} from './runtime.mjs';

export async function launch() {
    const browser = await puppeteer.launch({executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox']});
    const page = await browser.newPage();
    await page.setViewport({width: 1440, height: 900, deviceScaleFactor: 2});
    await page.emulateMediaFeatures([{name: 'prefers-color-scheme', value: 'light'}]);
    page.setDefaultTimeout(20000);
    return {browser, page};
}
export async function settle(page) {
    await page.waitForNetworkIdle({idleTime: 400, timeout: 12000}).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await new Promise(resolve => setTimeout(resolve, 1050));
    const close = await page.$('button[aria-label="Tutup panduan"]');
    if (close) await close.click();
    const later = await find(page, 'text:Nanti saja', false);
    if (later) await later.click();
}
export async function goto(page, route) {
    const response = await page.goto(baseUrl + route, {waitUntil: 'networkidle2'});
    if (!response?.ok()) throw new Error(`HTTP ${response?.status()} at ${route}`);
    await settle(page);
}
export async function find(page, spec, required = true) {
    const handle = await page.evaluateHandle(spec => {
        const visible = el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
        const norm = text => text.replaceAll('*', '').replace(/\s+/g, ' ').trim();
        if (spec.startsWith('field:')) {
            const label = [...document.querySelectorAll('label')].find(el => norm(el.textContent) === spec.slice(6) && visible(el));
            return label?.parentElement ?? null;
        }
        if (spec.startsWith('text:')) {
            return [...document.querySelectorAll('button,a,h1,h2,h3,label,p,span,div')]
                .filter(el => norm(el.textContent) === spec.slice(5) && visible(el))
                .sort((a,b) => Number(b.matches('button,a'))-Number(a.matches('button,a')) || a.children.length-b.children.length)[0] ?? null;
        }
        return document.querySelector(spec);
    }, spec);
    const element = handle.asElement();
    if (!element && required) throw new Error(`Missing target: ${spec} on ${page.url()}`);
    return element;
}
export async function click(page, spec) {
    const el = await find(page, spec);
    await el.scrollIntoView();
    await el.click();
    await settle(page);
}
export async function fill(page, spec, value) {
    let el = await find(page, spec);
    if (spec.startsWith('field:')) el = await el.$('input:not([type=hidden]),textarea');
    if (!el) throw new Error(`Input missing: ${spec}`);
    await el.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await el.press('Backspace');
    await el.type(value);
}
export async function login(page, email = 'pengelola@example.com') {
    await goto(page, '/login');
    await fill(page, 'input[type=email]', email);
    await fill(page, 'input[type=password]', guidePassword);
    await click(page, 'button[type=submit]');
    if (page.url().endsWith('/login')) throw new Error('Login did not complete.');
}
export async function capture(page, entry, map) {
    if (entry.focus) {
        const focus = await find(page, entry.focus);
        await focus.evaluate(el => el.scrollIntoView({block: 'center', behavior: 'instant'}));
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    const broken = await page.evaluate(() => [...document.images].filter(el => el.getBoundingClientRect().width && (!el.complete || el.naturalWidth === 0)).map(el => el.getAttribute('src')));
    if (broken.length) throw new Error(`Broken images at ${entry.id}: ${broken.join(',')}`);
    await fs.mkdir(path.join(output, 'assets/screenshots'), {recursive: true});
    await fs.mkdir(path.join(output, 'assets/annotated'), {recursive: true});
    const screenshot = `${entry.id}.png`;
    const annotated = `${entry.id}-annotated.png`;
    await page.screenshot({path: path.join(output, 'assets/screenshots', screenshot)});
    const annotations = [];
    for (let i = 0; i < entry.annotations.length; i++) {
        const [selector, label, description] = entry.annotations[i];
        const el = await find(page, selector);
        const box = await el.boundingBox();
        if (!box || box.y < 0 || box.y + box.height > 900 || box.x < 0 || box.x + box.width > 1440) {
            throw new Error(`Callout outside viewport: ${entry.id} ${label} ${JSON.stringify(box)}`);
        }
        annotations.push({number: i + 1, label, description, selector, bounds: box});
    }
    await page.evaluate(items => {
        const layer = document.createElement('div');
        layer.id = 'documentation-annotations';
        layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
        for (const item of items) {
            const {x,y,width,height} = item.bounds;
            const box = document.createElement('div');
            box.style.cssText = `position:absolute;left:${Math.max(1,x-3)}px;top:${Math.max(1,y-3)}px;width:${width+6}px;height:${height+6}px;border:2px solid #008dcc;border-radius:6px;box-sizing:border-box;box-shadow:0 0 0 1px white`;
            const badge = document.createElement('div');
            badge.textContent = String(item.number);
            const badgeX = width < 120 || x < 36 ? x : x-34;
            const badgeY = width < 120 || x < 36 ? y-34 : y;
            badge.style.cssText = `position:absolute;left:${Math.max(3,badgeX)}px;top:${Math.max(3,badgeY)}px;width:28px;height:28px;border:2px solid white;border-radius:50%;background:#008dcc;color:white;display:grid;place-items:center;font:700 16px Arial;box-shadow:0 2px 5px #0003`;
            layer.append(box,badge);
        }
        document.body.append(layer);
    }, annotations);
    await page.screenshot({path: path.join(output, 'assets/annotated', annotated)});
    await page.evaluate(() => document.getElementById('documentation-annotations').remove());
    map.push({...entry, route: entry.routeTemplate ?? new URL(page.url()).pathname + new URL(page.url()).search, screenshot, annotated, annotations,
        viewport: {width:1440,height:900,deviceScaleFactor:2}, capturedAt:new Date().toISOString()});
    await fs.writeFile(path.join(output, 'screenshot-map.json'), JSON.stringify(map,null,2));
    console.log(`Captured ${entry.id}`);
}
