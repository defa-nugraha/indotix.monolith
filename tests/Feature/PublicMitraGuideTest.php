<?php

use App\Http\Controllers\PublicMitraGuideController;

it('registers a public mitra guide route without authentication', function () {
    $route = app('router')->getRoutes()->getByName('public.guides.mitra');

    expect($route->uri())->toBe('panduan/mitra')
        ->and($route->getActionName())->toBe(PublicMitraGuideController::class)
        ->and($route->gatherMiddleware())->not->toContain('auth');
});

it('serves the built html guide without publishing internal documentation', function () {
    $response = app(PublicMitraGuideController::class)();
    $html = file_get_contents($response->getFile()->getPathname());

    expect($response->headers->get('Content-Type'))->toBe('text/html; charset=UTF-8')
        ->and($html)->toContain('USER GUIDE', '/guides/mitra/assets/', 'href="#registrasi"')
        ->and(is_file(public_path('guides/mitra/KNOWN_ISSUES.md')))->toBeFalse()
        ->and(is_file(public_path('guides/mitra/tools/fixtures.php')))->toBeFalse();
});
