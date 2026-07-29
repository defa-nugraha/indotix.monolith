<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function retiredUserSettingsApiUser(): User
{
    return User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);
}

test('mobile affiliate API is no longer exposed', function (string $method, string $uri) {
    $user = retiredUserSettingsApiUser();

    $this->actingAs($user, 'sanctum')
        ->json($method, $uri)
        ->assertNotFound();
})->with([
    ['GET', '/api/affiliate/overview'],
    ['GET', '/api/affiliate/destinations'],
    ['POST', '/api/affiliate/register'],
    ['GET', '/api/affiliate/profile'],
    ['PUT', '/api/affiliate/profile'],
    ['GET', '/api/affiliate/links'],
    ['POST', '/api/affiliate/links'],
    ['GET', '/api/affiliate/catalog'],
    ['GET', '/api/affiliate/commissions'],
    ['GET', '/api/affiliate/payouts'],
    ['POST', '/api/affiliate/payouts'],
]);

test('mobile shipping address API is no longer exposed', function (string $method, string $uri) {
    $user = retiredUserSettingsApiUser();

    $this->actingAs($user, 'sanctum')
        ->json($method, $uri)
        ->assertNotFound();
})->with([
    ['GET', '/api/profile/addresses'],
    ['POST', '/api/profile/addresses'],
    ['PUT', '/api/profile/addresses/1'],
    ['POST', '/api/profile/addresses/1/default'],
    ['DELETE', '/api/profile/addresses/1'],
]);
