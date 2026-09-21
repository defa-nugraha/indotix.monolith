<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin destination requires all three primary photos on create', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    $owner = User::factory()->create(['role' => 'mitra', 'email_verified_at' => now()]);

    $this->actingAs($admin)->post('/admin/wisata/destinations', [
        'user_id' => $owner->id,
        'destination_name' => 'Destinasi Baru',
        'destination_type' => 'alam',
        'is_live' => true,
    ])->assertSessionHasErrors(['photo_product_file', 'photo_gate_file', 'photo_area_file']);

    expect(MitraWisataOnboarding::query()->count())->toBe(0);
});

test('admin can publish with existing photos but cannot publish while a required photo is missing', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    $owner = User::factory()->create(['role' => 'mitra', 'email_verified_at' => now()]);
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $owner->id,
        'destination_name' => 'Destinasi Draft',
        'destination_type' => 'alam',
        'photo_product_path' => 'destinations/product.jpg',
        'photo_gate_path' => 'destinations/gate.jpg',
        'verification_status' => 'verified',
        'is_live' => false,
    ]);

    $payload = [
        'destination_name' => 'Destinasi Draft',
        'destination_type' => 'alam',
        'is_live' => true,
    ];

    $this->actingAs($admin)->put("/admin/wisata/destinations/{$destination->id}", $payload)
        ->assertSessionHasErrors('photo_area_file');
    expect($destination->refresh()->is_live)->toBeFalse();

    $destination->update(['photo_area_path' => 'destinations/area.jpg']);
    $this->put("/admin/wisata/destinations/{$destination->id}", $payload)
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'destination-updated');

    expect($destination->refresh()->is_live)->toBeTrue()
        ->and($destination->destination_type)->toBe('alam');
});
