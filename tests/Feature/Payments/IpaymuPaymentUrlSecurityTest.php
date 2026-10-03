<?php

use App\Exceptions\PaymentGatewayException;
use App\Payments\Gateways\IpaymuPaymentGateway;
use App\Services\IpaymuService;

function invokeIpaymuPaymentUrlValidator(string $url): void
{
    $gateway = new IpaymuPaymentGateway(Mockery::mock(IpaymuService::class));
    $method = new ReflectionMethod($gateway, 'assertPaymentUrl');
    $method->invoke($gateway, $url);
}

test('production accepts iPaymu hosted payment redirect URL', function () {
    config(['services.ipaymu.environment' => 'production']);

    invokeIpaymuPaymentUrlValidator(
        'https://payment.ipaymu.com/#/3426dcd8-83f6-4390-ac12-751dccb9e4b5',
    );

    expect(true)->toBeTrue();
});

test('production still rejects an untrusted payment host', function () {
    config(['services.ipaymu.environment' => 'production']);

    expect(fn () => invokeIpaymuPaymentUrlValidator(
        'https://evil.example.com/#/3426dcd8-83f6-4390-ac12-751dccb9e4b5',
    ))->toThrow(PaymentGatewayException::class);
});

test('production still requires HTTPS for payment redirects', function () {
    config(['services.ipaymu.environment' => 'production']);

    expect(fn () => invokeIpaymuPaymentUrlValidator(
        'http://payment.ipaymu.com/#/3426dcd8-83f6-4390-ac12-751dccb9e4b5',
    ))->toThrow(PaymentGatewayException::class);
});
