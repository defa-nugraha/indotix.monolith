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
});

Route::middleware('auth:sanctum')->get('history', [\App\Http\Controllers\Api\HistoryController::class, 'index']);
Route::middleware('auth:sanctum')->get('history/{type}/{booking}', [\App\Http\Controllers\Api\HistoryDetailController::class, 'show']);

Route::middleware('auth:sanctum')->prefix('wisata/bookings')->group(function () {
    Route::post('quote', [\App\Http\Controllers\Api\WisataBookingController::class, 'quote']);
    Route::post('/', [\App\Http\Controllers\Api\WisataBookingController::class, 'store']);
    Route::get('/', [\App\Http\Controllers\Api\WisataBookingController::class, 'index']);
    Route::get('{booking}', [\App\Http\Controllers\Api\WisataBookingController::class, 'show']);
    Route::post('{booking}/pay', [\App\Http\Controllers\Api\WisataBookingController::class, 'pay']);
    Route::post('{booking}/cancel', [\App\Http\Controllers\Api\WisataBookingController::class, 'cancel']);
});
