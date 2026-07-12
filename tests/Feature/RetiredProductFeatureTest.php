<?php

use App\Http\Middleware\BlockRetiredProductFeatures;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

it('blocks retired non wisata product paths', function (string $path): void {
    $middleware = new BlockRetiredProductFeatures;
    $request = Request::create('/'.$path);

    expect(fn () => $middleware->handle($request, fn () => response('ok')))
        ->toThrow(NotFoundHttpException::class);
})->with([
    'stay',
    'events',
    'academy',
    'special-programs',
    'retail-shop/cart',
    'booking/review',
    'tour-guide/dashboard',
    'admin/events',
    'admin/academy/classes',
    'admin/mitra',
    'admin/tour-guides',
    'hotels',
    'mitra/events',
    'mitra/onboarding',
    'api/hotel/bookings',
    'api/products/event',
]);

it('keeps wisata related paths available', function (string $path): void {
    $middleware = new BlockRetiredProductFeatures;
    $request = Request::create('/'.$path);
    $response = $middleware->handle($request, fn () => response('ok'));

    expect($response->getContent())->toBe('ok');
})->with([
    'wisata',
    'wisata/parai-bangka',
    'wisata/booking/review',
    'admin/wisata/destinations',
    'admin/mitra-wisata',
    'admin/mitra-documents',
    'mitra/wisata/tickets',
    'mitra/wisata/finance/summary',
    'api/wisata/bookings',
    'api/products/wisata',
]);
