import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const baseUrl = 'http://127.0.0.1:8000';
const docsBase = '/home/stardust/Documents/Client/2025/INDOTIX/2026/docs/role-user-guides';

const roleGuides = [
    {
        key: 'admin-utama',
        email: 'admin@indotix.id',
        password: 'password',
        outputDir: path.join(docsBase, 'generated-admin-utama-v2'),
        screenshots: [
            {
                key: 'login',
                path: '/login',
                auth: false,
                selectors: ['form', 'input[type="email"]', 'input[type="password"]', 'button[type="submit"]'],
                caption: 'Gambar 1: Halaman login admin utama.',
            },
            {
                key: 'dashboard',
                path: '/dashboard',
                selectors: ['aside', 'main section', '[data-slot="card"]'],
                caption: 'Gambar 2: Dashboard admin utama untuk memantau ringkasan operasional.',
            },
            {
                key: 'users',
                path: '/admin/users',
                selectors: ['form', 'table', 'button'],
                caption: 'Gambar 3: Halaman Kelola User untuk filter, lihat detail, dan hapus user.',
            },
            {
                key: 'special-admins-list',
                path: '/admin/system/special-admins',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 4: Halaman Kelola Admin Spesialis untuk menambah dan mengatur role admin khusus.',
            },
            {
                key: 'special-admins-create',
                path: '/admin/system/special-admins',
                clickSelectors: ['button'],
                clickText: 'Tambah Admin',
                selectors: ['[role="dialog"]', 'form', 'input', 'select', 'button'],
                caption: 'Gambar 5: Modal Tambah Admin Spesialis untuk mengisi nama, email, password, dan role.',
            },
        ],
    },
    {
        key: 'admin-academy',
        email: 'admin.academy@indotix.id',
        password: 'password',
        outputDir: path.join(docsBase, 'generated-admin-academy'),
        screenshots: [
            {
                key: 'dashboard',
                path: '/dashboard',
                selectors: ['aside', 'main section', '[data-slot="card"]'],
                caption: 'Gambar 1: Dashboard admin academy untuk melihat ringkasan kelas, booking, peserta, dan laporan.',
            },
            {
                key: 'classes',
                path: '/admin/academy/classes',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 2: Halaman Master Kelas untuk mengelola data kelas academy.',
            },
            {
                key: 'bookings',
                path: '/admin/academy/bookings',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 3: Halaman booking academy untuk memantau transaksi kelas.',
            },
            {
                key: 'finance',
                path: '/admin/academy/finance',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 4: Halaman keuangan academy untuk melihat ringkasan pendapatan dan refund.',
            },
        ],
    },
    {
        key: 'admin-retail',
        email: 'admin.retail@indotix.id',
        password: 'password',
        outputDir: path.join(docsBase, 'generated-admin-retail'),
        screenshots: [
            {
                key: 'dashboard',
                path: '/dashboard',
                selectors: ['aside', 'main section', '[data-slot="card"]'],
                caption: 'Gambar 1: Dashboard admin retail shop untuk melihat ringkasan produk, order, dan performa penjualan.',
            },
            {
                key: 'products',
                path: '/admin/retail-shop/products',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 2: Halaman Products untuk mengelola produk retail shop.',
            },
            {
                key: 'orders',
                path: '/admin/retail-shop/orders',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 3: Halaman Order & Transaksi untuk memantau pesanan retail.',
            },
            {
                key: 'reports',
                path: '/admin/retail-shop/reports',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 4: Halaman laporan retail untuk evaluasi performa penjualan.',
            },
        ],
    },
    {
        key: 'admin-special',
        email: 'admin.special@indotix.id',
        password: 'password',
        outputDir: path.join(docsBase, 'generated-admin-special-program'),
        screenshots: [
            {
                key: 'dashboard',
                path: '/dashboard',
                selectors: ['aside', 'main section', '[data-slot="card"]'],
                caption: 'Gambar 1: Dashboard admin special program untuk melihat ringkasan program dan transaksi.',
            },
            {
                key: 'programs',
                path: '/admin/special-programs',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 2: Halaman manajemen special program untuk membuat dan memperbarui program.',
            },
            {
                key: 'tickets',
                path: '/admin/special-programs/tickets',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 3: Halaman Produk Tiket untuk mengelola paket atau tiket special program.',
            },
            {
                key: 'scans',
                path: '/admin/special-programs/scans',
                selectors: ['section', 'table', 'form', 'video'],
                caption: 'Gambar 4: Halaman Monitoring QR untuk validasi peserta special program.',
            },
        ],
    },
    {
        key: 'affiliate-register',
        email: 'tester.webdoc@indotix.local',
        password: 'password',
        outputDir: path.join(docsBase, 'generated-affiliate-register'),
        screenshots: [
            {
                key: 'register',
                path: '/affiliate/register',
                selectors: ['form', 'input', 'select', 'button'],
                caption: 'Gambar 1: Form pendaftaran affiliate untuk mengaktifkan akses afiliasi wisata.',
            },
        ],
    },
    {
        key: 'affiliate',
        email: 'user@indotix.id',
        password: 'password',
        outputDir: path.join(docsBase, 'generated-affiliate'),
        screenshots: [
            {
                key: 'dashboard',
                path: '/affiliate',
                selectors: ['aside', 'main section', '[data-slot="card"]'],
                caption: 'Gambar 2: Dashboard affiliate untuk memantau performa klik, booking, dan komisi.',
            },
            {
                key: 'catalog',
                path: '/affiliate/catalog',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 3: Halaman katalog affiliate untuk melihat produk wisata yang bisa dipromosikan.',
            },
            {
                key: 'links',
                path: '/affiliate/links',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 4: Halaman link affiliate untuk membuat dan mengelola link promosi.',
            },
            {
                key: 'commissions',
                path: '/affiliate/commissions',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 5: Halaman komisi affiliate untuk melihat hasil promosi dan status komisi.',
            },
        ],
    },
    {
        key: 'mitra-generic',
        email: 'mitra@indotix.id',
        password: 'password',
        outputDir: path.join(docsBase, 'generated-mitra-generic'),
        screenshots: [
            {
                key: 'onboarding-select',
                path: '/mitra/onboarding',
                selectors: ['section', 'button', '[data-slot="card"]'],
                caption: 'Gambar 1: Halaman awal onboarding mitra untuk memilih jenis bisnis.',
            },
        ],
    },
    {
        key: 'mitra-wisata',
        email: 'digitalpelajar.id@gmail.com',
        password: 'password',
        outputDir: path.join(docsBase, 'generated-mitra-wisata'),
        screenshots: [
            {
                key: 'dashboard',
                path: '/mitra/dashboard',
                selectors: ['aside', 'main section', '[data-slot="card"]'],
                caption: 'Gambar 2: Dashboard mitra wisata untuk memantau ringkasan operasional destinasi.',
            },
            {
                key: 'tickets',
                path: '/mitra/wisata/tickets',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 3: Halaman Produk Tiket mitra wisata untuk mengelola tiket destinasi.',
            },
            {
                key: 'bookings',
                path: '/mitra/wisata/bookings',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 4: Halaman booking mitra wisata untuk memantau transaksi pengunjung.',
            },
            {
                key: 'finance',
                path: '/mitra/wisata/finance/summary',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 5: Halaman ringkasan pendapatan mitra wisata.',
            },
            {
                key: 'staff',
                path: '/mitra/wisata/staff',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 1: Halaman staff wisata untuk menambah dan mengatur staff operasional.',
            },
            {
                key: 'scans',
                path: '/mitra/wisata/scans',
                selectors: ['section', 'table', 'form', 'video'],
                caption: 'Gambar 2: Halaman validasi QR wisata untuk pemeriksaan tiket di lapangan.',
            },
            {
                key: 'disputes',
                path: '/mitra/wisata/disputes',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 3: Halaman laporan masalah wisata untuk mencatat kendala operasional.',
            },
        ],
    },
    {
        key: 'mitra-event',
        email: 'stardustexamp1@gmail.com',
        password: 'password',
        outputDir: path.join(docsBase, 'generated-mitra-event'),
        screenshots: [
            {
                key: 'events',
                path: '/mitra/events',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 6: Halaman event mitra untuk mengelola data event.',
            },
            {
                key: 'tickets',
                path: '/mitra/events/tickets',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 7: Halaman produk tiket event untuk mengelola tiket yang dijual.',
            },
            {
                key: 'bookings',
                path: '/mitra/events/bookings',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 8: Halaman booking event untuk memantau pesanan dan pembayaran.',
            },
            {
                key: 'staff',
                path: '/mitra/events/staff',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 4: Halaman staff event untuk menambah dan memperbarui role staff.',
            },
            {
                key: 'scans',
                path: '/mitra/events/scans',
                selectors: ['section', 'table', 'form', 'video'],
                caption: 'Gambar 5: Halaman validasi QR event untuk proses check-in peserta.',
            },
            {
                key: 'disputes',
                path: '/mitra/events/disputes',
                selectors: ['section', 'table', 'button'],
                caption: 'Gambar 6: Halaman laporan masalah event untuk eskalasi kendala operasional.',
            },
        ],
    },
];

function safeFileName(name) {
    return name.replaceAll(/[^a-z0-9-]+/gi, '-').toLowerCase();
}

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function sleep(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function dismissPotentialPopups(page) {
    const buttonTexts = ['Tutup', 'Close', 'Nanti', 'Lewati', 'OK'];
    const handles = await page.$$('button');
    for (const handle of handles) {
        const text = await page.evaluate((el) => (el.textContent || '').trim(), handle);
        if (buttonTexts.includes(text)) {
            await handle.click().catch(() => {});
        }
    }
}

async function highlight(page, selectors) {
    await page.evaluate((items) => {
        const prev = document.querySelectorAll('[data-guide-highlight="true"]');
        prev.forEach((el) => {
            el.style.outline = '';
            el.style.outlineOffset = '';
            el.style.borderRadius = '';
            el.removeAttribute('data-guide-highlight');
        });
        const unique = new Set();
        for (const selector of items) {
            document.querySelectorAll(selector).forEach((el) => {
                if (unique.has(el)) return;
                unique.add(el);
                el.setAttribute('data-guide-highlight', 'true');
                el.style.outline = '4px solid #ef4444';
                el.style.outlineOffset = '4px';
                el.style.borderRadius = '12px';
                el.style.scrollMarginTop = '24px';
            });
        }
    }, selectors);
}

async function clickByText(page, selector, text) {
    const clicked = await page.evaluate(({ selector, text }) => {
        const nodes = Array.from(document.querySelectorAll(selector));
        const target = nodes.find((node) => (node.textContent || '').trim().includes(text));
        if (!target) return false;
        target.click();
        return true;
    }, { selector, text });

    if (!clicked) {
        throw new Error(`Tidak menemukan elemen ${selector} dengan teks ${text}`);
    }
}

async function login(page, email, password) {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', email, { delay: 10 });
    await page.type('input[type="password"]', password, { delay: 10 });
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => null),
        page.click('button[type="submit"]'),
    ]);
}

async function capture(browser, guide) {
    await ensureDir(guide.outputDir);
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    await login(page, guide.email, guide.password);

    const manifest = [];

    for (const item of guide.screenshots) {
        if (item.auth === false) {
            const cleanContext = await browser.createBrowserContext();
            const cleanPage = await cleanContext.newPage();
            cleanPage.setDefaultTimeout(60000);
            await cleanPage.goto(`${baseUrl}${item.path}`, { waitUntil: 'networkidle2' });
            await cleanPage.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1 });
            await sleep(400);
            await highlight(cleanPage, item.selectors);
            await sleep(200);
            const filePath = path.join(guide.outputDir, `${safeFileName(item.key)}.png`);
            await cleanPage.screenshot({ path: filePath, fullPage: true });
            await cleanPage.close();
            await cleanContext.close();
            manifest.push({ ...item, image: filePath });
            console.log(`[${guide.key}] captured ${item.key}`);
            continue;
        }

        await page.goto(`${baseUrl}${item.path}`, { waitUntil: 'networkidle2' });
        await dismissPotentialPopups(page);
        await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1 });
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(400);

        if (item.clickSelectors && item.clickText) {
            for (const selector of item.clickSelectors) {
                try {
                    await clickByText(page, selector, item.clickText);
                    break;
                } catch {
                    continue;
                }
            }
            await sleep(600);
        }

        await highlight(page, item.selectors);
        await sleep(200);

        const filePath = path.join(guide.outputDir, `${safeFileName(item.key)}.png`);
        await page.screenshot({ path: filePath, fullPage: true });
        manifest.push({ ...item, image: filePath });
        console.log(`[${guide.key}] captured ${item.key}`);
    }

    await fs.writeFile(path.join(guide.outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    await page.close();
    await context.close();
}

async function main() {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1600, height: 1200, deviceScaleFactor: 1 },
    });

    for (const guide of roleGuides) {
        try {
            await capture(browser, guide);
        } catch (error) {
            console.error(`[${guide.key}] FAILED`, error.message);
        }
    }

    await browser.close();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
