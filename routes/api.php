<?php

use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [\App\Http\Controllers\Api\AuthController::class, 'register']);
    Route::post('login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
    Route::post('google', [\App\Http\Controllers\Api\SocialAuthController::class, 'google']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [\App\Http\Controllers\Api\AuthController::class, 'me']);
        Route::post('logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);
    });
});
