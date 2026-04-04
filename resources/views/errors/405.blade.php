@extends('errors.layout', [
    'code' => '405',
    'title' => 'Metode Tidak Diizinkan',
    'description' => 'Permintaan yang kamu kirim tidak didukung pada halaman ini.',
    'primaryAction' => ['label' => 'Kembali ke Beranda', 'url' => url('/')],
])
