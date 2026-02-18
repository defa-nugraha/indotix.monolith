# Indotix Academy Booking API (Mobile)

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

**POST** `/academy/bookings/quote`

Body:

```json
{
  "class_id": 1,
  "ticket_id": 7,
  "quantity": 2
}
```

Response 200:

```json
{
  "pricing": {
    "unit_price": 150000,
    "quantity": 2,
    "total": 300000
  }
}
```

Error umum:
- `422` tiket tidak tersedia / kuota tidak mencukupi

## 2) Buat Booking (Transaksi)

**POST** `/academy/bookings`

Body:

```json
{
  "class_id": 1,
  "ticket_id": 7,
  "quantity": 2,
  "guest_name": "User Indotix",
  "guest_email": "user@indotix.id",
  "guest_phone": "08123456789"
}
```

Response 201:

```json
{
  "booking": {
    "id": 88,
    "encrypted_id": "...",
    "booking_code": "ACADEMY-3-260216120101",
    "quantity": 2,
    "total": 300000,
    "status": "pending_payment",
    "payment_status": "pending",
    "payment_deadline": "2026-02-16T12:15:00+07:00",
    "ticket": { "id": 7, "name": "Regular" },
    "class": { "id": 1, "title": "Kelas Public Speaking", "location": "Jakarta", "start_at": "2026-02-20 09:00:00" },
    "guest": { "name": "User Indotix", "email": "user@indotix.id", "phone": "08123456789" },
    "payment": null,
    "qr_data": "INDOTIX|ACADEMY|ACADEMY-3-260216120101",
    "qr_url": "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=..."
  }
}
```

## 3) Detail Booking

**GET** `/academy/bookings/{booking}`

`{booking}` bisa `id` atau `encrypted_id`.

Response 200:

```json
{
  "booking": { "...": "payload sama seperti create" }
}
```

## 4) List Booking (Riwayat Academy)

**GET** `/academy/bookings`

Response 200:

```json
{
  "bookings": [
    { "...": "payload booking" }
  ]
}
```

## 5) Create Payment (Midtrans Snap)

**POST** `/academy/bookings/{booking}/pay`

Response 200:

```json
{
  "payment": {
    "order_id": "ACADEMY-88-20260216121000",
    "snap_token": "xxxxxxxx",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/...",
    "payload": { "...": "full midtrans response" }
  }
}
```

## 6) Cancel Booking

**POST** `/academy/bookings/{booking}/cancel`

Response 200:

```json
{
  "booking": { "...": "payload booking (status cancelled)" }
}
```

Catatan:
- Hanya bisa dibatalkan jika status masih `pending_payment`.

## 7) Download Ticket PDF

**GET** `/academy/bookings/{booking}/ticket`

Catatan:
- Hanya tersedia jika status `paid` atau `completed`.
- PDF menggunakan template web (`academy-ticket`).

## 8) Download QR

**GET** `/academy/bookings/{booking}/qr`

Response:
- `image/png` (attachment)

Catatan:
- Hanya tersedia jika status `paid` atau `completed`.
