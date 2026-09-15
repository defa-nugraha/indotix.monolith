# Inventaris Fitur Mitra INDOTIX

Audit sumber: 14 September 2026. Lingkup: web, role `mitra`, tipe `wisata`.
Pemeriksaan source dan halaman aktif telah dilakukan. Bukti UI tercatat pada screenshot-map.json; hasil tindakan dan batas pengujian tersedia pada verification.json serta KNOWN_ISSUES.md.

## Akses dan sumber kebenaran

- `routes/web.php:807`: dashboard dan chat memerlukan login, email terverifikasi, role Mitra, dan akun tidak ditangguhkan.
- `routes/web.php:923`: operasi wisata juga memerlukan tipe wisata, onboarding terverifikasi, serta destinasi tidak ditangguhkan (`EnsureMitraWisata`).
- `resources/js/components/app-sidebar-mitra.tsx`: 12 tautan navigasi aktif; staf tidak ada di sidebar maupun route wisata.
- `app/Actions/Fortify/CreateNewUser.php`: registrasi user/mitra dengan persetujuan legal, nama, email, telepon, password dan konfirmasi.
- Verifikasi web aktif memakai tautan email (`User::sendEmailVerificationNotification`, `VerifyEmailLinkNotification`, Fortify); route `/email/otp` dialihkan ke notice. `EmailOtpController` tersisa tetapi bukan alur web aktif.
- `MitraWisataOnboardingController`: tiga kelompok data, pengajuan verifikasi usaha dan rekening terpisah.

## Inventaris aktif

| Fitur | Route | Interaksi/validasi yang ditemukan | Sumber utama |
|---|---|---|---|
| Registrasi Mitra | /register | Pilih Mitra; data akun; persetujuan S&K/privasi; Buat akun | auth/register.tsx; CreateNewUser |
| Login/pemulihan | /login; /forgot-password | Email, password; ingat sesi; lupa password | auth/login.tsx; auth/forgot-password.tsx; Fortify |
| Verifikasi email | /email/verify | Tautan verifikasi di email, kirim ulang, keluar | VerifyEmailLinkNotification; auth/verify-email.tsx; Fortify |
| Pemilihan Mitra Wisata | /mitra/dashboard | Pemilihan jenis wisata bagi akun baru | mitra/dashboard.tsx; MitraOnboardingController |
| Pendaftaran destinasi | /mitra/wisata/onboarding | Penanggung jawab; destinasi dan operasional; legalitas dan rekening; simpan tiap kelompok; ajukan verifikasi | mitra/wisata-onboarding.tsx; MitraWisataOnboardingController |
| Perjanjian Mitra | /mitra/dashboard | Dokumen dari admin, tanda tangan jika diminta | PartnerTermsSignatureController; DashboardController |
| Dashboard | /mitra/dashboard | Tiket hari ini, pendapatan bulan ini, kuota, pending, validasi, status akun, aktivitas | Mitra/DashboardController |
| Profil Destinasi | /mitra/wisata/destination | Edit satu destinasi milik akun; info, lokasi, jam, fasilitas, tutup sementara, legalitas, bank, foto; simpan | Wisata/DestinationController; destination.tsx |
| Produk Tiket | /mitra/wisata/tickets | Daftar, tambah, edit, hapus dengan alasan wajib | Wisata/TicketController; tickets/index.tsx |
| Form Tiket | /mitra/wisata/tickets/create[?edit=id] | Reguler/paket; harga, kuota, kuota harian, min/maks pesanan 1-20, masa berlaku, kebijakan refund, aktif/tutup | Wisata/TicketController; tickets/create.tsx |
| Booking Wisata | /mitra/wisata/bookings | Filter tanggal kunjungan/status; pagination; detail dan rincian item | Wisata/BookingController; bookings/index.tsx; show.tsx |
| QR Masuk | /mitra/wisata/scans | Preview, unduh PDF, cetak; pengunjung memindai QR destinasi | Wisata/ScanController; scans/index.tsx |
| Riwayat validasi | /mitra/wisata/scans?tab=history | Cari, filter tanggal, pagination, waktu/jumlah/anomali | Wisata/ScanController |
| Ringkasan Pendapatan | /mitra/wisata/finance/summary | Bruto, komisi, neto, jumlah booking paid/completed | Wisata/FinanceController |
| Riwayat Payout | /mitra/wisata/finance/payouts | Periode, bruto, komisi, neto, status; baca saja | Wisata/FinanceController |
| Notifikasi | /mitra/wisata/notifications | Maksimal 50 notifikasi terbaru, status baca | Wisata/NotificationController |
| Ulasan Wisata | /mitra/wisata/reviews | Pagination, balas maks. 1000 karakter, hapus melalui status removed | Mitra/ReviewController; mitra/reviews/index.tsx |
| Laporan Masalah | /mitra/wisata/disputes | Pilih dari 50 booking terbaru; subjek wajib maks.255, deskripsi wajib maks.2000; JPG/PNG/PDF maks.5MB opsional; status open setelah dibuat | Wisata/DisputeController |
| Live Chat | /mitra/chat[/{id}] | Pilih percakapan wisata/admin, baca, kirim balasan maks.2000 karakter | Mitra/ChatController |
| Profil akun | /settings/profile | Nama, email, telepon, jenis kelamin; simpan profil | Settings/ProfileController; settings/staff-profile.tsx |
| Password | /settings/profile (form); PUT /settings/password | Password saat ini, baru, konfirmasi; simpan | Settings/PasswordController; settings/staff-profile.tsx |
| Bantuan dan keluar | Header/menu akun | Panduan interaktif jika tersedia, logout melalui sesi asli | app-header.tsx; nav-user.tsx; komponen coach |

## Batasan yang tidak boleh diasumsikan

- Akun wisata mengelola satu profil destinasi. Tidak ditemukan daftar destinasi dengan tombol Tambah Destinasi untuk Mitra terverifikasi.
- Tidak ada aksi refund, pembatalan booking, atau konfirmasi pembayaran manual pada controller booking Mitra wisata.
- Ringkasan pendapatan tidak menyediakan filter periode/export. Riwayat payout tidak menyediakan tombol permintaan pencairan.
- Harga paket dihitung server dari komponen tiket reguler milik destinasi yang sama.
- Bank: bila salah satu field diisi, ketiganya wajib; nomor rekening 6-30 digit.
- Foto JPG/JPEG/PNG/WEBP, maksimal 5 MB; foto lainnya maksimal lima. KTP/legal dapat PDF sesuai field.
- Data draft onboarding dapat disimpan sebagian, tetapi pengajuan memerlukan seluruh field yang diwajibkan controller.

## Legacy / di luar panduan utama

Hotel, Event, Staff Mitra wisata (controller/view tersisa tanpa route aktif), admin payout, refund pelanggan, pembayaran pelanggan, appearance dan two-factor khusus role user. Endpoint scan manual Mitra menolak permintaan dengan instruksi agar pengunjung scan QR Masuk.

## Strategi pembuktian

Database MySQL lokal terisolasi `indotix_user_guide` di port 13316, tidak memakai data produksi. Build dari source repository. Screenshot asli desktop 1440 x 900, device scale 2. Setiap gambar interaksi memiliki anotasi dari bounding rectangle DOM aktual. Masalah implementasi dicatat di KNOWN_ISSUES.md; batas verifikasi tindakan dicatat secara eksplisit.
