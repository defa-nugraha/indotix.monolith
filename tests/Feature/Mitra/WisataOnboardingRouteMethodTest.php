<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('accepts post requests for wisata onboarding document upload step', function () {
    $user = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);

    MitraWisataOnboarding::query()->create([
        'user_id' => $user->id,
        'current_step' => 2,
        'verification_status' => 'draft',
        'payout_status' => 'draft',
    ]);

    $this->actingAs($user)
        ->post('/mitra/wisata/onboarding/step-3', [
            'legal_doc_type' => 'nib',
            'legal_doc_number' => 'NIB-TEST-001',
            'bank_name' => 'BCA',
            'bank_account_number' => '1234567890',
            'bank_account_name' => 'Mitra Wisata Test',
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'onboarding-saved');
});
