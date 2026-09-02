<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataBooking;
use App\Models\WisataTicket;
use App\Models\WisataTicketScan;
use App\Services\WisataTicketUsageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\LaravelPdf\Facades\Pdf;

uses(RefreshDatabase::class);

function wisataScanPackageDestination(?User $owner = null, string $name = 'Wisata QR Test'): MitraWisataOnboarding
{
    $owner ??= User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);

    return MitraWisataOnboarding::query()->create([
        'user_id' => $owner->id,
        'current_step' => 3,
        'destination_name' => $name,
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);
}

it('lets user use a paid wisata ticket by scanning merchant QR only once per ticket unit', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);
    $destination = wisataScanPackageDestination();
    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Reguler QR',
        'price' => 50000,
        'quota' => 10,
        'daily_quota' => 10,
        'is_active' => true,
        'is_closed' => false,
    ]);
    $booking = WisataBooking::query()->create([
        'user_id' => $user->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-QR-TEST-1',
        'visit_date' => now()->toDateString(),
        'quantity' => 1,
        'unit_price' => 50000,
        'total_price' => 50000,
        'status' => 'paid',
        'payment_status' => 'paid',
        'guest_name' => $user->name,
        'guest_email' => $user->email,
    ]);
    $item = $booking->items()->create([
        'wisata_ticket_id' => $ticket->id,
        'ticket_name' => $ticket->name,
        'quantity' => 1,
        'used_quantity' => 0,
        'unit_price' => 50000,
        'subtotal' => 50000,
    ]);

    $qrData = app(WisataTicketUsageService::class)->buildMerchantQrData($destination);

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/wisata/ticket-scans/lookup?qr_data='.urlencode($qrData))
        ->assertOk()
        ->assertJsonPath('destination.name', 'Wisata QR Test')
        ->assertJsonPath('tickets.0.item_id', $item->id)
        ->assertJsonPath('tickets.0.remaining_quantity', 1)
        ->assertJsonPath('tickets.0.usable_today', true);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/ticket-scans/use', [
            'qr_data' => $qrData,
            'booking_item_id' => $item->id,
        ])
        ->assertOk()
        ->assertJsonPath('result.booking_code', 'WISATA-QR-TEST-1')
        ->assertJsonPath('result.remaining_quantity', 0);

    expect($item->refresh()->used_quantity)->toBe(1)
        ->and($booking->refresh()->status)->toBe('completed');

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/ticket-scans/use', [
            'qr_data' => $qrData,
            'booking_item_id' => $item->id,
        ])
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Tiket ini sudah pernah digunakan.');

    expect(WisataTicketScan::query()->where('wisata_booking_id', $booking->id)->count())->toBe(2)
        ->and(WisataTicketScan::query()->where('wisata_booking_id', $booking->id)->where('is_anomaly', false)->count())->toBe(1)
        ->and(WisataTicketScan::query()->where('wisata_booking_id', $booking->id)->where('is_anomaly', true)->count())->toBe(1);
});

it('prevents users from using another users wisata booking item through scan API', function () {
    $owner = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);
    $attacker = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);
    $destination = wisataScanPackageDestination();
    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Private QR',
        'price' => 50000,
        'quota' => 10,
        'daily_quota' => 10,
        'is_active' => true,
        'is_closed' => false,
    ]);
    $booking = WisataBooking::query()->create([
        'user_id' => $owner->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-QR-PRIVATE',
        'visit_date' => now()->toDateString(),
        'quantity' => 1,
        'unit_price' => 50000,
        'total_price' => 50000,
        'status' => 'paid',
        'payment_status' => 'paid',
        'guest_name' => $owner->name,
        'guest_email' => $owner->email,
    ]);
    $item = $booking->items()->create([
        'wisata_ticket_id' => $ticket->id,
        'ticket_name' => $ticket->name,
        'quantity' => 1,
        'used_quantity' => 0,
        'unit_price' => 50000,
        'subtotal' => 50000,
    ]);

    $qrData = app(WisataTicketUsageService::class)->buildMerchantQrData($destination);

    $this->actingAs($attacker, 'sanctum')
        ->postJson('/api/wisata/ticket-scans/use', [
            'qr_data' => $qrData,
            'booking_item_id' => $item->id,
        ])
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Tiket tidak ditemukan untuk QR masuk ini.');

    expect($item->refresh()->used_quantity)->toBe(0)
        ->and($booking->refresh()->status)->toBe('paid');

    $this->assertDatabaseMissing('wisata_ticket_scans', [
        'wisata_booking_id' => $booking->id,
        'user_id' => $attacker->id,
    ]);
});

it('does not let the legacy mitra scan endpoint consume user tickets', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);
    $partner = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);
    $destination = wisataScanPackageDestination($partner, 'Wisata QR Mitra');
    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Mitra QR',
        'price' => 50000,
        'quota' => 10,
        'is_active' => true,
        'is_closed' => false,
    ]);
    $booking = WisataBooking::query()->create([
        'user_id' => $user->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-LEGACY-SCAN',
        'visit_date' => now()->toDateString(),
        'quantity' => 1,
        'unit_price' => 50000,
        'total_price' => 50000,
        'status' => 'paid',
        'payment_status' => 'paid',
        'guest_name' => $user->name,
        'guest_email' => $user->email,
    ]);

    $this->actingAs($partner)
        ->post('/mitra/wisata/scans', [
            'booking_code' => $booking->booking_code,
            'officer_name' => 'Petugas Lama',
        ])
        ->assertSessionHasErrors('booking_code');

    expect($booking->refresh()->status)->toBe('paid')
        ->and(WisataTicketScan::query()->where('wisata_booking_id', $booking->id)->count())->toBe(0);
});

it('renders the mitra entry QR page without exposing raw QR payload and provides pdf actions', function () {
    $partner = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);
    wisataScanPackageDestination($partner, 'Papandayan');

    $this->actingAs($partner)
        ->get('/mitra/wisata/scans')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('mitra/wisata/scans/index')
            ->where('destination.destination_name', 'Papandayan')
            ->has('qrImage')
            ->where('qrPdfUrl', route('mitra.wisata.scans.pdf'))
            ->missing('qrData'));
});

it('filters mitra scan history by search keyword and keeps history tab active', function () {
    $partner = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);
    $destination = wisataScanPackageDestination($partner, 'Papandayan');
    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Search QR',
        'price' => 50000,
        'quota' => 10,
        'is_active' => true,
        'is_closed' => false,
    ]);
    $matchedBooking = WisataBooking::query()->create([
        'user_id' => User::factory()->create(['role' => 'user'])->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-SPECIAL-SEARCH',
        'visit_date' => now()->toDateString(),
        'quantity' => 1,
        'unit_price' => 50000,
        'total_price' => 50000,
        'status' => 'paid',
        'payment_status' => 'paid',
        'guest_name' => 'Tamu Dicari',
        'guest_email' => 'tamu-dicari@example.test',
    ]);
    $matchedItem = $matchedBooking->items()->create([
        'wisata_ticket_id' => $ticket->id,
        'ticket_name' => 'Tiket Keluarga Dicari',
        'quantity' => 1,
        'used_quantity' => 0,
        'unit_price' => 50000,
        'subtotal' => 50000,
    ]);
    WisataTicketScan::query()->create([
        'wisata_booking_id' => $matchedBooking->id,
        'wisata_booking_item_id' => $matchedItem->id,
        'quantity' => 1,
        'scan_source' => 'mitra_qr',
        'scanned_at' => now(),
        'is_anomaly' => false,
    ]);

    $unmatchedBooking = WisataBooking::query()->create([
        'user_id' => User::factory()->create(['role' => 'user'])->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-OTHER',
        'visit_date' => now()->toDateString(),
        'quantity' => 1,
        'unit_price' => 50000,
        'total_price' => 50000,
        'status' => 'paid',
        'payment_status' => 'paid',
        'guest_name' => 'Tamu Lain',
        'guest_email' => 'lain@example.test',
    ]);
    WisataTicketScan::query()->create([
        'wisata_booking_id' => $unmatchedBooking->id,
        'quantity' => 1,
        'scan_source' => 'mitra_qr',
        'scanned_at' => now()->subMinute(),
        'is_anomaly' => false,
    ]);

    $this->actingAs($partner)
        ->get('/mitra/wisata/scans?tab=history&search=SPECIAL')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('mitra/wisata/scans/index')
            ->where('filters.tab', 'history')
            ->where('filters.search', 'SPECIAL')
            ->has('scans.data', 1)
            ->where('scans.data.0.booking.booking_code', 'WISATA-SPECIAL-SEARCH'));
});

it('generates the mitra entry QR PDF from the same poster view', function () {
    Pdf::fake();

    $partner = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);
    wisataScanPackageDestination($partner, 'Papandayan');

    $this->actingAs($partner)
        ->get('/mitra/wisata/scans/qr.pdf')
        ->assertOk();

    Pdf::assertRespondedWithPdf(fn ($pdf) => $pdf->viewName === 'mitra-wisata-entry-qr'
        && ($pdf->viewData['destinationName'] ?? null) === 'Papandayan'
        && ! empty($pdf->viewData['template']['playstore_image'])
        && str_starts_with($pdf->downloadName, 'qr-masuk-papandayan')
        && $pdf->format === 'a4');
});

it('allows admin and wisata partner to create package tickets from single tickets on the same destination', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $partner = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);
    $destination = wisataScanPackageDestination($partner, 'Wisata Paket Test');
    $regular = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Reguler',
        'price' => 100000,
        'quota' => 20,
        'ticket_kind' => 'single',
        'is_active' => true,
        'is_closed' => false,
    ]);
    $children = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Anak',
        'price' => 50000,
        'quota' => 20,
        'ticket_kind' => 'single',
        'is_active' => true,
        'is_closed' => false,
    ]);

    $this->actingAs($admin)
        ->post('/admin/wisata/tickets', [
            'mitra_wisata_onboarding_id' => $destination->id,
            'name' => 'Paket Keluarga Admin',
            'description' => 'Paket dua dewasa dan dua anak.',
            'price' => 250000,
            'quota' => 10,
            'ticket_type' => 'grup',
            'ticket_kind' => 'package',
            'package_items' => [
                ['ticket_id' => $regular->id, 'quantity' => 2],
                ['ticket_id' => $children->id, 'quantity' => 2],
            ],
            'is_active' => true,
            'is_closed' => false,
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'ticket-created');

    $this->assertDatabaseHas('wisata_tickets', [
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Paket Keluarga Admin',
        'ticket_kind' => 'package',
        'price' => 300000,
    ]);

    $this->actingAs($partner)
        ->post('/mitra/wisata/tickets', [
            'name' => 'Paket Keluarga Mitra',
            'description' => 'Paket keluarga dari mitra.',
            'price' => 220000,
            'quota' => 8,
            'ticket_type' => 'grup',
            'ticket_kind' => 'package',
            'package_items' => [
                ['ticket_id' => $regular->id, 'quantity' => 2],
                ['ticket_id' => $children->id, 'quantity' => 1],
            ],
            'is_active' => true,
            'is_closed' => false,
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'ticket-created');

    $package = WisataTicket::query()
        ->where('name', 'Paket Keluarga Mitra')
        ->firstOrFail();

    expect($package->ticket_kind)->toBe('package')
        ->and($package->price)->toBe(250000)
        ->and($package->package_items)->toHaveCount(2)
        ->and($package->package_items[0]['ticket_id'])->toBe($regular->id)
        ->and($package->package_items[0]['quantity'])->toBe(2)
        ->and($package->package_items[1]['ticket_id'])->toBe($children->id)
        ->and($package->package_items[1]['quantity'])->toBe(1);
});

it('rejects package tickets containing single tickets from another destination', function () {
    $partner = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);
    $destination = wisataScanPackageDestination($partner, 'Wisata Paket Aman');
    $otherDestination = wisataScanPackageDestination(null, 'Wisata Lain');
    $ownTicket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Sendiri',
        'price' => 100000,
        'quota' => 20,
        'ticket_kind' => 'single',
        'is_active' => true,
    ]);
    $otherTicket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $otherDestination->id,
        'name' => 'Tiket Destinasi Lain',
        'price' => 100000,
        'quota' => 20,
        'ticket_kind' => 'single',
        'is_active' => true,
    ]);

    $this->actingAs($partner)
        ->post('/mitra/wisata/tickets', [
            'name' => 'Paket Tidak Valid',
            'price' => 200000,
            'quota' => 5,
            'ticket_type' => 'grup',
            'ticket_kind' => 'package',
            'package_items' => [
                ['ticket_id' => $ownTicket->id, 'quantity' => 1],
                ['ticket_id' => $otherTicket->id, 'quantity' => 1],
            ],
            'is_active' => true,
            'is_closed' => false,
        ])
        ->assertSessionHasErrors('package_items');
});
