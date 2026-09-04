<?php

test('public home product surface prioritizes wisata', function () {
    $source = file_get_contents(__DIR__.'/../../resources/js/pages/welcome.tsx');
    $contentSource = file_get_contents(__DIR__.'/../../app/Support/HomePageContent.php');
    $heroPosition = strpos($source, 'visibleBannerSlides.map');
    $wisataPosition = strpos($source, 'id="featured-destinations-section"');

    expect($source)
        ->toContain("label: 'Wisata'")
        ->toContain("href: '/wisata'")
        ->toContain('title="Indotix - Pesan Tiket Wisata dan Destinasi Rekreasi"')
        ->toContain("'query-input': 'required name=search_term_string'")
        ->toContain('type CategoryProductSection')
        ->toContain('bannerCategoryLabels.map')
        ->toContain('visibleBannerSlides.map')
        ->toContain('activeBanner')
        ->toContain('getBannerSlideStyle')
        ->toContain('sideBannerSlideWidth')
        ->toContain("clamp(40rem, 78vw, 78rem)")
        ->toContain('w-[clamp(44rem,86vw,84rem)]')
        ->toContain('PublicPartOfSection')
        ->toContain('left-1/2 mt-0 w-screen -translate-x-1/2 overflow-hidden bg-white')
        ->toContain('setActiveBannerIndex')
        ->toContain('window.setInterval')
        ->toContain('autoPlay')
        ->toContain('muted')
        ->toContain('loop')
        ->toContain('preload="auto"')
        ->toContain('playableSpecialPromoSecondaryVideoUrl')
        ->toContain('aspect-[1920/960]')
        ->toContain('aspect-[4/5]')
        ->toContain('aspect-[16/5]')
        ->toContain('specialPromoSlots')
        ->toContain('specialPromoImageCards[index % specialPromoImageCards.length]')
        ->toContain('renderSpecialPromoImageSlot')
        ->toContain('h-full w-full min-h-[150px]')
        ->toContain('categorySections.map((section)')
        ->toContain('section.products.map((item)')
        ->toContain('id="featured-destinations-section"')
        ->toContain('homeContent.featured.title')
        ->toContain('wisataProducts.slice(0, 3)')
        ->toContain('fallbackSource.slice(0, 3)')
        ->toContain('featuredProducts.map((item)')
        ->toContain('nearbyProducts.map((item)')
        ->toContain('homeContent.blog.eyebrow')
        ->toContain('Baca artikel')
        ->toContain('mb-10 sm:mb-14')
        ->not->toContain('homeContent.categories.map')
        ->not->toContain('homeContent.coupon.title')
        ->not->toContain('homeContent.promo.title')
        ->not->toContain('homeContent.trust.title')
        ->not->toContain('Wisata Pantai')
        ->not->toContain('Desa Wisata Lestari')
        ->not->toContain('Taman Edukasi');

    expect($contentSource)
        ->toContain('Cari kota, destinasi, atau tiket wisata...')
        ->toContain("'category_5_label' => 'Wahana'")
        ->not->toContain("'category_5_label' => 'Desa Wisata'")
        ->toContain('category_1_label')
        ->toContain('Kupon Diskon 12% untuk Pengguna Baru')
        ->toContain('Promo terbaik buat liburan irit!')
        ->toContain('special_promo_video_2_url')
        ->toContain('publicPartOfLogos')
        ->toContain('Destinasi Wisata Unggulan')
        ->toContain('Jelajah Indotix')
        ->toContain('Tiket wisata lebih mudah, aman, dan praktis');

    expect($contentSource)
        ->not->toContain('40 tahun')
        ->not->toContain('part_of_stat_');

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
        ->toContain('visibleBannerSlides.map')
        ->toContain('bannerCategoryLabels.map')
        ->toContain('getBannerSlideStyle')
        ->toContain('sideBannerSlideWidth')
        ->toContain("clamp(40rem, 78vw, 78rem)")
        ->toContain('w-[clamp(44rem,86vw,84rem)]')
        ->toContain('window.setInterval')
        ->not->toContain('aspect-[842/236]')
        ->not->toContain('grid-cols-2 grid-rows-[1fr_1fr]')
        ->not->toContain('getBannerSlideTransform')
        ->not->toContain('w-[24vw] min-w-[17rem]')
        ->not->toContain('https://images.unsplash.com')
        ->not->toContain('gradient:')
        ->toContain('slide.imageUrl')
        ->not->toContain('Lihat semua promo');
});
