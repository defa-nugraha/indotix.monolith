<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'user') {
            return redirect()->route('home');
        }

        return $next($request);
    }
}
