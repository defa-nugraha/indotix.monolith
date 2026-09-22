# Mobile App Home Content

Konten Mobile Home dikelola terpisah dari konten Website.

- Admin: `/admin/mobile/home` dan `/admin/mobile/promos`
- API Mobile: `GET /api/mobile/home`
- Tabel: `mobile_home_heroes` dan `mobile_promo_banners`
- Storage: `mobile/home/hero/` dan `mobile/home/promos/`

Resource Website (`system_settings`, `public_banners`, `/api/banners`, dan
`home-content/`) tidak dibaca atau ditulis oleh fitur ini.

Mobile Hero mendukung image, GIF, MP4, dan WebM. Rekomendasi media hero adalah
portrait 1080 x 1920 untuk video dan 1080 x 1440 atau 1080 x 1920 untuk poster.
Promo Mobile menggunakan banner sekitar 2.26:1, misalnya 1200 x 530.
