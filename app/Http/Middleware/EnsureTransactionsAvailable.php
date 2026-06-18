<?php

namespace App\Http\Middleware;

use App\Services\MaintenanceMode;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTransactionsAvailable
{
    public function handle(Request $request, Closure $next): Response
    {
        $maintenance = app(MaintenanceMode::class);

        if (! $maintenance->isEnabled()) {
            return $next($request);
        }

        $message = $maintenance->message();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => $message,
                'maintenance' => true,
            ], 503);
        }

        return back()->withErrors([
            'maintenance' => $message,
        ]);
    }
}
