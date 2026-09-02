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
    $routes = file_get_contents(__DIR__.'/../../routes/web.php');

    expect($sidebar)
        ->toContain('<span>Konten Publik</span>')
        ->toContain('/admin/public/home')
        ->toContain('Halaman Home')
        ->not->toContain('label: \'Banner\'')
        ->not->toContain('label: \'Promo Spesial\'')
        ->toContain('Kontak')
        ->toContain('/admin/public/partners')
        ->toContain('Partner Kami')
        ->not->toContain('/admin/public/promo-videos')
        ->not->toContain('Promo Video');

    expect($routes)
        ->toContain('admin/public/partners')
        ->not->toContain('admin/public/promo-videos');
});

test('admin wisata menu exposes voucher management and hides affiliate menu', function () {
    $sidebar = file_get_contents(__DIR__.'/../../resources/js/components/app-sidebar-admin.tsx');
    $routes = file_get_contents(__DIR__.'/../../routes/web.php');

    expect($sidebar)
        ->toContain('/admin/wisata/vouchers')
        ->toContain('Voucher Wisata')
        ->toContain('const showAffiliateSection = false');

    expect($routes)
        ->toContain("admin/wisata/vouchers")
        ->toContain("admin.wisata.vouchers.index");
});
