<?php

use Illuminate\Support\Facades\URL;

it('accepts an iPaymu return URL after provider query parameters are appended', function () {
    $url = URL::temporarySignedRoute(
        'payments.ipaymu.return',
        now()->addMinutes(10),
        ['reference' => 'WISATA-48-01M3ZPJ9GN1HEJAR29AKWSGJGS'],
    );

    $response = $this->get($url.'&sid=1099a0dc-a74b-4086-9e88-445752ab197f&trx_id=237244&status=berhasil&tipe=QRIS&payment_method=QRIS&payment_channel=QRIS');

    $response->assertOk();
});

it('rejects an iPaymu return URL when the signed reference is tampered', function () {
    $url = URL::temporarySignedRoute(
        'payments.ipaymu.return',
        now()->addMinutes(10),
        ['reference' => 'WISATA-48-01M3ZPJ9GN1HEJAR29AKWSGJGS'],
    );

    $tamperedUrl = str_replace(
        'reference=WISATA-48-01M3ZPJ9GN1HEJAR29AKWSGJGS',
        'reference=WISATA-TAMPERED',
        $url,
    );

    $response = $this->get($tamperedUrl.'&sid=1099a0dc-a74b-4086-9e88-445752ab197f&trx_id=237244&status=berhasil');

    $response->assertForbidden();
});


it('does not trust the provider return status before server verification', function () {
    $url = URL::temporarySignedRoute(
        'payments.ipaymu.return',
        now()->addMinutes(10),
        ['reference' => 'WISATA-RETURN-UNKNOWN'],
    );

    $response = $this->get($url.'&sid=return-test&trx_id=237262&status=berhasil&tipe=va&payment_method=va&payment_channel=bag');

    $response
        ->assertOk()
        ->assertSee('Pembayaran sedang diverifikasi')
        ->assertDontSee('Pembayaran berhasil');
});
