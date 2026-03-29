# API Change Log

Dokumen ini mencatat perubahan API agar selaras dengan alur WEB saat ini.

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

## Referensi Payload
- Contoh payload lengkap per endpoint ada di `docs/api-response-payloads.md`.
