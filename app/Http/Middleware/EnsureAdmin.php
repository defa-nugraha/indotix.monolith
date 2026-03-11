<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('home');
        }

        $role = $user->role;
        if ($role === 'admin') {
            return $next($request);
        }

        $path = $request->path();
        $isDashboard = $request->is('dashboard');

        if ($role === 'admin_academy' && ($isDashboard || $request->is('admin/academy*'))) {
            return $next($request);
        }

        if ($role === 'admin_retail' && ($isDashboard || $request->is('admin/retail-shop*'))) {
            return $next($request);
        }

        if ($role === 'admin_special_program' && ($isDashboard || $request->is('admin/special-programs*'))) {
            return $next($request);
        }

        return redirect()->route('dashboard');

    }
}
