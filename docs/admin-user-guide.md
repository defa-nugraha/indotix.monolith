# Panduan Pengguna Admin — Indotix

Dokumen ini adalah panduan operasional untuk peran **Admin** di aplikasi Indotix. Ditulis mengikuti praktik standar industri untuk memastikan konsistensi proses, keamanan data, dan efisiensi operasional.

> [SCREENSHOT: Cover / Halaman Login Admin]

---

## 1) Tujuan & Ruang Lingkup

Panduan ini mencakup:
- Login dan navigasi panel admin.
- Pengelolaan produk (Wisata, Hotel, Event, Eljohn Academy, Retail Shop).
- Pengelolaan mitra, transaksi, pembayaran, refund, dan laporan.
- Pengelolaan konten publik, special program, afiliasi, dan blog.
- Notifikasi, live chat, audit log, dan praktik keamanan.

---

## 2) Persyaratan Akses

**Akun & Role**
- Hanya user dengan role admin yang dapat mengakses panel.
- Role khusus (misal admin_academy, admin_retail, admin_special_program) memiliki akses terbatas sesuai kategori.

**Perangkat & Browser**
- Disarankan: Chrome/Edge versi terbaru.
- Resolusi minimal: 1366x768.

> [SCREENSHOT: Halaman Login Admin]

---

## 3) Login Admin

**Langkah:**
1. Buka URL admin.
2. Masukkan email & password.
3. Klik **Login**.

**Jika lupa password:**
Gunakan fitur reset password (jika tersedia) atau hubungi Super Admin.

> [SCREENSHOT: Form Login Admin]

---

## 4) Navigasi Utama

**Komponen utama:**
- **Topbar**: pencarian, notifikasi, profil.
- **Sidebar**: menu fitur admin.
- **Breadcrumb**: menunjukkan lokasi halaman saat ini.

> [SCREENSHOT: Layout Dashboard Admin + Sidebar]

---

## 5) Dashboard Admin

**Fungsi:**
Menampilkan ringkasan kinerja platform.

**Umumnya berisi:**
- Total transaksi
- Pendapatan
- Booking harian
- Produk aktif
- Ringkasan notifikasi

> [SCREENSHOT: Dashboard Admin]

---

## 6) Kelola Mitra

Menu ini digunakan untuk mengelola mitra per kategori.

### 6.1) Mitra Wisata
**Fungsi:** verifikasi dan pengelolaan mitra wisata.
**Aksi umum:**
- Lihat detail mitra
- Approve / Reject / Suspend
- Catatan internal

> [SCREENSHOT: Kelola Mitra Wisata]

### 6.2) Mitra Hotel
**Fungsi:** verifikasi dan pengelolaan mitra hotel.

> [SCREENSHOT: Kelola Mitra Hotel]

### 6.3) Mitra Event (EO)
**Fungsi:** review onboarding EO dan status verifikasi.

> [SCREENSHOT: Kelola Mitra Event (EO)]

**Best Practice:**
- Pastikan dokumen legalitas lengkap sebelum approve.
- Gunakan catatan internal untuk audit.

---

## 7) Kelola Produk

### 7.1) Wisata
**Fitur utama:**
- Profil destinasi
- Produk tiket
- Booking & validasi QR
- Laporan pendapatan

> [SCREENSHOT: Master Wisata + Produk Tiket]

### 7.2) Hotel
**Fitur utama:**
- Manajemen hotel & tipe kamar
- Harga & inventory
- Booking & pembayaran

> [SCREENSHOT: Manajemen Hotel + Tipe Kamar]

### 7.3) Event
**Fitur utama:**
- Manajemen event
- Produk tiket
- Booking & peserta
- Validasi QR

> [SCREENSHOT: Manajemen Event + Produk Tiket]

### 7.4) Eljohn Academy
**Fitur utama:**
- Manajemen kelas & jadwal
- Produk tiket kelas
- Booking & peserta
- QR check-in

> [SCREENSHOT: Manajemen Eljohn Academy]

### 7.5) Retail Shop
**Fitur utama:**
- Master produk
- Variasi produk
- Stok & inventory
- Order & pengiriman

> [SCREENSHOT: Manajemen Retail Shop]

---

## 8) Kelola Transaksi & Booking

**Fitur umum di semua kategori:**
- List booking
- Filter berdasarkan status/tanggal
- Detail booking
- Update status (jika diizinkan)

> [SCREENSHOT: Halaman Booking / Transaksi]

**Status yang umum:**
- `pending_payment`
- `paid`
- `cancelled`
- `completed`
- `expired`

**Catatan:**
Pastikan refund atau pembatalan mengikuti kebijakan masing-masing produk.

---

## 9) Pembayaran & Refund

**Fitur yang tersedia:**
- Lihat status pembayaran
- Trigger pembayaran (Snap Midtrans)
- Proses refund manual/massal (jika tersedia)

> [SCREENSHOT: Detail Pembayaran + Status]

**Best Practice:**
1. Konfirmasi status pembayaran dari gateway sebelum mengubah status.
2. Gunakan audit log untuk setiap perubahan finansial.

---

## 10) Special Program

**Tujuan:**
Mengelola program diskon/flash sale/highlight campaign.

**Aksi utama:**
- Buat program
- Atur scope
- Atur diskon/subsidi
- Monitor performa
- Emergency stop (kill switch)

> [SCREENSHOT: Special Program Management]

---

## 11) Afiliasi Wisata

**Fungsi:**
- Review pendaftaran afiliasi
- Atur skema komisi
- Monitoring performa
- Payout afiliasi

> [SCREENSHOT: Manajemen Afiliasi Wisata]

---

## 12) Konten Publik

### 12.1) Banner & Promo Terkini
**Fungsi:**
Mengelola banner utama dan promo terkini di halaman publik.

> [SCREENSHOT: Kelola Banner]

### 12.2) Promo Video
**Fungsi:**
Kelola video promo di halaman publik.

> [SCREENSHOT: Kelola Promo Video]

---

## 13) Blog — Jelajah Indotix

**Fungsi:**
Mengelola konten artikel untuk user.

**Fitur:**
- Kategori & tag
- Editor konten (CKEditor)
- SEO metadata

> [SCREENSHOT: Kelola Blog (Jelajah Indotix)]

---

## 14) Notifikasi & Live Chat

**Notifikasi:**
Menampilkan update transaksi, pengajuan mitra, dan peringatan sistem.

**Live Chat:**
Komunikasi user ↔ admin dan user ↔ mitra.

> [SCREENSHOT: Notifikasi Admin]
> [SCREENSHOT: Live Chat Admin]

---

## 15) Laporan & Audit

**Laporan:**
- Ringkasan pendapatan
- Transaksi per kategori
- Refund rate

**Audit Log:**
Semua perubahan penting dicatat.

> [SCREENSHOT: Laporan & Audit Log]

---

## 16) Keamanan & Praktik Terbaik

**Akses & Role**
- Gunakan role sesuai tugas (least privilege).
- Hindari berbagi akun admin.

**Data Sensitif**
- Jangan menyalin data pribadi user ke luar sistem.
- Gunakan catatan internal untuk verifikasi.

**Operasional**
- Selalu verifikasi pembayaran sebelum approve.
- Pastikan kebijakan refund sesuai SOP.

---

## 17) Troubleshooting Umum

**1) Gagal simpan perubahan**
- Pastikan method sesuai (PUT/POST).
- Cek validasi form.

**2) Harga berubah jadi lebih besar**
- Pastikan input harga tidak mengandung format desimal yang tidak sesuai.
- Gunakan format angka IDR (tanpa desimal).

**3) Upload gagal**
- Cek ukuran file sesuai ketentuan.
- Pastikan format file valid.

> [SCREENSHOT: Contoh Error & Solusi]

---

## 18) Lampiran — Definisi Status

**Booking / Transaksi**
- `pending_payment`: menunggu pembayaran
- `paid`: pembayaran sukses
- `cancelled`: dibatalkan
- `completed`: layanan selesai
- `expired`: pembayaran melewati batas waktu

**Mitra**
- `pending_review`: menunggu review admin
- `verified`: disetujui
- `suspended`: dinonaktifkan sementara

---

## 19) Kontak & Dukungan

Jika butuh bantuan teknis lebih lanjut, hubungi:
- Tim Engineering / Support
- PIC operasional platform

---

**Versi Dokumen:** 1.0  
**Tanggal:** 2026-03-08
