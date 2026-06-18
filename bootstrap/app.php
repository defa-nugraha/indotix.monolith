<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->alias([
            'mitra' => \App\Http\Middleware\EnsureMitra::class,
            'mitra.verified' => \App\Http\Middleware\EnsureMitraVerified::class,
            'mitra.wisata' => \App\Http\Middleware\EnsureMitraWisata::class,
            'mitra.event' => \App\Http\Middleware\EnsureMitraEvent::class,
            'admin' => \App\Http\Middleware\EnsureAdmin::class,
            'user' => \App\Http\Middleware\EnsureUser::class,
            'affiliate.user' => \App\Http\Middleware\EnsureAffiliateUser::class,
            'admin.log' => \App\Http\Middleware\LogAdminActivity::class,
            'user.activity' => \App\Http\Middleware\LogUserActivity::class,
            'maintenance.transactions' => \App\Http\Middleware\EnsureTransactionsAvailable::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            \App\Http\Middleware\CaptureAffiliateReferral::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
