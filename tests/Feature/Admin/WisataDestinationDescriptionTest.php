<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function editableWisataDestination(User $owner, string $description = ''): MitraWisataOnboarding
{
    return MitraWisataOnboarding::query()->create([
        'user_id' => $owner->id,
        'destination_name' => 'Wisata Uji Deskripsi',
        'destination_type' => 'alam',
        'description' => $description,
        'photo_product_path' => 'destinations/product.jpg',
        'photo_gate_path' => 'destinations/gate.jpg',
        'photo_area_path' => 'destinations/area.jpg',
        'verification_status' => 'verified',
        'is_live' => true,
    ]);
}

test('admin can update a formatted destination description safely', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    $owner = User::factory()->create(['role' => 'mitra', 'email_verified_at' => now()]);
    $destination = editableWisataDestination($owner);

    $this->actingAs($admin)
        ->put("/admin/wisata/destinations/{$destination->id}", [
            'destination_name' => $destination->destination_name,
            'destination_type' => $destination->destination_type,
            'description' => '<p>Wisata <strong>keluarga</strong>.</p><script>alert(1)</script>',
            'is_live' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'destination-updated');

    expect($destination->refresh()->description)
        ->toBe('<p>Wisata <strong>keluarga</strong>.</p>');
});

test('public destination receives sanitized formatted description', function () {
    $owner = User::factory()->create(['role' => 'mitra', 'email_verified_at' => now()]);
    $destination = editableWisataDestination(
        $owner,
        '<p>Informasi <em>penting</em>.</p><img src=x onerror=alert(1)>',
    );

    $this->get("/wisata/{$destination->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/wisata/show')
            ->where('destination.description', '<p>Informasi <em>penting</em>.</p>'));
});
