<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataTicket;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;

uses(RefreshDatabase::class);

function weekendTicketDestination(): array
{
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => User::factory()->create(['role' => 'mitra'])->id,
        'current_step' => 3,
        'destination_name' => 'Wisata Weekend Test',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);

    $regular = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Reguler',
        'price' => 50000,
        'quota' => 100,
        'daily_quota' => 100,
        'is_active' => true,
        'is_closed' => false,
        'is_weekend' => false,
    ]);

    $weekend = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Weekend',
        'price' => 75000,
        'weekend_price' => 100000,
        'quota' => 100,
        'daily_quota' => 100,
        'is_active' => true,
        'is_closed' => false,
        'is_weekend' => true,
    ]);

    return [$destination, $regular, $weekend];
}

test('wisata listing keeps weekend-priced tickets available and uses the selected date price', function () {
    [$destination, $regular, $weekend] = weekendTicketDestination();
    $saturday = CarbonImmutable::parse('next saturday')->toDateString();
    $monday = CarbonImmutable::parse('next monday')->toDateString();

    $this->getJson("/api/products/wisata/{$destination->slug}?visit_date={$saturday}")
        ->assertOk()
        ->assertJsonFragment(['name' => $weekend->name])
        ->assertJsonFragment(['name' => $regular->name]);

    $this->getJson("/api/products/wisata/{$destination->slug}?visit_date={$monday}")
        ->assertOk()
        ->assertJsonFragment(['name' => $regular->name])
        ->assertJsonFragment(['name' => $weekend->name]);
});

test('api booking applies weekend price only for a weekend visit date', function () {
    [$destination, , $weekend] = weekendTicketDestination();
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', [
            'destination_id' => Crypt::encryptString((string) $destination->id),
            'ticket_id' => Crypt::encryptString((string) $weekend->id),
            'visit_date' => CarbonImmutable::parse('next saturday')->toDateString(),
            'quantity' => 1,
        ])
        ->assertOk()
        ->assertJsonPath('pricing.items.0.unit_price', 100000)
        ->assertJsonPath('pricing.total', 100000);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', [
            'destination_id' => Crypt::encryptString((string) $destination->id),
            'ticket_id' => Crypt::encryptString((string) $weekend->id),
            'visit_date' => CarbonImmutable::parse('next monday')->toDateString(),
            'quantity' => 1,
        ])
        ->assertOk()
        ->assertJsonPath('pricing.items.0.unit_price', 75000)
        ->assertJsonPath('pricing.total', 75000);
});

test('web booking applies weekend price to the review summary', function () {
    [$destination, , $weekend] = weekendTicketDestination();
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);

    $this->actingAs($user)
        ->post('/wisata/booking/prepare', [
            'destination_id' => $destination->id,
            'ticket_id' => $weekend->id,
            'visit_date' => CarbonImmutable::parse('next saturday')->toDateString(),
            'quantity' => 1,
        ])
        ->assertRedirect('/wisata/booking/review');

    $this->actingAs($user)
        ->get('/wisata/booking/review')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('pricing.total', 100000)
            ->where('items.0.unit_price', 100000)
        );
});
