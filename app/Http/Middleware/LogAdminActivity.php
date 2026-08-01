<?php

namespace App\Http\Middleware;

use App\Models\AdminAuditLog;
use Closure;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogAdminActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $user = $request->user();
        if (! $user || ($user->role !== 'admin' && ! $user->adminRole)) {
            return $response;
        }

        if (! in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return $response;
        }

        AdminAuditLog::create([
            'admin_id' => $user->id,
            'action' => substr(sprintf('%s %s', $request->method(), $request->path()), 0, 120),
            'method' => $request->method(),
            'path' => substr($request->path(), 0, 255),
            'payload' => $this->sanitizePayload($request->except(['password', 'password_confirmation', 'current_password'])),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
        ]);

        return $response;
    }

    private function sanitizeValue(mixed $value): mixed
    {
        if ($value instanceof UploadedFile) {
            return [
                'uploaded_file' => true,
                'name' => $value->getClientOriginalName(),
                'mime' => $value->getClientMimeType(),
                'size' => $value->getSize(),
            ];
        }

        if (is_array($value)) {
            return collect($value)
                ->mapWithKeys(fn ($item, string|int $key) => [
                    $key => $this->isSensitiveKey((string) $key) ? '[redacted]' : $this->sanitizeValue($item),
                ])
                ->all();
        }

        if (is_object($value)) {
            return method_exists($value, '__toString')
                ? (string) $value
                : get_debug_type($value);
        }

        return $value;
    }

    private function sanitizePayload(array $payload): array
    {
        return collect($payload)
            ->mapWithKeys(fn ($value, string|int $key) => [
                $key => $this->isSensitiveKey((string) $key) ? '[redacted]' : $this->sanitizeValue($value),
            ])
            ->all();
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
            'bank_account_number',
            'account_number',
        ]);
    }
}
