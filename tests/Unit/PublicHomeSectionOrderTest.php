<?php

test('public home product surface prioritizes wisata', function () {
    $source = file_get_contents(__DIR__.'/../../resources/js/pages/welcome.tsx');
    $contentSource = file_get_contents(__DIR__.'/../../app/Support/HomePageContent.php');
    $heroPosition = strpos($source, 'homeContent.search.placeholder');
    $wisataPosition = strpos($source, 'id="featured-destinations-section"');

    expect($source)
        ->toContain("label: 'Wisata'")
        ->toContain("href: '/wisata'")
        ->toContain('title="Indotix - Pesan Tiket Wisata dan Destinasi Rekreasi"')
        ->toContain("'query-input': 'required name=search_term_string'")
        ->toContain('homeContent.categories.map')
        ->toContain('homeContent.search.button_label')
        ->toContain('id="featured-destinations-section"')
        ->toContain('homeContent.featured.title')
        ->toContain('featuredProducts.map((item)')
        ->toContain('nearbyProducts.map((item)')
        ->toContain('homeContent.blog.eyebrow')
        ->not->toContain('Wisata Pantai')
        ->not->toContain('Desa Wisata Lestari')
        ->not->toContain('Taman Edukasi');

    expect($contentSource)
        ->toContain('Cari kota, destinasi, atau tiket wisata...')
        ->toContain('category_1_label')
        ->toContain('Kupon Diskon 12% untuk Pengguna Baru')
        ->toContain('Promo terbaik buat liburan irit!')
        ->toContain('Destinasi Wisata Unggulan')
        ->toContain('Jelajah Indotix')
        ->toContain('Tiket wisata lebih mudah, aman, dan praktis');

    expect($heroPosition)
        ->not->toBeFalse();
    expect($wisataPosition)
        ->not->toBeFalse();
    expect($heroPosition)
        ->toBeLessThan($wisataPosition);
});

test('banner upload does not automatically resize images and home avoids dummy banners', function () {
    $createSource = file_get_contents(__DIR__.'/../../resources/js/pages/admin/public/banners/create.tsx');
    $editSource = file_get_contents(__DIR__.'/../../resources/js/pages/admin/public/banners/edit.tsx');
    $homeSource = file_get_contents(__DIR__.'/../../resources/js/pages/welcome.tsx');

    expect(file_exists(__DIR__.'/../../resources/js/lib/banner-image.ts'))->toBeFalse();
    expect($createSource)
        ->not->toContain('prepareBannerImage')
        ->not->toContain('Menyiapkan gambar');
    expect($editSource)
        ->not->toContain('prepareBannerImage')
        ->not->toContain('Menyiapkan gambar');

    expect($homeSource)
        ->not->toContain('aspect-[842/236]')
        ->not->toContain('https://images.unsplash.com')
        ->not->toContain('gradient:')
        ->not->toContain('Lihat semua promo');
});
