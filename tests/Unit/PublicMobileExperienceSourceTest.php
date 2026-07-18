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
    $contentSource = file_get_contents(__DIR__.'/../../app/Support/HomePageContent.php');
    $styles = file_get_contents(__DIR__.'/../../resources/css/app.css');

    expect($home)
        ->toContain('space-y-8 pb-0 font-sans text-slate-800')
        ->toContain('homeContent.search.placeholder')
        ->toContain('homeContent.categories.map')
        ->toContain('homeContent.special_promo.title')
        ->toContain('const [shouldLoadSpecialPromoVideo')
        ->toContain('shouldLoadSpecialPromoVideo &&')
        ->toContain('specialPromoSlots.map')
        ->toContain('preload="metadata"')
        ->toContain('h-[clamp(200px,24vw,360px)]')
        ->toContain('object-fill')
        ->toContain('translate-y-1/2')
        ->toContain('[scrollbar-width:none] [&::-webkit-scrollbar]:hidden')
        ->toContain('const mobileRailClass =')
        ->toContain('w-[72vw] min-w-[16rem]')
        ->toContain('homeContent.featured.title')
        ->toContain('md:grid-cols-4 md:gap-6')
        ->toContain('relative h-28 overflow-hidden bg-slate-100 sm:h-40')
        ->toContain('featuredProducts.map((item)')
        ->toContain('homeContent.nearby.eyebrow')
        ->toContain('homeContent.blog.eyebrow')
        ->not->toContain('Lihat semua promo')
        ->not->toContain('promo-current-grid')
        ->not->toContain('menu-shimmer')
        ->not->toContain('mobileMenuLoading === item.href')
        ->not->toContain('https://images.unsplash.com')
        ->not->toContain('Lihat Semua Wisata')
        ->not->toContain('Lihat Semua Event')
        ->not->toContain('Lihat Semua Hotel')
        ->not->toContain('Lihat Semua →');

    expect($contentSource)
        ->toContain('Cari kota, destinasi, atau tiket wisata...')
        ->toContain('special_promo_video_url')
        ->toContain('special_promo_card_4_image_url')
        ->toContain('category_1_label')
        ->toContain('Destinasi Wisata Unggulan')
        ->toContain('Rekomendasi Terdekat')
        ->toContain('Jelajah Indotix');

    expect($styles)
        ->toContain('.public-shell footer > div:first-child')
        ->toContain('grid-template-columns: repeat(5, minmax(0, 1fr))')
        ->toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
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
        ->toContain('const mobileVoucherRailItemClass =')
        ->toContain('p-3.5 md:p-5')
        ->toContain('text-2xl font-black tracking-tight text-slate-950 md:text-3xl');

    expect($wisata)
        ->toContain('const mobileProductRailClass =')
        ->toContain('className={mobileProductRailClass}')
        ->toContain('className={`border-slate-150/80 flex flex-col');

    expect($promo)
        ->toContain('const mobileVoucherRailClass =')
        ->toContain('const mobilePromoRailClass =')
        ->toContain('className={mobileVoucherRailClass}')
        ->toContain('className={mobilePromoRailClass}')
        ->toContain('text-[10px] font-black tracking-widest text-sky-600 uppercase lg:hidden')
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
