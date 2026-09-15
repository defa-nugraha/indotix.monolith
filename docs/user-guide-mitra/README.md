# User Guide INDOTIX - Mitra Wisata

Panduan web berdasarkan source aplikasi pada 14 September 2026. Bukan panduan Flutter, Hotel, Event, atau admin.

## Membaca panduan

Panduan juga tersedia melalui route website `/panduan/mitra`, ditautkan sebagai **Panduan Mitra** pada footer publik. Link membuka halaman HTML dalam tab yang sama, tanpa login.

`npm run build`, `npm run build:ssr`, dan `npm run dev` menjalankan `guide:publish`. Langkah ini menyalin HTML, logo dan screenshot beranotasi ke `public/guides/mitra` agar ikut artefak deployment meskipun folder `docs` dikecualikan. Hasil salinan tidak masuk Git. Script, fixture, laporan QA, screenshot asli dan PDF tidak disalin ke direktori publik. Untuk memperbarui panduan tanpa build frontend, jalankan `npm run guide:publish`.

- `user-guide-mitra.html`: versi utama, daftar isi desktop/mobile, gambar dapat dibuka ukuran penuh.
- `user-guide-mitra.pdf`: versi digital dan cetak A3 landscape; format lebar dipilih agar screenshot desktop tetap terbaca. Gunakan zoom untuk membaca field kecil.
- `USER_GUIDE_MITRA.md`: sumber teks yang dapat dibaca tanpa browser khusus.
- `FEATURE_INVENTORY.md`: inventaris route, permission, fitur aktif dan legacy.
- `KNOWN_ISSUES.md`: bug aplikasi dan batas pengujian, dipisahkan dari petunjuk pengguna.
- `screenshot-map.json`: route, selector, koordinat, nomor dan penjelasan anotasi.
- `verification.json`: catatan tindakan UI. Percobaan gagal karena selector/tooling tidak otomatis merupakan bug aplikasi.
- `verification-summary.json`: hasil terakhir per alur dan batas pengujian.
- `document-qa.json`: jumlah bagian/gambar dan pemeriksaan layout HTML.

## Asal screenshot

Screenshot diambil dari aplikasi Laravel + Inertia/React yang dijalankan lokal, bukan mockup. Viewport 1440 x 900, device scale 2 (PNG 2880 x 1800). Logo disalin dari `public/logo.png` tanpa perubahan. Koordinat anotasi diambil dari DOM aktual. Capture menyimpan original sebelum overlay; `tools/annotate.py` dapat membuat ulang anotasi dari original dan koordinat tersebut tanpa mengubah original atau source aplikasi. Membutuhkan Python 3 + Pillow serta font DejaVu Sans yang tersedia di sistem dokumentasi.

Data contoh memakai domain `example.com`, rekening semua nol, dan akun dokumentasi khusus. Tidak ada data produksi atau kredensial yang disertakan. Dokumen contoh legal pada fixture bukan KTP/izin usaha asli dan tidak boleh digunakan pada registrasi operasional.

## Memperbarui dokumentasi

Prasyarat: dependency Composer/npm proyek terpasang, Chrome pada `/usr/bin/google-chrome`, Node, PHP, MySQL lokal, serta Puppeteer existing. Tidak ada dependency aplikasi baru.

1. Siapkan **database MySQL baru dan terisolasi** bernama `indotix_user_guide`, server bind `127.0.0.1`, port `13316`, socket `/tmp/indotix-guide-mysql.sock`. Konfigurasi runtime hanya untuk instance dokumentasi lokal. Jangan hubungkan ke staging/production dan jangan gunakan database kerja yang sudah berisi data.
2. Jalankan migrasi existing menggunakan environment dari `tools/runtime.mjs`, bukan `.env` aplikasi:

```bash
node --input-type=module -e "import {spawnSync} from 'node:child_process'; import {env,root} from './docs/user-guide-mitra/tools/runtime.mjs'; const r=spawnSync('php',['artisan','migrate','--force'],{cwd:root,env,stdio:'inherit'}); process.exit(r.status ?? 1)"
npm run build
node docs/user-guide-mitra/tools/runtime.mjs seed
node docs/user-guide-mitra/tools/runtime.mjs serve
```

3. Aplikasi dokumentasi tersedia di `http://127.0.0.1:8017`. Password acak disimpan hanya di `/tmp/indotix-guide-password` dengan mode 600. Jangan menyalin password ke dokumentasi atau commit. Email menggunakan mailer log lokal; layanan SMTP, pembayaran dan bank tidak dipanggil.
4. Jalankan capture dan interaksi **berurutan**, bukan bersamaan, karena masing-masing memperbarui map yang sama:

```bash
node docs/user-guide-mitra/tools/capture.mjs
node docs/user-guide-mitra/tools/flows.mjs
GUIDE_REGISTRATION_EMAIL=registrasi.panduan@example.com node docs/user-guide-mitra/tools/registration.mjs
```

Capture static untuk checklist akun terverifikasi dapat dilewati: checklist draft dibuat oleh script registrasi. `capture-errors.json` merekam target yang perlu ditinjau. Capture subset didukung, misalnya `capture.mjs 08-dashboard,29-entry-qr`; tindakan subset memakai `flows.mjs profile-save`.

5. Untuk screenshot pengajuan usaha dan persetujuan kerja sama, sediakan path PDF syarat Mitra wisata existing melalui `GUIDE_TERMS_PDF`, gunakan email yang sama dengan registrasi sebelumnya, lalu jalankan `tools/complete-capture.mjs`. Script hanya menyiapkan data draft development, mengunggah foto melalui UI, dan mencatat persetujuan pada database dokumentasi. Jangan menjalankannya pada akun/data nyata. Pengulangan registrasi memerlukan email contoh baru; pengulangan pengajuan memerlukan draft baru.
6. Ubah narasi di `tools/chapters.mjs`, bukan hanya pada HTML hasil generate. Periksa kesesuaian semua selector dan label dengan UI terbaru, lalu:

```bash
python3 docs/user-guide-mitra/tools/annotate.py
node docs/user-guide-mitra/tools/build.mjs
node docs/user-guide-mitra/tools/validate.mjs
pdfinfo docs/user-guide-mitra/user-guide-mitra.pdf
pdftoppm -scale-to 1600 -png docs/user-guide-mitra/user-guide-mitra.pdf /tmp/indotix-guide-page
```

7. Inspeksi screenshot dan halaman PDF hasil render. Periksa nomor callout, tidak ada gambar rusak, tidak ada heading/penjelasan terpisah secara tidak wajar, tidak ada data sensitif, serta HTML pada lebar 320, 390, 768 dan 1440.

Script ini membantu pembaruan, bukan pengganti pemeriksaan manual. Jika fitur aplikasi berubah atau masih gagal, perbarui `KNOWN_ISSUES.md` dan jangan menyatakan fitur berhasil hanya karena HTTP 200.

Script tambahan `tools/reset-password.mjs` menguji tautan pemulihan melalui log email lokal dan menyimpan screenshot form tanpa token. `tools/final-flows.mjs` memeriksa penyimpanan hari buka serta unduhan PDF QR. Jalankan sebelum build, secara berurutan setelah script capture lainnya.

## Menghentikan server dokumentasi

Hentikan hanya proses server dokumentasi yang PID-nya disimpan pada `/tmp/indotix-guide-server.pid`. Jangan menghentikan MySQL, PHP-FPM, Nginx, atau layanan server lain secara global. Runtime sementara tidak masuk Git.

## Batas cakupan QA

Interaksi diuji terhadap data development. Persetujuan admin, pengiriman inbox eksternal, transfer bank, Midtrans, kamera pengunjung dan printer fisik tidak dinyatakan teruji. Pembaruan UI/business logic tidak termasuk pekerjaan dokumentasi ini.
