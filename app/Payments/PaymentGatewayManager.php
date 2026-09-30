<?php

namespace App\Payments;

use App\Payments\Contracts\PaymentGateway;
use App\Payments\Gateways\IpaymuPaymentGateway;
use App\Payments\Gateways\MidtransPaymentGateway;
use InvalidArgumentException;

final readonly class PaymentGatewayManager
{
    public function __construct(
        private MidtransPaymentGateway $midtrans,
        private IpaymuPaymentGateway $ipaymu,
    ) {}

    public function forNewPayment(): PaymentGateway
    {
        return $this->forProvider((string) config('services.payment.gateway', 'midtrans'));
    }

    public function forProvider(string $provider): PaymentGateway
    {
        return match (strtolower(trim($provider))) {
            'midtrans' => $this->midtrans,
            'ipaymu' => $this->ipaymu,
            default => throw new InvalidArgumentException('Unsupported payment gateway configuration.'),
        };
    }
}
