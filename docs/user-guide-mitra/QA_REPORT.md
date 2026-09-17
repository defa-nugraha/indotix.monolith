# Hasil QA User Guide Mitra

Pemeriksaan 14-15 September 2026, source aplikasi `6e12e5a`.

## Lingkup dan artefak

- Role Mitra Wisata web, 14 bagian perjalanan pengguna.
- 44 screenshot asli dan 44 versi beranotasi, PNG 2880 x 1800.
- Markdown, HTML responsive, PDF A3 landscape dengan daftar isi dan nomor halaman.
- Inventory, screenshot map, hasil verifikasi, known issues, dan script pembaruan tersedia di folder ini.
- Tidak ada perubahan UI, route, business logic, atau data produksi.

## Pengujian aplikasi

Build frontend existing berhasil melalui `npm run build`. Migrasi existing berhasil pada database MySQL khusus dokumentasi. Full suite PHPUnit tidak dijalankan untuk pekerjaan dokumentasi ini; verifikasi yang dilaporkan adalah interaksi browser terhadap aplikasi aktual.

Alur yang berhasil dijalankan: registrasi Mitra, tautan verifikasi email lokal, pemilihan wisata, penyimpanan penanggung jawab, upload foto, pengajuan verifikasi, persetujuan dokumen kerja sama, tambah/edit tiket, filter/detail booking, balasan ulasan, laporan masalah, balasan chat, perubahan profil, perubahan password, reset password melalui tautan lokal, logout, penyimpanan operasional destinasi, serta unduhan PDF QR.

Pengajuan usaha dikonfirmasi melalui pembacaan database development: status `pending`, tiga path foto tersimpan. Tidak ada persetujuan usaha nyata oleh admin. Legalitas contoh telah dipersiapkan sebagai fixture non-sensitif.

Form paket dan dialog hapus diperiksa tanpa mengklaim eksekusi penyimpanan paket/penghapusan berhasil. SMTP eksternal, Google OAuth, bank, Midtrans, kamera dan printer fisik berada di luar verifikasi ini. Riwayat percobaan tooling tetap tersedia; gunakan hasil terakhir di `verification-summary.json` untuk status tiap alur.

## QA visual dan struktur

- Seluruh screenshot ditinjau melalui contact sheet dan pemeriksaan ukuran penuh untuk elemen berisiko.
- Bounding box berasal dari posisi DOM; nomor berurutan dan penjelasan memakai sumber map yang sama.
- Nomor anotasi dipindahkan ke luar target agar label/field utama tidak tertutup.
- Tidak ada screenshot devtools, password nyata, token pemulihan, atau data pelanggan produksi. Route reset disimpan sebagai template tanpa token.
- HTML diperiksa pada lebar 320, 390, 768, 1440: tidak ada horizontal overflow atau gambar rusak.
- PDF dirender menggunakan Poppler. Layout halaman, heading, gambar, callout, footer dan nomor halaman ditinjau; jumlah halaman diperiksa terhadap struktur sumber untuk mendeteksi halaman tambahan yang tidak disengaja.
- Pemeriksaan otomatis terakhir tersedia pada `artifact-validation.json` dan `document-qa.json`.

## Temuan aplikasi

Tiga temuan dicatat di `KNOWN_ISSUES.md`: pemetaan nilai Riwayat Payout menyebabkan halaman berisi data gagal tampil; metadata pagination ulasan tidak sesuai isi; teks bantuan payout menyiratkan aksi yang tidak tersedia. Temuan tidak diperbaiki dalam pekerjaan dokumentasi dan tidak disembunyikan dengan mockup.

## Pemakaian

HTML adalah versi baca utama. PDF berformat lebar untuk menjaga ukuran screenshot desktop; bukan booklet A4. Gunakan zoom bila membaca seluruh halaman pada layar kecil, atau buka HTML yang memiliki daftar isi mobile dan tautan gambar ukuran penuh.
