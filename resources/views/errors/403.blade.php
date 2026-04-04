@extends('errors.layout', [
    'code' => '403',
    'title' => 'Akses Ditolak',
    'description' => 'Maaf, kamu tidak memiliki izin untuk mengakses halaman ini.',
    'primaryAction' => ['label' => 'Kembali ke Beranda', 'url' => url('/')],
])
