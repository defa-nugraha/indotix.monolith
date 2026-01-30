<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified', 'admin'])->name('dashboard');

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

require __DIR__.'/settings.php';
