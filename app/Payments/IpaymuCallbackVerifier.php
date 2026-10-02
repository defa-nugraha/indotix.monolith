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

        $expected = strtolower($signature);

        try {
            foreach ($this->canonicalCandidates($payload) as $canonical) {
                if (hash_equals(hash_hmac('sha256', $canonical, $va), $expected)) {
                    return true;
                }
            }
        } catch (JsonException) {
            return false;
        }

        return false;
    }

    public function normalize(array $payload): array
    {
        unset($payload['signature']);

        foreach ($payload as $key => $value) {
            if (in_array($key, ['trx_id', 'status_code', 'transaction_status_code', 'paid_off'], true)) {
                $payload[$key] = filter_var($value, FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE);
            } elseif ($key === 'is_escrow') {
                $payload[$key] = in_array($value, [true, 1, '1', 'true'], true);
            } elseif ($key === 'additional_info' && $value === '[]') {
                $payload[$key] = [];
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
        return $this->encode($this->normalize($payload), $unescapedSlashes);
    }

    /**
     * @return list<string>
     *
     * @throws JsonException
     */
    private function canonicalCandidates(array $payload): array
    {
        $normalized = $this->normalize($payload);
        $candidates = [
            $this->encode($normalized),
            $this->encode($normalized, true),
        ];

        // iPaymu documents the normalized representation above. Sandbox/form
        // callbacks may preserve these two fields in their original form before
        // signing; accept those variants only when their HMAC still matches the
        // merchant VA secret.
        $formCompatibility = $normalized;

        if (array_key_exists('additional_info', $payload) && $payload['additional_info'] === '[]') {
            $formCompatibility['additional_info'] = '[]';
        }

        if (array_key_exists('is_escrow', $payload) && is_string($payload['is_escrow'])) {
            $formCompatibility['is_escrow'] = $payload['is_escrow'];
        }

        ksort($formCompatibility, SORT_STRING);
        $candidates[] = $this->encode($formCompatibility);
        $candidates[] = $this->encode($formCompatibility, true);

        return array_values(array_unique($candidates));
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @throws JsonException
     */
    private function encode(array $payload, bool $unescapedSlashes = false): string
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
