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
    // The verifier accepts the merchant VA explicitly so this unit test does not require Laravel bootstrapping.

    $payload = [
        'trx_id' => '237141',
        'status_code' => '1',
        'transaction_status_code' => '7',
        'paid_off' => '59700',
        'is_escrow' => 'true',
        'additional_info' => '[]',
        'url' => 'https://staging.indotix.co.id/payments/ipaymu/callback',
    ];

    $verifier = new IpaymuCallbackVerifier('123456');
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


it('verifies a sandbox callback signature when the provider preserves payload insertion order', function () {
    $payload = [
        'trx_id' => '237242',
        'sid' => 'ca57ab43-0b80-4546-a5f9-0c2c1776d026',
        'reference_id' => 'WISATA-47-01M3ZNGGNXJ4PME7N6ZGXQQ06Y',
        'status' => 'berhasil',
        'status_code' => '1',
        'sub_total' => '15000',
        'total' => '15270',
        'amount' => '15270',
        'fee' => '345',
        'paid_off' => '14925',
        'created_at' => '2026-10-03 08:19:53',
        'expired_at' => '2026-10-03 09:19:53',
        'paid_at' => '2026-10-03 08:20:11',
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
    $signature = hash_hmac('sha256', json_encode(
        $verifier->normalize($payload, false),
        JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
    ), '123456');

    expect($verifier->verify($payload, $signature))->toBeTrue();
});
