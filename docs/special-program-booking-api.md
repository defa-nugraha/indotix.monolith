# Indotix Special Program Booking API (Mobile)

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

**POST** `/special-programs/bookings/quote`

Body:

```json
{
  "program_id": 1,
  "item_type": "event",
  "item_id": 3,
  "ticket_id": 5,
  "visit_date": "2026-02-20",
  "quantity": 2
}
```

Response 200:

```json
{
  "pricing": {
    "unit_price": 250000,
    "quantity": 2,
    "total": 500000
  }
}
```

Error umum:
- `422` produk tidak tersedia / tiket tidak ditemukan
- `422` kuota tiket tidak mencukupi
- `422` tanggal kunjungan wajib diisi (khusus item_type = wisata)

## 2) Buat Booking (Transaksi)

**POST** `/special-programs/bookings`

Body:

```json
{
  "program_id": 1,
  "item_type": "event",
  "item_id": 3,
  "ticket_id": 5,
  "visit_date": "2026-02-20",
  "quantity": 2,
  "guest_name": "User Indotix",
  "guest_email": "user@indotix.id",
  "guest_phone": "08123456789",
  "special_request": "Datang lebih awal"
}
```

Response 201:

```json
{
  "booking": {
    "id": 21,
    "encrypted_id": "...",
    "program": { "id": 1, "name": "Libur Sekolah" },
    "item": { "type": "event", "name": "Indotix Music Festival 2026", "city_name": "Jakarta Barat" },
    "quantity": 2,
    "unit_price": 250000,
    "total": 500000,
    "status": "pending_payment",
    "payment_status": "pending",
    "payment_deadline": "2026-02-16T12:15:00+07:00",
    "ticket_name": "Regular Pass",
    "guest": { "name": "User Indotix", "email": "user@indotix.id", "phone": "08123456789" },
    "payment": null
  }
}
```

## 3) Detail Booking

**GET** `/special-programs/bookings/{booking}`

`{booking}` bisa `id` atau `encrypted_id`.

Response 200:

```json
{
  "booking": { "...": "payload sama seperti create" }
}
```

## 4) List Booking (Riwayat Special Program)

**GET** `/special-programs/bookings`

Response 200:

```json
{
  "bookings": [
    { "...": "payload booking" }
  ]
}
```

## 5) Create Payment (Midtrans Snap)

**POST** `/special-programs/bookings/{booking}/pay`

Response 200:

```json
{
  "payment": {
    "order_id": "SPP-21-20260216121000",
    "snap_token": "xxxxxxxx",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/...",
    "payload": { "...": "full midtrans response" }
  }
}
```

## 6) Cancel Booking

**POST** `/special-programs/bookings/{booking}/cancel`

Response 200:

```json
{
  "booking": { "...": "payload booking (status cancelled)" }
}
```

Catatan:
- Hanya bisa dibatalkan jika status masih `pending_payment`.
- `visit_date` wajib diisi jika `item_type` = `wisata`.
