<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateCommissionItem;
use App\Models\WisataAffiliatePayout;
use App\Models\WisataAffiliateSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function affiliateApiUser(): User
{
    return User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);
}

function affiliateApiDestination(): MitraWisataOnboarding
{
    return MitraWisataOnboarding::query()->create([
        'user_id' => User::factory()->create([
            'role' => 'mitra',
            'email_verified_at' => now(),
        ])->id,
        'current_step' => 3,
        'destination_name' => 'Wisata API Affiliate',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
        'is_suspended' => false,
    ]);
}

test('mobile user can register and view affiliate overview', function () {
    $user = affiliateApiUser();
    $destination = affiliateApiDestination();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/affiliate/overview')
        ->assertOk()
        ->assertJsonPath('registered', false);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/affiliate/register', [
            'wisata_id' => $destination->id,
            'phone' => '08123456789',
            'type' => 'individu',
            'platform' => 'Instagram @tester',
            'bank_name' => 'BCA',
            'bank_account_number' => '1234567890',
            'bank_account_name' => 'Tester Affiliate',
        ])
        ->assertCreated()
        ->assertJsonPath('affiliate.status', 'pending_review')
        ->assertJsonPath('affiliate.destination.destination_name', 'Wisata API Affiliate');

    expect(WisataAffiliate::query()->where('user_id', $user->id)->exists())->toBeTrue();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/affiliate/overview')
        ->assertOk()
        ->assertJsonPath('registered', true)
        ->assertJsonPath('affiliate.phone', '08123456789');
});

test('mobile affiliate can create referral link and see catalog', function () {
    $user = affiliateApiUser();
    $destination = affiliateApiDestination();
    WisataAffiliate::query()->create([
        'user_id' => $user->id,
        'wisata_id' => $destination->id,
        'name' => $user->name,
        'email' => $user->email,
        'phone' => '08123456789',
        'type' => 'individu',
        'status' => 'active',
    ]);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/affiliate/links')
        ->assertCreated()
        ->assertJsonStructure(['link' => ['id', 'code', 'referral_url']]);

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/affiliate/links')
        ->assertOk()
        ->assertJsonPath('affiliate.status', 'active')
        ->assertJsonStructure(['link' => ['code', 'cookie_days', 'referral_url']]);

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/affiliate/catalog')
        ->assertOk()
        ->assertJsonPath('destination.destination_name', 'Wisata API Affiliate');
});

test('mobile affiliate can request payout when balance is available', function () {
    $user = affiliateApiUser();
    $destination = affiliateApiDestination();
    $affiliate = WisataAffiliate::query()->create([
        'user_id' => $user->id,
        'wisata_id' => $destination->id,
        'name' => $user->name,
        'email' => $user->email,
        'phone' => '08123456789',
        'type' => 'individu',
        'status' => 'active',
        'bank_name' => 'BCA',
        'bank_account_number' => '1234567890',
        'bank_account_name' => 'Tester Affiliate',
    ]);
    WisataAffiliateSetting::query()->create([
        'min_payout' => 50000,
        'cookie_days' => 7,
        'attribution_model' => 'last_click',
        'payout_cutoff_days' => 7,
    ]);
    WisataAffiliateCommissionItem::query()->create([
        'affiliate_id' => $affiliate->id,
        'commission_amount' => 100000,
        'status' => 'approved',
    ]);

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/affiliate/payouts')
        ->assertOk()
        ->assertJsonPath('available', 100000)
        ->assertJsonPath('min_payout', 50000);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/affiliate/payouts')
        ->assertCreated()
        ->assertJsonPath('available', 0);

    expect(WisataAffiliatePayout::query()
        ->where('affiliate_id', $affiliate->id)
        ->where('total_commission', 100000)
        ->where('status', 'pending')
        ->exists())->toBeTrue();
});
