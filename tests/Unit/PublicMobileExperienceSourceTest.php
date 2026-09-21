<?php

test('public mobile navigation adapts to guests and user accounts', function () {
    $navigation = file_get_contents(__DIR__.'/../../resources/js/components/public-mobile-navigation.tsx');
    $layout = file_get_contents(__DIR__.'/../../resources/js/layouts/public-layout.tsx');

    expect($navigation)
        ->toContain("const isUser = role === 'user'")
        ->toContain("label: 'Destinasi'")
        ->toContain("label: 'Jelajah'")
        ->toContain("label: 'Tentang'")
        ->toContain("label: 'Riwayat'")
        ->toContain("label: 'Profil'")
        ->toContain('const [loadingHref, setLoadingHref] = useState<string | null>(null)')
        ->toContain('LoaderCircle')
        ->toContain('animate-spin')
        ->not->toContain("label: 'Masuk'")
        ->not->toContain("label: 'Event'")
        ->not->toContain("label: 'Hotel'")
        ->not->toContain('LogIn')
        ->toContain("!isUser && 'is-public'");

    expect($layout)
        ->toContain('const showMobileNavigation = !auth?.user || isUser')
        ->toContain('showMobileNavigation && <PublicMobileNavigation />');
});

test('public home follows the tourism design without dummy promo rails', function () {
    $home = file_get_contents(__DIR__.'/../../resources/js/pages/welcome.tsx');
    $adminHome = file_get_contents(__DIR__.'/../../resources/js/pages/admin/public/home/edit.tsx');
    $contentSource = file_get_contents(__DIR__.'/../../app/Support/HomePageContent.php');
    $styles = file_get_contents(__DIR__.'/../../resources/css/app.css');

    expect($home)
        ->toContain('space-y-8 pb-0 font-sans text-slate-800')
        ->toContain('const companyName = contact?.company_name?.trim() || \'Indotix\'')
        ->toContain('bannerCategoryLabels.map')
        ->toContain('visibleBannerSlides.map')
        ->toContain('activeBanner')
        ->toContain('getBannerSlideStyle')
        ->toContain('sideBannerSlideWidth')
        ->toContain("clamp(40rem, 78vw, 78rem)")
        ->toContain('w-[clamp(44rem,86vw,84rem)]')
        ->toContain('PublicPartOfSection')
        ->toContain('left-1/2 mt-0 w-screen -translate-x-1/2 overflow-hidden bg-white')
        ->toContain('window.setInterval')
        ->toContain('homeContent.special_promo.title')
        ->toContain('autoPlay')
        ->toContain('muted')
        ->toContain('loop')
        ->toContain('preload="auto"')
        ->toContain('isVideoMediaUrl(specialPromoVideoPosterUrl)')
        ->toContain('playableSpecialPromoSecondaryVideoUrl')
        ->toContain('specialPromoSlots')
        ->toContain('specialPromoImageCards[index % specialPromoImageCards.length]')
        ->toContain('.slice(0, 2)')
        ->toContain('aspect-[1920/960]')
        ->toContain('aspect-[4/5]')
        ->toContain('aspect-[16/5]')
        ->toContain('renderSpecialPromoImageSlot')
        ->toContain('group relative block min-h-[132px]')
        ->toContain('h-full w-full min-h-[150px]')
        ->toContain('homeContent.part_of?.logos')
        ->toContain('categorySections.map((section)')
        ->toContain('section.products.map((item)')
        ->toContain('[scrollbar-width:none]')
        ->toContain('[&::-webkit-scrollbar]:hidden')
        ->toContain('const mobileRailClass =')
        ->toContain('w-[72vw] min-w-[16rem]')
        ->toContain('wisataProducts.slice(0, 3)')
        ->toContain('homeContent.featured.title')
        ->toContain('md:grid-cols-3 md:gap-6')
        ->toContain('relative h-32 overflow-hidden bg-slate-100 sm:h-44 lg:h-48')
        ->toContain("'Tiket belum tersedia'")
        ->toContain('lg:aspect-[2.1/1]')
        ->toContain('lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]')
        ->toContain('lg:grid-rows-[minmax(0,1.7fr)_minmax(0,1fr)]')
        ->toContain('featuredProducts.map((item)')
        ->toContain('homeContent.nearby.eyebrow')
        ->toContain('homeContent.blog.eyebrow')
        ->toContain('Baca artikel')
        ->toContain('mb-10 sm:mb-14')
        ->toContain('<PublicFooter contact={contact} className="mt-0" />')
        ->not->toContain('absolute top-6 left-1/4 -rotate-12 animate-bounce')
        ->not->toContain('Lihat semua promo')
        ->not->toContain('homeContent.categories.map')
        ->not->toContain('homeContent.coupon.title')
        ->not->toContain('homeContent.promo.title')
        ->not->toContain('homeContent.trust.title')
        ->not->toContain('promo-current-grid')
        ->not->toContain('grid-cols-2 grid-rows-[1fr_1fr]')
        ->not->toContain('getBannerSlideTransform')
        ->not->toContain('w-[24vw] min-w-[17rem]')
        ->not->toContain('menu-shimmer')
        ->not->toContain('mobileMenuLoading === item.href')
        ->not->toContain('https://images.unsplash.com')
        ->not->toContain('Lihat Semua Wisata')
        ->not->toContain('Lihat Semua Event')
        ->not->toContain('Lihat Semua Hotel')
        ->not->toContain('Lihat Semua →');

    expect($contentSource)
        ->toContain('Cari kota, destinasi, atau tiket wisata...')
        ->toContain("'TreePalm' => 'Tropis / Pantai'")
        ->toContain('special_promo_video_url')
        ->toContain('special_promo_video_2_url')
        ->toContain('special_promo_card_3_image_url')
        ->not->toContain('special_promo_card_4_image_url')
        ->toContain('category_1_label')
        ->toContain('Destinasi Wisata Unggulan')
        ->toContain('Rekomendasi Terdekat')
        ->toContain('Jelajah Indotix');

    expect($adminHome)
        ->toContain('Pilih icon kategori')
        ->toContain('activeIconField')
        ->toContain('adminHomeIconMap')
        ->toContain("type: 'media'")
        ->toContain('video/mp4,video/webm,video/ogg')
        ->toContain('Keunggulan publik')
        ->not->toContain('Placeholder pencarian')
        ->not->toContain('Teks tombol pencarian')
        ->not->toContain('Kupon pengguna baru')
        ->not->toContain('Promo terbaik');

    expect($styles)
        ->toContain('.public-shell footer > div:first-child')
        ->toContain('grid-template-columns: repeat(5, minmax(0, 1fr))')
        ->toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');

    $publicSections = file_get_contents(__DIR__.'/../../resources/js/components/public-page-sections.tsx');

    expect($publicSections)
        ->toContain('const companyName = contact?.company_name?.trim() || \'Indotix\'')
        ->toContain('{companyName}');
});

test('retail cart is removed from the public mobile drawer', function () {
    $header = file_get_contents(__DIR__.'/../../resources/js/components/public-header.tsx');

    expect($header)
        ->toContain('<SheetContent side="left" className="w-72">')
        ->toContain('className="hidden border-t border-slate-100 bg-white/90 md:block"')
        ->toContain('ml-auto flex items-center gap-2 md:hidden')
        ->toContain('inline-flex h-12 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm transition hover:bg-sky-700 md:hidden')
        ->not->toContain('<div className="mt-3 md:hidden">{renderSearch()}</div>')
        ->not->toContain('href="/retail-shop/cart"')
        ->not->toContain('ShoppingCart')
        ->not->toContain('showCart = !isNonUser')
        ->not->toContain('aria-label="Keranjang"');
});

test('login and register pages keep only the form card on auth screens', function () {
    $login = file_get_contents(__DIR__.'/../../resources/js/pages/auth/login.tsx');
    $register = file_get_contents(__DIR__.'/../../resources/js/pages/auth/register.tsx');

    expect($login)
        ->not->toContain('Portal Tiket Digital')
        ->not->toContain('Kelola pengalaman tiket digital')
        ->toContain('max-w-md flex-col items-center justify-center')
        ->toContain('Selamat datang kembali');

    expect($register)
        ->not->toContain('Buat akun baru untuk akses tiket digital')
        ->not->toContain('Support Lokal')
        ->toContain('max-w-md flex-col items-center justify-center')
        ->toContain('Buat akun Indotix');
});

test('public listing pages keep mobile card layouts compact and paginated', function () {
    $home = file_get_contents(__DIR__.'/../../resources/js/pages/welcome.tsx');
    $wisata = file_get_contents(__DIR__.'/../../resources/js/pages/public/wisata/search.tsx');
    $promo = file_get_contents(__DIR__.'/../../resources/js/pages/public/promo/index.tsx');
    $blog = file_get_contents(__DIR__.'/../../resources/js/pages/public/blog/index.tsx');
    $blogController = file_get_contents(__DIR__.'/../../app/Http/Controllers/PublicBlogController.php');
    $header = file_get_contents(__DIR__.'/../../resources/js/components/public-header.tsx');

    expect($home)
        ->toContain('categorySections.map((section)')
        ->toContain('section.products.map((item)')
        ->not->toContain('const mobileVoucherRailItemClass =')
        ->not->toContain('h-[12.75rem] overflow-hidden rounded-[1.4rem]');

    expect($wisata)
        ->toContain('const mobileProductRailClass =')
        ->toContain('className={mobileProductRailClass}')
        ->toContain('className={`border-slate-150/80 flex flex-col');

    expect($promo)
        ->toContain('const mobileVoucherRailClass =')
        ->toContain('const mobilePromoRailClass =')
        ->toContain('className={mobileVoucherRailClass}')
        ->toContain('className={mobilePromoRailClass}')
        ->toContain('text-[11px] font-black tracking-widest text-sky-600 uppercase lg:hidden')
        ->toContain('mt-3 hidden space-y-1 text-xs font-medium text-slate-500');

    expect($blog)
        ->toContain('const mobileBlogGridClass =')
        ->toContain('grid grid-cols-[repeat(2,minmax(0,1fr))]')
        ->toContain('Pagination artikel')
        ->toContain('paginationLabel(link.label)');

    expect($blogController)
        ->toContain('->paginate(10)')
        ->toContain('->withQueryString()');

    expect($header)
        ->toContain('href="/login"')
        ->toContain('Masuk');
});
