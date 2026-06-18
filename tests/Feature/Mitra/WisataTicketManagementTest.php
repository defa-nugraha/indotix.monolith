<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function verifiedWisataMitraForTicketTest(string $email): array
{
    $user = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email' => $email,
        'email_verified_at' => now(),
    ]);

    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $user->id,
        'destination_name' => 'Wisata Test',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_suspended' => false,
    ]);

    return [$user, $destination];
}

it('allows verified wisata partner to update its own ticket', function () {
    [$user, $destination] = verifiedWisataMitraForTicketTest('wisata-ticket-owner@indotix.test');

    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Lama',
        'price' => 50000,
        'quota' => 20,
        'ticket_type' => 'perorangan',
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->put("/mitra/wisata/tickets/{$ticket->id}", [
            'name' => 'Tiket Baru',
            'description' => 'Deskripsi baru',
            'price' => 75000,
            'quota' => 30,
            'daily_quota' => 10,
            'ticket_type' => 'grup',
            'valid_from' => now()->toDateString(),
            'valid_until' => now()->addMonth()->toDateString(),
            'refund_policy' => 'Refund H-1',
            'is_active' => true,
            'is_closed' => false,
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'ticket-updated');

    expect($ticket->refresh())
        ->name->toBe('Tiket Baru')
        ->price->toBe(75000)
        ->quota->toBe(30)
        ->daily_quota->toBe(10)
        ->ticket_type->toBe('grup');
});

it('forbids wisata partner from updating another destination ticket', function () {
    [$user] = verifiedWisataMitraForTicketTest('wisata-ticket-user@indotix.test');
    [, $otherDestination] = verifiedWisataMitraForTicketTest('wisata-ticket-other@indotix.test');

    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $otherDestination->id,
        'name' => 'Tiket Mitra Lain',
        'price' => 50000,
        'quota' => 20,
        'ticket_type' => 'perorangan',
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->put("/mitra/wisata/tickets/{$ticket->id}", [
            'name' => 'Tidak Boleh',
            'price' => 75000,
            'quota' => 30,
            'ticket_type' => 'perorangan',
        ])
        ->assertForbidden();
});
