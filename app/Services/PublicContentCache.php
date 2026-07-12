<?php

namespace App\Services;

use Closure;
use DateTimeInterface;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

class PublicContentCache
{
    public function enabled(): bool
    {
        return (bool) config('api_cache.enabled', true);
    }

    public function store(): Repository
    {
        return Cache::store((string) config('api_cache.store', 'redis'));
    }

    public function version(): int
    {
        if (! $this->enabled()) {
            return 1;
        }

        try {
            return max(1, (int) $this->store()->get($this->versionKey(), 1));
        } catch (Throwable $exception) {
            $this->logFailure('read-version', $exception);

            return 1;
        }
    }

    public function requestKey(Request $request): string
    {
        $query = Arr::sortRecursive($request->query());
        $identity = [
            'method' => $request->method(),
            'path' => '/'.$request->path(),
            'query' => $query,
            'accept_language' => $request->header('Accept-Language', ''),
        ];

        return $this->versionedKey('response:'.hash('sha256', json_encode($identity, JSON_THROW_ON_ERROR)));
    }

    public function remember(string $key, DateTimeInterface|int $ttl, Closure $callback): mixed
    {
        if (! $this->enabled()) {
            return $callback();
        }

        $versionedKey = $this->versionedKey($key);

        try {
            $cached = $this->store()->get($versionedKey);
            if (is_array($cached) && array_key_exists('value', $cached)) {
                return $cached['value'];
            }
        } catch (Throwable $exception) {
            $this->logFailure('read', $exception);
        }

        $value = $callback();

        try {
            $this->store()->put($versionedKey, ['value' => $value], $ttl);
        } catch (Throwable $exception) {
            $this->logFailure('write', $exception);
        }

        return $value;
    }

    public function get(string $key): mixed
    {
        if (! $this->enabled()) {
            return null;
        }

        try {
            return $this->store()->get($key);
        } catch (Throwable $exception) {
            $this->logFailure('read', $exception);

            return null;
        }
    }

    public function put(string $key, mixed $value, DateTimeInterface|int $ttl): void
    {
        if (! $this->enabled()) {
            return;
        }

        try {
            $this->store()->put($key, $value, $ttl);
        } catch (Throwable $exception) {
            $this->logFailure('write', $exception);
        }
    }

    public function invalidate(): void
    {
        if (! $this->enabled()) {
            return;
        }

        try {
            $store = $this->store();
            $current = max(1, (int) $store->get($this->versionKey(), 1));
            $store->forever($this->versionKey(), $current + 1);
        } catch (Throwable $exception) {
            // Cache invalidation must never prevent a product mutation.
            $this->logFailure('invalidate', $exception);
        }
    }

    private function versionedKey(string $key): string
    {
        return 'public-api:v'.$this->version().':'.$key;
    }

    private function versionKey(): string
    {
        return (string) config('api_cache.version_key', 'public-api:content-version');
    }

    private function logFailure(string $operation, Throwable $exception): void
    {
        Log::warning('Redis public cache operation failed; request continues without cache.', [
            'operation' => $operation,
            'exception' => $exception::class,
            'message' => $exception->getMessage(),
        ]);
    }
}
