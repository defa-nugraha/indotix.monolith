<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows admin to approve and reject wisata verification', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $mitra = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);
    $onboarding = MitraWisataOnboarding::query()->create([
        'user_id' => $mitra->id,
        'verification_status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->post("/admin/mitra-wisata/{$mitra->id}/verify", [
            'action' => 'approve',
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'verification-updated');

    expect($onboarding->refresh())
        ->verification_status->toBe('verified')
        ->verification_reason->toBeNull();

    $this->actingAs($admin)
        ->post("/admin/mitra-wisata/{$mitra->id}/verify", [
            'action' => 'reject',
        ])
        ->assertSessionHasErrors('reason');

    expect($onboarding->refresh()->verification_status)->toBe('verified');

    $this->actingAs($admin)
        ->post("/admin/mitra-wisata/{$mitra->id}/verify", [
            'action' => 'reject',
            'reason' => 'Foto dokumen legalitas belum terbaca jelas.',
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'verification-updated');

    expect($onboarding->refresh())
        ->verification_status->toBe('rejected')
        ->verification_reason->toBe('Foto dokumen legalitas belum terbaca jelas.');
});

it('allows admin to approve and reject wisata payout account', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $mitra = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);
    $onboarding = MitraWisataOnboarding::query()->create([
        'user_id' => $mitra->id,
        'payout_status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->post("/admin/mitra-wisata/{$mitra->id}/payout", [
            'action' => 'approve',
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'payout-updated');

    expect($onboarding->refresh())
        ->payout_status->toBe('verified')
        ->payout_reason->toBeNull();

    $this->actingAs($admin)
        ->post("/admin/mitra-wisata/{$mitra->id}/payout", [
            'action' => 'reject',
        ])
        ->assertSessionHasErrors('reason');

    expect($onboarding->refresh()->payout_status)->toBe('verified');

    $this->actingAs($admin)
        ->post("/admin/mitra-wisata/{$mitra->id}/payout", [
            'action' => 'reject',
            'reason' => 'Nama pemilik rekening tidak sesuai dengan data mitra.',
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'payout-updated');

    expect($onboarding->refresh())
        ->payout_status->toBe('rejected')
        ->payout_reason->toBe('Nama pemilik rekening tidak sesuai dengan data mitra.');
});
