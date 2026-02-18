# Indotix Event Booking API (Mobile)

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

**POST** `/events/bookings/quote`

Body:

```json
{
  "event_id": 3,
  "ticket_id": 5,
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
- `422` tiket tidak tersedia / kuota tidak mencukupi

## 2) Buat Booking (Transaksi)

**POST** `/events/bookings`

Body:

```json
{
  "event_id": 3,
  "ticket_id": 5,
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
    "id": 77,
    "encrypted_id": "...",
    "booking_code": "EVENT-3-260216120101",
    "quantity": 2,
    "total": 500000,
    "status": "pending_payment",
    "payment_status": "pending",
    "payment_deadline": "2026-02-16T12:15:00+07:00",
    "ticket": { "id": 5, "name": "Regular Pass" },
    "event": { "id": 3, "title": "Indotix Music Festival 2026", "location": "ICE BSD", "start_at": "2026-02-18 18:00:00" },
    "guest": { "name": "User Indotix", "email": "user@indotix.id", "phone": "08123456789" },
    "payment": null,
    "qr_data": "INDOTIX|EVENT|EVENT-3-260216120101",
    "qr_url": "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=..."
  }
}
```

## 3) Detail Booking

**GET** `/events/bookings/{booking}`

`{booking}` bisa `id` atau `encrypted_id`.

Response 200:

```json
{
  "booking": { "...": "payload sama seperti create" }
}
```

## 4) List Booking (Riwayat Event)

**GET** `/events/bookings`

Response 200:

```json
{
  "bookings": [
    { "...": "payload booking" }
  ]
}
```

## 5) Create Payment (Midtrans Snap)

**POST** `/events/bookings/{booking}/pay`

Response 200:

```json
{
  "payment": {
    "order_id": "EVENT-77-20260216121000",
    "snap_token": "xxxxxxxx",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/...",
    "payload": { "...": "full midtrans response" }
  }
}
```

## 6) Cancel Booking

**POST** `/events/bookings/{booking}/cancel`

Response 200:

```json
{
  "booking": { "...": "payload booking (status cancelled)" }
}
```

Catatan:
- Hanya bisa dibatalkan jika status masih `pending_payment`.
