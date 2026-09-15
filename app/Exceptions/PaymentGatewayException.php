<?php

namespace App\Exceptions;

use RuntimeException;

class PaymentGatewayException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $httpStatus = 0,
        public readonly array $payload = [],
    ) {
        parent::__construct($message);
    }

    public function isNotFound(): bool
    {
        return $this->httpStatus === 404
            || (string) ($this->payload['status_code'] ?? '') === '404';
    }
}
