<?php

use App\Http\Controllers\MidtransCallbackController;
use App\Services\MidtransService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

test('signed dashboard notification probe is acknowledged without database access', function () {
    config(['services.midtrans.server_key' => 'probe-test-key']);
    $orderId = 'payment_notif_test_G106088247_02edc0df-c050-4c3c-a67e-3613d73c45d3';
    DB::shouldReceive('connection')->never();

    $response = app(MidtransCallbackController::class)(Request::create('/', 'POST', [
        'order_id' => $orderId,
        'merchant_id' => 'G106088247',
        'status_code' => '200',
        'gross_amount' => '105000.00',
        'transaction_status' => 'settlement',
        'signature_key' => hash('sha512', $orderId.'200105000.00probe-test-key'),
    ]), app(MidtransService::class));

    expect($response->getStatusCode())->toBe(200)
        ->and($response->getContent())->toBe('OK');
});

test('dashboard probe cannot bypass signature validation after a key change', function () {
    config(['services.midtrans.server_key' => 'new-key']);
    $orderId = 'payment_notif_test_G106088247_02edc0df-c050-4c3c-a67e-3613d73c45d3';
    DB::shouldReceive('connection')->never();

    $response = app(MidtransCallbackController::class)(Request::create('/', 'POST', [
        'order_id' => $orderId,
        'merchant_id' => 'G106088247',
        'status_code' => '200',
        'gross_amount' => '105000.00',
        'signature_key' => hash('sha512', $orderId.'200105000.00old-key'),
    ]), app(MidtransService::class));

    expect($response->getStatusCode())->toBe(400)
        ->and($response->getContent())->toBe('Invalid signature');
});
