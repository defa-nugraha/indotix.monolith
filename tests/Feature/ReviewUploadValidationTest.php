<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

uses(RefreshDatabase::class);

test('web review upload rejects executable image payloads', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user)
        ->from('/wisata/demo')
        ->post('/reviews', [
            'product_type' => 'wisata',
            'product_id' => 1,
            'rating' => 5,
            'comment' => 'Ulasan dari test.',
            'images' => [
                UploadedFile::fake()->create('payload.php', 1, 'application/x-php'),
            ],
        ])
        ->assertSessionHasErrors('images.0');
});

test('api review upload rejects executable image payloads', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user, 'sanctum')
        ->post('/api/reviews', [
            'product_type' => 'wisata',
            'product_id' => '1',
            'rating' => 5,
            'comment' => 'Ulasan dari test.',
            'images' => [
                UploadedFile::fake()->create('payload.php', 1, 'application/x-php'),
            ],
        ], ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('images.0');
});
