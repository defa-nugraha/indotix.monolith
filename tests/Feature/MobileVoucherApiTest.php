<?php

use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('mobile voucher api returns only selectable wisata vouchers', function () {
    Voucher::query()->create([
        'code' => 'MOBILEACTIVE',
        'discount_type' => 'percentage',
        'discount_value' => 20,
        'is_active' => true,
    ]);
    Voucher::query()->create([
        'code' => 'MOBILEEXPIRED',
        'discount_type' => 'fixed',
        'discount_value' => 10000,
        'ends_at' => now()->subDay(),
        'is_active' => true,
    ]);

    $this->getJson('/api/mobile/vouchers')
        ->assertOk()
        ->assertJsonCount(1, 'vouchers')
        ->assertJsonPath('vouchers.0.code', 'MOBILEACTIVE');
});

test('mobile voucher detail is available by code', function () {
    Voucher::query()->create([
        'code' => 'MOBILEDETAIL',
        'discount_type' => 'fixed',
        'discount_value' => 15000,
        'is_active' => true,
    ]);

    $this->getJson('/api/mobile/vouchers/mobile detail')
        ->assertNotFound();

    $this->getJson('/api/mobile/vouchers/MOBILEDETAIL')
        ->assertOk()
        ->assertJsonPath('voucher.code', 'MOBILEDETAIL')
        ->assertJsonPath('voucher.discount_value', 15000);
});
