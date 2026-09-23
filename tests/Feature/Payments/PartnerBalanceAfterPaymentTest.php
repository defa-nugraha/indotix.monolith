<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataBooking;
use App\Models\WisataCommissionRule;
use App\Models\WisataPayment;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    Mail::fake();
    Queue::fake();
});

function partnerBalanceMidtransPayload(string $orderId, int $grossAmount): array
{
    config(['services.midtrans.server_key' => 'test-server-key']);
    $grossAmountText = number_format($grossAmount, 2, '.', '');

    return [
        'order_id' => $orderId,
        'status_code' => '200',
        'gross_amount' => $grossAmountText,
        'signature_key' => hash('sha512', $orderId.'200'.$grossAmountText.'test-server-key'),
        'transaction_status' => 'settlement',
        'payment_type' => 'bank_transfer',
        'transaction_id' => 'trx-'.$orderId,
    ];
}

test('wisata ticket purchase is included in wisata partner sales balance after successful payment', function () {
    $buyer = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);
    $mitra = User::factory()->create(['role' => 'mitra', 'mitra_onboarding_type' => 'wisata', 'email_verified_at' => now()]);
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $mitra->id,
        'current_step' => 3,
        'destination_name' => 'Wisata Saldo Test',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
    ]);
    WisataCommissionRule::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'type' => 'percentage',
        'value' => 10,
        'is_forever' => true,
    ]);
    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Wisata',
        'price' => 75000,
        'quota' => 100,
        'is_active' => true,
    ]);
    $booking = WisataBooking::query()->create([
        'user_id' => $buyer->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-PARTNER-BALANCE-1',
        'visit_date' => now()->addDay()->toDateString(),
        'quantity' => 3,
        'unit_price' => 75000,
        'total_price' => 225000,
        'status' => 'pending_payment',
        'payment_status' => 'pending',
        'payment_deadline' => now()->addMinutes(15),
        'midtrans_order_id' => 'WISATA-PARTNER-BALANCE-1',
    ]);
    WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'pending',
        'gross_amount' => 225000,
        'order_id' => 'WISATA-PARTNER-BALANCE-1',
    ]);

    $this->withoutMiddleware()
        ->post('/payments/midtrans/callback', partnerBalanceMidtransPayload('WISATA-PARTNER-BALANCE-1', 225000))
        ->assertOk();

    $booking->refresh();
    expect($booking->status)->toBe('paid')
        ->and($booking->total_price)->toBe(225000);

    $this->actingAs($mitra)
        ->get('/mitra/wisata/finance/summary')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('mitra/wisata/finance/summary')
            ->where('summary.bookings_count', 1)
            ->where('summary.gross', fn ($value) => (int) $value === 225000)
            ->where('summary.commission', fn ($value) => (int) $value === 22500)
            ->where('summary.net', fn ($value) => (int) $value === 202500)
        );
});
