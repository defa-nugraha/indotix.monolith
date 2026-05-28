<?php

namespace App\Http\Middleware;

use App\Models\AdminAuditLog;
use Closure;
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
            'action' => sprintf('%s %s', $request->method(), $request->path()),
            'method' => $request->method(),
            'path' => $request->path(),
            'payload' => $request->except(['password', 'password_confirmation']),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
        ]);

        return $response;
    }
}
