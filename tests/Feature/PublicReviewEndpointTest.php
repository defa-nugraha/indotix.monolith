<?php

use App\Models\MitraWisataOnboarding;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('public review endpoint returns active wisata reviews and summary', function () {
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => User::factory()->create(['role' => 'mitra'])->id,
        'current_step' => 3,
        'destination_name' => 'Wisata Review Publik',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);

    ProductReview::query()->create([
        'product_type' => 'wisata',
        'product_id' => $destination->id,
        'user_id' => User::factory()->create(['name' => 'User Aktif'])->id,
        'rating' => 5,
        'comment' => 'Tempatnya nyaman.',
        'status' => 'active',
    ]);

    ProductReview::query()->create([
        'product_type' => 'wisata',
        'product_id' => $destination->id,
        'user_id' => User::factory()->create()->id,
        'rating' => 1,
        'comment' => 'Tidak tampil.',
        'status' => 'removed',
    ]);

    $this->getJson('/reviews/public?product_type=wisata&product_id='.$destination->id)
        ->assertOk()
        ->assertJsonCount(1, 'reviews')
        ->assertJsonPath('reviews.0.user_name', 'User Aktif')
        ->assertJsonPath('summary.total', 1)
        ->assertJsonPath('summary.average', 5)
        ->assertJsonPath('summary.distribution.0.stars', 5)
        ->assertJsonPath('summary.distribution.0.count', 1);
});
