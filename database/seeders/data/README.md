Format file `indonesia.json`

Struktur data JSON yang dibaca oleh `IndonesiaRegionSeeder`:

```
{
  "provinces": [
    { "code": "11", "name": "Aceh" }
  ],
  "regencies": [
    { "code": "1101", "province_code": "11", "name": "Kabupaten Simeulue", "type": "Kabupaten" }
  ],
  "districts": [
    { "code": "110101", "regency_code": "1101", "name": "Teupah Selatan" }
  ],
  "villages": [
    { "code": "1101012001", "district_code": "110101", "name": "Latiung", "type": "Desa", "postal_code": "23771" }
  ]
}
```

Catatan:
- `code` wajib unik dan mengikuti kode wilayah resmi (Kemendagri).
- `type` untuk `regencies` biasanya `Kabupaten` atau `Kota`, sedangkan `villages` bisa `Desa` atau `Kelurahan`.
- `postal_code` opsional.
