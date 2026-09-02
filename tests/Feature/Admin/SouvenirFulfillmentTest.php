<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('retired retail fulfillment routes stay unavailable', function (string $method, string $uri) {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->call($method, $uri)
        ->assertNotFound();
})->with([
    ['GET', '/admin/retail-shop/fulfillment'],
    ['POST', '/admin/retail-shop/orders/1/status'],
    ['POST', '/admin/retail-shop/orders/1/shipping'],
]);
