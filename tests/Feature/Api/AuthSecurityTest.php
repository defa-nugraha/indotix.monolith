<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('existing unverified account cannot be re-registered to obtain a token', function () {
    $user = User::factory()->create([
        'email' => 'pending@example.test',
        'phone' => '081111111111',
        'password' => 'original-secret',
        'email_verified_at' => null,
    ]);

    $this->postJson('/api/auth/register', [
        'name' => 'Attacker',
        'email' => $user->email,
        'phone' => '089999999999',
        'password' => 'attacker-secret',
        'terms_accepted' => true,
        'device_name' => 'attacker-device',
    ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Email sudah terdaftar. Silakan login untuk melanjutkan verifikasi.');

    expect($user->fresh()->phone)->toBe('081111111111')
        ->and($user->tokens()->count())->toBe(0);
});

test('unverified api token cannot mutate the profile', function () {
    $user = User::factory()->create([
        'name' => 'Pending User',
        'email' => 'pending-profile@example.test',
        'phone' => '081222222222',
        'password' => 'original-secret',
        'email_verified_at' => null,
    ]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/profile', [
            'name' => 'Taken Over',
            'email' => 'attacker@example.test',
            'phone' => '089999999999',
            'gender' => 'other',
            'current_password' => 'original-secret',
        ])
        ->assertForbidden();

    $user->refresh();

    expect($user->name)->toBe('Pending User')
        ->and($user->email)->toBe('pending-profile@example.test')
        ->and($user->phone)->toBe('081222222222');
});
