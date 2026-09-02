<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('main admin can manage wisata vouchers from wisata submenu', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get('/admin/wisata/vouchers')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/marketing/vouchers/index')
            ->where('routeBase', '/admin/wisata/vouchers')
            ->where('showHotelScope', false)
            ->where('pageTitle', 'Voucher Wisata'));

    $this->actingAs($admin)
        ->post('/admin/wisata/vouchers', [
            'code' => 'wisatahemat15',
            'discount_type' => 'percentage',
            'discount_value' => 15,
            'min_transaction' => 100000,
            'quota_total' => 25,
            'max_per_user_per_day' => 1,
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addMonth()->toDateString(),
            'hotel_id' => 999,
            'is_active' => 1,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $voucher = Voucher::query()->where('code', 'WISATAHEMAT15')->firstOrFail();

    expect($voucher->hotel_id)->toBeNull()
        ->and((int) $voucher->discount_value)->toBe(15)
        ->and((int) $voucher->quota_total)->toBe(25);

    $this->actingAs($admin)
        ->put("/admin/wisata/vouchers/{$voucher->id}", [
            'code' => 'WISATAHEMAT20',
            'discount_type' => 'fixed',
            'discount_value' => 20000,
            'min_transaction' => 150000,
            'quota_total' => 30,
            'max_per_user_per_day' => 2,
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addMonth()->toDateString(),
            'is_active' => 1,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($voucher->fresh()->code)->toBe('WISATAHEMAT20')
        ->and((int) $voucher->fresh()->discount_value)->toBe(20000);

    $this->actingAs($admin)
        ->delete("/admin/wisata/vouchers/{$voucher->id}")
        ->assertRedirect();

    $this->assertDatabaseMissing('vouchers', ['id' => $voucher->id]);
});

test('non admin cannot access wisata voucher management', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user)
        ->get('/admin/wisata/vouchers')
        ->assertRedirect('/dashboard');
});

test('percentage wisata voucher cannot exceed one hundred percent', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->from('/admin/wisata/vouchers')
        ->post('/admin/wisata/vouchers', [
            'code' => 'OVER100',
            'discount_type' => 'percentage',
            'discount_value' => 120,
            'quota_total' => 10,
            'is_active' => 1,
        ])
        ->assertRedirect('/admin/wisata/vouchers')
        ->assertSessionHasErrors('discount_value');
});

test('wisata voucher can target selected destinations only', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => User::factory()->create(['role' => 'mitra'])->id,
        'current_step' => 3,
        'destination_name' => 'Wisata Voucher Target',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);

    $this->actingAs($admin)
        ->get('/admin/wisata/vouchers')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('wisataDestinationOptions')
            ->where('wisataDestinationOptions.0.id', $destination->id));

    $this->actingAs($admin)
        ->post('/admin/wisata/vouchers', [
            'code' => 'TARGETWISATA',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'quota_total' => 10,
            'destination_scope' => 'selected',
            'wisata_destination_ids' => [$destination->id],
            'is_active' => 1,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $voucher = Voucher::query()->where('code', 'TARGETWISATA')->firstOrFail();

    expect($voucher->wisataDestinations()->pluck('mitra_wisata_onboardings.id')->all())
        ->toBe([$destination->id]);
});
