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
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('hotels', \App\Http\Controllers\HotelController::class)->except(['show']);
    Route::resource('room-types', \App\Http\Controllers\RoomTypeController::class);
    Route::resource('room-inventories', \App\Http\Controllers\RoomInventoryController::class)->except(['show']);
    Route::delete('room-types/{roomType}/images/{roomImage}', [\App\Http\Controllers\RoomTypeController::class, 'destroyImage'])
        ->name('room-types.images.destroy');
});

require __DIR__.'/settings.php';
