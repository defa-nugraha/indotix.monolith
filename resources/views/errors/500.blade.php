@extends('errors.layout', [
    'code' => '500',
    'title' => 'Sistem Sedang Bermasalah',
    'description' => 'Kami sedang menangani masalah ini. Silakan coba lagi dalam beberapa menit.',
    'primaryAction' => ['label' => 'Muat Ulang', 'url' => request()->fullUrl()],
    'secondaryAction' => ['label' => 'Kembali ke Beranda', 'url' => url('/')],
])
