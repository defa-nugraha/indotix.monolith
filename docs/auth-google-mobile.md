# Login/Register Google (Mobile) - Indotix API

Dokumentasi ini khusus alur **Google Sign-In dari mobile** untuk mendapatkan token Indotix (Sanctum).

## Ringkas Flow

1) Mobile melakukan Google Sign-In  
2) Mobile mendapatkan **access_token** Google  
3) Kirim access_token ke API Indotix  
4) API mengembalikan **Bearer token** Indotix  
5) Gunakan Bearer token untuk semua request berikutnya

---

## Endpoint

**POST** `/api/auth/google`

**Body**

```json
{
  "access_token": "ya29.a0AfH6S....",
  "role": "user",
  "device_name": "android"
}
```

**Response 200**

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

**Error**
- `422` Token Google invalid / email tidak ditemukan
- `403` Akun disuspend

---

## Requirement di Google Cloud

Pastikan kamu punya:
- **OAuth Client ID** (Android dan iOS)
- **OAuth Client Secret**
- **Redirect URI** (sesuai Google Console)

Diset di `.env`:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
```

---

## Mobile Implementation (General)

1) Integrasi Google Sign-In SDK  
2) Dapatkan **access_token** (bukan hanya id_token)  
3) Kirim ke `/api/auth/google`  
4) Simpan `token` dari Indotix  
5) Tambahkan header `Authorization: Bearer <token>` di request berikutnya

---

## Contoh Flutter (google_sign_in)

```dart
final googleSignIn = GoogleSignIn(
  scopes: ['email'],
);

final account = await googleSignIn.signIn();
final auth = await account?.authentication;

final accessToken = auth?.accessToken; // wajib

final response = await http.post(
  Uri.parse('https://your-domain.com/api/auth/google'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'access_token': accessToken,
    'role': 'user',
    'device_name': 'android'
  }),
);
```

---

## Contoh React Native

### @react-native-google-signin/google-signin

```ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID',
  scopes: ['email'],
});

const userInfo = await GoogleSignin.signIn();
const tokens = await GoogleSignin.getTokens();
const accessToken = tokens.accessToken;

await fetch('https://your-domain.com/api/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    access_token: accessToken,
    role: 'user',
    device_name: 'android'
  }),
});
```

---

## Catatan Penting

- Endpoint ini **membutuhkan access_token** Google.  
  Jika SDK hanya memberikan `id_token`, kamu butuh:
  - menukar `id_token` menjadi `access_token`, atau
  - minta saya menambahkan endpoint baru yang memverifikasi `id_token`.

- Token Indotix adalah **Bearer token** (Sanctum).  
  Simpan dengan aman di secure storage.

---

## Header untuk Request Berikutnya

```
Authorization: Bearer 1|TOKEN_INDOTIX
```

---

Jika kamu mau saya buat versi detail khusus Flutter / React Native (step-by-step setup + konfigurasi Google Console), bilang aja platformnya.  
