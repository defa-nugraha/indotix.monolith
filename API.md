# INDOTIX API Documentation

**Overview**
Dokumentasi ini menjelaskan penggunaan seluruh endpoint API yang tersedia pada aplikasi INDOTIX. Gunakan bersama `docs/api-response-payloads.md` untuk contoh JSON lengkap per endpoint.

**Base URL**
`/api`

**Auth**
Gunakan token Laravel Sanctum.
Header: `Authorization: Bearer <token>`
Header JSON: `Content-Type: application/json`, `Accept: application/json`

**Common Rules**
- Format tanggal: `YYYY-MM-DD`.
- Format tanggal & waktu: ISO 8601, contoh `2026-03-30T10:00:00`.
- Beberapa endpoint menerima `{id}` atau `{encrypted_id}` pada path. Dukungan slug disebutkan per endpoint.
- `guest_phone` untuk booking diambil dari profil user, tidak dikirim dari client.
- Error umumnya mengembalikan `message` dan kadang `errors` pada status `4xx`.

**Response Examples**
Contoh payload lengkap per endpoint ada di `docs/api-response-payloads.md`.

**Auth Endpoints**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | No | `name`, `email`, `password`, `role?` (`user|mitra`), `device_name?` | Mengembalikan token dan flag `requires_otp` bila email belum terverifikasi. |
| POST | `/api/auth/login` | No | `email`, `password`, `device_name?` | Jika email belum terverifikasi, response berisi `requires_otp`. |
| POST | `/api/auth/google` | No | `access_token`, `role?` (`user|mitra`), `device_name?` | Login via token Google. |
| GET | `/api/auth/me` | Yes | - | Mengembalikan data user. |
| POST | `/api/auth/logout` | Yes | - | Revoke token aktif. |
| POST | `/api/auth/otp/verify` | Yes | `code` (6 digit) | Verifikasi OTP email. |
| POST | `/api/auth/otp/resend` | Yes | - | Kirim ulang OTP. |

**Products: Hotels**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/products/hotels` | No | Query: `city?` (kode regency 4 digit), `check_in?`, `check_out?`, `rooms?` (1-10), `guests?` (1-20), `q?` | Jika `check_in/check_out` kosong, otomatis pakai hari ini & besok. Jika tidak ada filter (`q/city/check_in/check_out`) tampil 10 hotel acak. |
| GET | `/api/products/hotels/{hotel}` | No | Path: `{hotel}` = id/encrypted_id. Query: `check_in?`, `check_out?`, `rooms?`, `guests?` | Default tanggal sama seperti list. |

**Products: Wisata**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/products/wisata` | No | Query: `q?`, `visit_date?`, `quantity?` | Default `visit_date` = hari ini, `quantity` = 1. |
| GET | `/api/products/wisata/{destination}` | No | Path: `{destination}` = slug atau id/encrypted_id. Query: `visit_date?`, `quantity?` | Default `visit_date` = hari ini, `quantity` = 1. |

**Products: Events**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/products/events` | No | Query: `q?` | - |
| GET | `/api/products/events/{event}` | No | Path: `{event}` = id/encrypted_id | Slug tidak didukung di API. |

**Products: Academy**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/products/academy` | No | Query: `q?` | Jika `q` kosong, tampil 10 kelas acak. |
| GET | `/api/products/academy/{class}` | No | Path: `{class}` = id/encrypted_id | Slug tidak didukung di API. |

**Products: Souvenirs**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/products/souvenirs` | No | Query: `q?`, `category_id?`, `page?` | Pagination default 12 per halaman. |
| GET | `/api/products/souvenirs/{product}` | No | Path: `{product}` = id/encrypted_id | - |

**Products: Special Programs**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/products/special-programs` | No | Query: `q?`, `category?` (`meeting|wedding|travel`) | - |
| GET | `/api/products/special-programs/{program}` | No | Path: `{program}` = slug atau id/encrypted_id | - |

**Public Banners**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/banners` | No | - | Banner publik untuk homepage. |

**Bookings: Hotel**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/hotel/bookings/quote` | Yes | `hotel_id`, `room_type_id`, `check_in`, `check_out`, `rooms` (1-10), `guests` (1-20), `voucher_code?` | Mengembalikan kalkulasi harga. |
| POST | `/api/hotel/bookings` | Yes | `hotel_id`, `room_type_id`, `check_in`, `check_out`, `rooms`, `guests`, `guest_name`, `guest_email`, `special_request?`, `voucher_code?` | `guest_phone` diambil dari profil. |
| GET | `/api/hotel/bookings` | Yes | - | List booking hotel user. |
| GET | `/api/hotel/bookings/{booking}` | Yes | Path: `{booking}` = id/encrypted_id | Detail booking. |
| POST | `/api/hotel/bookings/{booking}/pay` | Yes | - | Membuat pembayaran Midtrans Snap. |
| POST | `/api/hotel/bookings/{booking}/cancel` | Yes | - | Hanya bisa saat `pending_payment`. |
| GET | `/api/hotel/bookings/{booking}/invoice` | Yes | - | Mengunduh invoice PDF. |

**Bookings: Wisata**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/wisata/bookings/quote` | Yes | `destination_id`, `ticket_id`, `visit_date`, `quantity` (1-20) | Kalkulasi harga. |
| POST | `/api/wisata/bookings` | Yes | `destination_id`, `ticket_id`, `visit_date`, `quantity`, `guest_name`, `guest_email`, `special_request?`, `referral_code?` | `guest_phone` diambil dari profil. |
| GET | `/api/wisata/bookings` | Yes | - | List booking wisata user. |
| GET | `/api/wisata/bookings/{booking}` | Yes | Path: `{booking}` = id/encrypted_id | Detail booking. |
| POST | `/api/wisata/bookings/{booking}/pay` | Yes | - | Membuat pembayaran Midtrans Snap. |
| POST | `/api/wisata/bookings/{booking}/cancel` | Yes | - | - |
| GET | `/api/wisata/bookings/{booking}/ticket` | Yes | - | Mengunduh tiket PDF. |

**Bookings: Event**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/events/bookings/quote` | Yes | `event_id`, `ticket_id`, `quantity` (1-20) | Kalkulasi harga. |
| POST | `/api/events/bookings` | Yes | `event_id`, `ticket_id`, `quantity`, `guest_name`, `guest_email` | `guest_phone` diambil dari profil. |
| GET | `/api/events/bookings` | Yes | - | List booking event user. |
| GET | `/api/events/bookings/{booking}` | Yes | Path: `{booking}` = id/encrypted_id | Detail booking. |
| POST | `/api/events/bookings/{booking}/pay` | Yes | - | Membuat pembayaran Midtrans Snap. |
| POST | `/api/events/bookings/{booking}/cancel` | Yes | - | - |

**Bookings: Special Programs**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/special-programs/bookings/quote` | Yes | `program_id`, `variant_id?`, `date`, `quantity` (1-999) | Kalkulasi harga. |
| POST | `/api/special-programs/bookings` | Yes | `program_id`, `variant_id?`, `date`, `quantity`, `guest_name`, `guest_email`, `notes?` | `guest_phone` diambil dari profil. |
| GET | `/api/special-programs/bookings` | Yes | - | List booking special program user. |
| GET | `/api/special-programs/bookings/{booking}` | Yes | Path: `{booking}` = id/encrypted_id | Detail booking. |
| POST | `/api/special-programs/bookings/{booking}/pay` | Yes | - | Membuat pembayaran Midtrans Snap. |
| POST | `/api/special-programs/bookings/{booking}/cancel` | Yes | - | - |

**Orders: Souvenir**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/souvenir/orders/quote` | Yes | `items` (array), `items.*.product_id`, `items.*.variant_id?`, `items.*.quantity` (1-999) | Kalkulasi harga. |
| POST | `/api/souvenir/orders` | Yes | `items`, `guest_name`, `guest_email`, `notes?`, `shipping_method?` | `guest_phone` + alamat utama diambil dari profil. |
| GET | `/api/souvenir/orders` | Yes | - | List order souvenir user. |
| GET | `/api/souvenir/orders/{order}` | Yes | Path: `{order}` = id/encrypted_id | Detail order. |
| POST | `/api/souvenir/orders/{order}/pay` | Yes | - | Membuat pembayaran Midtrans Snap. |

**Bookings: Academy**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/academy/bookings/quote` | Yes | `class_id`, `ticket_id`, `quantity` (1-20) | Kalkulasi harga. |
| POST | `/api/academy/bookings` | Yes | `class_id`, `ticket_id`, `quantity`, `guest_name`, `guest_email` | `guest_phone` diambil dari profil. |
| GET | `/api/academy/bookings` | Yes | - | List booking academy user. |
| GET | `/api/academy/bookings/{booking}` | Yes | Path: `{booking}` = id/encrypted_id | Detail booking. |
| POST | `/api/academy/bookings/{booking}/pay` | Yes | - | Membuat pembayaran Midtrans Snap. |
| POST | `/api/academy/bookings/{booking}/cancel` | Yes | - | - |
| GET | `/api/academy/bookings/{booking}/ticket` | Yes | - | Mengunduh tiket PDF. |
| GET | `/api/academy/bookings/{booking}/qr` | Yes | - | Mengunduh QR PDF. |

**History**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/history` | Yes | Query: `type?` atau `category?` (`hotel|wisata|event|special_program|souvenir|academy`), `status?`, `q?`, `date_from?`, `date_to?` | Menyatukan history semua tipe. |
| GET | `/api/history/{type}/{booking}` | Yes | Path: `{type}` sama seperti di atas, `{booking}` = id/encrypted_id | Detail history per tipe. |

**Reviews**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/reviews` | Yes | Query: `product_type`, `product_id` | `product_id` bisa id/encrypted_id. |
| POST | `/api/reviews` | Yes | `product_type`, `product_id`, `rating` (1-5), `comment?` | Hanya bisa jika booking sudah digunakan/selesai. |

**Notifications**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/notifications` | Yes | Query: `per_page?` (1-100), `status?` (`read|unread`), `type?` (comma list), `q?` | Pagination info ada di `meta`. |
| GET | `/api/notifications/unread-count` | Yes | - | Jumlah notifikasi belum dibaca. |
| POST | `/api/notifications/read-all` | Yes | - | Tandai semua sebagai dibaca. |
| POST | `/api/notifications/{notification}/read` | Yes | Path: `{notification}` = id | Tandai satu notifikasi dibaca. |

**Push Tokens**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| POST | `/api/push/tokens` | Yes | `token`, `platform?`, `device_id?` | Simpan token push. |
| POST | `/api/push/tokens/revoke` | Yes | `token?` atau `device_id?` | Salah satu wajib diisi. |

**Souvenir Cart**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/souvenir/cart` | Yes | - | Ambil isi cart. |
| POST | `/api/souvenir/cart/add` | Yes | `product_id`, `variant_id?`, `quantity` (1-20) | Tambah item ke cart. |
| POST | `/api/souvenir/cart/update` | Yes | `product_id`, `variant_id?`, `quantity` (0-20) | `quantity=0` akan menghapus item. |
| POST | `/api/souvenir/cart/remove` | Yes | `product_id`, `variant_id?` | Hapus item tertentu. |
| POST | `/api/souvenir/cart/clear` | Yes | - | Kosongkan cart. |

**Chat**
| Method | Endpoint | Auth | Params/Body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/chat/conversations` | Yes | - | List percakapan. |
| POST | `/api/chat/start` | Yes | `type` (`wisata|hotel|souvenir|event|academy|special_program|admin`), `id?` | `id` wajib kecuali `admin`. |
| GET | `/api/chat/conversations/{conversation}` | Yes | Path: `{conversation}` = id. Query: `per_page?` (1-100) | Detail + pesan awal. |
| GET | `/api/chat/conversations/{conversation}/messages` | Yes | Query: `per_page?` (1-100), `after_id?` | Ambil pesan setelah id tertentu. |
| POST | `/api/chat/conversations/{conversation}/messages` | Yes | `message` | Kirim pesan baru. |
| POST | `/api/chat/conversations/{conversation}/read` | Yes | - | Tandai pesan sebagai sudah dibaca. |

**Changelog**
Perubahan historis dan contoh payload detail tersedia di `docs/api-response-payloads.md`.
