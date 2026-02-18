# Indotix Public Banner API (Mobile)

Base URL:

```
https://your-domain.com/api
```

Headers:

```
Content-Type: application/json
```

## 1) List Banner (Publik)

**GET** `/banners`

Response 200:

```json
{
  "banners": [
    {
      "id": 3,
      "title": "Promo Libur Sekolah",
      "image_url": "https://your-domain.com/storage/public-banners/banner-1.jpg",
      "link_url": "https://your-domain.com/wisata",
      "sort_order": 1
    },
    {
      "id": 2,
      "title": "Special Program Weekend",
      "image_url": "https://your-domain.com/storage/public-banners/banner-2.jpg",
      "link_url": "https://your-domain.com/special-programs",
      "sort_order": 2
    }
  ]
}
```

Catatan:
- Hanya banner dengan `is_active = true` yang ditampilkan.
- Urutan berdasarkan `sort_order` lalu `id` (terbaru lebih dulu jika sort sama).
- Pastikan `php artisan storage:link` sudah dibuat agar `image_url` bisa diakses publik.
