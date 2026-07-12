<?php

use App\Http\Controllers\Api\AdminNotificationController;
use App\Http\Controllers\Api\AffiliateController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\DiscoveryController;
use App\Http\Controllers\Api\HistoryController;
use App\Http\Controllers\Api\HistoryDetailController;
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
    Route::get('global/suggestions', [DiscoveryController::class, 'globalSuggestions'])
        ->middleware('api.public-cache:120');
    Route::get('metadata', [DiscoveryController::class, 'metadata'])
        ->middleware('api.public-cache:3600');
    Route::get('{type}', [DiscoveryController::class, 'index'])
        ->where('type', 'wisata');
    Route::get('{type}/suggestions', [DiscoveryController::class, 'suggestions'])
        ->middleware('api.public-cache:120')
        ->where('type', 'wisata');
    Route::get('{type}/filters', [DiscoveryController::class, 'filters'])
        ->middleware('api.public-cache:300')
        ->where('type', 'wisata');
});

Route::prefix('products')->middleware('api.public-cache:30')->group(function () {
    Route::get('wisata', [WisataController::class, 'index']);
    Route::get('wisata/{destination}', [WisataController::class, 'show']);
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

Route::get('banners', [PublicBannerController::class, 'index'])
    ->middleware('api.public-cache:300');
Route::get('faqs', [PublicFaqController::class, 'index'])
    ->middleware('api.public-cache:300');
Route::get('privacy-policy', [PublicPrivacyPolicyController::class, 'show'])
    ->middleware('api.public-cache:300');

Route::middleware(['auth:sanctum', 'verified'])->prefix('chat')->group(function () {
    Route::get('conversations', [ChatController::class, 'index']);
    Route::post('start', [ChatController::class, 'start']);
    Route::get('conversations/{conversation}', [ChatController::class, 'show']);
    Route::get('conversations/{conversation}/messages', [ChatController::class, 'messages']);
    Route::post('conversations/{conversation}/messages', [ChatController::class, 'store']);
    Route::post('conversations/{conversation}/read', [ChatController::class, 'markRead']);
});
