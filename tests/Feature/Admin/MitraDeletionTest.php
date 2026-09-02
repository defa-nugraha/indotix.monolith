<?php

use App\Models\EventOrganizer;
use App\Models\MitraWisataOnboarding;
use App\Models\MitraWisataStaff;
use App\Models\User;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateCommission;
use App\Models\WisataBooking;
use App\Models\WisataCommissionRule;
use App\Models\WisataDispute;
use App\Models\WisataPayout;
use App\Models\WisataReview;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function adminUserForMitraDeletion(): User
{
    return User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
}

it('keeps retired hotel mitra deletion route unavailable', function () {
    $admin = adminUserForMitraDeletion();
    $mitra = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'hotel',
    ]);

    $this->actingAs($admin)
        ->delete("/admin/mitra/{$mitra->id}")
        ->assertNotFound();

    expect(User::query()->whereKey($mitra->id)->exists())->toBeTrue();
});

it('deletes wisata mitra with related data and uploaded files', function () {
    Storage::fake('public');

    $admin = adminUserForMitraDeletion();
    $mitra = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
    ]);
    $customer = User::factory()->create();

    $filePaths = [
        'mitra/wisata/gate.jpg',
        'mitra/wisata/area.jpg',
        'mitra/wisata/ticket.jpg',
        'mitra/wisata/other-a.jpg',
        'mitra/wisata/other-b.jpg',
        'mitra/wisata/ktp.jpg',
        'mitra/wisata/selfie.jpg',
        'mitra/wisata/legal.pdf',
        'wisata-disputes/proof.jpg',
    ];
    foreach ($filePaths as $path) {
        Storage::disk('public')->put($path, 'file');
    }

    $onboarding = MitraWisataOnboarding::query()->create([
        'user_id' => $mitra->id,
        'destination_name' => 'Wisata Cascade',
        'destination_type' => 'alam',
        'photo_gate_path' => 'mitra/wisata/gate.jpg',
        'photo_area_path' => 'mitra/wisata/area.jpg',
        'photo_ticket_path' => 'mitra/wisata/ticket.jpg',
        'photo_other_paths' => ['mitra/wisata/other-a.jpg', 'mitra/wisata/other-b.jpg'],
        'ktp_path' => 'mitra/wisata/ktp.jpg',
        'selfie_ktp_path' => 'mitra/wisata/selfie.jpg',
        'legal_doc_path' => 'mitra/wisata/legal.pdf',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
    ]);
    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $onboarding->id,
        'name' => 'Reguler',
        'price' => 50000,
        'quota' => 100,
        'is_active' => true,
    ]);
    $booking = WisataBooking::query()->create([
        'user_id' => $customer->id,
        'mitra_wisata_onboarding_id' => $onboarding->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-DELETE-1',
        'visit_date' => now()->addDay()->toDateString(),
        'quantity' => 2,
        'unit_price' => 50000,
        'total_price' => 100000,
        'status' => 'paid',
    ]);
    WisataDispute::query()->create([
        'wisata_booking_id' => $booking->id,
        'user_id' => $customer->id,
        'mitra_wisata_onboarding_id' => $onboarding->id,
        'wisata_ticket_id' => $ticket->id,
        'subject' => 'Dokumen',
        'description' => 'Lampiran',
        'attachment_path' => 'wisata-disputes/proof.jpg',
    ]);
    WisataPayout::query()->create([
        'mitra_wisata_onboarding_id' => $onboarding->id,
        'period_start' => now()->startOfMonth()->toDateString(),
        'period_end' => now()->endOfMonth()->toDateString(),
        'total_gmv' => 100000,
        'commission_amount' => 10000,
        'net_payout' => 90000,
    ]);
    WisataCommissionRule::query()->create([
        'mitra_wisata_onboarding_id' => $onboarding->id,
        'type' => 'percentage',
        'value' => 10,
    ]);
    WisataReview::query()->create([
        'mitra_wisata_onboarding_id' => $onboarding->id,
        'user_id' => $customer->id,
        'rating' => 5,
        'comment' => 'Bagus',
    ]);
    WisataAffiliate::query()->create([
        'wisata_id' => $onboarding->id,
        'name' => 'Affiliate Cascade',
        'type' => 'individu',
    ]);
    WisataAffiliateCommission::query()->create([
        'scope_type' => 'wisata',
        'wisata_id' => $onboarding->id,
        'type' => 'percentage',
        'value' => 5,
        'source' => 'platform',
    ]);
    MitraWisataStaff::query()->create([
        'mitra_wisata_onboarding_id' => $onboarding->id,
        'name' => 'Staff Wisata',
        'role' => 'staff_validasi',
    ]);

    $this->actingAs($admin)
        ->delete("/admin/mitra-wisata/{$mitra->id}")
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'mitra-wisata-deleted');

    expect(User::query()->whereKey($mitra->id)->exists())->toBeFalse()
        ->and(MitraWisataOnboarding::query()->whereKey($onboarding->id)->exists())->toBeFalse()
        ->and(WisataTicket::query()->whereKey($ticket->id)->exists())->toBeFalse()
        ->and(WisataBooking::query()->whereKey($booking->id)->exists())->toBeFalse()
        ->and(WisataAffiliateCommission::query()->where('wisata_id', $onboarding->id)->exists())->toBeFalse();

    foreach ($filePaths as $path) {
        expect(Storage::disk('public')->exists($path))->toBeFalse();
    }
});

it('keeps retired event mitra deletion route unavailable', function () {
    $admin = adminUserForMitraDeletion();
    $mitra = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'event',
    ]);
    $organizer = EventOrganizer::query()->create([
        'user_id' => $mitra->id,
        'name' => 'Organizer Retired',
        'email' => $mitra->email,
        'status' => 'verified',
    ]);

    $this->actingAs($admin)
        ->delete("/admin/events/organizers/{$organizer->id}")
        ->assertNotFound();

    expect(User::query()->whereKey($mitra->id)->exists())->toBeTrue()
        ->and(EventOrganizer::query()->whereKey($organizer->id)->exists())->toBeTrue();
});
