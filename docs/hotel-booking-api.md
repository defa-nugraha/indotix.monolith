# Indotix Hotel Booking API (Mobile)

Base URL:

```
https://your-domain.com/api
```

Headers umum:

```
Content-Type: application/json
Authorization: Bearer <token>
```

Catatan:
- Semua endpoint di bawah **wajib** auth (Sanctum).
- Flow transaksi mengikuti web: create booking → bayar → callback Midtrans → status berubah.
- Riwayat & notifikasi otomatis tercatat via `Booking` dan `UserNotification`.

## 1) Quote Harga (Preview)

**POST** `/hotel/bookings/quote`

Body:

```json
{
  "hotel_id": 12,
  "room_type_id": 3,
  "check_in": "2026-02-20",
  "check_out": "2026-02-21",
  "rooms": 1,
  "guests": 2,
  "voucher_code": "HEMAT10"
}
```

Response 200:

```json
{
  "pricing": {
    "nights": 1,
    "subtotal": 350000,
    "discount_amount": 35000,
    "total": 315000
  },
  "voucher": {
    "code": "HEMAT10",
    "discount_type": "percent",
    "discount_value": 10,
    "discount_amount": 35000
  }
}
```

Error umum:
- `422` inventory tidak tersedia / voucher invalid

## 2) Buat Booking (Transaksi)

**POST** `/hotel/bookings`

Body:

```json
{
  "hotel_id": 12,
  "room_type_id": 3,
  "check_in": "2026-02-20",
  "check_out": "2026-02-21",
  "rooms": 1,
  "guests": 2,
  "guest_name": "User Indotix",
  "guest_email": "user@indotix.id",
  "guest_phone": "08123456789",
  "special_request": "Kamar non-smoking",
  "voucher_code": "HEMAT10"
}
```

Response 201:

```json
{
  "booking": {
    "encrypted_id": "...",
    "id": 101,
    "status": "pending_payment",
    "payment_status": null,
    "payment_deadline": "2026-02-16T12:15:00+07:00",
    "hotel": { "name": "Hotel Nusantara", "address": "Jl. Sudirman No. 10" },
    "check_in": "2026-02-20",
    "check_out": "2026-02-21",
    "nights": 1,
    "rooms_count": 1,
    "guests_count": 2,
    "total": 315000,
    "subtotal": 350000,
    "discount_amount": 35000,
    "voucher_code": "HEMAT10",
    "guest_name": "User Indotix",
    "guest_email": "user@indotix.id",
    "guest_phone": "08123456789",
    "special_request": "Kamar non-smoking",
    "rooms": [
      {
        "room_type": "Deluxe",
        "rooms_count": 1,
        "price_per_night": 350000,
        "subtotal": 350000
      }
    ],
    "payment": null,
    "qr_data": "INDOTIX|HOTEL|...",
    "qr_url": "https://api.qrserver.com/..."
  }
}
```

## 3) Detail Booking

**GET** `/hotel/bookings/{booking}`

`{booking}` bisa `id` atau `encrypted_id`.

Response 200:

```json
{
  "booking": { "...": "payload sama seperti create" }
}
```

## 4) List Booking (Riwayat)

**GET** `/hotel/bookings`

Response 200:

```json
{
  "bookings": [
    { "...": "payload booking" }
  ]
}
```

## 5) Create Payment (Midtrans Snap)

**POST** `/hotel/bookings/{booking}/pay`

Response 200:

```json
{
  "payment": {
    "order_id": "INDOTIX-101-20260216121000",
    "snap_token": "xxxxxxxx",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/...",
    "payload": { "...": "full midtrans response" }
  }
}
```

Catatan:
- Gunakan `snap_token` untuk membuka Midtrans Snap di mobile SDK.
- Status pembayaran akan diperbarui via callback Midtrans.

## 6) Cancel Booking

**POST** `/hotel/bookings/{booking}/cancel`

Catatan:
- Hanya bisa dibatalkan jika status masih `pending_payment`.

Response 200:

```json
{
  "booking": { "...": "payload sama seperti create" }
}
```

## 7) Download Invoice PDF

**GET** `/hotel/bookings/{booking}/invoice`

Response:
- `application/pdf` (attachment)

Catatan:
- File mengikuti template invoice web.

---

## Perubahan API Hotel vs Sebelumnya

Ringkasan perubahan terbaru yang menyamakan API hotel dengan web.

### Produk Hotel (Products API)

**List Hotel**
- Tambah field `slug` di setiap item hotel pada response `/products/hotels`.

**Detail Hotel**
- Tambah field `slug` pada object `hotel` di response `/products/hotels/{hotel}`.
- Tambah field baru:
  - `reviews` (daftar ulasan publik)
  - `user_review` (ulasan user yang sedang login)
  - `can_review` (boolean, true jika user sudah memenuhi syarat review)
- Catatan: jika request tanpa token, `user_review` = null dan `can_review` = false.

### Transaksi Hotel (Hotel Booking API)

**Cancel Booking**
- Endpoint baru: `POST /hotel/bookings/{booking}/cancel`
- Syarat: hanya `pending_payment`.
- Response: payload booking (sama seperti create).

**Download Invoice**
- Endpoint baru: `GET /hotel/bookings/{booking}/invoice`
- Response: file PDF invoice (attachment).
