<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('retired mobile hotel payment endpoint stays unavailable', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/hotel/bookings/1/pay')
        ->assertNotFound();
});
