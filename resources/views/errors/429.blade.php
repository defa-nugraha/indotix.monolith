@extends('errors.layout', [
    'code' => '429',
    'title' => 'Terlalu Banyak Permintaan',
    'description' => 'Terlalu banyak permintaan dalam waktu singkat. Coba lagi beberapa saat.',
    'primaryAction' => ['label' => 'Muat Ulang', 'url' => request()->fullUrl()],
    'secondaryAction' => ['label' => 'Kembali ke Beranda', 'url' => url('/')],
])
