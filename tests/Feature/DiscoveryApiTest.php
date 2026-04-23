<?php

use App\Models\Event;
use App\Models\EventTicket;
use App\Models\SouvenirCategory;
use App\Models\SouvenirProduct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

test('discovery metadata exposes supported product types', function () {
    $this->getJson('/api/discovery/metadata')
        ->assertOk()
        ->assertJsonPath('data.0.type', 'events')
        ->assertJsonStructure([
            'data' => [
                ['type', 'label', 'listing_url', 'suggestions_url', 'filters_url', 'sorts', 'popular_keywords'],
            ],
        ]);
});

test('event discovery listing respects published status and grouped search filters', function () {
    $organizerId = DB::table('event_organizers')->insertGetId([
        'name' => 'Organizer Test',
        'status' => 'verified',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $published = Event::query()->create([
        'event_organizer_id' => $organizerId,
        'event_type' => 'event',
        'title' => 'Konser Musik Test',
        'description' => 'Event publik untuk discovery',
        'location' => 'Jakarta',
        'status' => 'published',
        'published_at' => now(),
        'start_at' => now()->addDays(3),
        'capacity_total' => 100,
        'capacity_sold' => 10,
    ]);

    EventTicket::query()->create([
        'event_id' => $published->id,
        'name' => 'Gratis',
        'price' => 0,
        'is_active' => true,
        'quota' => 50,
        'sold_count' => 5,
    ]);

    $draft = Event::query()->create([
        'event_organizer_id' => $organizerId,
        'event_type' => 'event',
        'title' => 'Konser Draft Test',
        'status' => 'draft',
        'start_at' => now()->addDays(2),
    ]);

    EventTicket::query()->create([
        'event_id' => $draft->id,
        'name' => 'Gratis',
        'price' => 0,
        'is_active' => true,
        'quota' => 50,
    ]);

    $this->getJson('/api/discovery/events?q=Konser&price_type=free&sort=upcoming&per_page=5')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.title', 'Konser Musik Test')
        ->assertJsonMissing(['title' => 'Konser Draft Test'])
        ->assertJsonPath('meta.applied_filters.q', 'Konser')
        ->assertJsonPath('meta.applied_filters.price_type', 'free');
});

test('souvenir discovery keeps active filters grouped when searching name or sku', function () {
    $category = SouvenirCategory::query()->create([
        'name' => 'Merchandise',
        'is_active' => true,
    ]);

    SouvenirProduct::query()->create([
        'category_id' => $category->id,
        'name' => 'Kaos Aktif',
        'price' => 150000,
        'sku' => 'SKU-AKTIF-001',
        'status' => 'active',
        'is_active' => true,
        'stock' => 10,
        'min_stock' => 1,
    ]);

    SouvenirProduct::query()->create([
        'category_id' => $category->id,
        'name' => 'Kaos Nonaktif',
        'price' => 150000,
        'sku' => 'SKU-AKTIF-002',
        'status' => 'draft',
        'is_active' => false,
        'stock' => 10,
        'min_stock' => 1,
    ]);

    $this->getJson('/api/discovery/souvenirs?q=SKU-AKTIF&stock_status=in_stock')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.title', 'Kaos Aktif')
        ->assertJsonMissing(['title' => 'Kaos Nonaktif']);
});

test('discovery suggestions fallback to contextual keywords', function () {
    $this->getJson('/api/discovery/academy/suggestions')
        ->assertOk()
        ->assertJsonPath('data.0.type', 'keyword')
        ->assertJsonStructure([
            'data' => [
                ['type', 'label', 'value'],
            ],
            'meta' => ['type', 'q', 'limit'],
        ]);
});

test('discovery invalid sort falls back and oversized per page is rejected', function () {
    $this->getJson('/api/discovery/souvenirs?sort=unknown')
        ->assertOk()
        ->assertJsonPath('meta.applied_filters.sort', null);

    $this->getJson('/api/discovery/souvenirs?per_page=100')
        ->assertStatus(422);
});
