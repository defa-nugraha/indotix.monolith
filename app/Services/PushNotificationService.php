<?php

namespace App\Services;

use App\Models\UserDeviceToken;
use Google\Auth\Credentials\ServiceAccountCredentials;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class PushNotificationService
{
    private const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

    public function sendToUser(
        int $userId,
        string $title,
        string $body,
        array $data = [],
        array $context = []
    ): bool
    {
        $context = array_merge([
            'user_id' => $userId,
        ], $context);

        $serviceAccountPath = $this->resolveServiceAccountPath();
        $projectId = $serviceAccountPath ? $this->resolveProjectId($serviceAccountPath) : null;

        if (! $serviceAccountPath || ! $projectId) {
            Log::warning('FCM service account not configured.', $context);
            return false;
        }

        $accessToken = $this->getAccessToken($serviceAccountPath);
        if (! $accessToken) {
            Log::warning('FCM access token missing.', $context);
            return false;
        }

        $tokens = UserDeviceToken::query()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->pluck('token')
            ->values();

        if ($tokens->isEmpty()) {
            Log::info('FCM no active device tokens.', $context);
            return false;
        }

        $success = false;
        $invalidTokens = [];
        $sentTokens = [];
        $payloadData = $this->normalizeData($data);

        Log::info('FCM push started.', array_merge($context, [
            'token_count' => $tokens->count(),
            'project_id' => $projectId,
        ]));

        $failureCount = 0;
        foreach ($tokens->chunk(200) as $chunk) {
            Log::info('FCM push chunk.', array_merge($context, [
                'chunk_size' => $chunk->count(),
            ]));
            foreach ($chunk as $token) {
                $response = Http::withToken($accessToken)
                    ->post(sprintf('https://fcm.googleapis.com/v1/projects/%s/messages:send', $projectId), [
                        'message' => [
                            'token' => $token,
                            'notification' => [
                                'title' => $title,
                                'body' => $body,
                            ],
                            'data' => $payloadData,
                        ],
                    ]);

                if ($response->ok()) {
                    $success = true;
                    $sentTokens[] = $token;
                    continue;
                }

                $errorCode = data_get($response->json(), 'error.details.0.errorCode');
                if (in_array($errorCode, ['UNREGISTERED', 'INVALID_ARGUMENT'], true)) {
                    $invalidTokens[] = $token;
                }

                $failureCount++;
                Log::warning('FCM v1 push failed', [
                    ...$context,
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'error_code' => $errorCode,
                    'token_hint' => $this->maskToken($token),
                ]);
            }
        }

        if ($sentTokens) {
            UserDeviceToken::query()
                ->whereIn('token', $sentTokens)
                ->update(['last_used_at' => now()]);
        }

        if ($invalidTokens) {
            UserDeviceToken::query()
                ->whereIn('token', array_values(array_unique($invalidTokens)))
                ->update(['is_active' => false]);
        }

        Log::info('FCM push completed.', array_merge($context, [
            'sent_tokens' => count($sentTokens),
            'invalid_tokens' => count($invalidTokens),
            'failures' => $failureCount,
        ]));

        return $success;
    }

    private function getAccessToken(string $serviceAccountPath): ?string
    {
        $cacheKey = 'fcm.access_token.' . sha1($serviceAccountPath);
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return $cached;
        }

        try {
            $credentials = new ServiceAccountCredentials(
                [self::FCM_SCOPE],
                $serviceAccountPath
            );
            $token = $credentials->fetchAuthToken();
        } catch (Throwable $exception) {
            Log::warning('FCM access token failed', [
                'error' => $exception->getMessage(),
            ]);
            return null;
        }

        $accessToken = $token['access_token'] ?? null;
        if (! $accessToken) {
            return null;
        }

        $expiresIn = (int) ($token['expires_in'] ?? 3600);
        $ttl = max(60, $expiresIn - 60);
        Cache::put($cacheKey, $accessToken, $ttl);

        return $accessToken;
    }

    private function resolveServiceAccountPath(): ?string
    {
        $path = config('services.fcm.service_account');
        if (! $path) {
            Log::warning('FCM service account path empty.');
            return null;
        }

        $resolved = $this->normalizePath($path);
        if (! is_readable($resolved)) {
            Log::warning('FCM service account file not readable', [
                'path' => $resolved,
            ]);
            return null;
        }

        return $resolved;
    }

    private function resolveProjectId(string $serviceAccountPath): ?string
    {
        $projectId = config('services.fcm.project_id');
        if ($projectId) {
            return $projectId;
        }

        $serviceAccount = $this->loadServiceAccount($serviceAccountPath);

        return $serviceAccount['project_id'] ?? null;
    }

    private function loadServiceAccount(string $serviceAccountPath): ?array
    {
        $contents = file_get_contents($serviceAccountPath);
        if (! $contents) {
            return null;
        }

        $decoded = json_decode($contents, true);
        if (! is_array($decoded)) {
            return null;
        }

        return $decoded;
    }

    private function normalizePath(string $path): string
    {
        if (str_starts_with($path, DIRECTORY_SEPARATOR)) {
            return $path;
        }

        if (preg_match('/^[A-Za-z]:\\\\/', $path) === 1) {
            return $path;
        }

        return base_path($path);
    }

    private function normalizeData(array $data): array
    {
        $payload = [];
        foreach ($data as $key => $value) {
            if (is_null($value)) {
                continue;
            }

            if (is_scalar($value)) {
                $payload[$key] = (string) $value;
                continue;
            }

            $payload[$key] = json_encode($value);
        }

        return $payload;
    }

    private function maskToken(string $token): string
    {
        $suffix = substr($token, -8);
        $hash = substr(sha1($token), 0, 8);

        return sprintf('***%s(%s)', $suffix, $hash);
    }
}
