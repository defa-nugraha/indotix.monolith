<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\RegionController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use App\Http\Controllers\Settings\UserAddressController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'user'])->group(function () {
    Route::post('settings/addresses', [UserAddressController::class, 'store'])
        ->name('profile.addresses.store');
    Route::patch('settings/addresses/{address}', [UserAddressController::class, 'update'])
        ->name('profile.addresses.update');
    Route::patch('settings/addresses/{address}/default', [UserAddressController::class, 'setDefault'])
        ->name('profile.addresses.default');
    Route::delete('settings/addresses/{address}', [UserAddressController::class, 'destroy'])
        ->name('profile.addresses.destroy');

    Route::get('settings/regions/villages', [RegionController::class, 'villages'])
        ->name('profile.regions.villages');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');
});

Route::middleware(['auth', 'verified', 'user'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');
});
