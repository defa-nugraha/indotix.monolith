# Masalah dan batas verifikasi dokumentasi

Audit 14 September 2026. Aplikasi dibangun dari source dan dijalankan lokal pada database khusus dokumentasi. Tidak ada perbaikan business logic dalam tugas ini.

## KI-01 - Riwayat Payout kosong ketika mempunyai data (tinggi)

- Route: `/mitra/wisata/finance/payouts`.
- Reproduksi: login Mitra wisata terverifikasi yang mempunyai satu payout, kemudian buka Riwayat Payout.
- Hasil: respons HTTP 200, tetapi halaman React kosong.
- Bukti source: `Mitra/Wisata/FinanceController::payouts` membaca `gross_amount` dan `net_amount`; model dan tabel `WisataPayout` menggunakan `total_gmv` dan `net_payout`. View memanggil `toLocaleString()` pada nilai null.
- Dampak dokumentasi: panduan menjelaskan akses dan kepemilikan proses payout oleh admin, tidak menampilkan tabel fiktif atau mengklaim riwayat berisi data berhasil.
- Tindak lanjut: perbaiki pemetaan controller dalam pekerjaan terpisah, uji empty/populated state, lalu perbarui screenshot.

## KI-02 - Pagination ulasan tidak cocok dengan isi (sedang)

- Route: `/mitra/wisata/reviews`.
- UI menampilkan satu ulasan tetapi informasi pagination menyatakan `0 sampai 0 dari 0 data`.
- Controller memasok `data` dan `links` tanpa seluruh metadata paginator yang diperlukan komponen global.
- Panduan menggunakan baris ulasan sebagai acuan dan tidak mengandalkan angka total ini.

## KI-03 - Teks bantuan keuangan mengisyaratkan pengajuan payout (rendah)

- Banner bantuan mengajak pengguna memeriksa saldo sebelum membuat pengajuan.
- Route/controller keuangan wisata hanya menyediakan GET ringkasan dan riwayat. Tidak ditemukan tombol pengajuan payout Mitra wisata.
- Panduan mengikuti implementasi: payout dibuat admin; Mitra melengkapi rekening dan memantau status.

## Legacy yang dapat menyesatkan penulis panduan

- EmailOtpController dan auth/verify-otp.tsx bukan flow verifikasi web aktif. Web memakai tautan verifikasi email.
- Pengelolaan staf wisata memiliki source tetapi tidak memiliki route aktif; tidak masuk panduan utama.
- Hotel/Event tidak tersedia untuk onboarding Mitra wisata aktif.
- `/settings/password` masih menampilkan layout publik dan tautan pengaturan role user. Panduan mengarahkan perubahan password melalui Kelola Profil operasional.

## Batas lingkungan

- Email dicatat melalui mailer lokal, bukan dikirim ke inbox eksternal. Pengiriman SMTP production tidak dinyatakan teruji.
- Transaksi, ulasan, percakapan, dan rekening adalah data contoh khusus dokumentasi, bukan data pelanggan.
- Approval usaha/payout oleh admin berada di luar role Mitra. Akun terverifikasi disiapkan lewat fixture development.
- Pembayaran Midtrans, transfer payout bank, pemindaian kamera perangkat pengunjung, dan printer fisik memerlukan pengujian operasional tersendiri.
- Form paket wisata dipilih dan diperiksa, tetapi penyimpanan paket tidak diuji end-to-end. Dialog penghapusan diperiksa tanpa menjalankan penghapusan. Google OAuth tidak diuji karena membutuhkan konfigurasi pihak ketiga.
- Unduhan PDF QR, reset password melalui tautan email lokal, perubahan profil, dan pengajuan usaha telah diuji. Pemeriksaan database dokumentasi mengonfirmasi pengajuan berstatus pending dengan tiga path foto tersimpan.

Hasil tindakan UI yang benar-benar dijalankan tersedia pada `verification.json` (riwayat percobaan) dan `verification-summary.json` (hasil terakhir serta batas cakupan). Kesalahan selector/pengambilan gambar awal adalah masalah tooling dokumentasi, bukan temuan bug aplikasi.
