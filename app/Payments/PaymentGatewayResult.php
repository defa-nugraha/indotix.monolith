<?php

namespace App\Payments;

use Carbon\CarbonImmutable;

final readonly class PaymentGatewayResult
{
    public function __construct(
        public string $internalStatus,
        public string $providerStatus,
        public ?string $transactionId,
        public ?string $providerReferenceId,
        public ?string $paymentType,
        public ?string $paymentChannel,
        public ?string $paymentUrl,
        public ?int $amount,
        public ?int $fee,
        public ?CarbonImmutable $expiresAt,
        public array $raw,
    ) {}
}
