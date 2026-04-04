@extends('errors.layout', [
    'code' => '419',
    'title' => 'Sesi Berakhir',
    'description' => 'Sesi kamu sudah berakhir. Silakan muat ulang halaman untuk melanjutkan.',
    'primaryAction' => ['label' => 'Muat Ulang', 'url' => request()->fullUrl()],
    'secondaryAction' => ['label' => 'Kembali ke Beranda', 'url' => url('/')],
])
