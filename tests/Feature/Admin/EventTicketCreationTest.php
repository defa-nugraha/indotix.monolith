<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('retired admin event ticket routes stay unavailable', function (string $method, string $uri) {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->call($method, $uri)
        ->assertNotFound();
})->with([
    ['GET', '/admin/events/tickets/create'],
    ['POST', '/admin/events/tickets'],
    ['GET', '/admin/events/tickets/1/edit'],
    ['PUT', '/admin/events/tickets/1'],
    ['DELETE', '/admin/events/tickets/1'],
]);
