# UI/UX Changelog

## File yang Diubah

### `resources/css/app.css`

- Menambahkan guard media publik agar gambar, video, dan iframe tidak melewati container.
- Menambahkan focus-visible global untuk link, button, input, select, textarea, dan elemen role button.
- Menyesuaikan floating WhatsApp dan panduan pada mobile.
- Menambahkan aturan responsive publik agar grid produk tidak meluber pada layar kecil.

Dampak UI/UX: tampilan publik lebih stabil di mobile, fokus keyboard lebih terlihat, dan floating action tidak terlalu mengganggu konten.

Risiko kecil: perlu cek manual halaman publik dengan layout grid khusus karena ada guard mobile untuk grid dua kolom di public shell.

### `resources/js/components/product-description.tsx`

- Menambahkan komponen deskripsi dengan ellipsis dan tombol `Selengkapnya`.

Dampak UI/UX: halaman detail lebih mudah dipindai dan teks panjang tidak langsung mengambil terlalu banyak ruang.

Risiko kecil: teks HTML yang sangat kompleks perlu dicek manual agar tetap tampil sesuai ekspektasi.

### `resources/js/pages/public/wisata/show.tsx`

- Merapikan gallery mobile, membatasi preview gambar, menambahkan overlay `Lihat semua gambar`, dan membuat section navigation tidak floating saat scroll.
- Merapikan area informasi produk, deskripsi, harga, dan CTA agar lebih proporsional di samping area pemesanan.

Dampak UI/UX: detail wisata lebih rapi di desktop dan mobile, tanpa gambar yang melewati layar.

Risiko kecil: perlu cek manual variasi produk dengan jumlah gambar sangat sedikit atau sangat banyak.

### `resources/js/pages/public/hotels/show.tsx`

- Merapikan gallery hotel, membatasi preview gambar, menambahkan overlay `Lihat semua gambar`, dan menyesuaikan card kamar pada mobile.
- Membuat section navigation tidak floating saat scroll.

Dampak UI/UX: detail hotel lebih proporsional dan mobile-friendly.

Risiko kecil: perlu cek manual hotel dengan banyak tipe kamar dan banyak media.

### `resources/js/pages/public/events/show.tsx`
### `resources/js/pages/public/academy/show.tsx`
### `resources/js/pages/public/special-programs/show.tsx`
### `resources/js/pages/public/souvenir/show.tsx`

- Menggunakan pola deskripsi ellipsis untuk konten panjang.

Dampak UI/UX: halaman detail produk lintas kategori lebih konsisten dan tidak terlalu padat.

Risiko kecil: perlu cek manual deskripsi yang berisi tabel atau embed.

### `resources/js/layouts/public-layout.tsx`

- Menambahkan class shell publik untuk guard responsive dan penempatan floating action.

Dampak UI/UX: layout publik lebih terkendali pada mobile.

Risiko kecil: perlu cek halaman publik statis dengan layout kustom.

### `resources/js/components/coach-marks.tsx`

- Menyesuaikan class launcher panduan agar posisinya bisa dikontrol berdasarkan konteks publik.

Dampak UI/UX: tombol panduan tidak bertabrakan dengan floating WhatsApp dan bottom navigation.

Risiko kecil: perlu cek posisi pada halaman admin/mitra dengan viewport kecil.

### `resources/js/components/table-pagination.tsx`

- Mengubah microcopy pagination menjadi Bahasa Indonesia.
- Menambahkan label aksesibilitas, tombol awal/akhir halaman, dan layout pagination yang lebih aman di mobile.

Dampak UI/UX: tabel admin/mitra lebih mudah dipahami dan pagination tidak mudah memaksa overflow.

Risiko kecil: halaman dengan lebih dari satu paginator perlu dicek manual karena navigasi masih mengikuti pola query yang sudah ada.

### `resources/js/components/input-error.tsx`

- Menambahkan `role="alert"` dan `aria-live="polite"`.
- Merapikan line-height dan font weight error.

Dampak UI/UX: error form lebih mudah terbaca dan lebih baik untuk screen reader.

Risiko kecil: sangat rendah, hanya styling dan atribut aksesibilitas.

### `resources/js/components/heading.tsx`

- Merapikan hierarchy heading dengan line-height, weight, dan max width deskripsi.

Dampak UI/UX: judul halaman/settings lebih mudah dibaca.

Risiko kecil: halaman dengan heading sangat panjang perlu cek wrap text.

### `resources/js/components/reviews/review-section.tsx`

- Merapikan heading, empty state, focus input, tombol submit mobile, dan spacing review.

Dampak UI/UX: section ulasan lebih profesional dan nyaman digunakan di mobile.

Risiko kecil: perlu cek manual upload media review pada perangkat mobile.

## Catatan Validasi Manual

- Cek ulang halaman publik dengan data real yang memiliki banyak gambar.
- Cek ulang halaman admin/mitra yang memiliki tabel panjang.
- Cek ulang form dengan error validasi agar pesan tetap muncul di posisi yang tepat.
- Cek ulang posisi floating WhatsApp dan panduan pada iOS/Android browser.
