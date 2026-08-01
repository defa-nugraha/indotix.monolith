<?php

test('public promo page exposes voucher discovery and copy code ux', function () {
    $routes = file_get_contents(__DIR__.'/../../routes/web.php');
    $controller = file_get_contents(__DIR__.'/../../app/Http/Controllers/PublicPromoController.php');
    $page = file_get_contents(__DIR__.'/../../resources/js/pages/public/promo/index.tsx');
    $showPage = file_get_contents(__DIR__.'/../../resources/js/pages/public/promo/show.tsx');
    $adminController = file_get_contents(__DIR__.'/../../app/Http/Controllers/Admin/PromoItemController.php');
    $adminCreate = file_get_contents(__DIR__.'/../../resources/js/pages/admin/public/promo-items/create.tsx');
    $adminEdit = file_get_contents(__DIR__.'/../../resources/js/pages/admin/public/promo-items/edit.tsx');
    $home = file_get_contents(__DIR__.'/../../resources/js/pages/welcome.tsx');
    $header = file_get_contents(__DIR__.'/../../resources/js/components/public-header.tsx');
    $mobileNav = file_get_contents(__DIR__.'/../../resources/js/components/public-mobile-navigation.tsx');
    $foreignBrand = 'Trave'.'loka';

    expect($routes)
        ->toContain("Route::get('/promo'")
        ->toContain("->name('promo.index')")
        ->toContain("Route::get('/promo/{promoItem:slug}'")
        ->toContain("->name('promo.show')");

    expect($controller)
        ->toContain("Inertia::render('public/promo/index'")
        ->toContain("Inertia::render('public/promo/show'")
        ->toContain('activePromoItemsQuery')
        ->toContain("where('is_active', true)")
        ->toContain("orWhereColumn('quota_used', '<', 'quota_total')");

    expect($page)
        ->toContain('Promo Indotix - Voucher dan Diskon Tiket Wisata')
        ->toContain("type PromoTab = 'all' | 'voucher' | 'banner'")
        ->toContain('const mobileVoucherRailClass =')
        ->toContain('const mobilePromoRailClass =')
        ->toContain('navigator.clipboard.writeText(code)')
        ->toContain('Salin kode')
        ->toContain('Gunakan sekarang')
        ->toContain('Semua Kategori')
        ->toContain('categoryOptions')
        ->toContain('Masukkan kode pada kolom voucher saat checkout')
        ->not->toContain($foreignBrand);

    expect($showPage)
        ->toContain('Detail promo')
        ->toContain('Syarat dan ketentuan')
        ->toContain('Promo lain di kategori ini')
        ->toContain('Buka promo');

    expect($adminController)
        ->toContain('CATEGORY_OPTIONS')
        ->toContain("'slug' =>")
        ->toContain("'category' =>")
        ->toContain("'description' =>")
        ->toContain("'terms' =>")
        ->toContain('Slot homepage sudah digunakan');

    expect($adminCreate)
        ->toContain('Kategori promo')
        ->toContain('Deskripsi promo')
        ->toContain('Syarat dan ketentuan')
        ->toContain('Slot homepage');

    expect($adminEdit)
        ->toContain('Kategori promo')
        ->toContain('Deskripsi promo')
        ->toContain('Syarat dan ketentuan')
        ->toContain('Slot homepage');

    expect($home)
        ->toContain('specialPromoImageCards')
        ->toContain('promoItems.map((promo)')
        ->toContain('`/promo/${promo.slug}`')
        ->not->toContain('copyVoucherCode')
        ->not->toContain('copiedVoucherCode === voucher.code')
        ->not->toContain('homeContent.promo.title')
        ->not->toContain($foreignBrand);

    expect($header)
        ->toContain("{ label: 'Promo', href: '/promo' }");

    expect($mobileNav)
        ->toContain("label: 'Promo'")
        ->toContain("href: '/promo'");
});
