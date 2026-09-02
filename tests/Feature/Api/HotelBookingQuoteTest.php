<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('retired mobile hotel quote endpoint stays unavailable', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/hotel/bookings/quote', [
            'hotel_id' => '1',
            'room_type_id' => '1',
            'check_in' => '2026-06-14',
            'check_out' => '2026-06-15',
            'rooms' => 1,
            'guests' => 2,
        ])
        ->assertNotFound();
});
