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
        ->with(['roomTypes', 'city', 'images'])
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
            'image_url' => $hotel->images->first()?->image_url ? '/storage/'.$hotel->images->first()->image_url : null,
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

Route::middleware(['auth', 'verified', 'admin', 'admin.log'])->group(function () {
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
    Route::get('admin/mitra-wisata', [\App\Http\Controllers\Admin\MitraWisataController::class, 'index'])
        ->name('admin.mitra-wisata.index');
    Route::get('admin/mitra-wisata/{user}', [\App\Http\Controllers\Admin\MitraWisataController::class, 'show'])
        ->name('admin.mitra-wisata.show');
    Route::post('admin/mitra-wisata/{user}/verify', [\App\Http\Controllers\Admin\MitraWisataController::class, 'verify'])
        ->name('admin.mitra-wisata.verify');
    Route::post('admin/mitra-wisata/{user}/payout', [\App\Http\Controllers\Admin\MitraWisataController::class, 'payout'])
        ->name('admin.mitra-wisata.payout');
    Route::post('admin/mitra-wisata/{user}/suspend', [\App\Http\Controllers\Admin\MitraWisataController::class, 'suspend'])
        ->name('admin.mitra-wisata.suspend');

    Route::get('admin/wisata/destinations', [\App\Http\Controllers\Admin\WisataDestinationController::class, 'index'])
        ->name('admin.wisata.destinations.index');
    Route::get('admin/wisata/destinations/{destination}', [\App\Http\Controllers\Admin\WisataDestinationController::class, 'show'])
        ->name('admin.wisata.destinations.show');
    Route::put('admin/wisata/destinations/{destination}', [\App\Http\Controllers\Admin\WisataDestinationController::class, 'update'])
        ->name('admin.wisata.destinations.update');
    Route::post('admin/wisata/destinations/{destination}/suspend', [\App\Http\Controllers\Admin\WisataDestinationController::class, 'suspend'])
        ->name('admin.wisata.destinations.suspend');

    Route::get('admin/wisata/tickets', [\App\Http\Controllers\Admin\WisataTicketController::class, 'index'])
        ->name('admin.wisata.tickets.index');
    Route::get('admin/wisata/tickets/create', [\App\Http\Controllers\Admin\WisataTicketController::class, 'create'])
        ->name('admin.wisata.tickets.create');
    Route::post('admin/wisata/tickets', [\App\Http\Controllers\Admin\WisataTicketController::class, 'store'])
        ->name('admin.wisata.tickets.store');
    Route::put('admin/wisata/tickets/{ticket}', [\App\Http\Controllers\Admin\WisataTicketController::class, 'update'])
        ->name('admin.wisata.tickets.update');
    Route::delete('admin/wisata/tickets/{ticket}', [\App\Http\Controllers\Admin\WisataTicketController::class, 'destroy'])
        ->name('admin.wisata.tickets.destroy');

    Route::get('admin/bookings', [\App\Http\Controllers\Admin\BookingController::class, 'index'])
        ->name('admin.bookings.index');
    Route::get('admin/bookings/{booking}', [\App\Http\Controllers\Admin\BookingController::class, 'show'])
        ->name('admin.bookings.show');
    Route::post('admin/bookings/{booking}/cancel', [\App\Http\Controllers\Admin\BookingController::class, 'cancel'])
        ->name('admin.bookings.cancel');
    Route::post('admin/bookings/{booking}/refund', [\App\Http\Controllers\Admin\BookingController::class, 'refund'])
        ->name('admin.bookings.refund');
    Route::post('admin/bookings/{booking}/dispute', [\App\Http\Controllers\Admin\BookingController::class, 'dispute'])
        ->name('admin.bookings.dispute');

    Route::get('admin/finance/commissions', [\App\Http\Controllers\Admin\CommissionRuleController::class, 'index'])
        ->name('admin.finance.commissions.index');
    Route::post('admin/finance/commissions', [\App\Http\Controllers\Admin\CommissionRuleController::class, 'store'])
        ->name('admin.finance.commissions.store');
    Route::put('admin/finance/commissions/{commissionRule}', [\App\Http\Controllers\Admin\CommissionRuleController::class, 'update'])
        ->name('admin.finance.commissions.update');
    Route::delete('admin/finance/commissions/{commissionRule}', [\App\Http\Controllers\Admin\CommissionRuleController::class, 'destroy'])
        ->name('admin.finance.commissions.destroy');

    Route::get('admin/finance/payouts', [\App\Http\Controllers\Admin\PayoutController::class, 'index'])
        ->name('admin.payouts.index');
    Route::get('admin/finance/payouts/create', [\App\Http\Controllers\Admin\PayoutController::class, 'create'])
        ->name('admin.payouts.create');
    Route::post('admin/finance/payouts', [\App\Http\Controllers\Admin\PayoutController::class, 'store'])
        ->name('admin.payouts.store');
    Route::post('admin/finance/payouts/{payout}/approve', [\App\Http\Controllers\Admin\PayoutController::class, 'approve'])
        ->name('admin.payouts.approve');
    Route::post('admin/finance/payouts/{payout}/transfer', [\App\Http\Controllers\Admin\PayoutController::class, 'transfer'])
        ->name('admin.payouts.transfer');

    Route::get('admin/finance/reports', [\App\Http\Controllers\Admin\FinanceReportController::class, 'index'])
        ->name('admin.finance.reports.index');

    Route::get('admin/marketing/vouchers', [\App\Http\Controllers\Admin\VoucherController::class, 'index'])
        ->name('admin.vouchers.index');
    Route::post('admin/marketing/vouchers', [\App\Http\Controllers\Admin\VoucherController::class, 'store'])
        ->name('admin.vouchers.store');
    Route::put('admin/marketing/vouchers/{voucher}', [\App\Http\Controllers\Admin\VoucherController::class, 'update'])
        ->name('admin.vouchers.update');
    Route::delete('admin/marketing/vouchers/{voucher}', [\App\Http\Controllers\Admin\VoucherController::class, 'destroy'])
        ->name('admin.vouchers.destroy');

    Route::get('admin/system/audit-logs', [\App\Http\Controllers\Admin\AdminAuditLogController::class, 'index'])
        ->name('admin.audit-logs.index');
    Route::get('admin/system/settings', [\App\Http\Controllers\Admin\SystemSettingController::class, 'index'])
        ->name('admin.system.settings.index');
    Route::post('admin/system/settings', [\App\Http\Controllers\Admin\SystemSettingController::class, 'update'])
        ->name('admin.system.settings.update');
    Route::get('admin/system/notifications', [\App\Http\Controllers\Admin\NotificationControlController::class, 'index'])
        ->name('admin.system.notifications.index');
    Route::post('admin/system/notifications/templates', [\App\Http\Controllers\Admin\NotificationControlController::class, 'storeTemplate'])
        ->name('admin.system.notifications.templates.store');
    Route::put('admin/system/notifications/templates/{template}', [\App\Http\Controllers\Admin\NotificationControlController::class, 'updateTemplate'])
        ->name('admin.system.notifications.templates.update');
    Route::delete('admin/system/notifications/templates/{template}', [\App\Http\Controllers\Admin\NotificationControlController::class, 'destroyTemplate'])
        ->name('admin.system.notifications.templates.destroy');
    Route::put('admin/system/notifications/triggers/{trigger}', [\App\Http\Controllers\Admin\NotificationControlController::class, 'updateTrigger'])
        ->name('admin.system.notifications.triggers.update');

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
    $onboardingType = $request->user()->mitra_onboarding_type;
    $onboarding = null;
    $wisataOnboarding = null;
    if ($onboardingType === 'hotel') {
        $onboarding = \App\Models\MitraOnboarding::query()->firstOrCreate([
            'user_id' => $request->user()->id,
        ]);
    }
    if ($onboardingType === 'wisata') {
        $wisataOnboarding = \App\Models\MitraWisataOnboarding::query()->firstOrCreate([
            'user_id' => $request->user()->id,
        ]);
    }
    $user = $request->user();
    $today = now()->toDateString();
    $monthStart = now()->startOfMonth()->toDateString();
    $monthEnd = now()->endOfMonth()->toDateString();

    $hotelIds = \App\Models\Hotel::query()
        ->where('vendor_id', $user->id)
        ->pluck('id');

    $todayBookings = \App\Models\Booking::query()
        ->whereIn('hotel_id', $hotelIds)
        ->whereIn('status', ['paid', 'completed'])
        ->whereDate('check_in', '<=', $today)
        ->whereDate('check_out', '>', $today)
        ->count();

    $monthlyRevenue = (int) \App\Models\Booking::query()
        ->whereIn('hotel_id', $hotelIds)
        ->whereIn('status', ['paid', 'completed'])
        ->where('payment_status', '!=', 'refunded')
        ->whereDate('check_out', '>=', $monthStart)
        ->whereDate('check_out', '<=', $monthEnd)
        ->sum('total');

    $totalRooms = (int) \App\Models\RoomType::query()
        ->whereIn('hotel_id', $hotelIds)
        ->sum('total_rooms');

    $roomsBookedToday = (int) \App\Models\Booking::query()
        ->whereIn('hotel_id', $hotelIds)
        ->whereIn('status', ['paid', 'completed'])
        ->whereDate('check_in', '<=', $today)
        ->whereDate('check_out', '>', $today)
        ->sum('rooms_count');

    $availableRooms = max(0, $totalRooms - $roomsBookedToday);

    return Inertia::render('mitra/dashboard', [
        'onboarding' => $onboarding,
        'wisataOnboarding' => $wisataOnboarding,
        'onboardingType' => $onboardingType,
        'stats' => [
            'reservations_today' => $todayBookings,
            'monthly_revenue' => $monthlyRevenue,
            'available_rooms' => $availableRooms,
        ],
    ]);
})->middleware(['auth', 'verified', 'mitra'])->name('mitra.dashboard');

Route::middleware(['auth', 'verified', 'mitra'])->group(function () {
    Route::post('mitra/onboarding/type', [\App\Http\Controllers\MitraOnboardingController::class, 'selectType'])
        ->name('mitra.onboarding.type');
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

    Route::get('mitra/wisata/onboarding', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'show'])
        ->name('mitra.wisata.onboarding');
    Route::patch('mitra/wisata/onboarding/step-1', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'updateStepOne'])
        ->name('mitra.wisata.onboarding.step1');
    Route::post('mitra/wisata/onboarding/step-1', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'updateStepOne'])
        ->name('mitra.wisata.onboarding.step1.post');
    Route::patch('mitra/wisata/onboarding/step-2', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'updateStepTwo'])
        ->name('mitra.wisata.onboarding.step2');
    Route::post('mitra/wisata/onboarding/step-2', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'updateStepTwo'])
        ->name('mitra.wisata.onboarding.step2.post');
    Route::patch('mitra/wisata/onboarding/step-3', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'updateStepThree'])
        ->name('mitra.wisata.onboarding.step3');
    Route::post('mitra/wisata/onboarding/step-3', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'updateStepThree'])
        ->name('mitra.wisata.onboarding.step3.post');
    Route::post('mitra/wisata/onboarding/submit-verification', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'submitVerification'])
        ->name('mitra.wisata.onboarding.submitVerification');
    Route::post('mitra/wisata/onboarding/submit-payout', [\App\Http\Controllers\MitraWisataOnboardingController::class, 'submitPayout'])
        ->name('mitra.wisata.onboarding.submitPayout');
});

Route::prefix('mitra')
    ->name('mitra.')
    ->middleware(['auth', 'verified', 'mitra', 'mitra.verified'])
    ->group(function () {
        Route::resource('hotels', \App\Http\Controllers\Mitra\HotelController::class)->except(['show']);
        Route::delete('hotels/{hotel}/images/{hotelImage}', [\App\Http\Controllers\Mitra\HotelController::class, 'destroyImage'])
            ->name('hotels.images.destroy');
        Route::resource('room-types', \App\Http\Controllers\Mitra\RoomTypeController::class);
        Route::delete('room-types/{roomType}/images/{roomImage}', [\App\Http\Controllers\Mitra\RoomTypeController::class, 'destroyImage'])
            ->name('room-types.images.destroy');
        Route::delete('room-inventories/bulk', [\App\Http\Controllers\Mitra\RoomInventoryController::class, 'bulkDestroy'])
            ->name('room-inventories.bulk-destroy');
        Route::resource('room-inventories', \App\Http\Controllers\Mitra\RoomInventoryController::class)->except(['show']);
        Route::get('bookings', [\App\Http\Controllers\Mitra\BookingController::class, 'index'])
            ->name('bookings.index');
        Route::get('bookings/{booking}', [\App\Http\Controllers\Mitra\BookingController::class, 'show'])
            ->name('bookings.show');
        Route::post('bookings/{booking}/cancel', [\App\Http\Controllers\Mitra\BookingController::class, 'cancel'])
            ->name('bookings.cancel');
        Route::post('bookings/{booking}/stay-status', [\App\Http\Controllers\Mitra\BookingController::class, 'updateStayStatus'])
            ->name('bookings.stay-status');
        Route::patch('bookings/{booking}/notes', [\App\Http\Controllers\Mitra\BookingController::class, 'updateNotes'])
            ->name('bookings.notes');
        Route::post('bookings/{booking}/refund', [\App\Http\Controllers\Mitra\BookingController::class, 'refund'])
            ->name('bookings.refund');
        Route::post('bookings/{booking}/dispute', [\App\Http\Controllers\Mitra\BookingController::class, 'dispute'])
            ->name('bookings.dispute');
        Route::get('occupancy', [\App\Http\Controllers\Mitra\OccupancyController::class, 'index'])
            ->name('occupancy.index');
        Route::get('finance/summary', [\App\Http\Controllers\Mitra\FinanceSummaryController::class, 'index'])
            ->name('finance.summary');
        Route::get('finance/payouts', [\App\Http\Controllers\Mitra\PayoutController::class, 'index'])
            ->name('finance.payouts');
        Route::get('finance/bank', [\App\Http\Controllers\Mitra\BankAccountController::class, 'edit'])
            ->name('finance.bank.edit');
        Route::patch('finance/bank', [\App\Http\Controllers\Mitra\BankAccountController::class, 'update'])
            ->name('finance.bank.update');
    });

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('hotels', \App\Http\Controllers\HotelController::class)->except(['show']);
    Route::resource('room-types', \App\Http\Controllers\RoomTypeController::class);
    Route::delete('room-inventories/bulk', [\App\Http\Controllers\RoomInventoryController::class, 'bulkDestroy'])
        ->name('room-inventories.bulk-destroy');
    Route::resource('room-inventories', \App\Http\Controllers\RoomInventoryController::class)->except(['show']);
    Route::delete('room-types/{roomType}/images/{roomImage}', [\App\Http\Controllers\RoomTypeController::class, 'destroyImage'])
        ->name('room-types.images.destroy');
    Route::delete('hotels/{hotel}/images/{hotelImage}', [\App\Http\Controllers\HotelController::class, 'destroyImage'])
        ->name('hotels.images.destroy');
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
    Route::get('/notifications', [\App\Http\Controllers\PublicNotificationController::class, 'index'])
        ->name('public.notifications');
    Route::post('/notifications/read-all', [\App\Http\Controllers\PublicNotificationController::class, 'markAllRead'])
        ->name('public.notifications.readAll');
    Route::post('/notifications/{notification}/read', [\App\Http\Controllers\PublicNotificationController::class, 'markRead'])
        ->name('public.notifications.read');
    Route::get('/history', [\App\Http\Controllers\PublicHistoryController::class, 'index'])
        ->name('public.history');
    Route::get('/booking/review', [\App\Http\Controllers\BookingController::class, 'review'])
        ->name('booking.review');
    Route::post('/booking/confirm', [\App\Http\Controllers\BookingController::class, 'confirm'])
        ->name('booking.confirm');
    Route::post('/booking/voucher', [\App\Http\Controllers\BookingController::class, 'applyVoucher'])
        ->name('booking.voucher.apply');
    Route::post('/booking/voucher/remove', [\App\Http\Controllers\BookingController::class, 'removeVoucher'])
        ->name('booking.voucher.remove');
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
