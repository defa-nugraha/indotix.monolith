<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class MidtransService
{
    public function charge(array $payload): array
    {
        $response = $this->client()->post($this->baseUrl().'/charge', $payload);

        if (! $response->successful()) {
            throw new RuntimeException('Midtrans charge failed: '.$response->body());
        }

        return $response->json();
    }

    public function status(string $orderId): array
    {
        $response = $this->client()->get($this->baseUrl().'/'.$orderId.'/status');

        if (! $response->successful()) {
            throw new RuntimeException('Midtrans status failed: '.$response->body());
        }

        return $response->json();
    }

    public function snap(array $payload): array
    {
        $response = $this->client()->post($this->snapUrl().'/transactions', $payload);

        if (! $response->successful()) {
            throw new RuntimeException('Midtrans snap failed: '.$response->body());
        }

        return $response->json();
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
            ->acceptJson()
            ->asJson();
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
