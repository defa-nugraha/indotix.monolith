<?php

namespace App\Http\Middleware;

use App\Services\PublicContentCache;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CachePublicApiResponse
{
    public function __construct(private readonly PublicContentCache $cache) {}

    public function handle(Request $request, Closure $next, int|string|null $ttl = null): Response
    {
        if (! $this->shouldCache($request)) {
            return $next($request);
        }

        $seconds = max(1, (int) ($ttl ?: config('api_cache.ttl', 60)));
        $key = $this->cache->requestKey($request);
        $cached = $this->cache->get($key);

        if ($this->isValidPayload($cached)) {
            return $this->cachedResponse($request, $cached, $seconds);
        }

        $response = $next($request);
        if (! $this->isCacheableResponse($response)) {
            return $response;
        }

        $payload = [
            'content' => $response->getContent(),
            'status' => $response->getStatusCode(),
            'content_type' => $response->headers->get('Content-Type', 'application/json'),
            'etag' => '"'.sha1((string) $response->getContent()).'"',
            'cached_at' => now()->timestamp,
        ];

        $this->cache->put($key, $payload, $seconds);
        $this->setCacheHeaders($response, 'MISS', $payload['etag'], $seconds);

        return $response;
    }

    private function shouldCache(Request $request): bool
    {
        return $this->cache->enabled()
            && $request->isMethod('GET')
            && ! $request->bearerToken()
            && ! $request->headers->has('Cookie');
    }

    private function isCacheableResponse(Response $response): bool
    {
        return $response->isSuccessful()
            && str_contains((string) $response->headers->get('Content-Type'), 'application/json')
            && ! $response->headers->has('Set-Cookie');
    }

    private function isValidPayload(mixed $payload): bool
    {
        return is_array($payload)
            && isset($payload['content'], $payload['status'], $payload['etag'], $payload['cached_at']);
    }

    private function cachedResponse(Request $request, array $payload, int $seconds): Response
    {
        if ($request->headers->get('If-None-Match') === $payload['etag']) {
            $response = response('', Response::HTTP_NOT_MODIFIED);
        } else {
            $response = response(
                $payload['content'],
                (int) $payload['status'],
                ['Content-Type' => $payload['content_type'] ?? 'application/json']
            );
        }

        $this->setCacheHeaders($response, 'HIT', $payload['etag'], $seconds);
        $response->headers->set('Age', (string) max(0, now()->timestamp - (int) $payload['cached_at']));

        return $response;
    }

    private function setCacheHeaders(Response $response, string $status, string $etag, int $seconds): void
    {
        $response->headers->set('X-Cache', $status);
        $response->headers->set('ETag', $etag);
        $response->headers->set('Cache-Control', 'public, max-age='.$seconds);
        $response->headers->set('Vary', 'Accept, Accept-Language');
    }
}
