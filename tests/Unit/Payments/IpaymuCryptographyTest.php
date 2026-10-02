<?php

use App\Exceptions\PaymentGatewayException;
use App\Models\WisataBooking;
use App\Models\WisataPayment;
use App\Payments\Gateways\IpaymuPaymentGateway;
use App\Payments\IpaymuCallbackVerifier;
use App\Services\IpaymuService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

test('request signature follows the documented iPaymu API v2 algorithm', function () {
    config([
        'services.ipaymu.va' => '1179000899',
        'services.ipaymu.api_key' => 'test-api-key',
    ]);

    $body = '{"referenceId":"ORDER-1","amount":100000}';

    expect(app(IpaymuService::class)->signature('post', $body))
        ->toBe('f4101e7175f73b9b4b7e638d03781aa44041dc206c0f4636a3d13f0a8c2205b0');
});

test('callback signature rejects payload mutation and malformed signatures', function () {
    config(['services.ipaymu.va' => '1179000899']);
    $verifier = app(IpaymuCallbackVerifier::class);
    $payload = [
        'trx_id' => '4719',
        'reference_id' => 'ORDER-1',
        'amount' => '100000',
        'status_code' => '1',
        'merchant' => '1179000899',
    ];
    $signature = hash_hmac('sha256', $verifier->canonicalJson($payload), '1179000899');

    expect($verifier->verify($payload, $signature))->toBeTrue()
        ->and($verifier->verify([...$payload, 'amount' => '1'], $signature))->toBeFalse()
        ->and($verifier->verify($payload, 'not-a-signature'))->toBeFalse();
});

test('callback canonicalization is stable across key order', function () {
    config(['services.ipaymu.va' => '1179000899']);
    $verifier = app(IpaymuCallbackVerifier::class);

    expect($verifier->canonicalJson(['status_code' => '1', 'trx_id' => '99']))
        ->toBe($verifier->canonicalJson(['trx_id' => '99', 'status_code' => '1']));
});

test('redirect payment uses the server booking total and sends no secret to the result', function () {
    config([
        'services.ipaymu.environment' => 'sandbox',
        'services.ipaymu.va' => '1179000899',
        'services.ipaymu.api_key' => 'test-api-key',
        'app.url' => 'https://indotix.test',
    ]);
    Http::fake([
        'sandbox.ipaymu.com/api/v2/payment' => Http::response([
            'Status' => 200,
            'Success' => true,
            'Data' => [
                'SessionID' => 'SESSION-1',
                'Url' => 'https://sandbox-payment.ipaymu.com/payment/SESSION-1',
            ],
        ]),
    ]);
    $booking = new WisataBooking([
        'booking_code' => 'WISATA-UNIT-1',
        'total_price' => 100000,
        'guest_name' => 'Buyer',
        'guest_email' => 'buyer@example.test',
        'guest_phone' => '081234567890',
    ]);
    $payment = new WisataPayment(['order_id' => 'WISATA-UNIT-ORDER-1']);

    $result = app(IpaymuPaymentGateway::class)->create($booking, $payment);

    expect($result->amount)->toBe(100000)
        ->and($result->paymentUrl)->toBe('https://sandbox-payment.ipaymu.com/payment/SESSION-1')
        ->and(json_encode($result->raw))->not->toContain('test-api-key');
    Http::assertSent(function ($request) {
        $body = json_decode($request->body(), true);

        return $body['price'] === ['100000']
            && $body['referenceId'] === 'WISATA-UNIT-ORDER-1'
            && $request->hasHeader('signature')
            && ! str_contains($request->body(), 'test-api-key');
    });
});

test('payment creation does not retry an ambiguous network failure', function () {
    config([
        'services.ipaymu.environment' => 'sandbox',
        'services.ipaymu.va' => '1179000899',
        'services.ipaymu.api_key' => 'test-api-key',
    ]);
    $attempts = 0;
    Http::fake(function () use (&$attempts) {
        $attempts++;
        throw new ConnectionException('timeout');
    });
    $booking = new WisataBooking([
        'booking_code' => 'WISATA-UNIT-2',
        'total_price' => 100000,
        'guest_name' => 'Buyer',
        'guest_email' => 'buyer@example.test',
        'guest_phone' => '081234567890',
    ]);
    $payment = new WisataPayment(['order_id' => 'WISATA-UNIT-ORDER-2']);

    expect(fn () => app(IpaymuPaymentGateway::class)->create($booking, $payment))
        ->toThrow(PaymentGatewayException::class, 'network result is unknown');
    expect($attempts)->toBe(1);
});

test('payment creation rejects an untrusted provider redirect URL', function () {
    config([
        'services.ipaymu.environment' => 'sandbox',
        'services.ipaymu.va' => '1179000899',
        'services.ipaymu.api_key' => 'test-api-key',
    ]);
    Http::fake([
        '*' => Http::response([
            'Status' => 200,
            'Success' => true,
            'Data' => ['SessionID' => 'SESSION-1', 'Url' => 'https://attacker.test/pay'],
        ]),
    ]);
    $booking = new WisataBooking([
        'booking_code' => 'WISATA-UNIT-3',
        'total_price' => 100000,
        'guest_name' => 'Buyer',
        'guest_email' => 'buyer@example.test',
        'guest_phone' => '081234567890',
    ]);
    $payment = new WisataPayment(['order_id' => 'WISATA-UNIT-ORDER-3']);

    expect(fn () => app(IpaymuPaymentGateway::class)->create($booking, $payment))
        ->toThrow(PaymentGatewayException::class, 'untrusted payment URL');
});

test('unexpected escrow status never triggers paid fulfillment', function () {
    config([
        'services.ipaymu.environment' => 'sandbox',
        'services.ipaymu.va' => '1179000899',
        'services.ipaymu.api_key' => 'test-api-key',
    ]);
    Http::fake([
        'sandbox.ipaymu.com/api/v2/transaction' => Http::response([
            'Status' => 200,
            'Success' => true,
            'Data' => [
                'TransactionId' => 4719,
                'ReferenceId' => 'WISATA-UNIT-ORDER-4',
                'Amount' => 100000,
                'Status' => 7,
            ],
        ]),
    ]);

    $result = app(IpaymuPaymentGateway::class)->statusByTransactionId('4719');

    expect($result->providerStatus)->toBe('7')
        ->and($result->internalStatus)->toBe('unknown');
});
