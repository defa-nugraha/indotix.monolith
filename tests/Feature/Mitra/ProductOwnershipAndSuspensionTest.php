<?php

use App\Models\Event;
use App\Models\EventOrganizer;
use App\Models\Hotel;
use App\Models\MitraEventOnboarding;
use App\Models\MitraOnboarding;
use App\Models\MitraWisataOnboarding;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

function mitraProductTestCity(): string
{
    DB::table('provinces')->updateOrInsert(
        ['code' => '32'],
        ['name' => 'Jawa Barat'],
    );

    DB::table('regencies')->updateOrInsert(
        ['code' => '3273'],
        [
            'province_code' => '32',
            'name' => 'Bandung',
            'type' => 'Kota',
        ],
    );

    return '3273';
}

function verifiedHotelMitraForProductTest(string $email): User
{
    $user = User::factory()->create([
        'name' => 'Mitra Hotel',
        'email' => $email,
        'role' => 'mitra',
        'mitra_onboarding_type' => 'hotel',
        'email_verified_at' => now(),
    ]);

    MitraOnboarding::query()->create([
        'user_id' => $user->id,
        'current_step' => 3,
        'verification_status' => 'verified',
        'payout_status' => 'verified',
    ]);

    return $user;
}

function verifiedEventMitraForProductTest(string $email): array
{
    $user = User::factory()->create([
        'name' => 'Mitra Event',
        'email' => $email,
        'role' => 'mitra',
        'mitra_onboarding_type' => 'event',
        'email_verified_at' => now(),
    ]);

    MitraEventOnboarding::query()->create([
        'user_id' => $user->id,
        'current_step' => 4,
        'verification_status' => 'verified',
        'eo_name' => 'EO Test',
    ]);

    $organizer = EventOrganizer::query()->create([
        'user_id' => $user->id,
        'name' => 'EO Test',
        'email' => $user->email,
        'status' => 'verified',
    ]);

    return [$user, $organizer];
}

it('rejects hotel partner product creation for another mitra id or suspended status', function () {
    $cityId = mitraProductTestCity();
    $mitra = verifiedHotelMitraForProductTest('hotel-owner-rule@indotix.test');
    $otherMitra = verifiedHotelMitraForProductTest('hotel-other-rule@indotix.test');

    $payload = [
        'vendor_id' => (string) $otherMitra->id,
        'name' => 'Hotel Salah Mitra',
        'city_id' => $cityId,
        'address' => 'Jl. Test',
        'status' => 'active',
    ];

    $this->actingAs($mitra)
        ->post('/mitra/hotels', $payload)
        ->assertSessionHasErrors('vendor_id');

    $this->actingAs($mitra)
        ->post('/mitra/hotels', array_merge($payload, [
            'vendor_id' => (string) $mitra->id,
            'status' => 'suspended',
        ]))
        ->assertSessionHasErrors('status');

    expect(Hotel::query()->where('vendor_id', $mitra->id)->exists())->toBeFalse();
});

it('blocks hotel partner from updating suspended hotel product', function () {
    $cityId = mitraProductTestCity();
    $mitra = verifiedHotelMitraForProductTest('hotel-suspended-rule@indotix.test');

    $hotel = Hotel::query()->create([
        'vendor_id' => $mitra->id,
        'name' => 'Hotel Dikunci',
        'city_id' => $cityId,
        'address' => 'Jl. Test',
        'status' => 'suspended',
    ]);

    $this->actingAs($mitra)
        ->put("/mitra/hotels/{$hotel->id}", [
            'vendor_id' => (string) $mitra->id,
            'name' => 'Hotel Diubah',
            'city_id' => $cityId,
            'address' => 'Jl. Update',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('status');

    expect($hotel->refresh())
        ->name->toBe('Hotel Dikunci')
        ->status->toBe('suspended');
});

it('rejects wisata ticket creation for another destination id', function () {
    $owner = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);
    $other = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);

    $ownedDestination = MitraWisataOnboarding::query()->create([
        'user_id' => $owner->id,
        'destination_name' => 'Wisata Owner',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_suspended' => false,
    ]);
    $otherDestination = MitraWisataOnboarding::query()->create([
        'user_id' => $other->id,
        'destination_name' => 'Wisata Lain',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_suspended' => false,
    ]);

    $this->actingAs($owner)
        ->post('/mitra/wisata/tickets', [
            'mitra_wisata_onboarding_id' => $otherDestination->id,
            'name' => 'Tiket Salah Destinasi',
            'price' => 50000,
            'quota' => 10,
            'ticket_type' => 'perorangan',
        ])
        ->assertSessionHasErrors('mitra_wisata_onboarding_id');

    expect($ownedDestination->tickets()->exists())->toBeFalse();
});

it('rejects event ticket creation for another organizer event', function () {
    [$owner] = verifiedEventMitraForProductTest('event-owner-rule@indotix.test');
    [, $otherOrganizer] = verifiedEventMitraForProductTest('event-other-rule@indotix.test');

    $otherEvent = Event::query()->create([
        'event_organizer_id' => $otherOrganizer->id,
        'title' => 'Event Mitra Lain',
        'start_at' => now()->addDay(),
        'end_at' => now()->addDays(2),
        'capacity_total' => 100,
        'status' => 'draft',
    ]);

    $this->actingAs($owner)
        ->post('/mitra/events/tickets', [
            'event_id' => $otherEvent->id,
            'name' => 'Tiket Salah Event',
            'price' => 100000,
            'quota' => 20,
            'max_per_user' => 2,
            'is_active' => true,
        ])
        ->assertSessionHasErrors('event_id');
});
