<?php

namespace App\Services;

use App\Models\UserDeviceToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    public function sendToUser(int $userId, string $title, string $body, array $data = []): bool
    {
        $serverKey = config('services.fcm.server_key');
        if (! $serverKey) {
            Log::warning('FCM server key not configured.');
            return false;
        }

        $tokens = UserDeviceToken::query()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->pluck('token')
            ->values();

        if ($tokens->isEmpty()) {
            return false;
        }

        $payloadBase = [
            'notification' => [
                'title' => $title,
                'body' => $body,
            ],
            'data' => $data,
            'priority' => 'high',
        ];

        $success = false;
        $tokens->chunk(500)->each(function ($chunk) use ($serverKey, $payloadBase, &$success) {
            $payload = $payloadBase;
            $payload['registration_ids'] = $chunk->values()->all();

            $response = Http::withHeaders([
                'Authorization' => 'key=' . $serverKey,
                'Content-Type' => 'application/json',
            ])->post('https://fcm.googleapis.com/fcm/send', $payload);

            if (! $response->ok()) {
                Log::warning('FCM push failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return;
            }

            $success = true;
            $this->handleResponse($chunk->values()->all(), $response->json());
            UserDeviceToken::query()
                ->whereIn('token', $chunk->values()->all())
                ->update(['last_used_at' => now()]);
        });

        return $success;
    }

    private function handleResponse(array $tokens, ?array $response): void
    {
        if (! $response || ! isset($response['results']) || ! is_array($response['results'])) {
            return;
        }

        $invalidTokens = [];
        foreach ($response['results'] as $index => $result) {
            $error = $result['error'] ?? null;
            if ($error && in_array($error, ['NotRegistered', 'InvalidRegistration'], true)) {
                $invalidTokens[] = $tokens[$index] ?? null;
            }
        }

        $invalidTokens = array_values(array_filter($invalidTokens));
        if ($invalidTokens) {
            UserDeviceToken::query()
                ->whereIn('token', $invalidTokens)
                ->update(['is_active' => false]);
        }
    }
}
