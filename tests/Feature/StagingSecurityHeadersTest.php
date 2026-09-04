<?php

use App\Http\Middleware\AddSecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

it('marks staging responses as not indexable without applying the header in production', function () {
    $application = app(Application::class);
    $originalEnvironment = $application->environment();
    $middleware = new AddSecurityHeaders;

    $application->detectEnvironment(fn () => 'staging');
    $staging = $middleware->handle(Request::create('/'), fn () => new Response('ok'));

    $application->detectEnvironment(fn () => 'production');
    $production = $middleware->handle(Request::create('/'), fn () => new Response('ok'));

    $application->detectEnvironment(fn () => $originalEnvironment);

    expect($staging->headers->get('X-Robots-Tag'))->toBe('noindex, nofollow')
        ->and($production->headers->has('X-Robots-Tag'))->toBeFalse();
});
