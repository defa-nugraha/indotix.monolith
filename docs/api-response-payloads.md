# API Response Payloads (Verified)

Catatan:
- Semua contoh di bawah adalah **contoh JSON** dari response sukses.
- Beberapa endpoint mengembalikan file (PDF/PNG); bagian itu ditandai.
- Tanggal ISO umumnya berbentuk `YYYY-MM-DD`, sedangkan datetime berbentuk `YYYY-MM-DDTHH:mm:ss`.

## Auth
1. `POST /api/auth/register`
```json
{
  "token": "<sanctum-token>",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "User",
    "email": "user@mail.com",
    "role": "user",
    "email_verified_at": null
  },
  "requires_otp": true,
  "otp_expires_at": "2026-03-29T12:00:00+07:00"
}
```

2. `POST /api/auth/login`
```json
{
  "token": "<sanctum-token>",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "User",
    "email": "user@mail.com",
    "role": "user"
  }
}
```

3. `POST /api/auth/google`
```json
{
  "token": "<sanctum-token>",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "User",
    "email": "user@mail.com",
    "role": "user"
  }
}
```

4. `POST /api/auth/password/forgot`
```json
{
  "message": "OTP reset password telah dikirim.",
  "otp_expires_at": "2026-04-02T12:10:00+07:00"
}
```

5. `POST /api/auth/password/reset`
```json
{
  "message": "Password berhasil direset."
}
```

6. `GET /api/auth/me`
```json
{
  "user": {
    "id": 1,
    "name": "User",
    "email": "user@mail.com",
    "role": "user"
  }
}
```

7. `POST /api/auth/logout`
```json
{
  "message": "Logout berhasil."
}
```

8. `POST /api/auth/otp/verify`
```json
{
  "message": "OTP berhasil diverifikasi.",
  "user": {
    "id": 1,
    "name": "User",
    "email": "user@mail.com",
    "email_verified_at": "2026-03-29T12:00:00+07:00"
  }
}
```

9. `POST /api/auth/otp/resend`
```json
{
  "message": "OTP baru telah dikirim.",
  "otp_expires_at": "2026-03-29T12:10:00+07:00"
}
```

## Profile (auth)
1. `PUT /api/profile`
```json
{
  "message": "Profil berhasil diperbarui.",
  "user": {
    "id": 1,
    "name": "User",
    "email": "user@mail.com",
    "phone": "08123456789",
    "gender": "male",
    "role": "user"
  }
}
```

2. `POST /api/profile/password/otp`
```json
{
  "message": "OTP untuk ganti password telah dikirim.",
  "otp_expires_at": "2026-03-30T12:10:00+07:00"
}
```

3. `PUT /api/profile/password`
```json
{
  "message": "Password berhasil diperbarui."
}
```

4. `DELETE /api/profile`
```json
{
  "message": "Akun berhasil dihapus."
}
```

## Products
### Hotels
1. `GET /api/products/hotels`
```json
{
  "filters": {
    "city": "3173",
    "check_in": "2026-04-01",
    "check_out": "2026-04-02",
    "rooms": 1,
    "guests": 2,
    "q": "neo"
  },
  "hotels": [
    {
      "id": 10,
      "encrypted_id": "<encrypted>",
      "slug": "neo-hotel",
      "name": "Neo Hotel",
      "address": "Jl. Contoh",
      "star_rating": 4,
      "city_name": "Jakarta",
      "min_price": 450000,
      "available_rooms": 12,
      "image_url": "/storage/hotel.jpg",
      "breakfast_included": true,
      "smoking_allowed": false
    }
  ],
  "recommendations": [
    {
      "id": 11,
      "encrypted_id": "<encrypted>",
      "slug": "prime-hotel",
      "name": "Prime Hotel",
      "city_name": "Jakarta",
      "star_rating": 5,
      "min_price": 600000,
      "image_url": "/storage/hotel2.jpg"
    }
  ]
}
```

2. `GET /api/products/hotels/{hotel}`
```json
{
  "hotel": {
    "id": 10,
    "encrypted_id": "<encrypted>",
    "slug": "neo-hotel",
    "name": "Neo Hotel",
    "description": "...",
    "address": "Jl. Contoh",
    "city_name": "Jakarta",
    "star_rating": 4,
    "check_in_time": "14:00",
    "check_out_time": "12:00",
    "latitude": -6.2,
    "longitude": 106.8,
    "maps_url": "https://www.google.com/maps/search/?api=1&query=-6.2,106.8",
    "facilities": ["wifi", "pool"],
    "images": [{"id": 1, "url": "/storage/hotel.jpg"}]
  },
  "room_types": [
    {
      "id": 1,
      "name": "Deluxe",
      "description": "...",
      "max_guest": 2,
      "bed_type": "Queen",
      "base_price": 450000,
      "strike_price": 500000,
      "available_rooms": 5,
      "total_price": 450000,
      "breakfast_included": true,
      "smoking_allowed": false,
      "images": [{"id": 10, "url": "/storage/room.jpg"}]
    }
  ],
  "roomTypes": [
    {
      "id": 1,
      "name": "Deluxe",
      "description": "...",
      "max_guest": 2,
      "bed_type": "Queen",
      "base_price": 450000,
      "strike_price": 500000,
      "available_rooms": 5,
      "total_price": 450000,
      "breakfast_included": true,
      "smoking_allowed": false,
      "images": [{"id": 10, "url": "/storage/room.jpg"}]
    }
  ],
  "filters": {
    "check_in": "2026-04-01",
    "check_out": "2026-04-02",
    "rooms": 1,
    "guests": 2
  },
  "reviews": [],
  "user_review": null,
  "userReview": null,
  "can_review": false,
  "canReview": false
}
```

### Wisata
1. `GET /api/products/wisata`
```json
{
  "filters": {
    "q": "pantai",
    "visit_date": "2026-04-01",
    "quantity": 2
  },
  "destinations": [
    {
      "id": 5,
      "encrypted_id": "<encrypted>",
      "slug": "pantai-indah",
      "destination_name": "Pantai Indah",
      "destination_type": "alam",
      "city_name": "Bali",
      "photo_url": "/storage/pantai.jpg",
      "tickets": [
        {"id": 10, "name": "Tiket Reguler", "price": 20000, "available": 100}
      ]
    }
  ]
}
```

2. `GET /api/products/wisata/{destination}`
```json
{
  "filters": {
    "visit_date": "2026-04-01",
    "quantity": 2
  },
  "destination": {
    "cover_photo_url": "/storage/area.jpg",
    "latitude": "-8.7",
    "longitude": "115.2",
    "id": 5,
    "encrypted_id": "<encrypted>",
    "slug": "pantai-indah",
    "destination_name": "Pantai Indah",
    "destination_type": "alam",
    "description": "...",
    "highlights": ["sunset"],
    "address_full": "Jl. Pantai",
    "city_name": "Bali",
    "open_days": ["Mon","Tue"],
    "open_time": "08:00",
    "close_time": "17:00",
    "facilities": ["toilet"],
    "photo_gate_url": "/storage/gate.jpg",
    "photo_area_url": "/storage/area.jpg",
    "photo_ticket_url": "/storage/ticket.jpg",
    "photo_other_urls": ["/storage/other1.jpg"],
    "maps_pin_url": "https://maps.google.com/...",
    "maps_url": "https://www.google.com/maps/search/?api=1&query=-8.7,115.2",
    "maps_embed_url": "https://maps.google.com/...&output=embed"
  },
  "tickets": [
    {
      "id": 10,
      "name": "Tiket Reguler",
      "description": "...",
      "price": 20000,
      "available": 100,
      "ticket_type": "reguler",
      "refund_policy": "non_refund"
    }
  ],
  "reviews": [],
  "user_review": null,
  "userReview": null,
  "can_review": false,
  "canReview": false
}
```

### Events
1. `GET /api/products/events`
```json
{
  "filters": {"q": "music"},
  "events": [
    {
      "id": 12,
      "encrypted_id": "<encrypted>",
      "slug": "music-fest",
      "title": "Music Fest",
      "city_name": "Jakarta",
      "location": "Stadion",
      "maps_url": "https://www.google.com/maps/search/?api=1&query=Stadion",
      "start_at": "2026-05-01",
      "min_price": 150000,
      "image_url": "https://images.unsplash.com/photo-1472653431158-6364773b2a56?q=80&w=1200&auto=format&fit=crop&sig=12"
    }
  ]
}
```

2. `GET /api/products/events/{event}`
```json
{
  "event": {
    "id": 12,
    "encrypted_id": "<encrypted>",
    "slug": "music-fest",
    "title": "Music Fest",
    "description": "...",
    "city_name": "Jakarta",
    "location": "Stadion",
    "address": "Jl. Stadion",
    "maps_url": "https://www.google.com/maps/search/?api=1&query=Stadion",
    "image_url": "https://images.unsplash.com/photo-1472653431158-6364773b2a56?q=80&w=1200&auto=format&fit=crop&sig=12",
    "start_at": "2026-05-01T18:00:00",
    "end_at": "2026-05-01T22:00:00",
    "capacity_total": 1000,
    "capacity_sold": 200
  },
  "tickets": [
    {
      "id": 21,
      "name": "VIP",
      "description": "...",
      "price": 300000,
      "quota": 200,
      "sold_count": 50,
      "available": 150
    }
  ],
  "reviews": [],
  "user_review": null,
  "userReview": null,
  "can_review": false,
  "canReview": false
}
```

### Academy
1. `GET /api/products/academy`
```json
{
  "filters": {"q": "design"},
  "classes": [
    {
      "id": 9,
      "encrypted_id": "<encrypted>",
      "slug": "kelas-design",
      "title": "Kelas Design",
      "category": "design",
      "start_at": "2026-05-10",
      "location": "Jakarta Barat",
      "maps_url": "https://www.google.com/maps/search/?api=1&query=Jakarta%20Barat",
      "min_price": 100000,
      "image_url": "/storage/academy.jpg"
    }
  ]
}
```

2. `GET /api/products/academy/{class}`
```json
{
  "class": {
    "id": 9,
    "encrypted_id": "<encrypted>",
    "slug": "kelas-design",
    "title": "Kelas Design",
    "description": "...",
    "category": "design",
    "start_at": "2026-05-10T09:00:00",
    "end_at": "2026-05-10T12:00:00",
    "duration_minutes": 180,
    "location_type": "offline",
    "location_detail": "Jakarta Barat",
    "maps_url": "https://www.google.com/maps/search/?api=1&query=Jakarta%20Barat",
    "capacity_total": 50,
    "capacity_sold": 10,
    "images": ["/storage/academy.jpg"]
  },
  "tickets": [
    {
      "id": 44,
      "name": "Reguler",
      "price": 100000,
      "quota": 50,
      "sold_count": 10,
      "available": 40,
      "ticket_type": "reguler",
      "refundable": false,
      "sales_start_at": "2026-05-01",
      "sales_end_at": "2026-05-09"
    }
  ],
  "reviews": [],
  "user_review": null,
  "can_review": false
}
```

### Souvenir
1. `GET /api/products/souvenirs`
```json
{
  "filters": {"q": "kaos", "category_id": 1},
  "products": {
    "data": [
      {
        "id": 1,
        "encrypted_id": "<encrypted>",
        "slug": "kaos-indotix",
        "name": "Kaos Indotix",
        "price": 75000,
        "stock": 100,
        "category": "Apparel",
        "image_url": "/storage/kaos.jpg"
      }
    ],
    "current_page": 1
  },
  "categories": [{"id": 1, "name": "Apparel"}]
}
```

2. `GET /api/products/souvenirs/{product}`
```json
{
  "product": {
    "id": 1,
    "encrypted_id": "<encrypted>",
    "slug": "kaos-indotix",
    "name": "Kaos Indotix",
    "description": "...",
    "price": 75000,
    "stock": 100,
    "category": "Apparel",
    "images": ["/storage/kaos.jpg"],
    "variants": [
      {"id": 10, "name": "M", "variant_type": "size", "sku": "KAOS-M", "additional_price": 0, "stock": 50, "is_active": true}
    ]
  },
  "reviews": [],
  "user_review": null,
  "can_review": false
}
```

### Special Programs
1. `GET /api/products/special-programs`
```json
{
  "filters": {"q": "wedding", "category": "wedding"},
  "programs": [
    {
      "id": 7,
      "encrypted_id": "<encrypted>",
      "slug": "paket-wedding",
      "name": "Paket Wedding",
      "category": "wedding",
      "min_price": 2000000,
      "image_url": "/storage/sp.jpg"
    }
  ]
}
```

2. `GET /api/products/special-programs/{program}`
```json
{
  "program": {
    "id": 7,
    "encrypted_id": "<encrypted>",
    "slug": "paket-wedding",
    "name": "Paket Wedding",
    "category": "wedding",
    "description": "...",
    "base_price": 2000000,
    "capacity": 0,
    "image_url": "/storage/sp.jpg"
  },
  "variants": [
    {"id": 1, "name": "Silver", "price": 2000000, "capacity": 0, "facilities": ["1x meal"]}
  ],
  "facilities": ["1x meal"],
  "inventories": [
    {"date": "2026-06-01", "capacity": 50}
  ]
}
```

## Bookings
### Hotel Booking (auth)
1. `POST /api/hotel/bookings/quote`
```json
{
  "pricing": {
    "nights": 1,
    "subtotal": 450000,
    "discount_amount": 0,
    "service_fee": 5000,
    "tax_total": 45000,
    "taxes": [{"name": "Tax", "rate": 10, "amount": 45000}],
    "total": 500000
  },
  "voucher": null
}
```

2. `POST /api/hotel/bookings`
```json
{
  "booking": {
    "encrypted_id": "<encrypted>",
    "id": 100,
    "status": "pending_payment",
    "payment_status": null,
    "payment_deadline": "2026-04-01T12:00:00+07:00",
    "hotel": {"name": "Neo Hotel", "address": "Jl. Contoh"},
    "check_in": "2026-04-01",
    "check_out": "2026-04-02",
    "nights": 1,
    "rooms_count": 1,
    "guests_count": 2,
    "total": 500000,
    "subtotal": 450000,
    "discount_amount": 0,
    "service_fee": 5000,
    "tax_total": 45000,
    "taxes": [{"name": "Tax", "rate": 10, "amount": 45000}],
    "voucher_code": null,
    "guest_name": "User",
    "guest_email": "user@mail.com",
    "guest_phone": "0812...",
    "special_request": null,
    "rooms": [
      {"room_type": "Deluxe", "rooms_count": 1, "price_per_night": 450000, "subtotal": 450000}
    ],
    "payment": null,
    "qr_data": "INDOTIX|HOTEL|<encrypted>",
    "qr_url": "https://api.qrserver.com/..."
  }
}
```

3. `GET /api/hotel/bookings`
```json
{"bookings": [/* bookingPayload */]}
```

4. `GET /api/hotel/bookings/{booking}`
```json
{"booking": {/* bookingPayload */}}
```

5. `POST /api/hotel/bookings/{booking}/pay`
```json
{
  "payment": {
    "order_id": "HOTEL-100-20260401120000",
    "snap_token": "<token>",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/...",
    "payload": {"token": "<token>"}
  }
}
```

6. `POST /api/hotel/bookings/{booking}/cancel`
```json
{"booking": {/* bookingPayload */}}
```

7. `GET /api/hotel/bookings/{booking}/invoice`
```
Content-Type: application/pdf
(binary PDF)
```

### Wisata Booking (auth)
1. `POST /api/wisata/bookings/quote`
```json
{
  "pricing": {"unit_price": 20000, "quantity": 2, "total": 40000}
}
```

2. `POST /api/wisata/bookings`
```json
{"booking": {/* wisata bookingPayload */}}
```

3. `GET /api/wisata/bookings`
```json
{"bookings": [/* wisata bookingPayload */]}
```

4. `GET /api/wisata/bookings/{booking}`
```json
{"booking": {/* wisata bookingPayload */}}
```

5. `POST /api/wisata/bookings/{booking}/pay`
```json
{
  "payment": {
    "order_id": "WISATA-10-20260401120000",
    "snap_token": "<token>",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/...",
    "payload": {"token": "<token>"}
  }
}
```

6. `POST /api/wisata/bookings/{booking}/cancel`
```json
{"booking": {/* wisata bookingPayload */}}
```

7. `GET /api/wisata/bookings/{booking}/ticket`
```
Content-Type: application/pdf
(binary PDF)
```

### Event Booking (auth)
1. `POST /api/events/bookings/quote`
```json
{"pricing": {"unit_price": 150000, "quantity": 2, "total": 300000}}
```

2. `POST /api/events/bookings`
```json
{"booking": {/* event bookingPayload */}}
```

3. `GET /api/events/bookings`
```json
{"bookings": [/* event bookingPayload */]}
```

4. `GET /api/events/bookings/{booking}`
```json
{"booking": {/* event bookingPayload */}}
```

5. `POST /api/events/bookings/{booking}/pay`
```json
{
  "payment": {
    "order_id": "EVENT-10-20260401120000",
    "snap_token": "<token>",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/...",
    "payload": {"token": "<token>"}
  }
}
```

6. `POST /api/events/bookings/{booking}/cancel`
```json
{"booking": {/* event bookingPayload */}}
```

### Academy Booking (auth)
1. `POST /api/academy/bookings/quote`
```json
{"pricing": {"unit_price": 100000, "quantity": 1, "total": 100000}}
```

2. `POST /api/academy/bookings`
```json
{"booking": {/* academy bookingPayload */}}
```

3. `GET /api/academy/bookings`
```json
{"bookings": [/* academy bookingPayload */]}
```

4. `GET /api/academy/bookings/{booking}`
```json
{"booking": {/* academy bookingPayload */}}
```

5. `POST /api/academy/bookings/{booking}/pay`
```json
{
  "payment": {
    "order_id": "ACADEMY-10-20260401120000",
    "snap_token": "<token>",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/...",
    "payload": {"token": "<token>"}
  }
}
```

6. `POST /api/academy/bookings/{booking}/cancel`
```json
{"booking": {/* academy bookingPayload */}}
```

7. `GET /api/academy/bookings/{booking}/ticket`
```
Content-Type: application/pdf
(binary PDF)
```

8. `GET /api/academy/bookings/{booking}/qr`
```
Content-Type: image/png
(binary PNG)
```

### Special Program Booking (auth)
1. `POST /api/special-programs/bookings/quote`
```json
{"pricing": {"unit_price": 2000000, "quantity": 1, "total": 2000000}}
```

2. `POST /api/special-programs/bookings`
```json
{"booking": {/* special program bookingPayload */}}
```

3. `GET /api/special-programs/bookings`
```json
{"bookings": [/* special program bookingPayload */]}
```

4. `GET /api/special-programs/bookings/{booking}`
```json
{"booking": {/* special program bookingPayload */}}
```

5. `POST /api/special-programs/bookings/{booking}/pay`
```json
{
  "payment": {
    "order_id": "SPECIAL-PROGRAM-10-20260401120000",
    "snap_token": "<token>",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/...",
    "payload": {"token": "<token>"}
  }
}
```

6. `POST /api/special-programs/bookings/{booking}/cancel`
```json
{"booking": {/* special program bookingPayload */}}
```

### Souvenir Orders (auth)
1. `POST /api/souvenir/orders/quote`
```json
{
  "items": [
    {"product_id": 1, "variant_id": 10, "name": "Kaos", "sku": "KAOS-M", "quantity": 2, "unit_price": 75000, "subtotal": 150000}
  ],
  "summary": {"subtotal": 150000, "total": 150000}
}
```

2. `POST /api/souvenir/orders`
```json
{"order": {/* souvenir orderPayload */}}
```

3. `GET /api/souvenir/orders`
```json
{"orders": [/* souvenir orderPayload */]}
```

4. `GET /api/souvenir/orders/{order}`
```json
{"order": {/* souvenir orderPayload */}}
```

5. `POST /api/souvenir/orders/{order}/pay`
```json
{
  "payment": {
    "order_id": "SOUVENIR-10-20260401120000",
    "snap_token": "<token>",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/...",
    "payload": {"token": "<token>"}
  }
}
```

## Souvenir Cart (auth)
1. `GET /api/souvenir/cart`
```json
{
  "items": [
    {"key": "1-10", "product_id": 1, "variant_id": 10, "encrypted_product_id": "<encrypted>", "name": "Kaos", "variant_name": "M", "price": 75000, "quantity": 2, "subtotal": 150000, "image_url": "/storage/kaos.jpg", "stock": 50}
  ],
  "summary": {"subtotal": 150000, "total": 150000}
}
```

2. `POST /api/souvenir/cart/add`
```json
{ "items": [/* same as cart */], "summary": {"subtotal": 150000, "total": 150000} }
```

3. `POST /api/souvenir/cart/update`
```json
{ "items": [/* same as cart */], "summary": {"subtotal": 150000, "total": 150000} }
```

4. `POST /api/souvenir/cart/remove`
```json
{ "items": [/* same as cart */], "summary": {"subtotal": 0, "total": 0} }
```

5. `POST /api/souvenir/cart/clear`
```json
{"items": [], "summary": {"subtotal": 0, "total": 0}}
```

## History (auth)
1. `GET /api/history`
```json
{
  "filters": {"type": "all", "status": null, "q": null, "date_from": null, "date_to": null},
  "bookings": [
    {
      "id": 100,
      "encrypted_id": "<encrypted>",
      "type": "hotel",
      "title": "Neo Hotel",
      "city_name": "Jakarta",
      "address": "Jl. Contoh",
      "check_in": "2026-04-01",
      "check_out": "2026-04-02",
      "nights": 1,
      "rooms_count": 1,
      "guests_count": 2,
      "visit_date": null,
      "quantity": null,
      "total": 500000,
      "status": "pending_payment",
      "payment_status": null,
      "payment_deadline": "2026-04-01T12:00:00+07:00",
      "guest_name": "User",
      "guest_email": "user@mail.com",
      "guest_phone": "0812...",
      "created_at": "2026-03-29T12:00:00+07:00",
      "midtrans_order_id": null,
      "payment_url": "/booking/<encrypted>/payment",
      "detail_url": "/booking/<encrypted>",
      "review_url": "/stay/hotels/neo-hotel",
      "can_review": false
    }
  ]
}
```

2. `GET /api/history/{type}/{booking}`
```json
{
  "type": "hotel",
  "booking": {
    "id": 100,
    "encrypted_id": "<encrypted>",
    "status": "pending_payment",
    "payment_status": null,
    "payment_deadline": "2026-04-01T12:00:00+07:00",
    "hotel": {"name": "Neo Hotel", "address": "Jl. Contoh"},
    "check_in": "2026-04-01",
    "check_out": "2026-04-02",
    "nights": 1,
    "rooms_count": 1,
    "guests_count": 2,
    "total": 500000,
    "subtotal": 450000,
    "discount_amount": 0,
    "service_fee": 5000,
    "tax_total": 45000,
    "taxes": [{"name": "Tax", "rate": 10, "amount": 45000}],
    "voucher_code": null,
    "guest_name": "User",
    "guest_email": "user@mail.com",
    "guest_phone": "0812...",
    "special_request": null,
    "rooms": [
      {"room_type": "Deluxe", "rooms_count": 1, "price_per_night": 450000, "subtotal": 450000}
    ],
    "payment": null,
    "qr_data": "INDOTIX|HOTEL|<encrypted>",
    "qr_url": "https://api.qrserver.com/..."
  }
}
```

## Notifications (auth)
1. `GET /api/notifications`
```json
{
  "filters": {"status": null, "type": null, "q": null},
  "meta": {"current_page": 1, "last_page": 1, "per_page": 20, "total": 1, "unread_count": 1},
  "notifications": [
    {
      "id": 1,
      "title": "Menunggu pembayaran",
      "message": "Ada pembayaran...",
      "type": "payment_pending",
      "is_read": false,
      "data": {"booking_id": "<encrypted>", "category": "hotel"},
      "created_at": "2026-03-29T12:00:00+07:00"
    }
  ]
}
```

2. `GET /api/notifications/unread-count`
```json
{"unread_count": 1}
```

3. `POST /api/notifications/read-all`
```json
{"updated": 5}
```

4. `POST /api/notifications/{notification}/read`
```json
{
  "notification": {
    "id": 1,
    "title": "...",
    "message": "...",
    "type": "...",
    "is_read": true,
    "data": {},
    "created_at": "2026-03-29T12:00:00+07:00"
  }
}
```

## Push Tokens (auth)
1. `POST /api/push/tokens`
```json
{
  "token": {
    "id": 1,
    "token": "<fcm-token>",
    "platform": "android",
    "device_id": "device-1",
    "is_active": true
  }
}
```

2. `POST /api/push/tokens/revoke`
```json
{"updated": 1}
```

## Reviews (auth)
1. `GET /api/reviews`
Catatan: `product_id` **wajib encrypted_id**.
```json
{
  "reviews": [],
  "user_review": null,
  "can_review": false
}
```

2. `POST /api/reviews`
Catatan: `product_id` **wajib encrypted_id**.
```json
{
  "message": "Ulasan berhasil dikirim.",
  "review": {
    "id": 1,
    "rating": 5,
    "comment": "Bagus",
    "status": "active",
    "created_at": "2026-03-29T12:00:00",
    "updated_at": "2026-03-29T12:00:00"
  }
}
```

## Banners
1. `GET /api/banners`
```json
{
  "banners": [
    {"id": 1, "title": "Promo", "image_url": "/storage/banner.jpg", "link_url": "https://example.com", "sort_order": 1}
  ]
}
```

## Public Content
1. `GET /api/faqs`
```json
{
  "faqs": [
    {
      "id": 1,
      "question": "Bagaimana cara booking?",
      "answer": "Silakan pilih produk lalu lanjutkan ke pembayaran.",
      "category": "booking",
      "sort_order": 1
    }
  ]
}
```

2. `GET /api/privacy-policy`
```json
{
  "policy": {
    "id": 1,
    "title": "Kebijakan Privasi Indotix",
    "content": "Isi kebijakan privasi...",
    "terms_content": "Isi syarat dan ketentuan...",
    "version": "1.0",
    "effective_at": "2026-03-30"
  }
}
```

## Chat (auth)
1. `GET /api/chat/conversations`
```json
{
  "conversations": [
    {
      "id": 1,
      "partner": {"id": 2, "name": "Admin", "role": "admin"},
      "subject": {"type": "wisata", "label": "Wisata", "title": "Pantai Indah"},
      "last_message_at": "2026-03-29 12:00:00",
      "unread_count": 0
    }
  ]
}
```

2. `POST /api/chat/start`
```json
{"conversation": {/* same as conversation payload */}}
```

3. `GET /api/chat/conversations/{conversation}`
```json
{
  "conversation": {/* conversation payload */},
  "messages": [
    {"id": 1, "conversation_id": 1, "sender_id": 1, "body": "Halo", "created_at": "2026-03-29 12:00:00", "is_me": true, "read_at": null}
  ]
}
```

4. `GET /api/chat/conversations/{conversation}/messages`
```json
{"messages": [/* message payload */]}
```

5. `POST /api/chat/conversations/{conversation}/messages`
```json
{"message": {"id": 2, "conversation_id": 1, "sender_id": 1, "body": "Halo", "created_at": "2026-03-29 12:01:00", "is_me": true, "read_at": null}}
```

6. `POST /api/chat/conversations/{conversation}/read`
```json
{"updated": 3}
```

## Admin: Push Notifications (auth)
1. `POST /api/admin/notifications`
```json
{
  "message": "Notifikasi berhasil dikirim.",
  "trace_id": "b1c3f2a8-4c3a-4ef8-9e5b-9f4b73b9b54a",
  "target": {
    "mode": "roles",
    "roles": ["user"],
    "user_ids": null
  },
  "stats": {
    "total_recipients": 120,
    "notifications_created": 120,
    "push_queued": 120
  }
}
```
