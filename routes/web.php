<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    $banners = \App\Models\PublicBanner::query()
        ->where('is_active', true)
        ->orderBy('sort_order')
        ->orderByDesc('id')
        ->get();
    $promoVideo = \App\Models\PromoVideo::query()
        ->where('is_active', true)
        ->latest()
        ->first();
    $promoItems = \App\Models\PromoItem::query()
        ->where('is_active', true)
        ->orderBy('sort_order')
        ->orderByDesc('id')
        ->take(3)
        ->get();
    $contact = \App\Models\PublicContact::query()->first();
    $partners = \App\Models\PublicPartner::query()
        ->where('is_active', true)
        ->orderBy('sort_order')
        ->orderByDesc('id')
        ->get();
    $hotelCards = \App\Models\Hotel::query()
        ->where('status', 'active')
        ->with(['roomTypes', 'city'])
        ->latest()
        ->take(3)
        ->get()
        ->map(fn (\App\Models\Hotel $hotel) => [
            'id' => $hotel->id,
            'encrypted_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $hotel->id),
            'name' => $hotel->name,
            'city_name' => $hotel->city?->name,
            'star_rating' => $hotel->star_rating,
            'min_price' => $hotel->roomTypes->min('base_price')
                ? (int) round($hotel->roomTypes->min('base_price'))
                : null,
        ]);

    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'banners' => $banners,
        'promoVideo' => $promoVideo,
        'promoItems' => $promoItems,
        'contact' => $contact,
        'partners' => $partners,
        'hotelCards' => $hotelCards,
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified', 'admin'])->name('dashboard');

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('admin/mitra', [\App\Http\Controllers\Admin\MitraController::class, 'index'])
        ->name('admin.mitra.index');
    Route::get('admin/mitra/{user}', [\App\Http\Controllers\Admin\MitraController::class, 'show'])
        ->name('admin.mitra.show');
    Route::post('admin/mitra/{user}/verify', [\App\Http\Controllers\Admin\MitraController::class, 'verify'])
        ->name('admin.mitra.verify');
    Route::post('admin/mitra/{user}/payout', [\App\Http\Controllers\Admin\MitraController::class, 'payout'])
        ->name('admin.mitra.payout');
    Route::post('admin/mitra/{user}/suspend', [\App\Http\Controllers\Admin\MitraController::class, 'suspend'])
        ->name('admin.mitra.suspend');

    Route::get('admin/public/banners', [\App\Http\Controllers\Admin\PublicBannerController::class, 'index'])
        ->name('admin.public.banners.index');
    Route::get('admin/public/banners/create', [\App\Http\Controllers\Admin\PublicBannerController::class, 'create'])
        ->name('admin.public.banners.create');
    Route::post('admin/public/banners', [\App\Http\Controllers\Admin\PublicBannerController::class, 'store'])
        ->name('admin.public.banners.store');
    Route::get('admin/public/banners/{banner}/edit', [\App\Http\Controllers\Admin\PublicBannerController::class, 'edit'])
        ->name('admin.public.banners.edit');
    Route::put('admin/public/banners/{banner}', [\App\Http\Controllers\Admin\PublicBannerController::class, 'update'])
        ->name('admin.public.banners.update');
    Route::delete('admin/public/banners/{banner}', [\App\Http\Controllers\Admin\PublicBannerController::class, 'destroy'])
        ->name('admin.public.banners.destroy');

    Route::get('admin/public/promo-videos', [\App\Http\Controllers\Admin\PromoVideoController::class, 'index'])
        ->name('admin.public.promo-videos.index');
    Route::get('admin/public/promo-videos/create', [\App\Http\Controllers\Admin\PromoVideoController::class, 'create'])
        ->name('admin.public.promo-videos.create');
    Route::post('admin/public/promo-videos', [\App\Http\Controllers\Admin\PromoVideoController::class, 'store'])
        ->name('admin.public.promo-videos.store');
    Route::get('admin/public/promo-videos/{promoVideo}/edit', [\App\Http\Controllers\Admin\PromoVideoController::class, 'edit'])
        ->name('admin.public.promo-videos.edit');
    Route::put('admin/public/promo-videos/{promoVideo}', [\App\Http\Controllers\Admin\PromoVideoController::class, 'update'])
        ->name('admin.public.promo-videos.update');
    Route::delete('admin/public/promo-videos/{promoVideo}', [\App\Http\Controllers\Admin\PromoVideoController::class, 'destroy'])
        ->name('admin.public.promo-videos.destroy');

    Route::get('admin/public/promo-items', [\App\Http\Controllers\Admin\PromoItemController::class, 'index'])
        ->name('admin.public.promo-items.index');
    Route::get('admin/public/promo-items/create', [\App\Http\Controllers\Admin\PromoItemController::class, 'create'])
        ->name('admin.public.promo-items.create');
    Route::post('admin/public/promo-items', [\App\Http\Controllers\Admin\PromoItemController::class, 'store'])
        ->name('admin.public.promo-items.store');
    Route::get('admin/public/promo-items/{promoItem}/edit', [\App\Http\Controllers\Admin\PromoItemController::class, 'edit'])
        ->name('admin.public.promo-items.edit');
    Route::put('admin/public/promo-items/{promoItem}', [\App\Http\Controllers\Admin\PromoItemController::class, 'update'])
        ->name('admin.public.promo-items.update');
    Route::delete('admin/public/promo-items/{promoItem}', [\App\Http\Controllers\Admin\PromoItemController::class, 'destroy'])
        ->name('admin.public.promo-items.destroy');
    Route::get('admin/public/partners', [\App\Http\Controllers\Admin\PublicPartnerController::class, 'index'])
        ->name('admin.public.partners.index');
    Route::get('admin/public/partners/create', [\App\Http\Controllers\Admin\PublicPartnerController::class, 'create'])
        ->name('admin.public.partners.create');
    Route::post('admin/public/partners', [\App\Http\Controllers\Admin\PublicPartnerController::class, 'store'])
        ->name('admin.public.partners.store');
    Route::get('admin/public/partners/{partner}/edit', [\App\Http\Controllers\Admin\PublicPartnerController::class, 'edit'])
        ->name('admin.public.partners.edit');
    Route::put('admin/public/partners/{partner}', [\App\Http\Controllers\Admin\PublicPartnerController::class, 'update'])
        ->name('admin.public.partners.update');
    Route::delete('admin/public/partners/{partner}', [\App\Http\Controllers\Admin\PublicPartnerController::class, 'destroy'])
        ->name('admin.public.partners.destroy');

    Route::get('admin/public/contacts', [\App\Http\Controllers\Admin\PublicContactController::class, 'edit'])
        ->name('admin.public.contacts.edit');
    Route::put('admin/public/contacts', [\App\Http\Controllers\Admin\PublicContactController::class, 'update'])
        ->name('admin.public.contacts.update');
});

Route::get('mitra/dashboard', function (\Illuminate\Http\Request $request) {
    $onboarding = \App\Models\MitraOnboarding::query()->firstOrCreate([
        'user_id' => $request->user()->id,
    ]);

    return Inertia::render('mitra/dashboard', [
        'onboarding' => $onboarding,
    ]);
})->middleware(['auth', 'verified', 'mitra'])->name('mitra.dashboard');

Route::middleware(['auth', 'verified', 'mitra'])->group(function () {
    Route::get('mitra/onboarding', [\App\Http\Controllers\MitraOnboardingController::class, 'show'])
        ->name('mitra.onboarding');
    Route::patch('mitra/onboarding/step-1', [\App\Http\Controllers\MitraOnboardingController::class, 'updateStepOne'])
        ->name('mitra.onboarding.step1');
    Route::patch('mitra/onboarding/step-2', [\App\Http\Controllers\MitraOnboardingController::class, 'updateStepTwo'])
        ->name('mitra.onboarding.step2');
    Route::post('mitra/onboarding/step-2', [\App\Http\Controllers\MitraOnboardingController::class, 'updateStepTwo'])
        ->name('mitra.onboarding.step2.post');
    Route::patch('mitra/onboarding/step-3', [\App\Http\Controllers\MitraOnboardingController::class, 'updateStepThree'])
        ->name('mitra.onboarding.step3');
    Route::post('mitra/onboarding/submit-verification', [\App\Http\Controllers\MitraOnboardingController::class, 'submitVerification'])
        ->name('mitra.onboarding.submitVerification');
    Route::post('mitra/onboarding/submit-payout', [\App\Http\Controllers\MitraOnboardingController::class, 'submitPayout'])
        ->name('mitra.onboarding.submitPayout');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('hotels', \App\Http\Controllers\HotelController::class)->except(['show']);
    Route::resource('room-types', \App\Http\Controllers\RoomTypeController::class);
    Route::resource('room-inventories', \App\Http\Controllers\RoomInventoryController::class)->except(['show']);
    Route::delete('room-types/{roomType}/images/{roomImage}', [\App\Http\Controllers\RoomTypeController::class, 'destroyImage'])
        ->name('room-types.images.destroy');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/email/otp', [\App\Http\Controllers\EmailOtpController::class, 'show'])
        ->name('email-otp.notice');
    Route::post('/email/otp', [\App\Http\Controllers\EmailOtpController::class, 'verify'])
        ->name('email-otp.verify');
    Route::post('/email/otp/resend', [\App\Http\Controllers\EmailOtpController::class, 'resend'])
        ->name('email-otp.resend');
});

Route::get('/stay', [\App\Http\Controllers\PublicHotelController::class, 'search'])
    ->name('public.hotels.search');
Route::get('/stay/hotels/{hotel}', [\App\Http\Controllers\PublicHotelController::class, 'show'])
    ->name('public.hotels.show');
Route::post('/booking/prepare', [\App\Http\Controllers\BookingController::class, 'prepare'])
    ->name('booking.prepare');
Route::middleware(['auth', 'verified', 'user'])->group(function () {
    Route::get('/history', [\App\Http\Controllers\PublicHistoryController::class, 'index'])
        ->name('public.history');
    Route::get('/booking/review', [\App\Http\Controllers\BookingController::class, 'review'])
        ->name('booking.review');
    Route::post('/booking/confirm', [\App\Http\Controllers\BookingController::class, 'confirm'])
        ->name('booking.confirm');
    Route::get('/booking/{booking}/payment', [\App\Http\Controllers\BookingController::class, 'payment'])
        ->name('booking.payment');
    Route::post('/booking/{booking}/payment', [\App\Http\Controllers\BookingController::class, 'pay'])
        ->name('booking.pay');
    Route::post('/booking/{booking}/cancel', [\App\Http\Controllers\BookingController::class, 'cancel'])
        ->name('booking.cancel');
    Route::get('/booking/{booking}/invoice', [\App\Http\Controllers\BookingController::class, 'invoice'])
        ->name('booking.invoice');
    Route::get('/booking/{booking}', [\App\Http\Controllers\BookingController::class, 'show'])
        ->name('booking.show');
});
Route::post('/payments/midtrans/callback', \App\Http\Controllers\MidtransCallbackController::class)
    ->name('payments.midtrans.callback');

require __DIR__.'/settings.php';
