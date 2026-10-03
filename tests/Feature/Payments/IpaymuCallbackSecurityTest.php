<?php

use App\Models\MitraWisataOnboarding;
use App\Models\PaymentWebhookEvent;
use App\Models\User;
use App\Models\WisataBooking;
use App\Models\WisataPayment;
use App\Models\WisataPaymentSideEffect;
use App\Models\WisataRefund;
use App\Models\WisataTicket;
use App\Payments\IpaymuCallbackVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'services.ipaymu.environment' => 'sandbox',
        'services.ipaymu.va' => '1179000899',
        'services.ipaymu.api_key' => 'test-api-key',
    ]);
    Mail::fake();
    Queue::fake();
});

function ipaymuPaymentFixture(int $amount = 100000): array
{
    $partner = User::factory()->create(['role' => 'mitra', 'email_verified_at' => now()]);
    $buyer = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $partner->id,
        'destination_name' => 'Wisata iPaymu',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);
    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket iPaymu',
        'price' => $amount,
        'quota' => 10,
        'daily_quota' => 10,
        'is_entry_ticket' => true,
        'is_active' => true,
        'is_closed' => false,
    ]);
    $booking = WisataBooking::query()->create([
        'user_id' => $buyer->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-IPAYMU-'.str()->upper(str()->random(8)),
        'visit_date' => now()->addDays(2)->toDateString(),
        'quantity' => 1,
        'unit_price' => $amount,
        'subtotal_price' => $amount,
        'total_price' => $amount,
        'status' => 'pending_payment',
        'payment_status' => 'pending',
        'payment_deadline' => now()->addHour(),
        'guest_name' => 'iPaymu Buyer',
        'guest_email' => 'ipaymu@example.test',
        'guest_phone' => '081234567890',
    ]);
    $payment = WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'ipaymu',
        'status' => '0',
        'internal_status' => 'pending',
        'gross_amount' => $amount,
        'provider_amount' => $amount,
        'payment_type' => 'redirect',
        'order_id' => 'WISATA-'.$booking->id.'-'.str()->ulid(),
        'active_key' => 'wisata-booking-'.$booking->id,
        'payment_url' => 'https://sandbox.ipaymu.com/payment/test',
    ]);

    return [$booking, $payment];
}

function ipaymuCallbackPayload(WisataPayment $payment, int $amount = 100000, int $status = 1): array
{
    return [
        'trx_id' => '4719',
        'sid' => 'SESSION-1',
        'reference_id' => $payment->order_id,
        'status_code' => (string) $status,
        'amount' => (string) $amount,
        'merchant' => '1179000899',
        'is_sandbox' => 'true',
        'via' => 'VA',
        'channel' => 'BCA',
    ];
}

function postSignedIpaymuCallback($testCase, array $payload, string $externalId = 'callback-1')
{
    $verifier = app(IpaymuCallbackVerifier::class);
    $signature = hash_hmac('sha256', $verifier->canonicalJson($payload), '1179000899');

    return $testCase->withHeaders([
        'X-Signature' => $signature,
        'X-Timestamp' => now()->toAtomString(),
        'X-External-ID' => $externalId,
    ])->postJson(route('payments.ipaymu.callback'), $payload);
}

test('valid callback confirms the trusted amount once', function () {
    [$booking, $payment] = ipaymuPaymentFixture();
    $payload = ipaymuCallbackPayload($payment);
    Http::fake([
        'sandbox.ipaymu.com/api/v2/transaction' => Http::response([
            'Status' => 200,
            'Success' => true,
            'Data' => [
                'TransactionId' => 4719,
                'ReferenceId' => $payment->order_id,
                'Amount' => 100000,
                'Fee' => 4000,
                'Status' => 1,
                'TypeDesc' => 'VA',
            ],
        ]),
    ]);

    postSignedIpaymuCallback($this, $payload)->assertOk();
    postSignedIpaymuCallback($this, $payload)->assertOk();

    expect($booking->fresh()->status)->toBe('paid')
        ->and($payment->fresh()->internal_status)->toBe('paid')
        ->and(PaymentWebhookEvent::query()->count())->toBe(1)
        ->and(WisataPaymentSideEffect::query()->where('wisata_payment_id', $payment->id)->count())->toBe(3);
    Http::assertSentCount(1);
});

test('missing or invalid callback signature cannot change payment state', function () {
    [$booking, $payment] = ipaymuPaymentFixture();
    $payload = ipaymuCallbackPayload($payment);

    $this->postJson(route('payments.ipaymu.callback'), $payload)->assertBadRequest();
    $this->withHeaders([
        'X-Signature' => str_repeat('0', 64),
        'X-Timestamp' => now()->toAtomString(),
        'X-External-ID' => 'forged',
    ])->postJson(route('payments.ipaymu.callback'), $payload)->assertBadRequest();

    expect($booking->fresh()->status)->toBe('pending_payment')
        ->and($payment->fresh()->internal_status)->toBe('pending');
});

test('signed callback with a modified amount is rejected before inquiry', function () {
    [$booking, $payment] = ipaymuPaymentFixture();
    Http::fake();

    postSignedIpaymuCallback($this, ipaymuCallbackPayload($payment, 1), 'amount-mismatch')->assertOk();

    expect($booking->fresh()->status)->toBe('pending_payment')
        ->and(PaymentWebhookEvent::query()->value('rejection_reason'))->toBe('callback_amount_mismatch');
    Http::assertNothingSent();
});

test('a callback external ID cannot be replayed with another payload', function () {
    [, $payment] = ipaymuPaymentFixture();
    Http::fake();
    $payload = ipaymuCallbackPayload($payment, 1);

    postSignedIpaymuCallback($this, $payload, 'reused-external-id')->assertOk();
    postSignedIpaymuCallback($this, [...$payload, 'amount' => '2'], 'reused-external-id')->assertStatus(409);
});

test('the same signed payload is deduplicated even when the external ID changes', function () {
    [, $payment] = ipaymuPaymentFixture();
    Http::fake();
    $payload = ipaymuCallbackPayload($payment, 1);

    postSignedIpaymuCallback($this, $payload, 'external-id-one')->assertOk();
    postSignedIpaymuCallback($this, $payload, 'external-id-two')->assertOk();

    expect(PaymentWebhookEvent::query()->count())->toBe(1);
    Http::assertNothingSent();
});

test('provider inquiry failure remains retryable instead of acknowledging fulfillment', function () {
    [$booking, $payment] = ipaymuPaymentFixture();
    Http::fake(['sandbox.ipaymu.com/*' => Http::response([], 500)]);

    postSignedIpaymuCallback($this, ipaymuCallbackPayload($payment), 'retryable-event')->assertStatus(500);

    expect($booking->fresh()->status)->toBe('pending_payment')
        ->and(PaymentWebhookEvent::query()->value('status'))->toBe('retryable');
});

test('paid payment cannot regress to pending from a late callback', function () {
    [$booking, $payment] = ipaymuPaymentFixture();
    $booking->update(['status' => 'paid', 'payment_status' => 'paid']);
    $payment->update(['transaction_id' => '4719', 'status' => '1', 'internal_status' => 'paid']);
    Http::fake([
        'sandbox.ipaymu.com/api/v2/transaction' => Http::response([
            'Status' => 200,
            'Success' => true,
            'Data' => [
                'TransactionId' => 4719,
                'ReferenceId' => $payment->order_id,
                'Amount' => 100000,
                'Status' => 0,
            ],
        ]),
    ]);

    postSignedIpaymuCallback($this, ipaymuCallbackPayload($payment, 100000, 0), 'late-pending')->assertOk();

    expect($booking->fresh()->status)->toBe('paid')
        ->and($payment->fresh()->internal_status)->toBe('paid');
});

test('authoritative refunded status records the refund exactly once', function () {
    [$booking, $payment] = ipaymuPaymentFixture();
    $booking->update(['status' => 'paid', 'payment_status' => 'paid']);
    $payment->update(['transaction_id' => '4719', 'status' => '1', 'internal_status' => 'paid']);
    Http::fake([
        'sandbox.ipaymu.com/api/v2/transaction' => Http::response([
            'Status' => 200,
            'Success' => true,
            'Data' => [
                'TransactionId' => 4719,
                'ReferenceId' => $payment->order_id,
                'Amount' => 100000,
                'Status' => 3,
            ],
        ]),
    ]);
    $payload = ipaymuCallbackPayload($payment, 100000, 3);

    postSignedIpaymuCallback($this, $payload, 'refund-one')->assertOk();
    postSignedIpaymuCallback($this, $payload, 'refund-two')->assertOk();

    expect($payment->fresh()->internal_status)->toBe('refunded')
        ->and($booking->fresh()->refund_status)->toBe('processed')
        ->and($booking->fresh()->refund_amount)->toBe(100000)
        ->and(WisataRefund::query()->where('wisata_payment_id', $payment->id)->count())->toBe(1)
        ->and(WisataRefund::query()->where('wisata_payment_id', $payment->id)->value('status'))->toBe('processed');
});

test('successful callback remains paid when inquiry reports ambiguous status 7', function () {
    [$booking, $payment] = ipaymuPaymentFixture();
    $payload = ipaymuCallbackPayload($payment);
    $payload['trx_id'] = '237262';
    $payload['status_code'] = '1';
    $payload['sub_total'] = '100000';
    $payload['total'] = '114930';
    $payload['fee'] = '14930';
    $payload['paid_off'] = 100000;
    $payload['transaction_status_code'] = '7';
    $payload['settlement_status'] = 'settled';
    $payload['is_escrow'] = 'true';

    Http::fake([
        'sandbox.ipaymu.com/api/v2/transaction' => Http::response([
            'Status' => 200,
            'Success' => true,
            'Data' => [
                'TransactionId' => 237262,
                'ReferenceId' => $payment->order_id,
                'Amount' => 100000,
                'Fee' => 14930,
                'Status' => 7,
                'TypeDesc' => 'VA',
            ],
        ]),
    ]);

    postSignedIpaymuCallback($this, $payload, 'ambiguous-inquiry-status')->assertOk();

    expect($booking->fresh()->status)->toBe('paid')
        ->and($booking->fresh()->payment_status)->toBe('paid')
        ->and($booking->fresh()->payment_deadline)->toBeNull()
        ->and($payment->fresh()->internal_status)->toBe('paid')
        ->and($payment->fresh()->transaction_id)->toBe('237262');
});
