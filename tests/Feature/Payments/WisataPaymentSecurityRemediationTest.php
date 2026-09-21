<?php

use App\Exceptions\PaymentGatewayException;
use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateCommissionItem;
use App\Models\WisataBooking;
use App\Models\WisataPayment;
use App\Models\WisataPaymentSideEffect;
use App\Models\WisataPayout;
use App\Models\WisataPayoutAdjustment;
use App\Models\WisataRefund;
use App\Models\WisataTicket;
use App\Services\MidtransService;
use App\Services\WisataFinanceService;
use App\Services\WisataPaymentLifecycleService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function () {
    Mail::fake();
    Queue::fake();
});

function paymentSecurityFixture(array $bookingOverrides = []): array
{
    $mitra = User::factory()->create([
        'role' => 'mitra',
        'email_verified_at' => now(),
        'mitra_onboarding_type' => 'wisata',
    ]);
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $mitra->id,
        'destination_name' => 'Wisata Payment Security',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);
    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Security',
        'price' => 100000,
        'quota' => 10,
        'daily_quota' => 10,
        'is_entry_ticket' => true,
        'is_active' => true,
        'is_closed' => false,
    ]);
    $buyer = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);

    $booking = WisataBooking::query()->create(array_merge([
        'user_id' => $buyer->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-SEC-'.str()->upper(str()->random(10)),
        'visit_date' => now()->addDays(2)->toDateString(),
        'quantity' => 1,
        'unit_price' => 100000,
        'subtotal_price' => 100000,
        'total_price' => 100000,
        'status' => 'pending_payment',
        'payment_status' => 'pending',
        'payment_deadline' => now()->addMinutes(20),
        'guest_name' => 'Payment Security User',
        'guest_email' => 'payment-security@example.com',
        'guest_phone' => '081234567890',
    ], $bookingOverrides));

    $booking->items()->create([
        'wisata_ticket_id' => $ticket->id,
        'ticket_name' => $ticket->name,
        'quantity' => 1,
        'unit_price' => 100000,
        'subtotal' => 100000,
    ]);

    return [$buyer, $mitra, $destination, $ticket, $booking];
}

function paymentLifecycle(MidtransService $gateway): WisataPaymentLifecycleService
{
    return new WisataPaymentLifecycleService($gateway, new WisataFinanceService());
}

test('concurrent payment creation is idempotent for the same booking', function () {
    [, , , , $booking] = paymentSecurityFixture();

    $gateway = Mockery::mock(MidtransService::class);
    $gateway->shouldReceive('snap')
        ->once()
        ->andReturn([
            'token' => 'one-snap-token',
            'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v4/redirection/test',
            'transaction_id' => 'trx-idempotent',
        ]);

    $service = paymentLifecycle($gateway);
    $first = $service->createOrGetSnapPayment($booking);
    $second = $service->createOrGetSnapPayment($booking->fresh());

    expect($first->id)->toBe($second->id)
        ->and($second->payload['token'])->toBe('one-snap-token')
        ->and(WisataPayment::query()->where('wisata_booking_id', $booking->id)->count())->toBe(1)
        ->and(WisataPayment::query()->whereNotNull('active_key')->where('wisata_booking_id', $booking->id)->count())->toBe(1);
});

test('database active payment key prevents a second active payment attempt', function () {
    [, , , , $booking] = paymentSecurityFixture();

    WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'pending',
        'gross_amount' => 100000,
        'order_id' => 'WISATA-ACTIVE-1',
        'active_key' => 'wisata-booking-'.$booking->id,
    ]);

    expect(fn () => WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'pending',
        'gross_amount' => 100000,
        'order_id' => 'WISATA-ACTIVE-2',
        'active_key' => 'wisata-booking-'.$booking->id,
    ]))->toThrow(QueryException::class);
});

test('pending payment cancellation is synchronized with provider before local cancellation', function () {
    [, , , , $booking] = paymentSecurityFixture();
    $payment = WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'pending',
        'gross_amount' => 100000,
        'payment_type' => 'snap',
        'order_id' => 'WISATA-CANCEL-1',
        'active_key' => 'wisata-booking-'.$booking->id,
    ]);
    $booking->update(['midtrans_order_id' => $payment->order_id]);

    $gateway = Mockery::mock(MidtransService::class);
    $gateway->shouldReceive('statusOrNull')->once()->with('WISATA-CANCEL-1')->andReturn([
        'status_code' => '201',
        'transaction_status' => 'pending',
    ]);
    $gateway->shouldReceive('cancel')->once()->with('WISATA-CANCEL-1')->andReturn([
        'status_code' => '200',
        'transaction_status' => 'cancel',
    ]);

    paymentLifecycle($gateway)->cancelBooking($booking, 'User membatalkan');

    expect($booking->fresh()->status)->toBe('cancelled')
        ->and($booking->fresh()->payment_status)->toBe('cancel')
        ->and($payment->fresh()->status)->toBe('cancel')
        ->and($payment->fresh()->active_key)->toBeNull();
});

test('already settled transaction cannot be incorrectly cancelled', function () {
    [, , , , $booking] = paymentSecurityFixture();
    $payment = WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'pending',
        'gross_amount' => 100000,
        'order_id' => 'WISATA-CANCEL-PAID',
        'active_key' => 'wisata-booking-'.$booking->id,
    ]);

    $gateway = Mockery::mock(MidtransService::class);
    $gateway->shouldReceive('statusOrNull')->once()->andReturn([
        'status_code' => '200',
        'transaction_status' => 'settlement',
        'payment_type' => 'bank_transfer',
        'transaction_id' => 'trx-paid',
    ]);
    $gateway->shouldNotReceive('cancel');

    expect(fn () => paymentLifecycle($gateway)->cancelBooking($booking, 'cancel'))
        ->toThrow(RuntimeException::class);

    expect($booking->fresh()->status)->toBe('paid')
        ->and($payment->fresh()->status)->toBe('settlement');
});

test('expired pending booking is released while paid booking is never expired', function () {
    [, , , , $expired] = paymentSecurityFixture([
        'payment_deadline' => now()->subMinute(),
    ]);

    $gateway = Mockery::mock(MidtransService::class);
    $service = paymentLifecycle($gateway);

    $service->expireBooking($expired);
    expect($expired->fresh()->status)->toBe('expired');

    [, , , , $paid] = paymentSecurityFixture([
        'status' => 'paid',
        'payment_status' => 'settlement',
        'payment_deadline' => now()->subMinute(),
    ]);

    $service->expireBooking($paid);
    expect($paid->fresh()->status)->toBe('paid');
});

test('expired pending booking no longer consumes public ticket quota', function () {
    [$buyer, , $destination, $ticket] = paymentSecurityFixture([
        'payment_deadline' => now()->subMinute(),
    ]);

    $this->actingAs($buyer, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', [
            'destination_id' => (string) $destination->id,
            'ticket_id' => (string) $ticket->id,
            'visit_date' => now()->addDays(2)->toDateString(),
            'quantity' => 10,
        ])
        ->assertOk()
        ->assertJsonPath('pricing.total', 1000000);
});

test('valid full refund is provider confirmed and duplicate request is idempotent', function () {
    [, , , , $booking] = paymentSecurityFixture([
        'status' => 'paid',
        'payment_status' => 'settlement',
        'payment_deadline' => null,
    ]);
    $payment = WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'settlement',
        'gross_amount' => 100000,
        'payment_type' => 'bank_transfer',
        'transaction_id' => 'trx-refund',
        'order_id' => 'WISATA-REFUND-1',
    ]);

    $gateway = Mockery::mock(MidtransService::class);
    $gateway->shouldReceive('statusOrNull')->once()->andReturn([
        'status_code' => '200',
        'transaction_status' => 'settlement',
    ]);
    $gateway->shouldReceive('refund')->once()->andReturn([
        'status_code' => '200',
        'transaction_status' => 'refund',
        'refund_amount' => '100000',
        'bank_confirmed_at' => now()->toIso8601String(),
        'refund_chargeback_id' => 'refund-provider-1',
    ]);

    $service = paymentLifecycle($gateway);
    $first = $service->requestFullRefund($booking, 'Customer request', null, User::factory()->create(['role' => 'admin'])->id);
    $second = $service->requestFullRefund($booking->fresh(), 'Duplicate request', null, User::factory()->create(['role' => 'admin'])->id);

    expect($first->id)->toBe($second->id)
        ->and($first->status)->toBe('processed')
        ->and($booking->fresh()->refund_status)->toBe('processed')
        ->and((int) $booking->fresh()->refund_amount)->toBe(100000)
        ->and(WisataRefund::query()->where('wisata_booking_id', $booking->id)->count())->toBe(1)
        ->and($payment->fresh()->status)->toBe('settlement');
});

test('refund confirmation must match the current refund key', function () {
    [, , , , $booking] = paymentSecurityFixture([
        'status' => 'paid',
        'payment_status' => 'settlement',
        'payment_deadline' => null,
        'refund_status' => 'pending',
    ]);

    $payment = WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'settlement',
        'gross_amount' => 100000,
        'payment_type' => 'bank_transfer',
        'transaction_id' => 'trx-refund-key-match',
        'order_id' => 'WISATA-REFUND-KEY-MATCH',
    ]);

    $refund = WisataRefund::query()->create([
        'wisata_booking_id' => $booking->id,
        'wisata_payment_id' => $payment->id,
        'refund_key' => 'TARGET-REFUND-KEY',
        'amount' => 100000,
        'status' => 'processing',
        'provider_action' => 'refund',
    ]);

    $gateway = Mockery::mock(MidtransService::class);
    $gateway->shouldReceive('statusOrNull')->once()->andReturn([
        'status_code' => '200',
        'transaction_status' => 'refund',
        'refund_amount' => '200000.00',
        'refunds' => [
            [
                'refund_key' => 'HISTORICAL-REFUND-KEY',
                'refund_amount' => '100000.00',
                'bank_confirmed_at' => now()->subMinute()->toDateTimeString(),
            ],
            [
                'refund_key' => 'TARGET-REFUND-KEY',
                'refund_amount' => '100000.00',
            ],
        ],
    ]);
    $gateway->shouldNotReceive('refund');

    expect(fn () => paymentLifecycle($gateway)->processRefund($refund))
        ->toThrow(RuntimeException::class);

    expect($refund->fresh()->status)->toBe('unknown')
        ->and($booking->fresh()->refund_status)->toBe('pending');
});

test('refund confirmation rejects fractional IDR amounts instead of float rounding', function () {
    [, , , , $booking] = paymentSecurityFixture([
        'status' => 'paid',
        'payment_status' => 'settlement',
        'payment_deadline' => null,
        'refund_status' => 'pending',
    ]);

    $payment = WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'settlement',
        'gross_amount' => 100000,
        'payment_type' => 'bank_transfer',
        'transaction_id' => 'trx-refund-exact-amount',
        'order_id' => 'WISATA-REFUND-EXACT-AMOUNT',
    ]);

    $refund = WisataRefund::query()->create([
        'wisata_booking_id' => $booking->id,
        'wisata_payment_id' => $payment->id,
        'refund_key' => 'EXACT-REFUND-KEY',
        'amount' => 100000,
        'status' => 'processing',
        'provider_action' => 'refund',
    ]);

    $gateway = Mockery::mock(MidtransService::class);
    $gateway->shouldReceive('statusOrNull')->once()->andReturn([
        'status_code' => '200',
        'transaction_status' => 'refund',
        'refunds' => [
            [
                'refund_key' => 'EXACT-REFUND-KEY',
                'refund_amount' => '99999.99',
                'bank_confirmed_at' => now()->toDateTimeString(),
            ],
        ],
    ]);
    $gateway->shouldNotReceive('refund');

    expect(fn () => paymentLifecycle($gateway)->processRefund($refund))
        ->toThrow(RuntimeException::class);

    expect($refund->fresh()->status)->toBe('unknown')
        ->and($booking->fresh()->refund_status)->toBe('pending');
});

test('refund rejects unpaid booking and amount above paid amount', function () {
    [, , , , $unpaid] = paymentSecurityFixture();
    $gateway = Mockery::mock(MidtransService::class);
    $service = paymentLifecycle($gateway);

    expect(fn () => $service->requestFullRefund($unpaid, 'invalid', null, User::factory()->create(['role' => 'admin'])->id))
        ->toThrow(RuntimeException::class);

    [, , , , $paid] = paymentSecurityFixture([
        'status' => 'paid',
        'payment_status' => 'settlement',
    ]);
    WisataPayment::query()->create([
        'wisata_booking_id' => $paid->id,
        'provider' => 'midtrans',
        'status' => 'settlement',
        'gross_amount' => 100000,
        'order_id' => 'WISATA-REFUND-LIMIT',
    ]);

    expect(fn () => $service->requestFullRefund($paid, 'too much', 100001, User::factory()->create(['role' => 'admin'])->id))
        ->toThrow(RuntimeException::class);
});

test('provider refund failure never marks refund processed', function () {
    [, , , , $booking] = paymentSecurityFixture([
        'status' => 'paid',
        'payment_status' => 'settlement',
    ]);
    WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'settlement',
        'gross_amount' => 100000,
        'order_id' => 'WISATA-REFUND-FAIL',
    ]);

    $gateway = Mockery::mock(MidtransService::class);
    $gateway->shouldReceive('statusOrNull')->once()->andReturn([
        'status_code' => '200',
        'transaction_status' => 'settlement',
    ]);
    $gateway->shouldReceive('refund')->once()->andThrow(new PaymentGatewayException('provider failed', 500, []));

    expect(fn () => paymentLifecycle($gateway)->requestFullRefund(
        $booking,
        'provider fail',
        null,
        User::factory()->create(['role' => 'admin'])->id,
    ))->toThrow(PaymentGatewayException::class);

    expect($booking->fresh()->refund_status)->toBe('rejected')
        ->and(WisataRefund::query()->where('wisata_booking_id', $booking->id)->value('status'))->toBe('failed');
});

test('missing webhook is recovered by reconciliation and reconciliation is idempotent', function () {
    [, , , , $booking] = paymentSecurityFixture();
    $payment = WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'unknown',
        'gross_amount' => 100000,
        'order_id' => 'WISATA-RECONCILE-1',
        'active_key' => 'wisata-booking-'.$booking->id,
    ]);

    $gateway = Mockery::mock(MidtransService::class);
    $gateway->shouldReceive('statusOrNull')->twice()->andReturn([
        'status_code' => '200',
        'transaction_status' => 'settlement',
        'payment_type' => 'bank_transfer',
        'transaction_id' => 'trx-reconcile',
    ]);

    $service = paymentLifecycle($gateway);
    $service->reconcile($payment);
    $service->reconcile($payment->fresh());

    expect($booking->fresh()->status)->toBe('paid')
        ->and($payment->fresh()->status)->toBe('settlement');
});

test('processed refund reverses affiliate commission and creates clawback for paid payout', function () {
    [, , $destination, , $booking] = paymentSecurityFixture([
        'status' => 'paid',
        'payment_status' => 'settlement',
        'visit_date' => now()->toDateString(),
    ]);
    $payment = WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'settlement',
        'gross_amount' => 100000,
        'order_id' => 'WISATA-REFUND-PAYOUT',
    ]);

    $affiliateUser = User::factory()->create(['role' => 'user']);
    $affiliate = WisataAffiliate::query()->create([
        'user_id' => $affiliateUser->id,
        'name' => 'Affiliate Security',
        'email' => 'affiliate-security@example.com',
        'status' => 'active',
    ]);
    $commission = WisataAffiliateCommissionItem::query()->create([
        'affiliate_id' => $affiliate->id,
        'wisata_booking_id' => $booking->id,
        'commission_amount' => 10000,
        'status' => 'approved',
    ]);
    WisataPayout::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'idempotency_key' => 'paid-payout-security',
        'period_start' => now()->subDay()->toDateString(),
        'period_end' => now()->addDay()->toDateString(),
        'total_gmv' => 100000,
        'commission_amount' => 10000,
        'net_payout' => 90000,
        'status' => 'paid',
    ]);

    $gateway = Mockery::mock(MidtransService::class);
    $gateway->shouldReceive('statusOrNull')->once()->andReturn([
        'status_code' => '200',
        'transaction_status' => 'settlement',
    ]);
    $gateway->shouldReceive('refund')->once()->andReturn([
        'status_code' => '200',
        'transaction_status' => 'refund',
        'refund_amount' => '100000',
        'bank_confirmed_at' => now()->toIso8601String(),
    ]);

    paymentLifecycle($gateway)->requestFullRefund(
        $booking,
        'Refund after payout',
        null,
        User::factory()->create(['role' => 'admin'])->id,
    );

    expect($commission->fresh()->status)->toBe('cancelled')
        ->and(WisataPayoutAdjustment::query()->where('wisata_booking_id', $booking->id)->count())->toBe(1)
        ->and((int) WisataPayoutAdjustment::query()->where('wisata_booking_id', $booking->id)->value('amount'))->toBe(90000);
});


test('wisata signed webhook replay does not duplicate fulfillment', function () {
    [$buyer, , , , $booking] = paymentSecurityFixture();
    $payment = WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'pending',
        'gross_amount' => 100000,
        'order_id' => 'WISATA-WEBHOOK-REPLAY',
        'active_key' => 'wisata-booking-'.$booking->id,
    ]);
    $booking->update(['midtrans_order_id' => $payment->order_id]);
    config(['services.midtrans.server_key' => 'test-server-key']);

    $payload = [
        'order_id' => $payment->order_id,
        'status_code' => '200',
        'gross_amount' => '100000.00',
        'transaction_status' => 'settlement',
        'payment_type' => 'bank_transfer',
        'transaction_id' => 'trx-webhook-replay',
    ];
    $payload['signature_key'] = hash(
        'sha512',
        $payload['order_id'].$payload['status_code'].$payload['gross_amount'].'test-server-key',
    );

    $this->post('/payments/midtrans/callback', $payload)->assertOk();
    $this->post('/payments/midtrans/callback', $payload)->assertOk();

    expect($booking->fresh()->status)->toBe('paid')
        ->and($payment->fresh()->status)->toBe('settlement')
        ->and($payment->fresh()->notification_dispatched_at)->not->toBeNull()
        ->and(\App\Models\UserNotification::query()
            ->where('user_id', $buyer->id)
            ->where('type', 'wisata_payment_paid')
            ->count())->toBe(1)
        ->and(WisataPaymentSideEffect::query()
            ->where('wisata_payment_id', $payment->id)
            ->count())->toBe(3)
        ->and(WisataPaymentSideEffect::query()
            ->where('wisata_payment_id', $payment->id)
            ->whereNotNull('completed_at')
            ->count())->toBe(3);

    Queue::assertPushed(\App\Jobs\SendPushNotificationJob::class, 1);
    Mail::assertSent(\App\Mail\WisataTicketMail::class, 1);
});

test('paid side effect claim prevents concurrent duplicate dispatch and stale claim can recover', function () {
    [$buyer, , , , $booking] = paymentSecurityFixture([
        'status' => 'paid',
        'payment_status' => 'settlement',
        'payment_deadline' => null,
    ]);

    $payment = WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'settlement',
        'gross_amount' => 100000,
        'payment_type' => 'bank_transfer',
        'transaction_id' => 'trx-side-effect-claim',
        'order_id' => 'WISATA-SIDE-EFFECT-CLAIM',
    ]);

    WisataPaymentSideEffect::query()->create([
        'wisata_payment_id' => $payment->id,
        'effect_type' => 'push',
        'status' => 'processing',
        'attempts' => 1,
        'claimed_at' => now(),
    ]);

    $service = paymentLifecycle(Mockery::mock(MidtransService::class));
    $service->dispatchPendingPaidSideEffects();

    Queue::assertNotPushed(\App\Jobs\SendPushNotificationJob::class);
    expect($payment->fresh()->notification_dispatched_at)->toBeNull()
        ->and(WisataPaymentSideEffect::query()
            ->where('wisata_payment_id', $payment->id)
            ->where('effect_type', 'push')
            ->value('status'))->toBe('processing')
        ->and(\App\Models\UserNotification::query()
            ->where('user_id', $buyer->id)
            ->where('type', 'wisata_payment_paid')
            ->count())->toBe(1);

    WisataPaymentSideEffect::query()
        ->where('wisata_payment_id', $payment->id)
        ->where('effect_type', 'push')
        ->update(['claimed_at' => now()->subMinutes(11)]);

    $service->dispatchPendingPaidSideEffects();

    Queue::assertPushed(\App\Jobs\SendPushNotificationJob::class, 1);
    expect($payment->fresh()->notification_dispatched_at)->not->toBeNull()
        ->and(WisataPaymentSideEffect::query()
            ->where('wisata_payment_id', $payment->id)
            ->whereNotNull('completed_at')
            ->count())->toBe(3);
});

test('late settlement never reactivates a cancelled wisata booking and queues compensation', function () {
    [, , , , $booking] = paymentSecurityFixture([
        'status' => 'cancelled',
        'payment_status' => 'cancel',
        'cancelled_at' => now(),
    ]);
    $payment = WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'pending',
        'gross_amount' => 100000,
        'order_id' => 'WISATA-LATE-SETTLEMENT',
    ]);
    $booking->update(['midtrans_order_id' => $payment->order_id]);
    config(['services.midtrans.server_key' => 'test-server-key']);

    $payload = [
        'order_id' => $payment->order_id,
        'status_code' => '200',
        'gross_amount' => '100000.00',
        'transaction_status' => 'settlement',
        'payment_type' => 'bank_transfer',
        'transaction_id' => 'trx-late',
    ];
    $payload['signature_key'] = hash(
        'sha512',
        $payload['order_id'].$payload['status_code'].$payload['gross_amount'].'test-server-key',
    );

    $this->post('/payments/midtrans/callback', $payload)->assertOk();

    expect($booking->fresh()->status)->toBe('cancelled')
        ->and($booking->fresh()->refund_status)->toBe('pending')
        ->and($payment->fresh()->status)->toBe('settlement')
        ->and(WisataRefund::query()->where('wisata_booking_id', $booking->id)->value('status'))->toBe('pending');
});

test('provider cancellation failure keeps booking non terminal for reconciliation', function () {
    [, , , , $booking] = paymentSecurityFixture();
    $payment = WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'pending',
        'gross_amount' => 100000,
        'order_id' => 'WISATA-CANCEL-UNKNOWN',
        'active_key' => 'wisata-booking-'.$booking->id,
    ]);

    $gateway = Mockery::mock(MidtransService::class);
    $gateway->shouldReceive('statusOrNull')->once()->andReturn([
        'status_code' => '201',
        'transaction_status' => 'pending',
    ]);
    $gateway->shouldReceive('cancel')->once()->andThrow(
        new PaymentGatewayException('network timeout', 0, []),
    );

    expect(fn () => paymentLifecycle($gateway)->cancelBooking($booking, 'cancel'))
        ->toThrow(PaymentGatewayException::class);

    expect($booking->fresh()->status)->toBe('pending_payment')
        ->and($payment->fresh()->status)->toBe('cancellation_unknown');
});

test('normal user cannot invoke admin wisata refund endpoint', function () {
    [$user, , , , $booking] = paymentSecurityFixture([
        'status' => 'paid',
        'payment_status' => 'settlement',
    ]);

    $this->actingAs($user)
        ->post(route('admin.wisata.bookings.refund', $booking), [
            'reason' => 'unauthorized',
        ])
        ->assertRedirect(route('dashboard'));
});
