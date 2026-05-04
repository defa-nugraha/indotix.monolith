import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const baseUrl = 'http://127.0.0.1:8000';
const outputDir = '/home/stardust/Documents/Client/2025/INDOTIX/2026/docs/role-user-guides/generated-mitra-refactor';

const guides = [
    {
        key: 'login',
        email: null,
        password: null,
        pages: [
            {
                key: 'login',
                path: '/login',
                caption: 'Gambar 1: Halaman login mitra untuk masuk menggunakan email dan password.',
                selectors: ['form', 'input[type="email"]', 'input[type="password"]', 'button[type="submit"]'],
            },
        ],
    },
    {
        key: 'generic',
        email: 'mitra.baru.guide@indotix.id',
        password: 'password',
        pages: [
            {
                key: 'onboarding-select',
                path: '/mitra/onboarding',
                caption: 'Gambar 2: Halaman pilihan jenis mitra untuk memilih bisnis Hotel, Wisata, atau Event.',
                selectors: ['main', 'section', 'button', '[data-slot="card"]'],
            },
        ],
    },
    {
        key: 'hotel',
        email: 'mitra.hotel.guide@indotix.id',
        password: 'password',
        pages: [
            {
                key: 'hotel-dashboard',
                path: '/mitra/dashboard',
                caption: 'Gambar 3: Dashboard mitra hotel untuk memantau reservasi, pendapatan, kamar, dan status akun.',
                selectors: ['aside', 'main section', '[data-slot="card"]'],
            },
            {
                key: 'hotel-list',
                path: '/mitra/hotels',
                caption: 'Gambar 4: Halaman Hotel Saya untuk mengelola data hotel yang dijual di INDOTIX.',
                selectors: ['main section', 'table', 'button', 'a'],
            },
            {
                key: 'hotel-room-types',
                path: '/mitra/room-types',
                caption: 'Gambar 5: Halaman tipe kamar untuk mengatur nama kamar, kapasitas, fasilitas, harga, dan kuota.',
                selectors: ['main section', 'table', 'button', 'a'],
            },
            {
                key: 'hotel-room-inventory',
                path: '/mitra/room-inventories',
                caption: 'Gambar 6: Halaman inventory kamar untuk mengatur ketersediaan kamar berdasarkan tanggal.',
                selectors: ['main section', 'table', 'button', 'form'],
            },
            {
                key: 'hotel-bookings',
                path: '/mitra/bookings',
                caption: 'Gambar 7: Halaman booking hotel untuk memantau reservasi, pembayaran, status menginap, refund, dan dispute.',
                selectors: ['main section', 'table', 'form', 'button'],
            },
            {
                key: 'hotel-finance',
                path: '/mitra/finance/summary',
                caption: 'Gambar 8: Halaman ringkasan keuangan hotel untuk memantau pendapatan dan performa transaksi.',
                selectors: ['main section', '[data-slot="card"]', 'table'],
            },
            {
                key: 'hotel-reviews',
                path: '/mitra/reviews',
                caption: 'Gambar 9: Halaman ulasan hotel untuk membaca dan membalas review pelanggan.',
                selectors: ['main section', 'table', 'button'],
            },
        ],
    },
    {
        key: 'wisata',
        email: 'mitra.wisata.guide@indotix.id',
        password: 'password',
        pages: [
            {
                key: 'wisata-dashboard',
                path: '/mitra/dashboard',
                caption: 'Gambar 10: Dashboard mitra wisata untuk memantau tiket terjual, pendapatan, kuota, dan validasi.',
                selectors: ['aside', 'main section', '[data-slot="card"]'],
            },
            {
                key: 'wisata-destination',
                path: '/mitra/wisata/destination',
                caption: 'Gambar 11: Halaman profil destinasi wisata untuk mengatur informasi publik destinasi.',
                selectors: ['main section', 'form', 'input', 'textarea', 'button'],
            },
            {
                key: 'wisata-tickets',
                path: '/mitra/wisata/tickets',
                caption: 'Gambar 12: Halaman produk tiket wisata untuk mengatur tiket, harga, kuota, dan status aktif.',
                selectors: ['main section', 'table', 'button', 'a'],
            },
            {
                key: 'wisata-bookings',
                path: '/mitra/wisata/bookings',
                caption: 'Gambar 13: Halaman booking wisata untuk memantau transaksi dan status pembayaran pengunjung.',
                selectors: ['main section', 'table', 'form', 'button'],
            },
            {
                key: 'wisata-scans',
                path: '/mitra/wisata/scans',
                caption: 'Gambar 14: Halaman scan QR wisata untuk memvalidasi tiket pengunjung di lokasi.',
                selectors: ['main section', 'form', 'video', 'table', 'button'],
            },
            {
                key: 'wisata-staff',
                path: '/mitra/wisata/staff',
                caption: 'Gambar 15: Halaman staff wisata untuk menambah petugas dan mengatur akses operasional.',
                selectors: ['main section', 'table', 'button', 'form'],
            },
            {
                key: 'wisata-finance',
                path: '/mitra/wisata/finance/summary',
                caption: 'Gambar 16: Halaman ringkasan keuangan wisata untuk memantau pendapatan dan payout.',
                selectors: ['main section', '[data-slot="card"]', 'table'],
            },
            {
                key: 'wisata-disputes',
                path: '/mitra/wisata/disputes',
                caption: 'Gambar 17: Halaman laporan masalah wisata untuk mencatat dan menindaklanjuti kendala operasional.',
                selectors: ['main section', 'table', 'button', 'form'],
            },
        ],
    },
    {
        key: 'event',
        email: 'mitra.event.guide@indotix.id',
        password: 'password',
        pages: [
            {
                key: 'event-dashboard',
                path: '/mitra/dashboard',
                caption: 'Gambar 18: Dashboard mitra event untuk memantau event aktif, tiket terjual, pendapatan, dan check-in.',
                selectors: ['aside', 'main section', '[data-slot="card"]'],
            },
            {
                key: 'event-list',
                path: '/mitra/events',
                caption: 'Gambar 19: Halaman event mitra untuk membuat, memperbarui, dan mengajukan event.',
                selectors: ['main section', 'table', 'button', 'a'],
            },
            {
                key: 'event-tickets',
                path: '/mitra/events/tickets',
                caption: 'Gambar 20: Halaman tiket event untuk mengatur kategori tiket, harga, benefit, dan kuota.',
                selectors: ['main section', 'table', 'button', 'a'],
            },
            {
                key: 'event-bookings',
                path: '/mitra/events/bookings',
                caption: 'Gambar 21: Halaman booking event untuk memantau pesanan dan status pembayaran.',
                selectors: ['main section', 'table', 'form', 'button'],
            },
            {
                key: 'event-attendees',
                path: '/mitra/events/attendees',
                caption: 'Gambar 22: Halaman peserta event untuk melihat daftar peserta dan status check-in.',
                selectors: ['main section', 'table', 'form', 'button'],
            },
            {
                key: 'event-scans',
                path: '/mitra/events/scans',
                caption: 'Gambar 23: Halaman scan QR event untuk melakukan check-in peserta.',
                selectors: ['main section', 'form', 'video', 'table', 'button'],
            },
            {
                key: 'event-staff',
                path: '/mitra/events/staff',
                caption: 'Gambar 24: Halaman staff event untuk menambah petugas dan mengatur role operasional.',
                selectors: ['main section', 'table', 'button', 'form'],
            },
            {
                key: 'event-finance',
                path: '/mitra/events/finance/summary',
                caption: 'Gambar 25: Halaman ringkasan keuangan event untuk memantau pendapatan dan payout.',
                selectors: ['main section', '[data-slot="card"]', 'table'],
            },
            {
                key: 'event-disputes',
                path: '/mitra/events/disputes',
                caption: 'Gambar 26: Halaman laporan masalah event untuk mencatat kendala transaksi atau operasional.',
                selectors: ['main section', 'table', 'button', 'form'],
            },
        ],
    },
];

function safeFileName(value) {
    return value.replaceAll(/[^a-z0-9-]+/gi, '-').toLowerCase();
}

async function sleep(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function highlight(page, selectors) {
    await page.evaluate((items) => {
        document.querySelectorAll('[data-guide-highlight="true"]').forEach((el) => {
            el.style.outline = '';
            el.style.outlineOffset = '';
            el.style.borderRadius = '';
            el.removeAttribute('data-guide-highlight');
        });

        const seen = new Set();
        for (const selector of items) {
            document.querySelectorAll(selector).forEach((el) => {
                if (seen.has(el)) return;
                seen.add(el);
                el.setAttribute('data-guide-highlight', 'true');
                el.style.outline = '4px solid #ef4444';
                el.style.outlineOffset = '4px';
                el.style.borderRadius = '12px';
                el.style.scrollMarginTop = '24px';
            });
        }
    }, selectors);
}

async function login(page, email, password) {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', email, { delay: 8 });
    await page.type('input[type="password"]', password, { delay: 8 });
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => null),
        page.click('button[type="submit"]'),
    ]);
}

async function capturePage(page, group, item, manifest) {
    await page.goto(`${baseUrl}${item.path}`, { waitUntil: 'networkidle2' });
    await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(600);
    await highlight(page, item.selectors);
    await sleep(250);

    const filename = `${safeFileName(item.key)}.png`;
    const filePath = path.join(outputDir, filename);
    await page.screenshot({ path: filePath, fullPage: true });
    manifest.push({ ...item, group: group.key, image: filePath });
    console.log(`[${group.key}] captured ${item.key}`);
}

async function main() {
    await fs.mkdir(outputDir, { recursive: true });
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1600, height: 1200, deviceScaleFactor: 1 },
    });

    const manifest = [];
    for (const group of guides) {
        const context = await browser.createBrowserContext();
        const page = await context.newPage();
        page.setDefaultTimeout(60000);

        try {
            if (group.email) {
                await login(page, group.email, group.password);
            }

            for (const item of group.pages) {
                await capturePage(page, group, item, manifest);
            }
        } catch (error) {
            console.error(`[${group.key}] FAILED`, error.message);
        } finally {
            await page.close();
            await context.close();
        }
    }

    await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    await browser.close();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
