<?php

namespace App\Services;

use App\Exceptions\PaymentGatewayException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class MidtransService
{
    public function charge(array $payload): array
    {
        return $this->json($this->client()->post($this->baseUrl().'/charge', $payload), 'charge');
    }

    public function status(string $orderId): array
    {
        return $this->json(
            $this->client()->get($this->baseUrl().'/'.rawurlencode($orderId).'/status'),
            'status',
        );
    }

    public function statusOrNull(string $orderId): ?array
    {
        try {
            return $this->status($orderId);
        } catch (PaymentGatewayException $exception) {
            if ($exception->isNotFound()) {
                return null;
            }

            throw $exception;
        }
    }

    public function snap(array $payload): array
    {
        return $this->json($this->client()->post($this->snapUrl().'/transactions', $payload), 'snap');
    }

    public function cancel(string $orderId): array
    {
        return $this->json(
            $this->client()->post($this->baseUrl().'/'.rawurlencode($orderId).'/cancel'),
            'cancel',
        );
    }

    public function expire(string $orderId): array
    {
        return $this->json(
            $this->client()->post($this->baseUrl().'/'.rawurlencode($orderId).'/expire'),
            'expire',
        );
    }

    public function refund(string $orderId, string $refundKey, int $amount, string $reason): array
    {
        return $this->json(
            $this->client()->post($this->baseUrl().'/'.rawurlencode($orderId).'/refund', [
                'refund_key' => $refundKey,
                'amount' => $amount,
                'reason' => mb_substr($reason, 0, 255),
            ]),
            'refund',
        );
    }

    public function validateSignature(string $orderId, string $statusCode, string $grossAmount, string $signature): bool
    {
        $serverKey = config('services.midtrans.server_key');
        $expected = hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);

        return hash_equals($expected, $signature);
    }

    private function client(): PendingRequest
    {
        $serverKey = config('services.midtrans.server_key');

        return Http::withBasicAuth($serverKey, '')
            ->connectTimeout((int) config('services.midtrans.connect_timeout', 5))
            ->timeout((int) config('services.midtrans.timeout', 20))
            ->acceptJson()
            ->asJson();
    }

    private function json(Response $response, string $operation): array
    {
        $payload = $response->json();
        $payload = is_array($payload) ? $payload : [];

        if (! $response->successful()) {
            throw new PaymentGatewayException(
                'Midtrans '.$operation.' failed with HTTP '.$response->status().'.',
                $response->status(),
                $payload,
            );
        }

        return $payload;
    }

    private function baseUrl(): string
    {
        $isProduction = (bool) config('services.midtrans.is_production');

        return $isProduction
            ? 'https://api.midtrans.com/v2'
            : 'https://api.sandbox.midtrans.com/v2';
    }

    private function snapUrl(): string
    {
        $isProduction = (bool) config('services.midtrans.is_production');

        return $isProduction
            ? 'https://app.midtrans.com/snap/v1'
            : 'https://app.sandbox.midtrans.com/snap/v1';
    }
}
