<?php

use App\Payments\IpaymuCallbackVerifier;

it('verifies iPaymu documented callback signature normalization', function () {
        $payload = [
        'trx_id' => '237141',
        'sid' => 'e6b72b57-58f6-4a7c-b65d-5235fdcc6ed6',
        'reference_id' => 'WISATA-46-01M3XQ404105551NRYW2KYPM9N',
        'status' => 'berhasil',
        'status_code' => '1',
        'sub_total' => '60000',
        'total' => '61080',
        'amount' => '61080',
        'fee' => '1380',
        'paid_off' => '59700',
        'created_at' => '2026-10-02 14:09:22',
        'expired_at' => '2026-10-02 15:09:22',
        'paid_at' => '2026-10-02 14:09:34',
        'settlement_status' => 'settled',
        'transaction_status_code' => '7',
        'is_escrow' => 'true',
        'system_notes' => 'Sandbox notify',
        'via' => 'qris',
        'channel' => 'qris',
        'payment_no' => '',
        'buyer_name' => 'user@indotix.id',
        'buyer_email' => 'user@indotix.id',
        'buyer_phone' => '0895386109689',
        'additional_info' => '[]',
        'url' => 'https://staging.indotix.co.id/payments/ipaymu/callback',
    ];

    $verifier = new IpaymuCallbackVerifier('123456');
    $signature = hash_hmac('sha256', $verifier->canonicalJson($payload), '123456');

    expect($verifier->verify($payload, $signature))->toBeTrue();
    expect($verifier->verify($payload, str_repeat('0', 64)))->toBeFalse();
});

it('verifies iPaymu form callback when sandbox preserves raw additional_info and is_escrow values', function () {
    config(['services.ipaymu.va' => '123456']);

    $payload = [
        'trx_id' => '237141',
        'status_code' => '1',
        'transaction_status_code' => '7',
        'paid_off' => '59700',
        'is_escrow' => 'true',
        'additional_info' => '[]',
        'url' => 'https://staging.indotix.co.id/payments/ipaymu/callback',
    ];

    $verifier = app(IpaymuCallbackVerifier::class);
    $compatibility = $verifier->normalize($payload);
    $compatibility['is_escrow'] = 'true';
    $compatibility['additional_info'] = '[]';
    ksort($compatibility, SORT_STRING);

    $signature = hash_hmac(
        'sha256',
        json_encode($compatibility, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        '123456',
    );

    expect($verifier->verify($payload, $signature))->toBeTrue();
});
