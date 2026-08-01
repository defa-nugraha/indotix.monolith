<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MobileErrorLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MobileErrorLogController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:4000'],
            'exception_type' => ['nullable', 'string', 'max:255'],
            'stack_trace' => ['nullable', 'string', 'max:20000'],
            'context' => ['nullable', 'string', 'max:255'],
            'source' => ['nullable', 'string', 'max:100'],
            'platform' => ['nullable', 'string', 'max:80'],
            'app_version' => ['nullable', 'string', 'max:80'],
            'build_number' => ['nullable', 'string', 'max:80'],
            'device' => ['nullable', 'array'],
            'extra' => ['nullable', 'array'],
            'fatal' => ['nullable', 'boolean'],
        ]);

        $user = $request->user('sanctum');
        $data['message'] = $this->redactString($data['message']);
        $data['stack_trace'] = $this->redactString($data['stack_trace'] ?? null);
        $data['device'] = $this->sanitizeArray($data['device'] ?? null);
        $data['extra'] = $this->sanitizeArray($data['extra'] ?? null);

        $log = MobileErrorLog::create([
            ...$data,
            'user_id' => $user?->id,
            'fatal' => (bool) ($data['fatal'] ?? false),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
        ]);

        Log::warning('Mobile app error reported', [
            'mobile_error_log_id' => $log->id,
            'user_id' => $user?->id,
            'message' => $log->message,
            'exception_type' => $log->exception_type,
            'context' => $log->context,
            'platform' => $log->platform,
            'app_version' => $log->app_version,
            'fatal' => $log->fatal,
        ]);

        return response()->json([
            'message' => 'Error berhasil dicatat.',
            'id' => $log->id,
        ], 201);
    }

    private function sanitizeArray(?array $payload): ?array
    {
        if ($payload === null) {
            return null;
        }

        return collect($payload)
            ->mapWithKeys(fn ($value, string|int $key) => [
                $key => $this->isSensitiveKey((string) $key) ? '[redacted]' : $this->sanitizeValue($value),
            ])
            ->all();
    }

    private function sanitizeValue(mixed $value): mixed
    {
        if (is_array($value)) {
            return $this->sanitizeArray($value);
        }

        if (is_string($value)) {
            return $this->redactString($value);
        }

        return $value;
    }

    private function isSensitiveKey(string $key): bool
    {
        return str($key)->lower()->contains([
            'token',
            'secret',
            'password',
            'otp',
            'pin',
            'authorization',
            'signature',
            'email',
            'phone',
            'account',
        ]);
    }

    private function redactString(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        $value = preg_replace('/Bearer\s+[A-Za-z0-9._~+\-\/]+=*/i', 'Bearer [redacted]', $value) ?? $value;

        return preg_replace(
            '/("?((access_)?token|id_token|refresh_token|password|otp|pin|authorization|signature|email|phone|account(_number)?)"?\s*[:=]\s*)("[^"]+"|[^,\s}]+)/i',
            '$1[redacted]',
            $value
        ) ?? $value;
    }
}
