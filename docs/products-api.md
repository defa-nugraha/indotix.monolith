# Indotix Products API (Mobile)

Base URL:

```
https://your-domain.com/api
```

Headers umum:

```
Content-Type: application/json
Authorization: Bearer <token>   # tidak wajib untuk endpoint public
```

Catatan:
- Semua endpoint di bawah bersifat public (tanpa auth).
- Field `encrypted_id` bisa dipakai sebagai parameter detail untuk keamanan.

## 1) Hotel

### 1.1 List Hotel

**GET** `/products/hotels`

Query params:
- `city` (string, optional) - kode kota (4 digit)
- `check_in` (date, optional) - default hari ini
- `check_out` (date, optional) - default besok
- `rooms` (int, optional) - default 1
- `guests` (int, optional) - default 2
- `q` (string, optional)

Response 200:

```json
{
  "filters": {
    "city": "3171",
    "check_in": "2026-02-16",
    "check_out": "2026-02-17",
    "rooms": 1,
    "guests": 2,
    "q": null
  },
  "hotels": [
    {
      "id": 12,
      "encrypted_id": "....",
      "name": "Hotel Nusantara",
      "address": "Jl. Sudirman No. 10",
      "star_rating": 4,
      "city_name": "Jakarta Selatan",
      "min_price": 350000,
      "available_rooms": 8,
      "image_url": "/storage/hotel-images/xx.jpg",
      "breakfast_included": true,
      "smoking_allowed": false
    }
  ]
}
```

### 1.2 Detail Hotel

**GET** `/products/hotels/{hotel}`

`{hotel}` bisa `id` atau `encrypted_id`.

Query params:
- `check_in` (date, optional) - default hari ini
- `check_out` (date, optional) - default besok
- `rooms` (int, optional) - default 1
- `guests` (int, optional) - default 2

Response 200:

```json
{
  "hotel": {
    "id": 12,
    "encrypted_id": "...",
    "name": "Hotel Nusantara",
    "description": "Deskripsi hotel",
    "address": "Jl. Sudirman No. 10",
    "city_name": "Jakarta Selatan",
    "star_rating": 4,
    "check_in_time": "14:00",
    "check_out_time": "12:00",
    "latitude": -6.2,
    "longitude": 106.8,
    "facilities": ["wifi", "pool"],
    "images": [{ "id": 1, "url": "/storage/hotel-images/xx.jpg" }]
  },
  "room_types": [
    {
      "id": 2,
      "name": "Deluxe",
      "description": "Kamar deluxe",
      "max_guest": 2,
      "bed_type": "King",
      "base_price": 350000,
      "strike_price": null,
      "available_rooms": 5,
      "total_price": 350000,
      "breakfast_included": true,
      "smoking_allowed": false,
      "images": [{ "id": 9, "url": "/storage/room-images/xx.jpg" }]
    }
  ],
  "filters": {
    "check_in": "2026-02-16",
    "check_out": "2026-02-17",
    "rooms": 1,
    "guests": 2
  }
}
```

## 2) Wisata

### 2.1 List Wisata

**GET** `/products/wisata`

Query params:
- `q` (string, optional)
- `visit_date` (date, optional) - default hari ini
- `quantity` (int, optional) - default 1

Response 200:

```json
{
  "filters": {
    "q": null,
    "visit_date": "2026-02-16",
    "quantity": 1
  },
  "destinations": [
    {
      "id": 5,
      "encrypted_id": "...",
      "destination_name": "Taman Laut",
      "destination_type": "alam",
      "city_name": "Banyuwangi",
      "photo_url": "/storage/mitra-wisata/area.jpg",
      "tickets": [
        { "id": 11, "name": "Tiket Dewasa", "price": 25000, "available": 120 }
      ]
    }
  ]
}
```

### 2.2 Detail Wisata

**GET** `/products/wisata/{destination}`

`{destination}` bisa `id` atau `encrypted_id`.

Query params:
- `visit_date` (date, optional) - default hari ini
- `quantity` (int, optional) - default 1

Response 200:

```json
{
  "filters": {
    "visit_date": "2026-02-16",
    "quantity": 1
  },
  "destination": {
    "id": 5,
    "encrypted_id": "...",
    "destination_name": "Taman Laut",
    "destination_type": "alam",
    "description": "Deskripsi wisata",
    "highlights": "Spot terbaik",
    "address_full": "Jl. Pantai No. 1",
    "city_name": "Banyuwangi",
    "open_days": ["mon", "tue", "wed"],
    "open_time": "08:00",
    "close_time": "17:00",
    "facilities": ["toilet", "parkir"],
    "photo_gate_url": "/storage/mitra-wisata/gate.jpg",
    "photo_area_url": "/storage/mitra-wisata/area.jpg",
    "photo_ticket_url": "/storage/mitra-wisata/ticket.jpg",
    "maps_pin_url": "https://maps.google.com/..."
  },
  "tickets": [
    {
      "id": 11,
      "name": "Tiket Dewasa",
      "description": "Akses penuh",
      "price": 25000,
      "available": 120,
      "ticket_type": "regular",
      "refund_policy": "non_refundable"
    }
  ]
}
```

## 3) Event

### 3.1 List Event

**GET** `/products/events`

Query params:
- `q` (string, optional)

Response 200:

```json
{
  "filters": { "q": null },
  "events": [
    {
      "id": 3,
      "encrypted_id": "...",
      "title": "Indotix Music Festival 2026",
      "city_name": "Jakarta Barat",
      "location": "ICE BSD",
      "start_at": "2026-02-18",
      "min_price": 250000,
      "image_url": null
    }
  ]
}
```

### 3.2 Detail Event

**GET** `/products/events/{event}`

`{event}` bisa `id` atau `encrypted_id`.

Response 200:

```json
{
  "event": {
    "id": 3,
    "encrypted_id": "...",
    "title": "Indotix Music Festival 2026",
    "description": "Deskripsi event",
    "city_name": "Jakarta Barat",
    "location": "ICE BSD",
    "address": "Jl. BSD",
    "start_at": "2026-02-18 18:00:00",
    "end_at": "2026-02-18 22:00:00",
    "capacity_total": 1000,
    "capacity_sold": 200
  },
  "tickets": [
    {
      "id": 5,
      "name": "Regular Pass",
      "description": "Akses umum",
      "price": 250000,
      "quota": 500,
      "sold_count": 120,
      "available": 380
    }
  ]
}
```

## 4) Academy

### 4.1 List Academy Classes

**GET** `/products/academy`

Query params:
- `q` (string, optional)

Response 200:

```json
{
  "filters": { "q": null },
  "classes": [
    {
      "id": 1,
      "encrypted_id": "...",
      "title": "Kelas Public Speaking",
      "category": "Soft Skill",
      "start_at": "2026-02-20",
      "location": "Jakarta",
      "min_price": 150000,
      "image_url": "/storage/academy/classes/1/img.jpg"
    }
  ]
}
```

### 4.2 Detail Academy Class

**GET** `/products/academy/{class}`

`{class}` bisa `id` atau `encrypted_id`.

Response 200:

```json
{
  "class": {
    "id": 1,
    "encrypted_id": "...",
    "title": "Kelas Public Speaking",
    "description": "Deskripsi kelas",
    "category": "Soft Skill",
    "start_at": "2026-02-20 09:00:00",
    "end_at": "2026-02-20 12:00:00",
    "duration_minutes": 180,
    "location_type": "offline",
    "location_detail": "Jakarta",
    "capacity_total": 60,
    "capacity_sold": 20,
    "images": ["/storage/academy/classes/1/img.jpg"]
  },
  "tickets": [
    {
      "id": 7,
      "name": "Regular",
      "price": 150000,
      "quota": 60,
      "sold_count": 20,
      "available": 40,
      "ticket_type": "regular",
      "refundable": false,
      "sales_start_at": "2026-02-01",
      "sales_end_at": "2026-02-19"
    }
  ]
}
```

## 5) Souvenir

### 5.1 List Souvenir Products

**GET** `/products/souvenirs`

Query params:
- `q` (string, optional)
- `category_id` (int, optional)

Response 200:

```json
{
  "filters": { "q": null, "category_id": null },
  "products": {
    "data": [
      {
        "id": 1,
        "encrypted_id": "...",
        "name": "Gantungan Kunci Nusantara",
        "price": 25000,
        "stock": 100,
        "category": "Aksesoris",
        "image_url": "/storage/souvenir/xx.jpg"
      }
    ],
    "links": {},
    "meta": {}
  },
  "categories": [
    { "id": 1, "name": "Aksesoris" }
  ]
}
```

### 5.2 Detail Souvenir

**GET** `/products/souvenirs/{product}`

`{product}` bisa `id` atau `encrypted_id`.

Response 200:

```json
{
  "product": {
    "id": 1,
    "encrypted_id": "...",
    "name": "Gantungan Kunci Nusantara",
    "description": "Souvenir khas",
    "price": 25000,
    "stock": 100,
    "category": "Aksesoris",
    "images": ["/storage/souvenir/xx.jpg"],
    "variants": [
      {
        "id": 2,
        "name": "Merah",
        "variant_type": "warna",
        "sku": "SKU-RED",
        "additional_price": 0,
        "stock": 50,
        "is_active": true
      }
    ]
  }
}
```

## 6) Special Program

### 6.1 List Special Programs

**GET** `/products/special-programs`

Response 200:

```json
{
  "programs": [
    {
      "id": 1,
      "encrypted_id": "...",
      "name": "Libur Sekolah",
      "program_type": "diskon",
      "status": "active",
      "starts_at": "2026-02-01",
      "ends_at": "2026-02-28",
      "highlight_level": "high",
      "description_internal": "Promo libur sekolah",
      "items": [
        {
          "type": "hotel",
          "id": 12,
          "encrypted_id": "...",
          "title": "Hotel Nusantara",
          "city_name": "Jakarta Selatan",
          "description": "Deskripsi",
          "image_url": "/storage/hotel-images/xx.jpg",
          "price": 350000
        }
      ]
    }
  ]
}
```

### 6.2 Detail Special Program

**GET** `/products/special-programs/{program}`

`{program}` bisa `id` atau `encrypted_id`.

Response 200:

```json
{
  "program": {
    "id": 1,
    "encrypted_id": "...",
    "name": "Libur Sekolah",
    "program_type": "diskon",
    "status": "active",
    "starts_at": "2026-02-01",
    "ends_at": "2026-02-28",
    "highlight_level": "high",
    "description_internal": "Promo libur sekolah",
    "terms": {},
    "discount": {},
    "rules": {}
  },
  "items": [
    {
      "type": "wisata",
      "id": 5,
      "encrypted_id": "...",
      "title": "Taman Laut",
      "city_name": "Banyuwangi",
      "description": "Deskripsi wisata",
      "image_url": "/storage/mitra-wisata/area.jpg",
      "price": 25000
    }
  ]
}
```
