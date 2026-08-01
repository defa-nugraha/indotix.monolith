# Audit Security, Reliability, UI/UX, dan Accessibility

Tanggal audit: 2026-08-01  
Repository web: `/home/stardust/Documents/Client/2025/INDOTIX/2026/indotix_laravel`  
Repository mobile: `/home/stardust/Documents/Client/2025/INDOTIX/2026/indotix`

## 1. Ringkasan Eksekutif

Audit dilakukan terhadap aplikasi web Laravel/Inertia React dan aplikasi mobile Flutter. Perbaikan yang aman langsung diterapkan pada source code, terutama pada area stored XSS, redaksi data sensitif di log, validasi upload, dependency advisory, telemetry error mobile, dan label aksesibilitas.

Kondisi aplikasi setelah perbaikan:

- Dependency audit web sudah bersih untuk `npm audit` dan `composer audit`.
- Test terarah untuk temuan audit lulus.
- Build frontend web berhasil.
- Typecheck web berhasil setelah generated Wayfinder/actions dibuat oleh build.
- Flutter analyze dan Flutter test lulus.
- Full Laravel test suite masih memiliki 28 kegagalan pada test legacy modul non-wisata yang saat ini memang diblokir oleh middleware retired product feature. Ini tidak diperbaiki otomatis karena membuka kembali hotel/event/retail/special-program akan mengubah keputusan scope produk.

## 2. Ruang Lingkup Audit

Area yang diperiksa:

- Web backend: route, middleware, controller, service, model, upload, cache, dependency, logging.
- Web frontend: React/Inertia page publik/admin, aksesibilitas label, build/typecheck.
- Mobile Flutter: error reporter, konfigurasi env, analyze, unit test, dependency freshness.
- Test suite: unit, feature, security, API, mobile tests.

Area yang tidak diubah:

- Business rule produk non-wisata yang saat ini sudah ditandai retired.
- Credential, isi file `.env`, dan konfigurasi production rahasia.
- Database produksi atau data user.
- History Git dan commit.

## 3. Kondisi Sebelum Perbaikan

Baseline yang ditemukan sebelum patch audit:

- `php artisan test`: gagal, terutama karena test legacy masih mengharapkan modul hotel/event/retail/academy/special-program aktif, sedangkan aplikasi saat ini memiliki `BlockRetiredProductFeatures`.
- `npm run types`: sempat lulus pada baseline sebelumnya, namun setelah dependency/build cycle ditemukan kondisi generated Wayfinder/actions bisa hilang sebelum build.
- `npm audit --audit-level=low`: gagal, terdapat vulnerability di paket Node transitive seperti `brace-expansion`, `js-yaml`, `postcss`, `shell-quote`.
- `composer audit --format=plain`: gagal, terdapat advisory pada `guzzlehttp/guzzle`.
- `flutter analyze`: lulus.
- `flutter test`: lulus.

## 4. Daftar Temuan

| ID | Kategori | Severity | Lokasi | Temuan | Dampak | Perbaikan | Status | Test |
| -- | -------- | -------- | ------ | ------ | ------ | --------- | ------ | ---- |
| SEC-01 | Security | High | `resources/js/pages/public/about.tsx`, `privacy-policy.tsx`, `faq.tsx`, `blog/show.tsx`, controller admin/public terkait | Konten HTML dari admin dirender dengan `dangerouslySetInnerHTML` tanpa sanitasi server-side yang konsisten. | Stored XSS dapat muncul jika konten admin mengandung script/event handler berbahaya. | Menambahkan `App\Support\HtmlSanitizer`, sanitasi saat simpan, dan sanitasi ulang saat payload public dikirim untuk konten lama. | Fixed | `tests/Unit/HtmlSanitizerTest.php` |
| SEC-02 | Security | High | `app/Http/Middleware/LogAdminActivity.php`, `app/Http/Middleware/LogUserActivity.php` | Payload audit log dapat menyimpan token, password, OTP, signature, atau nomor rekening jika dikirim nested di request. | Data sensitif dapat tersimpan di database log dan terlihat di audit log. | Menambahkan redaksi nested payload, mengecualikan `current_password`, dan tetap mencatat metadata file tanpa konten. | Fixed | `tests/Feature/Admin/AdminAuditLogTest.php` |
| SEC-03 | Security | High | `app/Http/Controllers/Api/MobileErrorLogController.php`, `indotix/lib/core/mobile_error_reporter.dart` | Error telemetry mobile dapat mengirim atau menyimpan token, email, nomor telepon, dan response body sensitif. | Kebocoran data pribadi atau token ke log server. | Menambahkan redaksi di client Flutter dan server API sebelum penyimpanan. Email user tidak lagi dikirim dalam extra telemetry. | Fixed | `tests/Feature/Api/MobileErrorLogTest.php`, `flutter test` |
| SEC-04 | Security | High | Review upload, onboarding/dispute upload, partner/logo/product image upload, room image upload | Sebagian upload belum memiliki kombinasi validasi MIME/extension/ukuran yang eksplisit. | Risiko upload file berbahaya, file terlalu besar, atau konsumsi storage/memori berlebihan. | Menambahkan `mimes` dan `max` pada upload yang relevan, termasuk review image/video dan dokumen onboarding/dispute. | Fixed | `tests/Feature/ReviewUploadValidationTest.php` |
| SEC-05 | Security | High | `package-lock.json`, `composer.lock` | Dependency audit menemukan advisory pada Node transitive packages dan Guzzle. | Risiko supply-chain dan kerentanan dependency. | Menjalankan `npm audit fix` dan update Guzzle dengan dependencies terkait. | Fixed | `npm audit --audit-level=low`, `composer audit --format=plain` |
| SEC-06 | Security | Medium | `app/Services/MediaCompressionService.php` | Resolusi binary `ffmpeg` dari PATH kurang ketat. | Path tidak valid atau output shell aneh dapat ikut dipakai untuk proses video. | Membatasi hasil `command -v ffmpeg` ke baris pertama, menolak path kosong, path berspasi, file non-executable, dan tetap memakai escaping pada argumen. | Fixed | `php -l`, build/test terarah |
| SEC-07 | Security | High | Mobile repo `.env`, `.gitignore`, `.env.example` | File `.env` mobile sudah tracked di Git. Isi tidak dibuka selama audit. | Potensi secret/config sensitif ikut terbawa repository dan build artifact. | Menambahkan `.env` ke `.gitignore` mobile dan membuat `.env.example` placeholder. Perlu keputusan lanjutan untuk remove dari tracking/history dan rotasi secret. | Partially Fixed | `git ls-files .env`, `git diff --check` |
| REL-01 | Reliability | High | `tests/Feature/Admin/*`, `tests/Feature/Api/HotelBookingQuoteTest.php`, `tests/Feature/Payments/ApiHotelPaymentTest.php`, `BlockRetiredProductFeatures` | Full Laravel suite masih menjalankan test legacy hotel/event/retail/special-program yang saat ini diblokir 404. | Pipeline CI penuh tetap merah walaupun fitur aktif wisata lulus. | Tidak membuka kembali modul karena berpotensi melanggar scope produk wisata-only. Perlu keputusan: hapus/update test legacy atau aktifkan kembali modul. | Needs Decision | `php artisan test` |
| REL-02 | Reliability | Medium | `.env.example`, `config/cache.php`, `config/session.php`, `config/queue.php` | Default sample env masih mengarah ke Redis untuk session/cache/queue. | Environment tanpa Redis dapat gagal jika `.env` meniru `.env.example` tanpa penyesuaian. | Tidak diubah karena deployment Redis pernah diminta sebelumnya. Dicatat sebagai keputusan deployment. | Needs Decision | Review konfigurasi |
| REL-03 | Reliability | Medium | Mobile `pubspec.yaml`, `pubspec.lock` | `flutter pub outdated` menunjukkan banyak paket belum latest atau perlu major upgrade. | Risiko maintenance jangka panjang dan potensi incompatibility di masa depan. | Tidak dilakukan major upgrade karena berisiko memecah build dan bukan patch aman kecil. | Needs Decision | `flutter pub outdated` |
| REL-04 | Reliability | Medium | `app/Services/PublicContentCache.php` | Cache Redis public API bisa gagal bila Redis tidak tersedia. | Potensi request error jika cache exception tidak ditangani. | Sudah ada fallback try/catch; diverifikasi sebagai bukan temuan baru. | False Positive | Review source |
| UI-01 | Accessibility | Medium | `resources/js/pages/admin/public/home/edit.tsx` | Satu dynamic input pada admin home content belum memiliki accessible label. | Screen reader dan audit label form gagal. | Menambahkan `aria-label` sesuai label field. | Fixed | `tests/Unit/AdminMitraFieldLabelSourceTest.php` |
| A11Y-01 | Accessibility | Medium | Seluruh frontend | Belum ada automated browser accessibility scan seperti axe/Playwright untuk semua viewport. | Risiko visual/responsive/accessibility tidak tertangkap otomatis di CI. | Tidak menambah dependency/tooling baru dalam patch ini. Direkomendasikan ditambahkan pada fase QA. | Needs Decision | Manual source review, build |
| OPS-01 | Reliability | Low | Build frontend | `npm run build` memberi warning asset `/images/backgroun-section.png` tidak resolve saat build dan akan diselesaikan runtime. | Tidak memblokir build, tetapi bisa menjadi broken asset jika file runtime tidak tersedia. | Tidak diubah karena warning berasal dari asset path existing dan build sukses. | Needs Decision | `npm run build` |

## 5. Perbaikan yang Dilakukan

### Security

- Menambahkan sanitizer HTML reusable: `app/Support/HtmlSanitizer.php`.
- Menerapkan sanitasi konten admin/public pada:
  - `AboutPageController`
  - `PrivacyPolicyController`
  - `FaqController`
  - `BlogPostController`
  - `PublicAboutController`
  - `PublicPrivacyPolicyController`
  - `PublicFaqController`
  - `PublicBlogController`
- Menambahkan redaksi payload sensitif pada:
  - `LogAdminActivity`
  - `LogUserActivity`
  - `MobileErrorLogController`
  - `MobileErrorReporter` Flutter
- Menambah batas MIME dan ukuran upload pada beberapa controller upload.
- Memperketat resolusi binary `ffmpeg`.
- Membersihkan vulnerability Node dan Composer melalui lockfile update.

### Reliability

- Menambahkan validasi upload executable payload untuk web/API review.
- Menjaga mobile error reporting tetap best-effort dan tidak membuat crash saat endpoint error.
- Memastikan generated Wayfinder/actions dibuat melalui build sebelum typecheck final.

### UI/UX dan Accessibility

- Menambahkan accessible label untuk dynamic input admin home content.
- Tidak melakukan redesign UI besar pada audit ini karena working tree berisi banyak perubahan UI lama dan fokus patch aman adalah security/reliability.

## 6. Test yang Ditambahkan atau Diperbarui

- `tests/Unit/HtmlSanitizerTest.php`
- `tests/Feature/ReviewUploadValidationTest.php`
- `tests/Feature/Admin/AdminAuditLogTest.php`
- `tests/Feature/Api/MobileErrorLogTest.php`

## 7. Hasil Pengujian

Perintah yang berhasil:

| Perintah | Hasil |
| -------- | ----- |
| `php -l` pada file PHP yang diubah | Lulus |
| `php artisan test tests/Unit/HtmlSanitizerTest.php tests/Feature/Admin/AdminAuditLogTest.php tests/Feature/Api/MobileErrorLogTest.php tests/Unit/AdminMitraFieldLabelSourceTest.php` | 7 passed, 100 assertions |
| `php artisan test tests/Feature/SecurityOptimizationTest.php tests/Feature/ReviewUploadValidationTest.php` | 5 passed, 24 assertions |
| `npm audit --audit-level=low` | 0 vulnerabilities |
| `composer audit --format=plain` | No security vulnerability advisories found |
| `npm run build` | Lulus |
| `npm run types` setelah build | Lulus |
| `flutter analyze` | No issues found |
| `flutter test` | 35 tests passed |
| `flutter pub outdated` | Berhasil, menampilkan dependency yang perlu rencana upgrade |
| `git diff --check` web dan mobile | Lulus |

Perintah yang masih gagal:

| Perintah | Hasil | Catatan |
| -------- | ----- | ------- |
| `php artisan test` | 28 failed, 1 skipped, 206 passed | Kegagalan dominan pada test legacy hotel/event/retail/special-program yang sekarang 404 karena retired product feature. |

Catatan typecheck:

- `npm run types` sempat gagal sebelum build karena file generated Wayfinder/actions tidak ada.
- Setelah `npm run build` menghasilkan actions/routes, `npm run types` lulus.

## 8. Temuan yang Belum Dapat Diperbaiki

| Area | Alasan |
| ---- | ------ |
| Legacy test non-wisata | Perlu keputusan produk apakah modul hotel/event/retail/special-program tetap retired atau diaktifkan kembali. Mengubah middleware atau route sekarang dapat melanggar scope wisata-only. |
| Mobile `.env` tracked | Perlu tindakan repo hygiene terpisah: remove dari Git tracking/history dan rotasi secret jika ada. Audit ini tidak membuka isi `.env`. |
| Redis default pada `.env.example` | Perlu keputusan deployment: Redis wajib tersedia atau default sample env diubah ke `file/database/sync` untuk shared hosting. |
| Major upgrade Flutter dependencies | Perlu sprint dependency upgrade karena beberapa paket besar seperti Firebase, local_auth, permission_handler, dan notification plugin memiliki major version baru. |
| Automated accessibility E2E | Perlu tambahan tooling browser automation/axe. Tidak ditambahkan agar tidak memasukkan dependency besar tanpa keputusan. |

## 9. Risiko Tersisa

- Full Laravel suite belum hijau karena konflik scope produk aktif vs test legacy.
- Jika `.env` mobile pernah berisi secret nyata dan sudah masuk history Git, secret harus dianggap terekspos sampai dirotasi.
- Aplikasi masih perlu browser-based responsive/a11y regression test untuk viewport 320, 375, 768, 1024, 1280, dan 1440 px.
- Redis harus dipastikan tersedia di environment yang memakai konfigurasi Redis untuk session/cache/queue.
- Paket Flutter major-upgrade perlu direncanakan agar kompatibel dengan Flutter/Android toolchain terbaru.

## 10. Rekomendasi Lanjutan

1. Putuskan secara eksplisit status modul non-wisata:
   - Jika retired: arsipkan/update test legacy dan hapus menu/route sisa secara bertahap.
   - Jika aktif kembali: ubah `BlockRetiredProductFeatures` dan validasi ulang seluruh role/module.
2. Hapus `.env` mobile dari Git tracking dan riwayat repository, lalu rotasi secret yang pernah tersimpan.
3. Tambahkan CI step:
   - `composer audit`
   - `npm audit --audit-level=low`
   - `npm run build`
   - `npm run types` setelah build/generation
   - `php artisan test` untuk suite aktif
   - `flutter analyze`
   - `flutter test`
4. Tambahkan Playwright/axe untuk smoke test public pages dan admin critical paths pada mobile/tablet/desktop.
5. Jadwalkan upgrade dependency Flutter major-version dengan build Android release dan regression test biometrik, push notification, payment webview, image picker, dan Google login.
