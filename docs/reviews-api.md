# Indotix Reviews API (Mobile)

Base URL:

```
https://your-domain.com/api
```

Headers:

```
Content-Type: application/json
Authorization: Bearer <token>
```

Catatan:
- Semua endpoint review membutuhkan autentikasi (Sanctum).
- Rule sama seperti web: **ulasan hanya bisa dikirim setelah tiket digunakan atau pesanan selesai** (`used`).

Produk yang didukung (`product_type`):
- `hotel`
- `wisata`
- `event`
- `academy`
- `souvenir`
- `special_program`

## 1) List Ulasan + Review User (dan status bisa review)

**GET** `/reviews?product_type=hotel&product_id=1`

Query:

```
product_type=hotel
product_id=1
```

Response 200:

```json
{
  "reviews": [
    {
      "id": 10,
      "rating": 5,
      "comment": "Pengalaman menginap sangat nyaman.",
      "user_name": "User Indotix",
      "created_at": "2026-02-22 10:10:10",
      "reply": "Terima kasih, sampai jumpa lagi!",
      "reply_by": "Admin Indotix",
      "reply_at": "2026-02-22 12:00:00",
      "user_id": 8
    }
  ],
  "user_review": {
    "id": 10,
    "rating": 5,
    "comment": "Pengalaman menginap sangat nyaman.",
    "created_at": "2026-02-22 10:10:10"
  },
  "can_review": true
}
```

Error:
- `404` produk tidak ditemukan
- `422` validasi gagal (product_type/product_id)

## 2) Kirim / Update Ulasan

**POST** `/reviews`

Body:

```json
{
  "product_type": "hotel",
  "product_id": 1,
  "rating": 5,
  "comment": "Kamar bersih, pelayanan ramah."
}
```

Response 200:

```json
{
  "message": "Ulasan berhasil dikirim.",
  "review": {
    "id": 10,
    "rating": 5,
    "comment": "Kamar bersih, pelayanan ramah.",
    "status": "active",
    "created_at": "2026-02-22 10:10:10",
    "updated_at": "2026-02-22 10:10:10"
  }
}
```

Response 422 (belum memenuhi syarat used):

```json
{
  "message": "Ulasan hanya bisa dikirim setelah tiket digunakan atau pesanan selesai.",
  "errors": {
    "review": [
      "Ulasan hanya bisa dikirim setelah tiket digunakan atau pesanan selesai."
    ]
  }
}
```

Catatan:
- Jika user sudah pernah review produk yang sama, endpoint ini akan **meng-update** review yang ada.
- Saat review baru dibuat, sistem mengirim notifikasi ke vendor/admin:
  - In-app notification
  - Push notification (FCM)

