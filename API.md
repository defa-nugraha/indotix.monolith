# API Change Log

Dokumen ini mencatat perubahan API agar selaras dengan alur WEB saat ini.

## Changelog Per Versi
| Versi | Tanggal | Ringkasan |
| --- | --- | --- |
| 2026.03.30 | 2026-03-30 | Penyelarasan media & peta untuk produk publik (hotel/wisata/event), plus alias camelCase untuk payload detail. |
| 2026.03.29 | 2026-03-29 | Sinkronisasi payload API dengan WEB untuk special program, booking, history, reviews, dan hotel pricing. |

## Changelog Per Endpoint
| Endpoint | Perubahan Utama |
| --- | --- |
| `GET /api/products/special-programs` | Pindah ke model `SpecialProgram`, field `name`, `category`, `min_price`, `image_url`. |
| `GET /api/products/special-programs/{program}` | Detail memakai `name`, `category`, `base_price`, `capacity`, `variants`, `facilities`, `inventories`. |
| `POST /api/special-programs/bookings/quote` | Input `program_id`, `variant_id`, `date`, `quantity`; keluaran pricing sesuai web. |
| `POST /api/special-programs/bookings` | Booking payload pakai `program`, `variant`, `unit_price`, `visit_date`. |
| `POST /api/special-programs/bookings/{booking}/pay` | Pembayaran Midtrans Snap sesuai flow web. |
| `GET /api/history` | Tambah `review_url` dan `can_review` untuk semua tipe. |
| `GET /api/history/hotel/{booking}` | Tambah `service_fee`, `tax_total`, `taxes`. |
| `GET /api/products/events` | Tambah `slug`, `image_url` fallback, dan `maps_url` lebih robust (alamat/lokasi/link peta). |
| `GET /api/products/events/{event}` | Tambah `slug`, `image_url` fallback, `userReview`/`canReview` alias, `maps_url` lebih robust. |
| `GET /api/products/academy` | Tambah `slug`. |
| `GET /api/products/academy/{class}` | Tambah `slug`, `reviews`, `user_review`, `can_review`. |
| `GET /api/products/souvenirs` | Tambah `slug`, casting `price`, `stock` ke integer. |
| `GET /api/products/souvenirs/{product}` | Tambah `slug`, `reviews`, `user_review`, `can_review`, casting `additional_price` & `stock`. |
| `GET /api/products/wisata` | `photo_url` memakai cover foto (area/gate/ticket/other) + fallback. |
| `GET /api/products/wisata/{destination}` | Tambah `cover_photo_url`, `maps_embed_url`, `userReview`/`canReview` alias, `maps_url` fallback ke `maps_pin_url`. |
| `GET /api/products/hotels` | Tambah `recommendations`, `image_url` fallback untuk list & rekomendasi, default tanggal saat kosong. |
| `GET /api/products/hotels/{hotel}` | Tambah `roomTypes` alias + `userReview`/`canReview` alias. |
| `POST /api/hotel/bookings/quote` | Tambah `service_fee`, `tax_total`, `taxes`. |
| `POST /api/hotel/bookings` | `guest_phone` dari profil; hitung pajak + service fee. |
| `POST /api/wisata/bookings` | `guest_phone` dari profil. |
| `POST /api/events/bookings` | `guest_phone` dari profil. |
| `POST /api/academy/bookings` | `guest_phone` dari profil. |
| `POST /api/souvenir/orders` | `guest_phone` & `shipping_address` dari profil; `shipping_method` set `delivery`. |

## 2026-03-29
1. Special Program API disesuaikan penuh ke model `SpecialProgram`.
   - Endpoint: `GET /api/products/special-programs`, `GET /api/products/special-programs/{program}`.
   - Perubahan: pakai field `name`, `category`, `base_price`, `capacity`, `image_url` + list `variants`, `facilities`, `inventories`.

2. Special Program Booking API mengikuti flow pembayaran web.
   - Endpoint: `POST /api/special-programs/bookings/quote`, `POST /api/special-programs/bookings`, `GET /api/special-programs/bookings`, `GET /api/special-programs/bookings/{booking}`, `POST /api/special-programs/bookings/{booking}/pay`, `POST /api/special-programs/bookings/{booking}/cancel`.
   - Perubahan: field input memakai `program_id`, `variant_id`, `date`, `quantity` dan payload booking menampilkan `program`, `variant`, `unit_price`, `total`, `visit_date`, `booking_code`.

3. History API diselaraskan untuk Special Program.
   - Endpoint: `GET /api/history`, `GET /api/history/{type}/{booking}`.
   - Perubahan: history special program mengambil dari `SpecialProgramBooking`, bukan `EventBooking`.

4. History API menambahkan review info sesuai WEB.
   - Endpoint: `GET /api/history`.
   - Perubahan: menambahkan `review_url` dan `can_review` untuk semua tipe (hotel/wisata/event/special_program/souvenir/academy).

5. History detail hotel menyertakan detail pajak dan service fee.
   - Endpoint: `GET /api/history/hotel/{booking}`.
   - Perubahan: `service_fee`, `tax_total`, `taxes` ditambahkan.

6. Event & Academy API menambahkan `slug` + review info.
   - Endpoint: `GET /api/products/events`, `GET /api/products/events/{event}`, `GET /api/products/academy`, `GET /api/products/academy/{class}`.
   - Perubahan: `slug` ditambahkan ke list & detail, serta `reviews`, `user_review`, `can_review` di detail.

7. Souvenir API menambahkan `slug` + review info dan casting harga.
   - Endpoint: `GET /api/products/souvenirs`, `GET /api/products/souvenirs/{product}`.
   - Perubahan: `slug` ditambahkan, `reviews`, `user_review`, `can_review` ditambahkan, casting `price`, `stock`, `additional_price` ke integer.

8. Wisata detail API menambahkan media tambahan.
   - Endpoint: `GET /api/products/wisata/{destination}`.
   - Perubahan: `photo_other_urls` dan `maps_pin_url` ditampilkan.

9. Hotel API menambahkan rekomendasi.
   - Endpoint: `GET /api/products/hotels`.
   - Perubahan: field `recommendations` (3 hotel terbaru) ditambahkan.

10. Booking API memakai nomor HP dari profil (sesuai WEB).
    - Endpoint: `POST /api/hotel/bookings`, `POST /api/wisata/bookings`, `POST /api/events/bookings`, `POST /api/academy/bookings`.
    - Perubahan: `guest_phone` tidak lagi diinput client, diambil dari profil user.

11. Souvenir booking memakai alamat utama profil.
    - Endpoint: `POST /api/souvenir/orders`.
    - Perubahan: `guest_phone` + `shipping_address` diambil dari profil user, `shipping_method` ditetapkan `delivery`.

12. Hotel booking API menghitung pajak dan service fee seperti WEB.
    - Endpoint: `POST /api/hotel/bookings/quote`, `POST /api/hotel/bookings`.
    - Perubahan: menambahkan `service_fee`, `tax_total`, `taxes` pada response pricing dan payload booking.

## 2026-03-30
1. Event API menyajikan gambar fallback + peta yang lebih robust.
   - Endpoint: `GET /api/products/events`, `GET /api/products/events/{event}`.
   - Perubahan: `image_url` fallback Unsplash, `maps_url` pakai `address`/`location`/`city` atau link peta langsung, alias `userReview`/`canReview`.

2. Wisata API menambahkan cover photo dan embed map.
   - Endpoint: `GET /api/products/wisata`, `GET /api/products/wisata/{destination}`.
   - Perubahan: `photo_url` memilih cover foto pertama, `cover_photo_url` ditambahkan, `maps_embed_url` ditambahkan, `maps_url` fallback ke `maps_pin_url`, alias `userReview`/`canReview`.

3. Hotel API menambahkan fallback gambar dan alias payload detail.
   - Endpoint: `GET /api/products/hotels`, `GET /api/products/hotels/{hotel}`.
   - Perubahan: `image_url` fallback Unsplash untuk list/rekomendasi, `roomTypes` alias, `userReview`/`canReview` alias.

4. Hotel API menambahkan fallback tanggal jika filter kosong.
   - Endpoint: `GET /api/products/hotels`, `GET /api/products/hotels/{hotel}`.
   - Perubahan: jika `check_in`/`check_out` kosong, otomatis pakai tanggal hari ini dan besok.

## Referensi Payload
- Contoh payload lengkap per endpoint ada di `docs/api-response-payloads.md`.
