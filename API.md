# INDOTIX API Documentation

**Overview**
Dokumentasi ini menjelaskan penggunaan seluruh endpoint API yang tersedia pada aplikasi INDOTIX. Gunakan bersama `docs/api-response-payloads.md` untuk contoh JSON lengkap per endpoint.

**Base URL**
`/api`

**Headers**
`Accept: application/json`
`Content-Type: application/json`
`Authorization: Bearer <token>` (hanya untuk endpoint Auth=Yes)

**How to Hit**
Contoh GET:
```
GET /api/products/hotels?city=3173&check_in=2026-04-05&check_out=2026-04-06
```
Contoh POST:
```
POST /api/auth/login
Body: { "email": "user@mail.com", "password": "secret123" }
```
Contoh cURL:
```
curl -X POST "/api/auth/login" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@mail.com","password":"secret123"}'
```

**Conventions**
- Format tanggal: `YYYY-MM-DD`.
- Format tanggal & waktu: ISO 8601, contoh `2026-03-30T10:00:00+07:00`.
- Harga dan nominal dikirim dalam integer (IDR).
- `encrypted_id` adalah identifier publik; gunakan nilai ini untuk endpoint detail, booking, review, history.
- Dukungan slug disebutkan per endpoint.
- `guest_phone` pada booking diambil dari profil user, tidak dikirim dari client.
- Pagination bila tersedia: `page`, `per_page`, dan metadata `meta`/`links`.

**Status Codes**
- `200` OK
- `201` Created
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `422` Validation Error
- `429` Too Many Requests
- `500` Server Error

**Response Examples**
Contoh payload lengkap per endpoint ada di `docs/api-response-payloads.md`.

**Auth**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes | 
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | No | `name`, `email`, `password` | `role` (`user|mitra`), `device_name` | `201`: `token`, `token_type`, `user`, `requires_otp`, `otp_expires_at` | `422` email sudah terdaftar; `500` gagal kirim OTP. |
| POST | `/api/auth/login` | No | `email`, `password` | `device_name` | `200`: `token`, `token_type`, `user` | `403` bila belum verifikasi (`requires_otp`) atau akun disuspend; `422` kredensial salah. |
| POST | `/api/auth/google` | No | `access_token` | `role` (`user|mitra`), `device_name` | `200`: `token`, `token_type`, `user` | `422` token tidak valid; `403` akun disuspend. |
| POST | `/api/auth/password/forgot` | No | `email` | - | `200`: `message`, `otp_expires_at?` | Jika email tidak terdaftar tetap `200` dengan pesan umum. |
| POST | `/api/auth/password/reset` | No | `email`, `code`, `password`, `password_confirmation` | - | `200`: `message` | Wajib kirim OTP dulu; `422` OTP salah/kedaluwarsa. |
| GET | `/api/auth/me` | Yes | - | - | `200`: `user` | - |
| POST | `/api/auth/logout` | Yes | - | - | `200`: `message` | Token aktif direvoke. |
| POST | `/api/auth/otp/verify` | Yes | `code` | - | `200`: `message`, `user` | `422` OTP salah/kedaluwarsa; `429` terlalu banyak percobaan. |
| POST | `/api/auth/otp/resend` | Yes | - | - | `200`: `message`, `otp_expires_at` | `429` terlalu banyak permintaan. |

**Profile**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes | 
| --- | --- | --- | --- | --- | --- | --- |
| PUT | `/api/profile` | Yes | - | `name`, `email`, `phone`, `gender` (`male|female|other`) | `200`: `message`, `user` | Jika `email` berubah, `email_verified_at` direset. |
| POST | `/api/profile/password/otp` | Yes | - | - | `200`: `message`, `otp_expires_at` | Kirim OTP ganti password. |
| PUT | `/api/profile/password` | Yes | `current_password`, `password`, `password_confirmation`, `code` | - | `200`: `message` | `422` OTP salah/kedaluwarsa/attempt limit. |
| DELETE | `/api/profile` | Yes | `password` | - | `200`: `message` | Hanya role `user`. Ditolak jika masih ada transaksi aktif. |
Catatan: flow update password = `POST /api/profile/password/otp` → `PUT /api/profile/password`.

**Products: Hotels**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/products/hotels` | No | - | `city`, `check_in`, `check_out`, `rooms`, `guests`, `q` | `200`: `filters`, `hotels`, `recommendations` | Jika `check_in/check_out` kosong, otomatis hari ini & besok. Jika tanpa filter, tampil 10 hotel acak. `city` dapat kode regency 4 digit atau nama kota. |
| GET | `/api/products/hotels/{hotel}` | No | Path: `{hotel}` | Query: `check_in`, `check_out`, `rooms`, `guests` | `200`: `hotel`, `room_types`, `filters`, `reviews` | `{hotel}` = id/encrypted_id. Status hotel harus aktif. |

**Products: Wisata**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/products/wisata` | No | - | `q`, `visit_date`, `quantity` | `200`: `filters`, `destinations` | Default `visit_date` = hari ini, `quantity` = 1. |
| GET | `/api/products/wisata/{destination}` | No | Path: `{destination}` | Query: `visit_date`, `quantity` | `200`: `filters`, `destination`, `tickets`, `reviews` | `{destination}` = slug atau id/encrypted_id. |

**Products: Events**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/products/events` | No | - | `q` | `200`: `filters`, `events` | - |
| GET | `/api/products/events/{event}` | No | Path: `{event}` | - | `200`: `event`, `tickets`, `reviews` | `{event}` = id/encrypted_id. |

**Products: Academy**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/products/academy` | No | - | `q` | `200`: `filters`, `classes` | Jika `q` kosong/`null`/`undefined`, tampil 10 kelas terbaru (urut `start_at` desc). |
| GET | `/api/products/academy/{class}` | No | Path: `{class}` | - | `200`: `class`, `tickets`, `reviews` | `{class}` = slug atau id/encrypted_id. Tiket yang dikembalikan hanya yang aktif dan berada dalam periode penjualan (`sales_start_at`/`sales_end_at`). |

**Products: Souvenirs**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/products/souvenirs` | No | - | `q`, `category_id`, `page` | `200`: `filters`, `products`, `meta?` | Pagination default 12 per halaman. |
| GET | `/api/products/souvenirs/{product}` | No | Path: `{product}` | - | `200`: `product`, `variants`, `reviews` | `{product}` = id/encrypted_id. |

**Products: Special Programs**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/products/special-programs` | No | - | `q`, `category` (`meeting|wedding|travel`) | `200`: `filters`, `programs` | - |
| GET | `/api/products/special-programs/{program}` | No | Path: `{program}` | - | `200`: `program`, `variants`, `facilities`, `reviews` | `{program}` = slug atau id/encrypted_id. |

**Public Banners**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/banners` | No | - | - | `200`: `banners` | Banner publik untuk homepage. |

**Public Content**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/faqs` | No | - | - | `200`: `faqs` | FAQ aktif, urut `sort_order` lalu `id`. |
| GET | `/api/privacy-policy` | No | - | - | `200`: `policy` | Kebijakan privasi aktif terbaru. Jika tidak ada, `policy` = `null`. |

**Bookings: Hotel**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/hotel/bookings/quote` | Yes | `hotel_id`, `room_type_id`, `check_in`, `check_out`, `rooms`, `guests` | `voucher_code` | `200`: `pricing` | Kalkulasi harga sebelum booking. |
| POST | `/api/hotel/bookings` | Yes | `hotel_id`, `room_type_id`, `check_in`, `check_out`, `rooms`, `guests`, `guest_name`, `guest_email` | `special_request`, `voucher_code` | `201`: `booking` | `guest_phone` diambil dari profil. |
| GET | `/api/hotel/bookings` | Yes | - | - | `200`: `bookings` | List booking hotel user. |
| GET | `/api/hotel/bookings/{booking}` | Yes | Path: `{booking}` | - | `200`: `booking` | `{booking}` = id/encrypted_id. |
| POST | `/api/hotel/bookings/{booking}/pay` | Yes | Path: `{booking}` | - | `200`: `payment` atau `booking` | Membuat pembayaran Midtrans Snap. |
| POST | `/api/hotel/bookings/{booking}/cancel` | Yes | Path: `{booking}` | - | `200`: `message` | Hanya bisa saat `pending_payment`. |
| GET | `/api/hotel/bookings/{booking}/invoice` | Yes | Path: `{booking}` | - | `200`: PDF | File PDF invoice. |

**Bookings: Wisata**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/wisata/bookings/quote` | Yes | `destination_id`, `ticket_id`, `visit_date`, `quantity` | - | `200`: `pricing` | Kalkulasi harga sebelum booking. |
| POST | `/api/wisata/bookings` | Yes | `destination_id`, `ticket_id`, `visit_date`, `quantity`, `guest_name`, `guest_email` | `special_request`, `referral_code` | `201`: `booking` | `guest_phone` diambil dari profil. |
| GET | `/api/wisata/bookings` | Yes | - | - | `200`: `bookings` | List booking wisata user. |
| GET | `/api/wisata/bookings/{booking}` | Yes | Path: `{booking}` | - | `200`: `booking` | `{booking}` = id/encrypted_id. |
| POST | `/api/wisata/bookings/{booking}/pay` | Yes | Path: `{booking}` | - | `200`: `payment` atau `booking` | Membuat pembayaran Midtrans Snap. |
| POST | `/api/wisata/bookings/{booking}/cancel` | Yes | Path: `{booking}` | - | `200`: `message` | - |
| GET | `/api/wisata/bookings/{booking}/ticket` | Yes | Path: `{booking}` | - | `200`: PDF | File PDF tiket. |

**Bookings: Event**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/events/bookings/quote` | Yes | `event_id`, `ticket_id`, `quantity` | - | `200`: `pricing` | Kalkulasi harga sebelum booking. |
| POST | `/api/events/bookings` | Yes | `event_id`, `ticket_id`, `quantity`, `guest_name`, `guest_email` | - | `201`: `booking` | `guest_phone` diambil dari profil. |
| GET | `/api/events/bookings` | Yes | - | - | `200`: `bookings` | List booking event user. |
| GET | `/api/events/bookings/{booking}` | Yes | Path: `{booking}` | - | `200`: `booking` | `{booking}` = id/encrypted_id. |
| POST | `/api/events/bookings/{booking}/pay` | Yes | Path: `{booking}` | - | `200`: `payment` atau `booking` | Membuat pembayaran Midtrans Snap. |
| POST | `/api/events/bookings/{booking}/cancel` | Yes | Path: `{booking}` | - | `200`: `message` | - |

**Bookings: Special Programs**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/special-programs/bookings/quote` | Yes | `program_id`, `date`, `quantity` | `variant_id` | `200`: `pricing` | Kalkulasi harga sebelum booking. |
| POST | `/api/special-programs/bookings` | Yes | `program_id`, `date`, `quantity`, `guest_name`, `guest_email` | `variant_id`, `notes` | `201`: `booking` | `guest_phone` diambil dari profil. |
| GET | `/api/special-programs/bookings` | Yes | - | - | `200`: `bookings` | List booking special program user. |
| GET | `/api/special-programs/bookings/{booking}` | Yes | Path: `{booking}` | - | `200`: `booking` | `{booking}` = id/encrypted_id. |
| POST | `/api/special-programs/bookings/{booking}/pay` | Yes | Path: `{booking}` | - | `200`: `payment` atau `booking` | Membuat pembayaran Midtrans Snap. |
| POST | `/api/special-programs/bookings/{booking}/cancel` | Yes | Path: `{booking}` | - | `200`: `message` | - |

**Orders: Souvenir**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/souvenir/orders/quote` | Yes | `items` | - | `200`: `pricing` | `items` berisi `product_id`, `variant_id?`, `quantity`. |
| POST | `/api/souvenir/orders` | Yes | `items`, `guest_name`, `guest_email` | `notes`, `shipping_method` | `201`: `order` | `guest_phone` dan alamat utama diambil dari profil. |
| GET | `/api/souvenir/orders` | Yes | - | - | `200`: `orders` | List order souvenir user. |
| GET | `/api/souvenir/orders/{order}` | Yes | Path: `{order}` | - | `200`: `order` | `{order}` = id/encrypted_id. |
| POST | `/api/souvenir/orders/{order}/pay` | Yes | Path: `{order}` | - | `200`: `payment` atau `order` | Membuat pembayaran Midtrans Snap. |

**Bookings: Academy**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/academy/bookings/quote` | Yes | `class_id`, `ticket_id`, `quantity` | - | `200`: `pricing` | Kalkulasi harga sebelum booking. |
| POST | `/api/academy/bookings` | Yes | `class_id`, `ticket_id`, `quantity`, `guest_name`, `guest_email` | - | `201`: `booking` | `guest_phone` diambil dari profil. |
| GET | `/api/academy/bookings` | Yes | - | - | `200`: `bookings` | List booking academy user. |
| GET | `/api/academy/bookings/{booking}` | Yes | Path: `{booking}` | - | `200`: `booking` | `{booking}` = id/encrypted_id. |
| POST | `/api/academy/bookings/{booking}/pay` | Yes | Path: `{booking}` | - | `200`: `payment` atau `booking` | Membuat pembayaran Midtrans Snap. |
| POST | `/api/academy/bookings/{booking}/cancel` | Yes | Path: `{booking}` | - | `200`: `message` | - |
| GET | `/api/academy/bookings/{booking}/ticket` | Yes | Path: `{booking}` | - | `200`: PDF | File PDF tiket. |
| GET | `/api/academy/bookings/{booking}/qr` | Yes | Path: `{booking}` | - | `200`: PDF | File PDF QR. |
Catatan: tiket hanya bisa di-quote/booking bila aktif dan berada dalam periode penjualan (`sales_start_at`/`sales_end_at`).

**History**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/history` | Yes | - | `type`/`category` (`hotel|wisata|event|special_program|souvenir|academy`), `status`, `q`, `date_from`, `date_to` | `200`: `history` | Menyatukan history semua tipe. |
| GET | `/api/history/{type}/{booking}` | Yes | Path: `{type}`, `{booking}` | - | `200`: `detail` | `{booking}` = id/encrypted_id. |

**Reviews**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/reviews` | Yes | `product_type`, `product_id` | - | `200`: `reviews` | `product_id` wajib encrypted_id. |
| POST | `/api/reviews` | Yes | `product_type`, `product_id`, `rating` | `comment` | `201`: `review` | Hanya bisa jika booking sudah digunakan/selesai. |

**Notifications**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/notifications` | Yes | - | `per_page`, `status` (`read|unread`), `type` (comma list), `q` | `200`: `notifications`, `meta` | Pagination tersedia. |
| GET | `/api/notifications/unread-count` | Yes | - | - | `200`: `count` | Jumlah notifikasi belum dibaca. |
| POST | `/api/notifications/read-all` | Yes | - | - | `200`: `message` | Tandai semua sebagai dibaca. |
| POST | `/api/notifications/{notification}/read` | Yes | Path: `{notification}` | - | `200`: `message` | Tandai satu notifikasi dibaca. |

**Admin Notifications**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/admin/notifications` | Yes | `title`, `message`, `type` | `data` (object) | `200`: `message`, `trace_id`, `target`, `stats` | Hanya role `admin`. Broadcast ke role `user`. |

**Push Tokens**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/push/tokens` | Yes | `token` | `platform`, `device_id` | `200`: `message` | Simpan token FCM. |
| POST | `/api/push/tokens/revoke` | Yes | `token` atau `device_id` | - | `200`: `message` | Salah satu wajib diisi. |

**Souvenir Cart**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/souvenir/cart` | Yes | - | - | `200`: `items`, `summary` | Ambil isi cart. |
| POST | `/api/souvenir/cart/add` | Yes | `product_id`, `quantity` | `variant_id` | `200`: `items`, `summary` | Tambah item ke cart. |
| POST | `/api/souvenir/cart/update` | Yes | `product_id`, `quantity` | `variant_id` | `200`: `items`, `summary` | `quantity=0` akan menghapus item. |
| POST | `/api/souvenir/cart/remove` | Yes | `product_id` | `variant_id` | `200`: `items`, `summary` | Hapus item tertentu. |
| POST | `/api/souvenir/cart/clear` | Yes | - | - | `200`: `message` | Kosongkan cart. |

**Chat**
| Method | Endpoint | Auth | Required | Optional | Success Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/chat/conversations` | Yes | - | - | `200`: `conversations` | List percakapan. |
| POST | `/api/chat/start` | Yes | `type` (`wisata|hotel|souvenir|event|academy|special_program|admin`) | `id` | `200`: `conversation` | `id` wajib kecuali `admin`. |
| GET | `/api/chat/conversations/{conversation}` | Yes | Path: `{conversation}` | `per_page` | `200`: `conversation`, `messages`, `meta?` | Detail + pesan awal. |
| GET | `/api/chat/conversations/{conversation}/messages` | Yes | Path: `{conversation}` | `per_page`, `after_id` | `200`: `messages`, `meta?` | Ambil pesan setelah id tertentu. |
| POST | `/api/chat/conversations/{conversation}/messages` | Yes | Path: `{conversation}`, `message` | - | `201`: `message` | Kirim pesan baru. |
| POST | `/api/chat/conversations/{conversation}/read` | Yes | Path: `{conversation}` | - | `200`: `message` | Tandai pesan sebagai sudah dibaca. |
