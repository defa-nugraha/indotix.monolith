<?php

use App\Models\Event;
use App\Models\EventOrganizer;
use App\Models\Hotel;
use App\Models\MitraEventOnboarding;
use App\Models\MitraOnboarding;
use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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

it('blocks hotel product management from role mitra', function () {
    $mitra = verifiedHotelMitraForProductTest('hotel-owner-rule@indotix.test');

    $this->actingAs($mitra)
        ->get('/mitra/hotels')
        ->assertNotFound();

    $this->actingAs($mitra)
        ->post('/mitra/hotels', [])
        ->assertNotFound();
});

it('blocks hotel operational routes from role mitra', function () {
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
        ->put("/mitra/hotels/{$hotel->id}", [])
        ->assertNotFound();

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

it('stores wisata product photo from mitra destination form and uses it as public cover', function () {
    Storage::fake('public');

    $cityId = mitraProductTestCity();
    $owner = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $owner->id,
        'destination_name' => 'Wisata Produk Foto',
        'destination_type' => 'alam',
        'province_code' => '32',
        'city_code' => $cityId,
        'address_full' => 'Jl. Wisata Produk Foto',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);
    WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Masuk',
        'price' => 50000,
        'quota' => 10,
        'daily_quota' => 10,
        'is_active' => true,
        'is_closed' => false,
    ]);

    $this->actingAs($owner)
        ->put('/mitra/wisata/destination', [
            'responsible_name' => 'Raka Destinasi',
            'responsible_phone' => '081234567890',
            'responsible_role' => 'manager',
            'destination_name' => 'Wisata Produk Foto',
            'destination_type' => 'alam',
            'province_code' => '32',
            'city_code' => $cityId,
            'address_full' => 'Jl. Wisata Produk Foto Baru',
            'legal_doc_type' => 'nib',
            'legal_doc_number' => 'NIB-123456',
            'bank_name' => 'Bank Indotix',
            'bank_account_number' => '1234567890',
            'bank_account_name' => 'Raka Destinasi',
            'photo_product_file' => fakeTestImage('produk-wisata.png'),
            'ktp_file' => fakeTestImage('ktp-wisata.png'),
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'destination-updated');

    $destination->refresh();
    expect($destination)
        ->responsible_name->toBe('Raka Destinasi')
        ->responsible_phone->toBe('081234567890')
        ->responsible_role->toBe('manager')
        ->legal_doc_type->toBe('nib')
        ->legal_doc_number->toBe('NIB-123456')
        ->bank_name->toBe('Bank Indotix')
        ->bank_account_number->toBe('1234567890')
        ->bank_account_name->toBe('Raka Destinasi')
        ->and($destination->photo_product_path)->not->toBeNull()
        ->and($destination->ktp_path)->not->toBeNull();
    Storage::disk('public')->assertExists($destination->photo_product_path);
    Storage::disk('public')->assertExists($destination->ktp_path);

    $this->getJson('/api/products/wisata?q=Produk%20Foto')
        ->assertOk()
        ->assertJsonPath('destinations.0.destination_name', 'Wisata Produk Foto')
        ->assertJsonPath('destinations.0.photo_url', '/storage/'.$destination->photo_product_path);
});

it('blocks suspended wisata destination updates from mitra form submission', function () {
    $cityId = mitraProductTestCity();
    $owner = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $owner->id,
        'destination_name' => 'Wisata Suspend',
        'destination_type' => 'alam',
        'province_code' => '32',
        'city_code' => $cityId,
        'address_full' => 'Jl. Wisata Suspend',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_suspended' => true,
    ]);

    $this->actingAs($owner)
        ->put('/mitra/wisata/destination', [
            'destination_name' => 'Wisata Suspend Diubah',
            'destination_type' => 'alam',
            'province_code' => '32',
            'city_code' => $cityId,
            'address_full' => 'Jl. Wisata Suspend Baru',
        ])
        ->assertSessionHasErrors();

    expect($destination->refresh()->destination_name)->toBe('Wisata Suspend');
});

it('blocks event product management from role mitra', function () {
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
        ->get('/mitra/events')
        ->assertNotFound();

    $this->actingAs($owner)
        ->post('/mitra/events/tickets', [
            'event_id' => $otherEvent->id,
        ])
        ->assertNotFound();
});
