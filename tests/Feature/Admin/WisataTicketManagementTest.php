<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can update wisata ticket price quota and active state', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $owner = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $owner->id,
        'current_step' => 3,
        'destination_name' => 'Wisata Ticket Admin',
        'destination_type' => 'wahana',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);
    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Lama',
        'price' => 50000,
        'quota' => 10,
        'daily_quota' => 10,
        'is_active' => true,
        'is_closed' => false,
    ]);

    $this->actingAs($admin)
        ->put("/admin/wisata/tickets/{$ticket->id}", [
            'price' => 75000,
            'quota' => 25,
            'daily_quota' => 20,
            'is_active' => false,
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'ticket-updated');

    expect($ticket->refresh())
        ->price->toBe(75000)
        ->quota->toBe(25)
        ->daily_quota->toBe(20)
        ->is_active->toBeFalse();

    $this->getJson("/api/products/wisata/{$destination->slug}")
        ->assertOk()
        ->assertJsonMissing(['name' => 'Tiket Lama']);
});
