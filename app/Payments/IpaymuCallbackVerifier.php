<?php

namespace App\Payments;

use DateTimeImmutable;
use DateTimeInterface;
use JsonException;

final class IpaymuCallbackVerifier
{
    public function __construct(private readonly ?string $merchantVa = null) {}

    public function verify(array $payload, string $signature): bool
    {
        $va = trim($this->merchantVa ?? (string) config('services.ipaymu.va', ''));
        if ($va === '' || ! preg_match('/\A[a-f0-9]{64}\z/i', $signature)) {
            return false;
        }

        try {
            $normalized = $this->normalize($payload);
            $canonical = $this->canonicalJsonFromNormalized($normalized);
            $expected = hash_hmac('sha256', $canonical, $va);

            if (hash_equals($expected, strtolower($signature))) {
                return true;
            }

            // Accept the equivalent JSON representation some callback
            // senders use when they do not escape forward slashes.
            $unescapedCanonical = $this->canonicalJsonFromNormalized($normalized, true);

            return hash_equals(
                hash_hmac('sha256', $unescapedCanonical, $va),
                strtolower($signature),
            );
        } catch (JsonException) {
            return false;
        }
    }

    public function normalize(array $payload): array
    {
        unset($payload['signature']);

        foreach ($payload as $key => $value) {
            if (in_array($key, ['trx_id', 'status_code', 'transaction_status_code', 'paid_off'], true)) {
                $payload[$key] = filter_var($value, FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE);
            } elseif ($key === 'is_escrow') {
                $payload[$key] = in_array($value, [true, 1, '1', 'true'], true);
            } elseif ($key === 'additional_info') {
                if ($value === '[]') {
                    $payload[$key] = [];
                }
            } elseif (! is_array($value) && ! is_object($value) && $value !== null) {
                $payload[$key] = (string) $value;
            }
        }

        if (! array_key_exists('additional_info', $payload)) {
            $payload['additional_info'] = [];
        }

        ksort($payload, SORT_STRING);

        return $payload;
    }

    public function canonicalJson(array $payload, bool $unescapedSlashes = false): string
    {
        $normalized = $this->normalize($payload);

        return $this->canonicalJsonFromNormalized($normalized, $unescapedSlashes);
    }

    private function canonicalJsonFromNormalized(array $payload, bool $unescapedSlashes = false): string
    {
        $flags = JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR;

        if ($unescapedSlashes) {
            $flags |= JSON_UNESCAPED_SLASHES;
        }

        return json_encode($payload, $flags);
    }

    public function validTimestamp(string $timestamp): bool
    {
        if ($timestamp === '' || strlen($timestamp) > 64) {
            return false;
        }

        try {
            $parsed = new DateTimeImmutable($timestamp);
        } catch (\Throwable) {
            return false;
        }

        return $parsed->format(DateTimeInterface::ATOM) !== '';
    }
}
