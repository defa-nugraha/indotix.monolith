<?php

use App\Models\PublicBanner;
use App\Services\PublicContentCache;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Predis\Client;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'api_cache.enabled' => true,
        'api_cache.store' => 'array',
    ]);

    Cache::store('array')->flush();
});

test('public API responses are cached and support etag validation', function () {
    $first = $this->getJson('/api/discovery/metadata')
        ->assertOk()
        ->assertHeader('X-Cache', 'MISS');

    $etag = $first->headers->get('ETag');
    expect($etag)->not->toBeNull();

    $this->getJson('/api/discovery/metadata')
        ->assertOk()
        ->assertHeader('X-Cache', 'HIT')
        ->assertHeader('ETag', $etag);

    $this->withHeader('If-None-Match', $etag)
        ->getJson('/api/discovery/metadata')
        ->assertNotModified()
        ->assertHeader('X-Cache', 'HIT');
});

test('public API cache is bypassed when an authorization header is present', function () {
    $this->withToken('authenticated-request')
        ->getJson('/api/discovery/metadata')
        ->assertOk()
        ->assertHeaderMissing('X-Cache');
});

test('public product APIs use the shared cache without changing their response', function (string $uri) {
    $first = $this->getJson($uri)
        ->assertOk()
        ->assertHeader('X-Cache', 'MISS');

    $this->getJson($uri)
        ->assertOk()
        ->assertHeader('X-Cache', 'HIT')
        ->assertExactJson($first->json());
})->with([
    'wisata' => '/api/products/wisata',
]);

test('public API cache is invalidated after related content changes', function () {
    PublicBanner::query()->create([
        'title' => 'Banner Redis Pertama',
        'image_path' => 'banners/redis-pertama.jpg',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $this->getJson('/api/banners')
        ->assertOk()
        ->assertHeader('X-Cache', 'MISS')
        ->assertJsonFragment(['title' => 'Banner Redis Pertama']);

    $this->getJson('/api/banners')
        ->assertOk()
        ->assertHeader('X-Cache', 'HIT');

    PublicBanner::query()->create([
        'title' => 'Banner Redis Kedua',
        'image_path' => 'banners/redis-kedua.jpg',
        'is_active' => true,
        'sort_order' => 2,
    ]);

    $this->getJson('/api/banners')
        ->assertOk()
        ->assertHeader('X-Cache', 'MISS')
        ->assertJsonFragment(['title' => 'Banner Redis Kedua']);
});

test('application cache reuses computed public content', function () {
    $calls = 0;
    $cache = app(PublicContentCache::class);

    $first = $cache->remember('web:test:payload', 60, function () use (&$calls) {
        $calls++;

        return ['value' => 'cached'];
    });
    $second = $cache->remember('web:test:payload', 60, function () use (&$calls) {
        $calls++;

        return ['value' => 'recomputed'];
    });

    expect($first)->toBe(['value' => 'cached'])
        ->and($second)->toBe(['value' => 'cached'])
        ->and($calls)->toBe(1);
});

test('redis runtime store can write and read data when redis is available', function () {
    expect(class_exists(Client::class))->toBeTrue();

    $key = 'tests:redis:'.str()->uuid();

    try {
        Cache::store('redis')->put($key, 'connected', 30);
        expect(Cache::store('redis')->get($key))->toBe('connected');
    } catch (Throwable $exception) {
        $this->markTestSkipped('Redis server is not available: '.$exception->getMessage());
    } finally {
        try {
            Cache::store('redis')->forget($key);
        } catch (Throwable) {
            // The connection failure is already reported as a skipped integration test.
        }
    }
});
