@extends('errors.layout', [
    'code' => $code ?? 'Error',
    'title' => 'Permintaan Tidak Valid',
    'description' => 'Permintaan tidak dapat diproses. Silakan periksa kembali dan coba lagi.',
    'primaryAction' => ['label' => 'Kembali ke Beranda', 'url' => url('/')],
])
