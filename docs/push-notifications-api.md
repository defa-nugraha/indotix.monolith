# Indotix Push Notification API (Mobile)

Base URL:

```
https://your-domain.com/api
```

Headers:

```
Content-Type: application/json
Authorization: Bearer <token>
```

## 1) Register Device Token

Gunakan setelah login atau saat token FCM berubah.

**POST** `/push/tokens`

Body:

```json
{
  "token": "fcm_device_token",
  "platform": "android",
  "device_id": "unique-device-id"
}
```

Response 200:

```json
{
  "token": {
    "id": 12,
    "token": "fcm_device_token",
    "platform": "android",
    "device_id": "unique-device-id",
    "is_active": true
  }
}
```

Catatan:
- Jika token sudah ada, sistem akan meng-update user dan mengaktifkannya kembali.
- `platform` opsional: `android` | `ios` | `web`.

## 2) Revoke Device Token

Gunakan saat logout atau uninstall app.

**POST** `/push/tokens/revoke`

Body (pilih salah satu):

```json
{ "token": "fcm_device_token" }
```

atau

```json
{ "device_id": "unique-device-id" }
```

Response 200:

```json
{
  "updated": 1
}
```

## Trigger Notifikasi (Pembayaran Sukses)

Sistem akan otomatis mengirim push notification ke user saat pembayaran sukses:
- Hotel
- Wisata
- Event
- Academy
- Special Program
- Souvenir

Payload yang dikirim berisi `title`, `body`, dan `data` seperti:

```json
{
  "title": "Pembayaran event berhasil",
  "body": "Pembayaran kamu sudah diterima. Tiket event aktif.",
  "data": {
    "booking_id": "encrypted_id",
    "type": "event",
    "category": "event",
    "notification_type": "event_payment_paid"
  }
}
```

## Konfigurasi Server

Set di `.env`:

```
FCM_SERVER_KEY=your_fcm_server_key
```

Catatan:
- Gunakan Firebase Cloud Messaging (Legacy HTTP API).
- Jika `FCM_SERVER_KEY` kosong, push akan di-skip (tidak error ke user).
