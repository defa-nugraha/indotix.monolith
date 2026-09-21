<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataBooking;
use App\Models\WisataPayment;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function transactionFinishFixture(): array
{
    $mitra = User::factory()->create(['role' => 'mitra', 'email_verified_at' => now()]);
    $buyer = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $mitra->id,
        'destination_name' => 'Wisata Pembayaran',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
    ]);
    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Reguler',
        'price' => 50000,
        'quota' => 10,
        'is_active' => true,
    ]);
    $booking = WisataBooking::query()->create([
        'user_id' => $buyer->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-FINISH-'.str()->upper(str()->random(10)),
        'visit_date' => now()->addDay()->toDateString(),
        'quantity' => 1,
        'unit_price' => 50000,
        'total_price' => 50000,
        'status' => 'paid',
        'payment_status' => 'settlement',
    ]);
    $payment = WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'settlement',
        'gross_amount' => 50000,
        'order_id' => 'WISATA-FINISH-'.str()->upper(str()->random(16)),
    ]);

    return [$buyer, $booking, $payment];
}

test('buyer sees the successful transaction page only for their paid wisata order', function () {
    [$buyer, $booking, $payment] = transactionFinishFixture();

    $this->actingAs($buyer)
        ->get('/transaction/finish?order_id='.$payment->order_id.'&status_code=200&transaction_status=settlement')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/transaction/finish')
            ->where('transaction.is_paid', true)
            ->where('transaction.order_id', $payment->order_id)
            ->where('transaction.booking_code', $booking->booking_code));
});

test('another user cannot view a transaction finish page they do not own', function () {
    [, , $payment] = transactionFinishFixture();
    $otherBuyer = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);

    $this->actingAs($otherBuyer)
        ->get('/transaction/finish?order_id='.$payment->order_id)
        ->assertNotFound();
});
