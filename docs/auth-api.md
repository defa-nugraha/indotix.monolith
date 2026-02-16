# Indotix Auth API (Mobile)

Base URL:

```
https://your-domain.com/api
```

Headers umum:

```
Content-Type: application/json
Authorization: Bearer <token>   # untuk endpoint yang butuh auth
```

## 1) Register

**POST** `/auth/register`

Body:

```json
{
  "name": "User Indotix",
  "email": "user@indotix.id",
  "password": "password123",
  "role": "user",
  "device_name": "android"
}
```

Validasi:
- `role` opsional: `user` / `mitra`
- `email` harus unik
- `password` minimal 8

Response 201:

```json
{
  "token": "1|.....",
  "token_type": "Bearer",
  "user": {
    "id": 10,
    "name": "User Indotix",
    "email": "user@indotix.id",
    "role": "user"
  },
  "requires_otp": true,
  "otp_expires_at": "2026-02-16T12:30:00+07:00"
}
```

## 2) Login

**POST** `/auth/login`

Body:

```json
{
  "email": "user@indotix.id",
  "password": "password123",
  "device_name": "android"
}
```

Response 200:

```json
{
  "token": "1|.....",
  "token_type": "Bearer",
  "user": {
    "id": 10,
    "name": "User Indotix",
    "email": "user@indotix.id",
    "role": "user"
  }
}
```

Error umum:
- `422` email/password salah
- `403` akun disuspend
- `403` email belum terverifikasi (OTP dikirim ulang otomatis)
- `429` terlalu banyak permintaan OTP

## 2b) Verifikasi OTP (Email)

**POST** `/auth/otp/verify`  
Auth: Bearer token

Body:

```json
{
  "code": "123456"
}
```

Response 200:

```json
{
  "message": "OTP berhasil diverifikasi.",
  "user": {
    "id": 10,
    "name": "User Indotix",
    "email": "user@indotix.id",
    "role": "user"
  }
}
```

Error umum:
- `422` kode salah / expired / not found
- `429` terlalu banyak percobaan

## 2c) Kirim Ulang OTP

**POST** `/auth/otp/resend`  
Auth: Bearer token

Response 200:

```json
{
  "message": "OTP baru telah dikirim.",
  "otp_expires_at": "2026-02-16T12:30:00+07:00"
}
```

Error umum:
- `429` terlalu banyak permintaan
- `500` gagal kirim OTP

## 3) Google Login / Register

**POST** `/auth/google`

Gunakan **Google access_token** (dari Google Sign-In).

Body:

```json
{
  "access_token": "ya29.a0AfH6S....",
  "role": "user",
  "device_name": "android"
}
```

Response 200:

```json
{
  "token": "1|.....",
  "token_type": "Bearer",
  "user": {
    "id": 12,
    "name": "Nama Google",
    "email": "email@gmail.com",
    "role": "user"
  }
}
```

Error umum:
- `422` token Google invalid / email tidak ditemukan
- `403` akun disuspend

Env yang diperlukan:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

## 4) Get Profile (Me)

**GET** `/auth/me`  
Auth: Bearer token

Response 200:

```json
{
  "user": {
    "id": 10,
    "name": "User Indotix",
    "email": "user@indotix.id",
    "role": "user"
  }
}
```

## 5) Logout

**POST** `/auth/logout`  
Auth: Bearer token

Response 200:

```json
{
  "message": "Logout berhasil."
}
```

## Contoh cURL

Login:

```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@indotix.id","password":"password123","device_name":"android"}'
```

Get profile:

```bash
curl https://your-domain.com/api/auth/me \
  -H "Authorization: Bearer 1|TOKEN"
```
