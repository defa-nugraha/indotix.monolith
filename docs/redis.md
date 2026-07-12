# Redis

INDOTIX menggunakan Redis untuk cache aplikasi dan API publik, session web,
rate limiter, serta queue. Koneksi dipisahkan agar key dari setiap kebutuhan
tidak saling bercampur:

- database `0`: koneksi Redis umum
- database `1`: cache aplikasi dan API
- database `2`: session web
- database `3`: queue

## Konfigurasi produksi

Pastikan Redis aktif dan dapat dijangkau oleh PHP, lalu gunakan konfigurasi:

```dotenv
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=0
REDIS_CACHE_DB=1
REDIS_SESSION_DB=2
REDIS_QUEUE_DB=3

CACHE_STORE=redis
SESSION_DRIVER=redis
SESSION_CONNECTION=session
QUEUE_CONNECTION=redis
REDIS_QUEUE_CONNECTION=queue

API_CACHE_ENABLED=true
API_CACHE_STORE=redis
API_CACHE_TTL=60
```

Setelah deployment:

```bash
php artisan optimize:clear
php artisan config:cache
php artisan queue:restart
redis-cli ping
```

Worker queue harus tetap dijalankan oleh Supervisor atau systemd:

```bash
php artisan queue:work redis --sleep=1 --tries=3 --timeout=90
```

Cache respons hanya diterapkan pada endpoint API publik. Endpoint transaksi,
profil, notifikasi, chat, dan request dengan token autentikasi tidak disimpan.
