@extends('errors.layout', [
    'code' => $code ?? 'Error',
    'title' => 'Ada Gangguan Sistem',
    'description' => 'Tim kami sedang menangani kendala ini. Silakan coba lagi sebentar.',
    'primaryAction' => ['label' => 'Muat Ulang', 'url' => request()->fullUrl()],
    'secondaryAction' => ['label' => 'Kembali ke Beranda', 'url' => url('/')],
])
