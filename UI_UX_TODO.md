# UI/UX TODO

## Saran Lanjutan

1. Buat visual regression test untuk halaman publik utama: homepage, wisata detail, hotel detail, event detail, login, register, dan dashboard.
2. Buat audit authenticated dengan akun admin, mitra hotel, mitra wisata, mitra event, dan user biasa menggunakan data staging.
3. Standardisasi seluruh form CRUD admin/mitra ke pola label, helper text, error, dan loading state yang sama.
4. Buat komponen reusable untuk empty state, page header, filter bar, action group, dan table shell.
5. Tambahkan accessibility test dengan axe atau Playwright untuk halaman prioritas.
6. Dokumentasikan design token untuk warna status, spacing, border radius, shadow, dan typography.
7. Evaluasi table mobile: beberapa tabel besar sebaiknya memakai card list di mobile, bukan hanya horizontal scroll.
8. Tambahkan skeleton/loading state yang konsisten untuk halaman publik dan dashboard.

## Ide Improvement Jangka Panjang

- Membuat design system internal INDOTIX berbasis komponen yang sudah ada.
- Menambahkan Storybook atau halaman katalog komponen internal agar style tidak bercabang.
- Menambahkan guideline image ratio per kategori produk: banner, wisata, hotel, event, academy, special program, dan retail.
- Menambahkan audit SEO visual untuk memastikan meta, heading, alt text, dan schema selalu sinkron dengan konten halaman.
- Membuat checklist QA UI sebelum deploy: desktop, tablet, mobile, focus keyboard, empty state, error state, dan data panjang.

## Butuh Konfirmasi Owner/Product

- Prioritas halaman authenticated mana yang paling sering digunakan tim operasional.
- Apakah tabel mobile tetap di-scroll horizontal atau diubah menjadi card list per modul.
- Batas panjang default deskripsi sebelum tombol `Selengkapnya` pada setiap kategori produk.
- Apakah visual dashboard admin/mitra boleh disederhanakan lebih jauh pada fase redesign berikutnya.
