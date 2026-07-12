<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataBooking;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'api_cache.enabled' => true,
        'api_cache.store' => 'array',
    ]);

    Cache::store('array')->flush();
});

function createWisataVisibilityDestination(bool $isLive, string $name): MitraWisataOnboarding
{
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => User::factory()->create(['role' => 'mitra'])->id,
        'current_step' => 3,
        'destination_name' => $name,
        'destination_type' => 'alam',
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

test('wisata API only returns destinations with live status', function () {
    $live = createWisataVisibilityDestination(true, 'Wisata Live Test');
    $draft = createWisataVisibilityDestination(false, 'Wisata Draft Test');

    $this->getJson('/api/products/wisata?q=Wisata')
        ->assertOk()
        ->assertJsonFragment(['destination_name' => $live->destination_name])
        ->assertJsonMissing(['destination_name' => $draft->destination_name]);

    $this->getJson('/api/discovery/wisata?q=Wisata')
        ->assertOk()
        ->assertJsonFragment(['title' => $live->destination_name])
        ->assertJsonMissing(['title' => $draft->destination_name]);

    $this->getJson('/api/products/wisata/'.$draft->slug)
        ->assertNotFound();
});

test('wisata booking quote rejects draft destination even with valid ids', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);
    $draft = createWisataVisibilityDestination(false, 'Wisata Draft Booking Test');
    $ticket = $draft->tickets()->firstOrFail();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', [
            'destination_id' => Crypt::encryptString((string) $draft->id),
            'ticket_id' => Crypt::encryptString((string) $ticket->id),
            'visit_date' => now()->addDay()->toDateString(),
            'quantity' => 1,
        ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Destinasi tidak tersedia.');
});

test('wisata booking quote counts pending bookings against ticket quota', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);
    $destination = createWisataVisibilityDestination(true, 'Wisata Kuota Test');
    $ticket = $destination->tickets()->firstOrFail();
    $ticket->update([
        'quota' => 5,
        'daily_quota' => 5,
    ]);
    $visitDate = now()->addDay()->toDateString();

    WisataBooking::query()->create([
        'user_id' => User::factory()->create()->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-QUOTA-PENDING',
        'visit_date' => $visitDate,
        'quantity' => 4,
        'unit_price' => $ticket->price,
        'total_price' => $ticket->price * 4,
        'status' => 'pending_payment',
        'payment_status' => 'pending',
        'payment_deadline' => now()->addMinutes(15),
    ]);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', [
            'destination_id' => Crypt::encryptString((string) $destination->id),
            'ticket_id' => Crypt::encryptString((string) $ticket->id),
            'visit_date' => $visitDate,
            'quantity' => 2,
        ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Kuota tiket tidak mencukupi.');

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', [
            'destination_id' => Crypt::encryptString((string) $destination->id),
            'ticket_id' => Crypt::encryptString((string) $ticket->id),
            'visit_date' => $visitDate,
            'quantity' => 1,
        ])
        ->assertOk()
        ->assertJsonPath('pricing.quantity', 1);
});

test('wisata product cache is invalidated when booking availability changes', function () {
    $destination = createWisataVisibilityDestination(true, 'Wisata Cache Kuota Test');
    $ticket = $destination->tickets()->firstOrFail();
    $ticket->update([
        'quota' => 5,
        'daily_quota' => 5,
    ]);
    $visitDate = now()->addDay()->toDateString();

    $this->getJson('/api/products/wisata?visit_date='.$visitDate.'&quantity=2')
        ->assertOk()
        ->assertHeader('X-Cache', 'MISS')
        ->assertJsonPath('destinations.0.tickets.0.available', 5);

    $this->getJson('/api/products/wisata?visit_date='.$visitDate.'&quantity=2')
        ->assertOk()
        ->assertHeader('X-Cache', 'HIT');

    WisataBooking::query()->create([
        'user_id' => User::factory()->create()->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-CACHE-INVALIDATION',
        'visit_date' => $visitDate,
        'quantity' => 4,
        'unit_price' => $ticket->price,
        'total_price' => $ticket->price * 4,
        'status' => 'pending_payment',
        'payment_status' => 'pending',
        'payment_deadline' => now()->addMinutes(15),
    ]);

    $this->getJson('/api/products/wisata?visit_date='.$visitDate.'&quantity=2')
        ->assertOk()
        ->assertHeader('X-Cache', 'MISS')
        ->assertJsonCount(0, 'destinations');
});
