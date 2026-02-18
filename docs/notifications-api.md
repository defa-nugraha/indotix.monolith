# Indotix Notifications API (Mobile)

Base URL:

```
https://your-domain.com/api
```

Headers:

```
Content-Type: application/json
Authorization: Bearer <token>
```

## 1) List Notifikasi

**GET** `/notifications`

Query params (opsional):
- `status`: `unread` | `read` (kosong = semua)
- `type`: filter tipe notifikasi, bisa multi (contoh `payment,booking`)
- `q`: keyword pencarian (judul / pesan)
- `per_page`: default `20`, max `100`

Contoh:

```
GET /notifications?status=unread&type=payment,booking&per_page=10
```

Response 200:

```json
{
  "filters": {
    "status": "unread",
    "type": "payment,booking",
    "q": null
  },
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 10,
    "total": 23,
    "unread_count": 5
  },
  "notifications": [
    {
      "id": 15,
      "title": "Pembayaran Berhasil",
      "message": "Pembayaran booking WISATA-3-260216120101 berhasil.",
      "type": "payment",
      "is_read": false,
      "data": {
        "booking_id": 55,
        "booking_type": "wisata"
      },
      "created_at": "2026-02-16T12:16:00+07:00"
    }
  ]
}
```

## 2) Hitung Notifikasi Belum Dibaca

**GET** `/notifications/unread-count`

Response 200:

```json
{
  "unread_count": 5
}
```

## 3) Tandai 1 Notifikasi Dibaca

**POST** `/notifications/{notification}/read`

Response 200:

```json
{
  "notification": {
    "id": 15,
    "title": "Pembayaran Berhasil",
    "message": "Pembayaran booking WISATA-3-260216120101 berhasil.",
    "type": "payment",
    "is_read": true,
    "data": {
      "booking_id": 55,
      "booking_type": "wisata"
    },
    "created_at": "2026-02-16T12:16:00+07:00"
  }
}
```

Catatan:
- Jika notifikasi bukan milik user, API akan merespon `403`.

## 4) Tandai Semua Notifikasi Dibaca

**POST** `/notifications/read-all`

Response 200:

```json
{
  "updated": 5
}
```
