# Indotix Wisata Booking API (Mobile)

Base URL:

```
https://your-domain.com/api
```

Headers:

```
Content-Type: application/json
Authorization: Bearer <token>
```

## 1) Quote Harga (Preview)

**POST** `/wisata/bookings/quote`

Body:

```json
{
  "destination_id": 5,
  "ticket_id": 11,
  "visit_date": "2026-02-20",
  "quantity": 2
}
```

Response 200:

```json
{
  "pricing": {
    "unit_price": 25000,
    "quantity": 2,
    "total": 50000
  }
}
```

Error umum:
- `422` tiket tidak tersedia / kuota tidak mencukupi / destinasi tutup

## 2) Buat Booking (Transaksi)

**POST** `/wisata/bookings`

Body:

```json
{
  "destination_id": 5,
  "ticket_id": 11,
  "visit_date": "2026-02-20",
  "quantity": 2,
  "guest_name": "User Indotix",
  "guest_email": "user@indotix.id",
  "guest_phone": "08123456789",
  "special_request": "Datang pagi",
  "referral_code": "BVCA78"
}
```

Response 201:

```json
{
  "booking": {
    "id": 55,
    "encrypted_id": "...",
    "booking_code": "WISATA-3-260216120101",
    "visit_date": "2026-02-20",
    "quantity": 2,
    "unit_price": 25000,
    "total": 50000,
    "status": "pending_payment",
    "payment_status": "pending",
    "payment_deadline": "2026-02-16T12:15:00+07:00",
    "ticket": { "id": 11, "name": "Tiket Dewasa" },
    "destination": { "id": 5, "name": "Taman Laut", "address": "Jl. Pantai No. 1" },
    "guest": { "name": "User Indotix", "email": "user@indotix.id", "phone": "08123456789" },
    "payment": null,
    "qr_data": "INDOTIX|WISATA|WISATA-3-260216120101",
    "qr_url": "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=..."
  }
}
```

Catatan:
- `referral_code` opsional untuk afiliasi.

## 3) Detail Booking

**GET** `/wisata/bookings/{booking}`

`{booking}` bisa `id` atau `encrypted_id`.

Response 200:

```json
{
  "booking": { "...": "payload sama seperti create" }
}
```

## 4) List Booking (Riwayat Wisata)

**GET** `/wisata/bookings`

Response 200:

```json
{
  "bookings": [
    { "...": "payload booking" }
  ]
}
```

## 5) Create Payment (Midtrans Snap)

**POST** `/wisata/bookings/{booking}/pay`

Response 200:

```json
{
  "payment": {
    "order_id": "WISATA-55-20260216121000",
    "snap_token": "xxxxxxxx",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/...",
    "payload": { "...": "full midtrans response" }
  }
}
```

## 6) Cancel Booking

**POST** `/wisata/bookings/{booking}/cancel`

Body (opsional):

```json
{
  "reason": "Berubah jadwal"
}
```

Response 200:

```json
{
  "booking": { "...": "payload booking (status cancelled)" }
}
```

Catatan:
- Hanya bisa dibatalkan jika status masih `pending_payment`.
