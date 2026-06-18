<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;

uses(RefreshDatabase::class);

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
