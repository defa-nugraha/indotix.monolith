@extends('errors.layout', [
    'code' => '404',
    'title' => 'Halaman Tidak Ditemukan',
    'description' => 'Sepertinya halaman yang kamu cari tidak tersedia atau sudah dipindahkan.',
    'primaryAction' => ['label' => 'Kembali ke Beranda', 'url' => url('/')],
    'secondaryAction' => ['label' => 'Coba Halaman Lain', 'url' => url()->previous() ?: url('/')],
])
