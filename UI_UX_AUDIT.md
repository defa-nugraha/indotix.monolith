# UI/UX Audit INDOTIX Web

## Ringkasan Kondisi Awal

Website INDOTIX sudah memiliki struktur fitur yang lengkap dan pola frontend yang cukup jelas: Laravel, Inertia React, Tailwind CSS, komponen UI reusable, layout publik, layout auth, dan layout admin/mitra. Kondisi utama yang ditemukan adalah beberapa halaman publik dan komponen lintas halaman masih belum konsisten pada spacing, keterbacaan teks panjang, responsivitas mobile, fokus keyboard, serta affordance pada tabel, form, dan floating action.

Perbaikan dilakukan dengan pendekatan aman: memperkuat komponen reusable dan layout publik tanpa mengubah route utama, API, autentikasi, schema database, atau alur bisnis.

## Halaman dan Komponen yang Diaudit

- Homepage dan section produk publik.
- Halaman detail produk wisata, hotel, event, academy, special program, dan retail/souvenir.
- Layout publik, header publik, floating WhatsApp, dan floating panduan.
- Halaman login/register melalui layout auth.
- Komponen form umum, error message, heading, dan review.
- Komponen table pagination untuk halaman data admin/mitra.
- Pola gambar/gallery, deskripsi panjang, sticky section navigation, dan CTA pada tampilan mobile.
- Breakpoint desktop dan mobile untuk halaman publik utama.

## Masalah Utama yang Ditemukan

1. Deskripsi produk dan tiket yang panjang berpotensi membuat halaman detail terlalu tinggi dan sulit dipindai.
2. Gallery produk pada mobile menampilkan terlalu banyak gambar sekaligus sehingga layout mudah melewati lebar layar.
3. Floating WhatsApp dan tombol panduan terlalu tinggi pada beberapa tampilan mobile dan dapat mengganggu konten.
4. Pagination tabel masih memakai microcopy campuran Inggris dan kontrolnya dapat memanjang pada layar kecil.
5. Form error belum memiliki state aksesibilitas yang jelas untuk screen reader.
6. Section ulasan masih terlalu polos ketika data kosong dan spacing formnya kurang kuat di mobile.
7. Focus state global belum cukup konsisten untuk navigasi keyboard.
8. Heading reusable masih perlu line-height dan batas lebar deskripsi agar hierarchy lebih jelas.

## Rekomendasi Prioritas

1. Prioritas 1: Jaga halaman publik detail tetap rapi di mobile, terutama gallery, CTA, dan deskripsi panjang.
2. Prioritas 1: Pastikan komponen tabel dan form tetap mudah digunakan pada halaman admin/mitra.
3. Prioritas 2: Konsistenkan microcopy UI dalam Bahasa Indonesia.
4. Prioritas 2: Perkuat focus state, label, error, empty state, dan hover state.
5. Prioritas 3: Lanjutkan standardisasi card, table, modal, alert, dan form pada seluruh CRUD admin/mitra.
6. Prioritas 4: Tambahkan visual regression test untuk halaman publik dan halaman authenticated yang paling sering digunakan.

## Perubahan yang Sudah Dilakukan

- Menambahkan komponen `ProductDescription` untuk deskripsi panjang dengan ellipsis dan tombol `Selengkapnya`.
- Merapikan halaman detail wisata dan hotel agar gallery lebih proporsional, gambar tidak meluber di mobile, dan navigasi section tidak lagi floating saat scroll.
- Membatasi preview gallery di detail wisata/hotel dan menyediakan aksi `Lihat semua gambar`.
- Menyesuaikan floating WhatsApp dan floating panduan agar tidak terlalu mengganggu konten mobile.
- Menambahkan guard CSS pada layout publik agar media tidak overflow dan grid dua kolom berubah menjadi satu kolom pada mobile.
- Memperbarui pagination tabel dengan Bahasa Indonesia, kontrol awal/akhir halaman, scroll horizontal aman pada mobile, serta `aria-label`.
- Memperkuat error form dengan `role="alert"` dan `aria-live`.
- Merapikan heading reusable dengan line-height, font weight, dan max width deskripsi.
- Merapikan section ulasan: heading lebih jelas, empty state lebih terlihat, input focus lebih konsisten, dan tombol submit full-width pada mobile.
- Menambahkan focus-visible global agar navigasi keyboard tetap terlihat.

## Perubahan yang Belum Dilakukan dan Alasannya

- Audit visual authenticated menyeluruh dengan semua role belum dapat dipastikan 100 persen karena beberapa halaman membutuhkan data dan akun role tertentu. Struktur reusable sudah diperbaiki, tetapi tetap disarankan cek manual dengan data production/staging.
- Redesign besar dashboard admin/mitra tidak dilakukan karena instruksi meminta tidak mengubah logic dan tidak membuat perubahan ekstrem yang membingungkan user lama.
- Visual regression otomatis belum ditambahkan karena tidak ada setup Playwright/Cypress khusus yang stabil untuk semua role dan data.
- Standardisasi penuh semua form CRUD belum dilakukan secara menyeluruh karena risiko menyentuh banyak file bisnis. Perbaikan diarahkan ke komponen reusable agar dampaknya aman.
