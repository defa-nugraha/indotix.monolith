<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('retired admin event listing stays unavailable', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get('/admin/events?q=Fun&status=published&capacity_state=available&date_from=2026-07-01&date_to=2026-07-31')
        ->assertNotFound();
});
