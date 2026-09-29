<?php

namespace App\Services;

use App\Exceptions\PaymentGatewayException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use JsonException;
use RuntimeException;

class IpaymuService
{
    public function redirectPayment(array $payload): array
    {
        return $this->post('/api/v2/payment', $payload, 'redirect payment');
    }

    public function transaction(string $transactionId): array
    {
        return $this->post('/api/v2/transaction', [
            'transactionId' => $transactionId,
        ], 'transaction inquiry');
    }

    public function signature(string $method, string $jsonBody): string
    {
        $apiKey = $this->apiKey();
        $bodyHash = strtolower(hash('sha256', $jsonBody));
        $stringToSign = strtoupper($method).':'.$this->va().':'.$bodyHash.':'.$apiKey;

        return hash_hmac('sha256', $stringToSign, $apiKey);
    }

    private function post(string $path, array $payload, string $operation): array
    {
        $this->assertEnvironmentIsSafe();

        try {
            $json = json_encode(
                $payload,
                JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
            );
        } catch (JsonException) {
            throw new PaymentGatewayException('iPaymu request could not be encoded.');
        }

        $timestamp = now()->format('YmdHis');

        try {
            $response = Http::connectTimeout((int) config('services.ipaymu.connect_timeout', 5))
                ->timeout((int) config('services.ipaymu.timeout', 20))
                ->acceptJson()
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'va' => $this->va(),
                    'signature' => $this->signature('POST', $json),
                    'timestamp' => $timestamp,
                ])
                ->withBody($json, 'application/json')
                ->post($this->baseUrl().$path);
        } catch (ConnectionException) {
            throw new PaymentGatewayException(
                'iPaymu '.$operation.' network result is unknown.',
            );
        }

        return $this->json($response, $operation);
    }

    private function json(Response $response, string $operation): array
    {
        $payload = $response->json();
        $payload = is_array($payload) ? $payload : [];
        $providerStatus = filter_var($payload['Status'] ?? null, FILTER_VALIDATE_INT);

        if (! $response->successful() || $providerStatus !== 200 || ($payload['Success'] ?? true) === false) {
            throw new PaymentGatewayException(
                'iPaymu '.$operation.' failed with HTTP '.$response->status().'.',
                $response->status(),
                $this->safeProviderError($payload),
            );
        }

        if (! is_array($payload['Data'] ?? null)) {
            throw new PaymentGatewayException('iPaymu '.$operation.' returned an invalid response.', $response->status());
        }

        return $payload;
    }

    private function safeProviderError(array $payload): array
    {
        return array_filter([
            'Status' => $payload['Status'] ?? null,
            'Success' => $payload['Success'] ?? null,
            'Message' => isset($payload['Message']) ? mb_substr((string) $payload['Message'], 0, 300) : null,
        ], static fn (mixed $value): bool => $value !== null);
    }

    private function assertEnvironmentIsSafe(): void
    {
        $environment = strtolower((string) config('services.ipaymu.environment', 'sandbox'));
        if (! in_array($environment, ['sandbox', 'production'], true)) {
            throw new RuntimeException('IPAYMU_ENVIRONMENT must be sandbox or production.');
        }

        if ($environment === 'production' && ! app()->isProduction() && ! config('services.ipaymu.allow_production')) {
            throw new RuntimeException('Production iPaymu is blocked outside the production application environment.');
        }
    }

    private function baseUrl(): string
    {
        return strtolower((string) config('services.ipaymu.environment', 'sandbox')) === 'production'
            ? 'https://my.ipaymu.com'
            : 'https://sandbox.ipaymu.com';
    }

    private function va(): string
    {
        $value = trim((string) config('services.ipaymu.va', ''));
        if ($value === '') {
            throw new RuntimeException('IPAYMU_VA is not configured.');
        }

        return $value;
    }

    private function apiKey(): string
    {
        $value = trim((string) config('services.ipaymu.api_key', ''));
        if ($value === '') {
            throw new RuntimeException('IPAYMU_API_KEY is not configured.');
        }

        return $value;
    }
}
