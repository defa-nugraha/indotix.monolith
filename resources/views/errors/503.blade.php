@extends('errors.layout', [
    'code' => '503',
    'title' => 'Layanan Sementara Tidak Tersedia',
    'description' => 'Kami sedang melakukan pemeliharaan singkat. Silakan coba lagi nanti.',
    'primaryAction' => ['label' => 'Muat Ulang', 'url' => request()->fullUrl()],
    'secondaryAction' => ['label' => 'Kembali ke Beranda', 'url' => url('/')],
])
