<?php

test('admin sidebar exposes only the global product reviews menu', function () {
    $sidebar = file_get_contents(__DIR__.'/../../resources/js/components/app-sidebar-admin.tsx');

    expect($sidebar)
        ->toContain("title: 'Ulasan Produk'")
        ->not->toContain('Review & Rating')
        ->and(substr_count($sidebar, '/admin/reviews'))
        ->toBe(1);
});

test('admin dashboard does not expose removed event and report shortcuts', function () {
    $dashboard = file_get_contents(__DIR__.'/../../resources/js/pages/dashboard.tsx');

    expect($dashboard)
        ->not->toContain('Buat event baru')
        ->not->toContain('Lihat laporan');
});

test('admin public content menu follows active public home sections', function () {
    $sidebar = file_get_contents(__DIR__.'/../../resources/js/components/app-sidebar-admin.tsx');

    expect($sidebar)
        ->toContain('<span>Konten Publik</span>')
        ->toContain('/admin/public/home')
        ->toContain('Halaman Home')
        ->toContain('Banner')
        ->toContain('Promo Terbaik')
        ->toContain('Kontak')
        ->not->toContain('/admin/public/promo-videos')
        ->not->toContain('/admin/public/partners')
        ->not->toContain('Promo Video')
        ->not->toContain('Partner Kami');
});
