@extends('errors.layout', [
    'code' => '502',
    'title' => 'Gateway Bermasalah',
    'description' => 'Server menerima respons yang tidak valid. Coba lagi sebentar.',
    'primaryAction' => ['label' => 'Muat Ulang', 'url' => request()->fullUrl()],
    'secondaryAction' => ['label' => 'Kembali ke Beranda', 'url' => url('/')],
])
