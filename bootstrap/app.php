<?php

use App\Http\Middleware\AddSecurityHeaders;
use App\Http\Middleware\CaptureAffiliateReferral;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureAffiliateUser;
use App\Http\Middleware\EnsureApiAdmin;
use App\Http\Middleware\EnsureMitra;
use App\Http\Middleware\EnsureMitraEvent;
use App\Http\Middleware\EnsureMitraVerified;
use App\Http\Middleware\EnsureMitraWisata;
use App\Http\Middleware\EnsureTransactionsAvailable;
use App\Http\Middleware\EnsureUser;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\LogAdminActivity;
use App\Http\Middleware\LogUserActivity;
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
            'mitra' => EnsureMitra::class,
            'mitra.verified' => EnsureMitraVerified::class,
            'mitra.wisata' => EnsureMitraWisata::class,
            'mitra.event' => EnsureMitraEvent::class,
            'admin' => EnsureAdmin::class,
            'user' => EnsureUser::class,
            'affiliate.user' => EnsureAffiliateUser::class,
            'admin.log' => LogAdminActivity::class,
            'api.admin' => EnsureApiAdmin::class,
            'user.activity' => LogUserActivity::class,
            'maintenance.transactions' => EnsureTransactionsAvailable::class,
        ]);

        $middleware->append(AddSecurityHeaders::class);

        $middleware->web(append: [
            HandleAppearance::class,
            CaptureAffiliateReferral::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
