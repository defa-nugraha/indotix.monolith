<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function discoveryWisataDestination(bool $isLive, string $name): MitraWisataOnboarding
{
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => User::factory()->create(['role' => 'mitra'])->id,
        'current_step' => 3,
        'destination_name' => $name,
        'destination_type' => 'alam',
        'city_name' => 'Bandung',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => $isLive,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);

    WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket '.$name,
        'price' => 50000,
        'quota' => 100,
        'daily_quota' => 100,
        'is_active' => true,
        'is_closed' => false,
    ]);

    return $destination;
}

test('discovery metadata exposes only wisata product type', function () {
    $this->getJson('/api/discovery/metadata')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'wisata')
        ->assertJsonStructure([
            'data' => [
                ['type', 'label', 'listing_url', 'suggestions_url', 'filters_url', 'sorts', 'popular_keywords'],
            ],
        ]);
});

test('wisata discovery listing respects live status and search filters', function () {
    $live = discoveryWisataDestination(true, 'Wisata Alam Bandung');
    $draft = discoveryWisataDestination(false, 'Wisata Draft Bandung');

    $this->getJson('/api/discovery/wisata?q=Bandung&per_page=5')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.title', $live->destination_name)
        ->assertJsonMissing(['title' => $draft->destination_name])
        ->assertJsonPath('meta.applied_filters.q', 'Bandung');
});

test('non wisata discovery type is not available', function () {
    $this->getJson('/api/discovery/events')->assertNotFound();
    $this->getJson('/api/discovery/souvenirs')->assertNotFound();
    $this->getJson('/api/discovery/academy/suggestions')->assertNotFound();
});

test('wisata discovery suggestions fallback to contextual keywords', function () {
    $this->getJson('/api/discovery/wisata/suggestions')
        ->assertOk()
        ->assertJsonPath('data.0.type', 'keyword')
        ->assertJsonStructure([
            'data' => [
                ['type', 'label', 'value'],
            ],
            'meta' => ['type', 'q', 'limit'],
        ]);
});

test('wisata discovery invalid sort falls back and oversized per page is rejected', function () {
    $this->getJson('/api/discovery/wisata?sort=unknown')
        ->assertOk()
        ->assertJsonPath('meta.applied_filters.sort', null);

    $this->getJson('/api/discovery/wisata?per_page=100')
        ->assertStatus(422);
});
