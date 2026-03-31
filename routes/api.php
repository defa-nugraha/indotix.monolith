<?php

use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [\App\Http\Controllers\Api\AuthController::class, 'register']);
    Route::post('login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
    Route::post('google', [\App\Http\Controllers\Api\SocialAuthController::class, 'google']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [\App\Http\Controllers\Api\AuthController::class, 'me']);
        Route::post('logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);
        Route::post('otp/verify', [\App\Http\Controllers\Api\OtpController::class, 'verify']);
        Route::post('otp/resend', [\App\Http\Controllers\Api\OtpController::class, 'resend']);
    });
});

Route::prefix('products')->group(function () {
    Route::get('hotels', [\App\Http\Controllers\Api\HotelController::class, 'index']);
    Route::get('hotels/{hotel}', [\App\Http\Controllers\Api\HotelController::class, 'show']);

    Route::get('wisata', [\App\Http\Controllers\Api\WisataController::class, 'index']);
    Route::get('wisata/{destination}', [\App\Http\Controllers\Api\WisataController::class, 'show']);

    Route::get('events', [\App\Http\Controllers\Api\EventController::class, 'index']);
    Route::get('events/{event}', [\App\Http\Controllers\Api\EventController::class, 'show']);

    Route::get('academy', [\App\Http\Controllers\Api\AcademyController::class, 'index']);
    Route::get('academy/{class}', [\App\Http\Controllers\Api\AcademyController::class, 'show']);

    Route::get('souvenirs', [\App\Http\Controllers\Api\SouvenirController::class, 'index']);
    Route::get('souvenirs/{product}', [\App\Http\Controllers\Api\SouvenirController::class, 'show']);

    Route::get('special-programs', [\App\Http\Controllers\Api\SpecialProgramController::class, 'index']);
    Route::get('special-programs/{program}', [\App\Http\Controllers\Api\SpecialProgramController::class, 'show']);
});

Route::middleware('auth:sanctum')->prefix('hotel/bookings')->group(function () {
    Route::post('quote', [\App\Http\Controllers\Api\HotelBookingController::class, 'quote']);
    Route::post('/', [\App\Http\Controllers\Api\HotelBookingController::class, 'store']);
    Route::get('/', [\App\Http\Controllers\Api\HotelBookingController::class, 'index']);
    Route::get('{booking}', [\App\Http\Controllers\Api\HotelBookingController::class, 'show']);
    Route::post('{booking}/pay', [\App\Http\Controllers\Api\HotelBookingController::class, 'pay']);
    Route::post('{booking}/cancel', [\App\Http\Controllers\Api\HotelBookingController::class, 'cancel']);
    Route::get('{booking}/invoice', [\App\Http\Controllers\Api\HotelBookingController::class, 'invoice']);
});

Route::middleware('auth:sanctum')->get('history', [\App\Http\Controllers\Api\HistoryController::class, 'index']);
Route::middleware('auth:sanctum')->get('history/{type}/{booking}', [\App\Http\Controllers\Api\HistoryDetailController::class, 'show']);
Route::middleware('auth:sanctum')->prefix('notifications')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::get('unread-count', [\App\Http\Controllers\Api\NotificationController::class, 'unreadCount']);
    Route::post('read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllRead']);
    Route::post('{notification}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markRead']);
});
Route::middleware('auth:sanctum')->prefix('push')->group(function () {
    Route::post('tokens', [\App\Http\Controllers\Api\PushTokenController::class, 'store']);
    Route::post('tokens/revoke', [\App\Http\Controllers\Api\PushTokenController::class, 'revoke']);
});

Route::middleware('auth:sanctum')->prefix('profile')->group(function () {
    Route::put('/', [\App\Http\Controllers\Api\ProfileController::class, 'update']);
    Route::post('password/otp', [\App\Http\Controllers\Api\ProfileController::class, 'sendPasswordOtp']);
    Route::put('password', [\App\Http\Controllers\Api\ProfileController::class, 'updatePassword']);
});

Route::middleware('auth:sanctum')->prefix('reviews')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ReviewController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\ReviewController::class, 'store']);
});

Route::middleware('auth:sanctum')->prefix('wisata/bookings')->group(function () {
    Route::post('quote', [\App\Http\Controllers\Api\WisataBookingController::class, 'quote']);
    Route::post('/', [\App\Http\Controllers\Api\WisataBookingController::class, 'store']);
    Route::get('/', [\App\Http\Controllers\Api\WisataBookingController::class, 'index']);
    Route::get('{booking}', [\App\Http\Controllers\Api\WisataBookingController::class, 'show']);
    Route::post('{booking}/pay', [\App\Http\Controllers\Api\WisataBookingController::class, 'pay']);
    Route::post('{booking}/cancel', [\App\Http\Controllers\Api\WisataBookingController::class, 'cancel']);
    Route::get('{booking}/ticket', [\App\Http\Controllers\Api\WisataBookingController::class, 'ticket']);
});

Route::middleware('auth:sanctum')->prefix('events/bookings')->group(function () {
    Route::post('quote', [\App\Http\Controllers\Api\EventBookingController::class, 'quote']);
    Route::post('/', [\App\Http\Controllers\Api\EventBookingController::class, 'store']);
    Route::get('/', [\App\Http\Controllers\Api\EventBookingController::class, 'index']);
    Route::get('{booking}', [\App\Http\Controllers\Api\EventBookingController::class, 'show']);
    Route::post('{booking}/pay', [\App\Http\Controllers\Api\EventBookingController::class, 'pay']);
    Route::post('{booking}/cancel', [\App\Http\Controllers\Api\EventBookingController::class, 'cancel']);
});

Route::middleware('auth:sanctum')->prefix('special-programs/bookings')->group(function () {
    Route::post('quote', [\App\Http\Controllers\Api\SpecialProgramBookingController::class, 'quote']);
    Route::post('/', [\App\Http\Controllers\Api\SpecialProgramBookingController::class, 'store']);
    Route::get('/', [\App\Http\Controllers\Api\SpecialProgramBookingController::class, 'index']);
    Route::get('{booking}', [\App\Http\Controllers\Api\SpecialProgramBookingController::class, 'show']);
    Route::post('{booking}/pay', [\App\Http\Controllers\Api\SpecialProgramBookingController::class, 'pay']);
    Route::post('{booking}/cancel', [\App\Http\Controllers\Api\SpecialProgramBookingController::class, 'cancel']);
});

Route::middleware('auth:sanctum')->prefix('souvenir/orders')->group(function () {
    Route::post('quote', [\App\Http\Controllers\Api\SouvenirBookingController::class, 'quote']);
    Route::post('/', [\App\Http\Controllers\Api\SouvenirBookingController::class, 'store']);
    Route::get('/', [\App\Http\Controllers\Api\SouvenirBookingController::class, 'index']);
    Route::get('{order}', [\App\Http\Controllers\Api\SouvenirBookingController::class, 'show']);
    Route::post('{order}/pay', [\App\Http\Controllers\Api\SouvenirBookingController::class, 'pay']);
});

Route::middleware('auth:sanctum')->prefix('souvenir/cart')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\SouvenirCartController::class, 'index']);
    Route::post('add', [\App\Http\Controllers\Api\SouvenirCartController::class, 'add']);
    Route::post('update', [\App\Http\Controllers\Api\SouvenirCartController::class, 'update']);
    Route::post('remove', [\App\Http\Controllers\Api\SouvenirCartController::class, 'remove']);
    Route::post('clear', [\App\Http\Controllers\Api\SouvenirCartController::class, 'clear']);
});

Route::middleware('auth:sanctum')->prefix('academy/bookings')->group(function () {
    Route::post('quote', [\App\Http\Controllers\Api\AcademyBookingController::class, 'quote']);
    Route::post('/', [\App\Http\Controllers\Api\AcademyBookingController::class, 'store']);
    Route::get('/', [\App\Http\Controllers\Api\AcademyBookingController::class, 'index']);
    Route::get('{booking}', [\App\Http\Controllers\Api\AcademyBookingController::class, 'show']);
    Route::post('{booking}/pay', [\App\Http\Controllers\Api\AcademyBookingController::class, 'pay']);
    Route::post('{booking}/cancel', [\App\Http\Controllers\Api\AcademyBookingController::class, 'cancel']);
    Route::get('{booking}/ticket', [\App\Http\Controllers\Api\AcademyBookingController::class, 'ticket']);
    Route::get('{booking}/qr', [\App\Http\Controllers\Api\AcademyBookingController::class, 'qr']);
});

Route::get('banners', [\App\Http\Controllers\Api\PublicBannerController::class, 'index']);
Route::get('faqs', [\App\Http\Controllers\Api\PublicFaqController::class, 'index']);
Route::get('privacy-policy', [\App\Http\Controllers\Api\PublicPrivacyPolicyController::class, 'show']);

Route::middleware('auth:sanctum')->prefix('chat')->group(function () {
    Route::get('conversations', [\App\Http\Controllers\Api\ChatController::class, 'index']);
    Route::post('start', [\App\Http\Controllers\Api\ChatController::class, 'start']);
    Route::get('conversations/{conversation}', [\App\Http\Controllers\Api\ChatController::class, 'show']);
    Route::get('conversations/{conversation}/messages', [\App\Http\Controllers\Api\ChatController::class, 'messages']);
    Route::post('conversations/{conversation}/messages', [\App\Http\Controllers\Api\ChatController::class, 'store']);
    Route::post('conversations/{conversation}/read', [\App\Http\Controllers\Api\ChatController::class, 'markRead']);
});
