# Indotix Souvenir Order API (Mobile)

Base URL:

```
https://your-domain.com/api
```

Headers:

```
Content-Type: application/json
Authorization: Bearer <token>
```

## 0) Cart (Keranjang)

Catatan: keranjang disimpan di cache server per user (TTL 30 hari).

### 0.1 Lihat Keranjang

**GET** `/souvenir/cart`

Response 200:

```json
{
  "items": [
    {
      "key": "1-2",
      "product_id": 1,
      "variant_id": 2,
      "encrypted_product_id": "...",
      "name": "Gantungan Kunci Nusantara",
      "variant_name": "Merah",
      "price": 25000,
      "quantity": 2,
      "subtotal": 50000,
      "image_url": "/storage/souvenir/xx.jpg",
      "stock": 10
    }
  ],
  "summary": {
    "subtotal": 50000,
    "total": 50000
  }
}
```

### 0.2 Tambah ke Keranjang

**POST** `/souvenir/cart/add`

Body:

```json
{
  "product_id": 1,
  "variant_id": 2,
  "quantity": 2
}
```

Response 200: sama seperti "lihat keranjang".

### 0.3 Update Keranjang

**POST** `/souvenir/cart/update`

Body:

```json
{
  "product_id": 1,
  "variant_id": 2,
  "quantity": 1
}
```

`quantity = 0` berarti remove item.

### 0.4 Remove Item

**POST** `/souvenir/cart/remove`

Body:

```json
{
  "product_id": 1,
  "variant_id": 2
}
```

### 0.5 Clear Keranjang

**POST** `/souvenir/cart/clear`

Response 200:

```json
{
  "items": [],
  "summary": {
    "subtotal": 0,
    "total": 0
  }
}
```

Error umum (Cart):
- `422` produk/varian tidak tersedia
- `422` stok tidak mencukupi

## 1) Quote Harga (Preview)

**POST** `/souvenir/orders/quote`

Body:

```json
{
  "items": [
    { "product_id": 1, "variant_id": 2, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
```

Response 200:

```json
{
  "items": [
    {
      "product_id": 1,
      "variant_id": 2,
      "name": "Gantungan Kunci Nusantara",
      "sku": "SKU-RED",
      "quantity": 2,
      "unit_price": 25000,
      "subtotal": 50000
    }
  ],
  "summary": {
    "subtotal": 50000,
    "total": 50000
  }
}
```

Error umum:
- `422` produk tidak tersedia / stok tidak mencukupi / varian tidak sesuai

## 2) Buat Order (Transaksi)

**POST** `/souvenir/orders`

Body:

```json
{
  "items": [
    { "product_id": 1, "variant_id": 2, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ],
  "guest_name": "User Indotix",
  "guest_email": "user@indotix.id",
  "guest_phone": "08123456789",
  "shipping_address": "Jl. Merdeka No. 10",
  "notes": "Tolong dibungkus rapi",
  "shipping_method": "delivery"
}
```

Response 201:

```json
{
  "order": {
    "id": 12,
    "encrypted_id": "...",
    "status": "pending_payment",
    "payment_status": "pending",
    "payment_deadline": "2026-02-16T12:15:00+07:00",
    "total_price": 50000,
    "shipping_address": "Jl. Merdeka No. 10",
    "shipping_status": "pending",
    "tracking_number": null,
    "items": [
      {
        "name": "Gantungan Kunci Nusantara",
        "sku": "SKU-RED",
        "quantity": 2,
        "unit_price": 25000,
        "subtotal": 50000
      }
    ]
  }
}
```

## 3) Detail Order

**GET** `/souvenir/orders/{order}`

`{order}` bisa `id` atau `encrypted_id`.

Response 200:

```json
{
  "order": { "...": "payload sama seperti create" }
}
```

## 4) List Order (Riwayat Souvenir)

**GET** `/souvenir/orders`

Response 200:

```json
{
  "orders": [
    { "...": "payload order" }
  ]
}
```

## 5) Create Payment (Midtrans Snap)

**POST** `/souvenir/orders/{order}/pay`

Response 200:

```json
{
  "payment": {
    "order_id": "SOUV-12-20260216121000",
    "snap_token": "xxxxxxxx",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/...",
    "payload": { "...": "full midtrans response" }
  }
}
```
