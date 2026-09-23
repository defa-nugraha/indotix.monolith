# Audit Wisata-Only

Tanggal audit: 2026-09-22

Dokumen ini mencatat hasil audit dependency sebelum dan selama cleanup menuju sistem yang berfokus pada wisata. Audit mencakup Laravel (`indotix_laravel`) dan aplikasi Flutter (`indotix`).

## Ringkasan

Codebase saat ini masih memuat beberapa product family lama: hotel, event, academy, special program, souvenir/retail, blog, dan affiliate. Sebagian memang non-wisata, tetapi tidak semuanya aman dihapus langsung karena masih disentuh oleh komponen shared seperti history, profile, payment/callback, voucher, dashboard, user deletion, review, dan navigation.

Kelompok dead code API non-wisata yang tidak diregistrasikan pada `routes/api.php` dan tidak direferensikan oleh runtime telah dihapus. Route, controller, dan halaman web untuk product family non-wisata yang tidak lagi aktif juga telah dipangkas. Kelompok lain tetap dipertahankan sementara sebagai `UNCERTAIN` sampai dependensinya diputus melalui refactor dan regression test.

## KEEP: Wisata

- `PublicWisataController`, `WisataBookingController`, `WisataCartController`, `WisataTicketScanController`.
- Controller admin wisata: destination, ticket, booking, scan, finance, exception, content, voucher, affiliate, dan QR entry.
- Controller dan onboarding Mitra Wisata beserta staff, payout, review, dispute, dan dokumen sensitif.
- Model `MitraWisata*`, `Wisata*`, `Voucher`, regional data, review wisata, notification, dan user/auth yang diperlukan.
- Flutter feature wisata: product listing/detail, wisata booking, wisata cart, history wisata, voucher flow, home/mobile content, authentication, profile, chat, notification, dan bottom navigation.

## SHARED/CORE: Dipertahankan

- Authentication, email/OTP/passkey/social login, Sanctum/Fortify, role/permission, dan verified middleware.
- Database/cache/session/queue, storage upload, media URL, validation, logging, error handling, maintenance transaction, Midtrans, QR/PDF ticket, dan mail.
- User/profile/account deletion, notifications/push, chat/live support, reviews, maps/location, regional lookup, search/discovery wisata, dan shared Inertia/Flutter UI.
- Mobile API `products/wisata`, `wisata/bookings`, `wisata/cart`, `wisata/ticket-scans`, `mobile/home`, dan `mobile/vouchers`.
- Mobile-only hero/promo resources dan storage namespace `mobile/home/...`; tidak menggunakan resource website.

## REMOVE: Aman dihapus pada tahap ini

### Laravel controller

- `app/Http/Controllers/Api/AcademyBookingController.php`
- `app/Http/Controllers/Api/AcademyController.php`
- `app/Http/Controllers/Api/EventBookingController.php`
- `app/Http/Controllers/Api/EventController.php`
- `app/Http/Controllers/Api/HotelBookingController.php`
- `app/Http/Controllers/Api/HotelController.php`
- `app/Http/Controllers/Api/SouvenirBookingController.php`
- `app/Http/Controllers/Api/SouvenirCartController.php`
- `app/Http/Controllers/Api/SouvenirController.php`
- `app/Http/Controllers/Api/SpecialProgramBookingController.php`
- `app/Http/Controllers/Api/SpecialProgramController.php`

Alasan: tidak ada route API aktif yang mengarah ke controller tersebut dan pencarian referensi runtime di `app`, `routes`, `resources`, dan `tests` tidak menemukan pemakai di luar deklarasi controller masing-masing.

Controller web/admin/Mitra yang ikut dihapus:

- seluruh `Admin/Academy`, `Admin/Event*`, `Admin/Souvenir*`, dan `Admin/SpecialProgram*`;
- seluruh `Mitra/Event/*`, `Mitra/HotelController`, `Mitra/RoomTypeController`, dan `Mitra/RoomInventoryController`;
- `AcademyPublicBookingController`, `PublicAcademyController`, `PublicEventController`, `PublicHotelController`, `PublicSouvenirController`, `PublicSpecialProgramController`;
- `HotelController`, `SouvenirBookingController`, `SouvenirCartController`, dan `SpecialProgramBookingController`.

### Frontend pages dan test khusus

- seluruh page `resources/js/pages/admin/academy`, `admin/events`, `admin/souvenir`, dan `admin/special-programs`;
- seluruh page `resources/js/pages/mitra/events`;
- seluruh page `resources/js/pages/public/academy`, `public/events`, `public/souvenir`, dan `public/special-programs`;
- test yang hanya menguji Event, Hotel API, dan Souvenir fulfillment.

`Admin/DashboardController` juga disederhanakan agar statistik dashboard hanya membaca onboarding Mitra Wisata dan transaksi wisata. Kontrak prop dashboard dipertahankan agar UI dashboard tetap kompatibel.

## UNCERTAIN: Jangan dihapus langsung

- `HistoryController`, `HistoryDetailController`, `ProfileController`, dan model booking/payment generik: masih memuat cabang non-wisata, tetapi juga menyajikan history/profile yang dipakai wisata.
- `DashboardController`, `BookingController`, `Payment`, `Payout`, `CommissionRule`, dan Midtrans callback: masih menjadi jalur transaksi atau admin shared.
- `Voucher`, `ProductReviewService`, `ChatService`, `UserDeletionService`, `MitraDeletionService`, `DiscoveryService`, dan service cleanup: memiliki referensi lintas product family.
- `PublicHomeController`, public banner/promo, blog, about/contact/FAQ/privacy, sitemap, dan mobile content: sebagian merupakan website shared dan sebagian mobile-only; tidak boleh dicampur atau dihapus sebelum contract UI/API ditetapkan.
- Flutter `HomeScreen`, `ProductDetailScreen`, `HistoryScreen`, dan `ProductCategory`: saat ini masih mengimpor detail hotel/event/academy/souvenir/special program sehingga penghapusan folder product harus didahului pemangkasan shell tersebut.
- Migration dan seeder lama: migration yang sudah mungkin diterapkan pada production tidak dihapus. Penghapusan schema memerlukan migration deprecation/rollback plan terpisah.
- Model dan service product lama yang masih dibaca oleh history, profile, payment callback, deletion cleanup, review, atau provider binding belum dihapus. Menghapusnya sekarang akan memutus alur wisata yang masih shared atau merusak penghapusan data akun lama.

## Dependency map utama

```text
Wisata Home/API
  -> auth/profile/notification/chat/review
  -> WisataController, DiscoveryController, Voucher
  -> WisataBooking, Midtrans, QR/PDF, storage

Admin wisata
  -> admin auth/RBAC/audit/logging
  -> MitraWisata, WisataDestination, WisataTicket, finance/payout

Shared history/profile/payment
  -> masih mengimpor hotel/event/academy/souvenir/special program
  -> harus direfactor sebelum model non-wisata dihapus

Flutter product shell
  -> masih switch/import semua category product
  -> harus dibatasi ke `wisata` sebelum feature folders non-wisata dihapus
```

## Database dan package

Migration dan seeder non-wisata yang terisolasi sudah dihapus. Migration Hotel/booking generik masih dipertahankan karena foreign key voucher, service legacy, dan model shared masih menggunakannya. Tidak ada package yang dihapus: `composer.json`, `composer.lock`, `package.json`, dan lockfile belum diubah karena belum ada dependency yang terbukti hanya dipakai modul yang dihapus. Flutter dependency juga belum dihapus karena product shell masih memuat import non-wisata.

## Validasi yang dilakukan

- `flutter analyze`: lulus setelah cleanup (`No issues found`).
- `npm run types`: lulus setelah cleanup.
- `npm run build`: lulus; Vite menghasilkan build production. Terdapat warning asset background yang sudah ada dan unresolved saat build-time, tetapi bukan error build.
- `php artisan route:list --except-vendor`: lulus; route non-wisata yang dipangkas tidak lagi terdaftar, sementara route wisata tetap terdaftar.
- `php artisan route:list --path=api --except-vendor`: lulus; tidak ada route yang menunjuk controller API yang dihapus.
- `php artisan test --testsuite=Unit --compact`: lulus, 29 test dan 382 assertion.
- `git diff --check`: lulus.
- PHP lint untuk controller cart: lulus.
- `php artisan route:list --path=wisata/cart`: route wisata cart terdaftar.
- Test Flutter penuh belum lulus: 24 test gagal pada run terakhir. Kegagalan yang terlihat berasal dari test UI/home existing (golden mismatch, `RenderFlex overflow` pada `home_destination_rail.dart`, dan assertion legacy hero) serta dua test biometric yang mengharapkan method berbeda dari implementasi. Perubahan cleanup ini tidak menyentuh file Flutter tersebut; `flutter analyze` tetap lulus.
- Test feature Laravel yang membutuhkan database belum dijadikan bukti lulus karena environment MySQL testing sebelumnya menolak koneksi `127.0.0.1:3306`.

## Batasan cleanup

File atau modul yang keterkaitannya belum terbukti aman sengaja tidak dihapus. Tahap berikutnya harus mereduksi dependency shared secara bertahap, menambah test isolation wisata, baru kemudian menghapus controller/model/page/asset non-wisata yang sudah tidak memiliki referensi.

## Perubahan yang sengaja tidak dilakukan

- Tidak ada migration database yang dijalankan, drop tabel, penghapusan data, atau perubahan dependency package.
- Migration source yang dihapus adalah kelompok Event, Special Program, Souvenir, Academy, dan retail ownership; Blog dipertahankan karena masih digunakan oleh Jelajah Indotix. Seeder demo untuk modul yang dihapus juga dikeluarkan dari `DatabaseSeeder`.
- Tidak ada tabel existing yang di-drop. Migration yang sudah pernah diterapkan pada production tetap tercatat di database; penghapusan file hanya memengaruhi source repository dan fresh-install migration path.
- Tidak ada perubahan pada Flutter feature folder non-wisata karena `HomeScreen`, `ProductDetailScreen`, `HistoryScreen`, dan `ProductCategory` masih menjadi shared product shell.
- Blog, public content, voucher, chat, profile, history, Midtrans callback, notification, payout, dan cleanup service tidak dihapus karena masih mempunyai route, import, kontrak UI, atau dependency account/transaksi wisata.
- Perubahan kerja pengguna yang sudah ada, termasuk cart wisata, mobile home content, admin pages, dan styling, tidak dibatalkan.
