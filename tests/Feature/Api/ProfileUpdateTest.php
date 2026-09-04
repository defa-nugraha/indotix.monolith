<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('mobile user can update and persist a valid profile', function () {
    $user = User::factory()->create([
        'name' => 'Nama Lama',
        'email' => 'profile-lama@example.test',
        'phone' => '081234567890',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/profile', [
            'name' => 'Nama Baru',
            'email' => 'profile-baru@example.test',
            'phone' => '081298765432',
            'gender' => 'other',
        ])
        ->assertOk()
        ->assertJsonPath('user.name', 'Nama Baru')
        ->assertJsonPath('user.email', 'profile-baru@example.test')
        ->assertJsonPath('user.phone', '081298765432');

    expect($user->fresh())
        ->name->toBe('Nama Baru')
        ->email->toBe('profile-baru@example.test')
        ->phone->toBe('081298765432')
        ->email_verified_at->toBeNull();
});
