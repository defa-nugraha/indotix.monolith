<?php

use App\Http\Controllers\Api\AcademyBookingController;
use App\Http\Controllers\Api\AcademyController;
use App\Http\Controllers\Api\AdminNotificationController;
use App\Http\Controllers\Api\AffiliateController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\DiscoveryController;
use App\Http\Controllers\Api\EventBookingController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\HistoryController;
use App\Http\Controllers\Api\HistoryDetailController;
use App\Http\Controllers\Api\HotelBookingController;
use App\Http\Controllers\Api\HotelController;
use App\Http\Controllers\Api\MobileErrorLogController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OtpController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PublicBannerController;
use App\Http\Controllers\Api\PublicFaqController;
use App\Http\Controllers\Api\PublicPrivacyPolicyController;
use App\Http\Controllers\Api\PushTokenController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\SouvenirBookingController;
use App\Http\Controllers\Api\SouvenirCartController;
use App\Http\Controllers\Api\SouvenirController;
use App\Http\Controllers\Api\SpecialProgramBookingController;
use App\Http\Controllers\Api\SpecialProgramController;
use App\Http\Controllers\Api\WisataBookingController;
use App\Http\Controllers\Api\WisataController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');
    Route::post('google', [SocialAuthController::class, 'google']);
    Route::post('password/forgot', [PasswordResetController::class, 'requestOtp']);
    Route::post('password/reset', [PasswordResetController::class, 'reset']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('otp/verify', [OtpController::class, 'verify']);
        Route::post('otp/resend', [OtpController::class, 'resend']);
    });
});

Route::post('mobile/errors', [MobileErrorLogController::class, 'store'])
    ->middleware('throttle:30,1');

Route::prefix('discovery')->group(function () {
    Route::get('global/suggestions', [DiscoveryController::class, 'globalSuggestions']);
    Route::get('metadata', [DiscoveryController::class, 'metadata']);
    Route::get('{type}', [DiscoveryController::class, 'index'])
        ->where('type', 'events|hotels|wisata|academy|special-programs|souvenirs');
    Route::get('{type}/suggestions', [DiscoveryController::class, 'suggestions'])
        ->where('type', 'events|hotels|wisata|academy|special-programs|souvenirs');
    Route::get('{type}/filters', [DiscoveryController::class, 'filters'])
        ->where('type', 'events|hotels|wisata|academy|special-programs|souvenirs');
});

Route::prefix('products')->group(function () {
    Route::get('hotels', [HotelController::class, 'index']);
    Route::get('hotels/{hotel}', [HotelController::class, 'show']);

    Route::get('wisata', [WisataController::class, 'index']);
    Route::get('wisata/{destination}', [WisataController::class, 'show']);

    Route::get('events', [EventController::class, 'index']);
    Route::get('events/{event}', [EventController::class, 'show']);

    Route::get('academy', [AcademyController::class, 'index']);
    Route::get('academy/{class}', [AcademyController::class, 'show']);

    Route::get('souvenirs', [SouvenirController::class, 'index']);
    Route::get('souvenirs/{product}', [SouvenirController::class, 'show']);

    Route::get('special-programs', [SpecialProgramController::class, 'index']);
    Route::get('special-programs/{program}', [SpecialProgramController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'verified'])->prefix('hotel/bookings')->group(function () {
    Route::post('quote', [HotelBookingController::class, 'quote'])->middleware('maintenance.transactions');
    Route::post('/', [HotelBookingController::class, 'store'])->middleware('maintenance.transactions');
    Route::get('/', [HotelBookingController::class, 'index']);
    Route::get('{booking}', [HotelBookingController::class, 'show']);
    Route::post('{booking}/pay', [HotelBookingController::class, 'pay'])->middleware('maintenance.transactions');
    Route::post('{booking}/cancel', [HotelBookingController::class, 'cancel']);
    Route::get('{booking}/invoice', [HotelBookingController::class, 'invoice']);
});

Route::middleware(['auth:sanctum', 'verified'])->get('history', [HistoryController::class, 'index']);
Route::middleware(['auth:sanctum', 'verified'])->get('history/{type}/{booking}', [HistoryDetailController::class, 'show']);
Route::middleware(['auth:sanctum', 'verified'])->prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('read-all', [NotificationController::class, 'markAllRead']);
    Route::post('{notification}/read', [NotificationController::class, 'markRead']);
});
Route::middleware(['auth:sanctum', 'verified'])->prefix('push')->group(function () {
    Route::post('tokens', [PushTokenController::class, 'store']);
    Route::post('tokens/revoke', [PushTokenController::class, 'revoke']);
});

Route::middleware('auth:sanctum')->prefix('profile')->group(function () {
    Route::put('/', [ProfileController::class, 'update']);
    Route::get('addresses', [ProfileController::class, 'addresses']);
    Route::post('addresses', [ProfileController::class, 'storeAddress']);
    Route::put('addresses/{address}', [ProfileController::class, 'updateAddress']);
    Route::post('addresses/{address}/default', [ProfileController::class, 'setDefaultAddress']);
    Route::delete('addresses/{address}', [ProfileController::class, 'destroyAddress']);
    Route::post('password/otp', [ProfileController::class, 'sendPasswordOtp']);
    Route::put('password', [ProfileController::class, 'updatePassword']);
    Route::delete('/', [ProfileController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'verified', 'api.admin'])->prefix('admin')->group(function () {
    Route::post('notifications', [AdminNotificationController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'verified'])->prefix('affiliate')->group(function () {
    Route::get('overview', [AffiliateController::class, 'overview']);
    Route::get('destinations', [AffiliateController::class, 'destinations']);
    Route::post('register', [AffiliateController::class, 'register']);
    Route::get('profile', [AffiliateController::class, 'profile']);
    Route::put('profile', [AffiliateController::class, 'updateProfile']);
    Route::get('links', [AffiliateController::class, 'links']);
    Route::post('links', [AffiliateController::class, 'createLink']);
    Route::get('catalog', [AffiliateController::class, 'catalog']);
    Route::get('commissions', [AffiliateController::class, 'commissions']);
    Route::get('payouts', [AffiliateController::class, 'payouts']);
    Route::post('payouts', [AffiliateController::class, 'requestPayout']);
});

Route::middleware(['auth:sanctum', 'verified'])->prefix('reviews')->group(function () {
    Route::get('/', [ReviewController::class, 'index']);
    Route::post('/', [ReviewController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'verified'])->prefix('wisata/bookings')->group(function () {
    Route::post('quote', [WisataBookingController::class, 'quote'])->middleware('maintenance.transactions');
    Route::post('/', [WisataBookingController::class, 'store'])->middleware('maintenance.transactions');
    Route::get('/', [WisataBookingController::class, 'index']);
    Route::get('{booking}', [WisataBookingController::class, 'show']);
    Route::post('{booking}/pay', [WisataBookingController::class, 'pay'])->middleware('maintenance.transactions');
    Route::post('{booking}/cancel', [WisataBookingController::class, 'cancel']);
    Route::get('{booking}/ticket', [WisataBookingController::class, 'ticket']);
});

Route::middleware(['auth:sanctum', 'verified'])->prefix('events/bookings')->group(function () {
    Route::post('quote', [EventBookingController::class, 'quote'])->middleware('maintenance.transactions');
    Route::post('/', [EventBookingController::class, 'store'])->middleware('maintenance.transactions');
    Route::get('/', [EventBookingController::class, 'index']);
    Route::get('{booking}', [EventBookingController::class, 'show']);
    Route::post('{booking}/pay', [EventBookingController::class, 'pay'])->middleware('maintenance.transactions');
    Route::post('{booking}/cancel', [EventBookingController::class, 'cancel']);
});

Route::middleware(['auth:sanctum', 'verified'])->prefix('special-programs/bookings')->group(function () {
    Route::post('quote', [SpecialProgramBookingController::class, 'quote'])->middleware('maintenance.transactions');
    Route::post('/', [SpecialProgramBookingController::class, 'store'])->middleware('maintenance.transactions');
    Route::get('/', [SpecialProgramBookingController::class, 'index']);
    Route::get('{booking}', [SpecialProgramBookingController::class, 'show']);
    Route::post('{booking}/pay', [SpecialProgramBookingController::class, 'pay'])->middleware('maintenance.transactions');
    Route::post('{booking}/cancel', [SpecialProgramBookingController::class, 'cancel']);
});

Route::middleware(['auth:sanctum', 'verified'])->prefix('souvenir/orders')->group(function () {
    Route::post('quote', [SouvenirBookingController::class, 'quote'])->middleware('maintenance.transactions');
    Route::post('/', [SouvenirBookingController::class, 'store'])->middleware('maintenance.transactions');
    Route::get('/', [SouvenirBookingController::class, 'index']);
    Route::get('{order}', [SouvenirBookingController::class, 'show']);
    Route::post('{order}/pay', [SouvenirBookingController::class, 'pay'])->middleware('maintenance.transactions');
});

Route::middleware(['auth:sanctum', 'verified'])->prefix('souvenir/cart')->group(function () {
    Route::get('/', [SouvenirCartController::class, 'index']);
    Route::post('add', [SouvenirCartController::class, 'add']);
    Route::post('update', [SouvenirCartController::class, 'update']);
    Route::post('remove', [SouvenirCartController::class, 'remove']);
    Route::post('clear', [SouvenirCartController::class, 'clear']);
});

Route::middleware(['auth:sanctum', 'verified'])->prefix('academy/bookings')->group(function () {
    Route::post('quote', [AcademyBookingController::class, 'quote'])->middleware('maintenance.transactions');
    Route::post('/', [AcademyBookingController::class, 'store'])->middleware('maintenance.transactions');
    Route::get('/', [AcademyBookingController::class, 'index']);
    Route::get('{booking}', [AcademyBookingController::class, 'show']);
    Route::post('{booking}/pay', [AcademyBookingController::class, 'pay'])->middleware('maintenance.transactions');
    Route::post('{booking}/cancel', [AcademyBookingController::class, 'cancel']);
    Route::get('{booking}/ticket', [AcademyBookingController::class, 'ticket']);
    Route::get('{booking}/qr', [AcademyBookingController::class, 'qr']);
});

Route::get('banners', [PublicBannerController::class, 'index']);
Route::get('faqs', [PublicFaqController::class, 'index']);
Route::get('privacy-policy', [PublicPrivacyPolicyController::class, 'show']);

Route::middleware(['auth:sanctum', 'verified'])->prefix('chat')->group(function () {
    Route::get('conversations', [ChatController::class, 'index']);
    Route::post('start', [ChatController::class, 'start']);
    Route::get('conversations/{conversation}', [ChatController::class, 'show']);
    Route::get('conversations/{conversation}/messages', [ChatController::class, 'messages']);
    Route::post('conversations/{conversation}/messages', [ChatController::class, 'store']);
    Route::post('conversations/{conversation}/read', [ChatController::class, 'markRead']);
});
