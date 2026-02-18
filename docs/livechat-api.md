# Indotix Live Chat API (Mobile)

Base URL:

```
https://your-domain.com/api
```

Headers:

```
Content-Type: application/json
Authorization: Bearer <token>
```

## 1) List Conversations

**GET** `/chat/conversations`

Response 200:

```json
{
  "conversations": [
    {
      "id": 12,
      "partner": { "id": 1, "name": "Customer Service", "role": "admin" },
      "subject": { "type": "wisata", "label": "Wisata", "title": "Taman Laut" },
      "last_message_at": "2026-02-16 12:30:00",
      "unread_count": 2
    }
  ]
}
```

## 2) Start Chat (Buat / Ambil Conversation)

**POST** `/chat/start`

Body:

```json
{
  "type": "wisata",
  "id": 5
}
```

`type` valid:
- `wisata`, `hotel`, `souvenir`, `event`, `academy`, `special_program`, `admin`

Catatan:
- Untuk `admin` (customer service) boleh tanpa `id`.
- Untuk tipe lain, `id` wajib.

Response 200:

```json
{
  "conversation": {
    "id": 12,
    "partner": { "id": 1, "name": "Customer Service", "role": "admin" },
    "subject": { "type": "wisata", "label": "Wisata", "title": "Taman Laut" },
    "last_message_at": "2026-02-16 12:30:00",
    "unread_count": 0
  }
}
```

## 3) Detail Conversation (Termasuk Pesan Terbaru)

**GET** `/chat/conversations/{conversation}`

Query params (opsional):
- `per_page` (default 30, max 100)

Response 200:

```json
{
  "conversation": { "...": "payload conversation" },
  "messages": [
    {
      "id": 99,
      "conversation_id": 12,
      "sender_id": 8,
      "body": "Halo, saya mau tanya.",
      "created_at": "2026-02-16 12:29:50",
      "is_me": true,
      "read_at": null
    }
  ]
}
```

## 4) Ambil Pesan Baru (Polling)

**GET** `/chat/conversations/{conversation}/messages`

Query params (opsional):
- `after_id`: ambil pesan setelah ID tertentu
- `per_page`: default 50, max 100

Contoh:

```
GET /chat/conversations/12/messages?after_id=99
```

Response 200:

```json
{
  "messages": [
    {
      "id": 100,
      "conversation_id": 12,
      "sender_id": 1,
      "body": "Halo, ada yang bisa kami bantu?",
      "created_at": "2026-02-16 12:30:10",
      "is_me": false,
      "read_at": null
    }
  ]
}
```

## 5) Kirim Pesan

**POST** `/chat/conversations/{conversation}/messages`

Body:

```json
{
  "message": "Saya ingin ubah jadwal"
}
```

Response 200:

```json
{
  "message": {
    "id": 101,
    "conversation_id": 12,
    "sender_id": 8,
    "body": "Saya ingin ubah jadwal",
    "created_at": "2026-02-16 12:30:20",
    "is_me": true,
    "read_at": null
  }
}
```

## 6) Tandai Pesan Dibaca

**POST** `/chat/conversations/{conversation}/read`

Response 200:

```json
{
  "updated": 2
}
```

## Realtime (WebSocket / Reverb)

Event broadcast:
- Channel: `private-chat.{conversationId}`
- Event name: `chat.message`

Payload event:

```json
{
  "id": 101,
  "conversation_id": 12,
  "sender_id": 8,
  "body": "Saya ingin ubah jadwal",
  "created_at": "2026-02-16 12:30:20"
}
```

Catatan:
- Pastikan user subscribe ke channel yang sesuai `conversationId`.
- Fallback polling bisa pakai endpoint `GET /chat/conversations/{conversation}/messages`.
