<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddReleaseIdentity
{
    public function __construct(private Application $app) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->is('up')) {
            $path = $this->app->basePath('release.json');
            $metadata = is_file($path) ? json_decode(file_get_contents($path), true) : null;
            $release = $metadata['release'] ?? null;

            if (is_string($release) && preg_match('/\A[A-Za-z0-9][A-Za-z0-9._-]*\z/', $release)) {
                $response->headers->set('X-Indotix-Release', $release);
            }

            $response->headers->set('Cache-Control', 'no-store, private');
        }

        return $response;
    }
}
