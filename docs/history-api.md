# Indotix History API (Mobile)

Base URL:

```
https://your-domain.com/api
```

Headers:

```
Content-Type: application/json
Authorization: Bearer <token>
```

## 1) Riwayat Transaksi (Semua Kategori)

**GET** `/history`

Query params (opsional):
- `type` / `category`: `hotel` | `wisata` | `event` | `special_program` | `souvenir` | `academy`
- `status`: contoh `pending_payment` | `paid` | `expired` | `cancelled`
- `q`: keyword pencarian (judul / kota / alamat)
- `date_from`: `YYYY-MM-DD`
- `date_to`: `YYYY-MM-DD`

Contoh:

```
GET /history?type=hotel&status=paid&date_from=2026-02-01&date_to=2026-02-16&q=jakarta
```

Response 200:

```json
{
  "filters": {
    "type": "hotel",
    "status": "paid",
    "q": "jakarta",
    "date_from": "2026-02-01",
    "date_to": "2026-02-16"
  },
  "bookings": [
    {
      "id": 101,
      "encrypted_id": "...",
      "type": "hotel",
      "title": "Hotel Nusantara",
      "city_name": "Jakarta Selatan",
      "address": "Jl. Sudirman No. 10",
      "check_in": "2026-02-12",
      "check_out": "2026-02-13",
      "nights": 1,
      "rooms_count": 1,
      "guests_count": 2,
      "visit_date": null,
      "quantity": null,
      "total": 315000,
      "status": "paid",
      "payment_status": "settlement",
      "payment_deadline": "2026-02-16T12:15:00+07:00",
      "guest_name": "User Indotix",
      "guest_email": "user@indotix.id",
      "guest_phone": "08123456789",
      "created_at": "2026-02-12T09:01:00+07:00",
      "midtrans_order_id": "INDOTIX-101-20260212090100",
      "payment_url": "https://your-domain.com/booking/xxx/payment",
      "detail_url": "https://your-domain.com/booking/xxx"
    }
  ]
}
```

Catatan:
- `payment_url` dan `detail_url` adalah URL web (opsional dipakai di mobile).
- Riwayat otomatis terisi untuk semua kategori (hotel, wisata, event, academy, souvenir, special program).

## 2) Detail Riwayat Pesanan

**GET** `/history/{type}/{booking}`

`{type}`: `hotel` | `wisata` | `event` | `special_program` | `souvenir` | `academy`  
`{booking}` bisa `id` atau `encrypted_id`.

Contoh:

```
GET /history/wisata/eyJpdiI6Ik5aS2dF...
```

Response 200 (contoh wisata):

```json
{
  "type": "wisata",
  "booking": {
    "id": 55,
    "encrypted_id": "...",
    "booking_code": "WISATA-3-260216120101",
    "visit_date": "2026-02-20",
    "quantity": 2,
    "unit_price": 25000,
    "total": 50000,
    "status": "paid",
    "payment_status": "settlement",
    "payment_deadline": "2026-02-16T12:15:00+07:00",
    "ticket": { "id": 11, "name": "Tiket Dewasa" },
    "destination": { "id": 5, "name": "Taman Laut", "address": "Jl. Pantai No. 1" },
    "guest": { "name": "User Indotix", "email": "user@indotix.id", "phone": "08123456789" },
    "payment": { "status": "settlement", "payment_type": "bank_transfer", "payload": {} },
    "qr_data": "INDOTIX|WISATA|WISATA-3-260216120101",
    "qr_url": "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=..."
  }
}
```

Catatan:
- QR code hanya tersedia untuk `hotel`, `wisata`, `event`, `academy`.
- `souvenir` menampilkan detail item + pengiriman, tanpa QR.
