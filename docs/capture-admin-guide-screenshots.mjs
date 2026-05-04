import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const baseUrl = 'http://127.0.0.1:8000';
const outputDir = '/home/stardust/Documents/Client/2025/INDOTIX/2026/docs/role-user-guides/generated-admin-utama';

const screenshots = [
    {
        key: 'banner',
        url: '/admin/public/banners/create',
        title: 'Konten Publik - Banner',
        selectors: ['form', 'h1'],
        caption: 'Gambar 1. Form tambah banner pada menu Konten Publik.',
    },
    {
        key: 'promo-video',
        url: '/admin/public/promo-videos/create',
        title: 'Konten Publik - Promo Video',
        selectors: ['form', 'h1'],
        caption: 'Gambar 2. Form tambah promo video pada menu Konten Publik.',
    },
    {
        key: 'promo-item',
        url: '/admin/public/promo-items/create',
        title: 'Konten Publik - Promo Item',
        selectors: ['form', 'h1'],
        caption: 'Gambar 3. Form tambah promo terkini pada menu Konten Publik.',
    },
    {
        key: 'partner',
        url: '/admin/public/partners/create',
        title: 'Konten Publik - Partner',
        selectors: ['form', 'h1'],
        caption: 'Gambar 4. Form tambah partner pada menu Konten Publik.',
    },
    {
        key: 'faq',
        url: '/admin/public/faqs/create',
        title: 'Konten Publik - FAQ',
        selectors: ['form', 'h1'],
        caption: 'Gambar 5. Form tambah FAQ pada menu Konten Publik.',
    },
    {
        key: 'about',
        url: '/admin/public/about',
        title: 'Konten Publik - About',
        selectors: ['form', 'h1'],
        caption: 'Gambar 6A. Halaman pengelolaan About pada menu Konten Publik.',
    },
    {
        key: 'contacts',
        url: '/admin/public/contacts',
        title: 'Konten Publik - Kontak',
        selectors: ['form', 'h1'],
        caption: 'Gambar 6B. Halaman pengelolaan Kontak pada menu Konten Publik.',
    },
    {
        key: 'privacy',
        url: '/admin/public/privacy-policy',
        title: 'Konten Publik - Privacy Policy',
        selectors: ['form', 'h1'],
        caption: 'Gambar 6C. Halaman pengelolaan Privacy Policy pada menu Konten Publik.',
    },
    {
        key: 'events',
        url: '/admin/events',
        title: 'Produk - Event',
        selectors: ['section', 'table'],
        caption: 'Gambar 7. Halaman manajemen Event di dashboard admin.',
    },
    {
        key: 'wisata',
        url: '/admin/wisata/destinations',
        title: 'Produk - Wisata',
        selectors: ['section', 'table'],
        caption: 'Gambar 8. Halaman master destinasi wisata di dashboard admin.',
    },
    {
        key: 'special-program',
        url: '/admin/special-programs',
        title: 'Produk - Special Program',
        selectors: ['section', 'table'],
        caption: 'Gambar 9. Halaman manajemen Special Program di dashboard admin.',
    },
    {
        key: 'academy',
        url: '/admin/academy/classes',
        title: 'Produk - Academy',
        selectors: ['section', 'table'],
        caption: 'Gambar 10. Halaman master kelas Eljohn Academy di dashboard admin.',
    },
    {
        key: 'retail',
        url: '/admin/retail-shop/products',
        title: 'Produk - Retail Shop',
        selectors: ['section', 'table'],
        caption: 'Gambar 11. Halaman master produk Retail Shop di dashboard admin.',
    },
    {
        key: 'hotels',
        url: '/hotels',
        title: 'Produk - Hotel',
        selectors: ['section', 'table'],
        caption: 'Gambar 12. Halaman pengelolaan hotel pada dashboard admin.',
    },
    {
        key: 'bookings',
        url: '/admin/bookings',
        title: 'Transaksi - Booking',
        selectors: ['section', 'table'],
        caption: 'Gambar 13A. Halaman booking hotel untuk pemantauan transaksi.',
    },
    {
        key: 'event-scans',
        url: '/admin/events/scans',
        title: 'Transaksi - Monitoring QR',
        selectors: ['video', 'table', 'form'],
        caption: 'Gambar 13B. Halaman monitoring QR event untuk validasi kehadiran.',
    },
    {
        key: 'reviews',
        url: '/admin/reviews',
        title: 'Admin Utama - Ulasan Produk',
        selectors: ['section', 'table'],
        caption: 'Gambar 14. Halaman ulasan produk untuk filter, balas, dan moderasi review.',
    },
    {
        key: 'notifications',
        url: '/admin/system/notifications',
        title: 'Sistem - Notifikasi',
        selectors: ['section', 'form', 'table'],
        caption: 'Gambar 15. Halaman Notification Control untuk broadcast dan template notifikasi.',
    },
    {
        key: 'settings',
        url: '/admin/system/settings',
        title: 'Sistem - Pengaturan',
        selectors: ['form', 'h1'],
        caption: 'Gambar 16. Halaman konfigurasi sistem untuk parameter operasional utama.',
    },
    {
        key: 'audit-logs',
        url: '/admin/system/audit-logs',
        title: 'Sistem - Audit Log',
        selectors: ['section', 'table'],
        caption: 'Gambar 17. Halaman audit log untuk menelusuri aktivitas admin.',
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

async function highlight(page, selectors) {
    await page.evaluate((items) => {
        const previous = document.querySelectorAll('[data-guide-highlight="true"]');
        previous.forEach((el) => {
            el.style.outline = '';
            el.style.outlineOffset = '';
            el.style.borderRadius = '';
            el.removeAttribute('data-guide-highlight');
        });

        const unique = new Set();
        items.forEach((selector) => {
            document.querySelectorAll(selector).forEach((el) => {
                if (unique.has(el)) return;
                unique.add(el);
                el.setAttribute('data-guide-highlight', 'true');
                el.style.outline = '4px solid #ef4444';
                el.style.outlineOffset = '4px';
                el.style.borderRadius = '12px';
                el.style.scrollMarginTop = '24px';
            });
        });
    }, selectors);
}

async function dismissPotentialPopups(page) {
    const candidates = [
        'button[aria-label="Close"]',
        'button[data-slot="dialog-close"]',
        'button',
    ];

    for (const selector of candidates) {
        const handles = await page.$$(selector);
        for (const handle of handles) {
            const text = await page.evaluate((el) => (el.textContent || '').trim(), handle);
            if (['Tutup', 'Close', 'Nanti', 'Lewati'].includes(text)) {
                await handle.click().catch(() => {});
            }
        }
    }
}

async function login(page) {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'admin@indotix.id', { delay: 20 });
    await page.type('input[type="password"]', 'password', { delay: 20 });

    const submitButton = await page.$('button[type="submit"]');
    if (!submitButton) throw new Error('Submit button login tidak ditemukan');

    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        submitButton.click(),
    ]);
}

async function capture(page, item) {
    await page.goto(`${baseUrl}${item.url}`, { waitUntil: 'networkidle2' });
    await dismissPotentialPopups(page);
    await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(400);
    await highlight(page, item.selectors);
    await sleep(200);

    const filePath = path.join(outputDir, `${safeFileName(item.key)}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    return filePath;
}

async function main() {
    await ensureDir(outputDir);

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1600, height: 1200, deviceScaleFactor: 1 },
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    await login(page);

    const manifest = [];
    for (const item of screenshots) {
        const image = await capture(page, item);
        manifest.push({
            ...item,
            image,
        });
        console.log(`captured ${item.key}`);
    }

    await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    await browser.close();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
