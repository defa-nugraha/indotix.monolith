<?php

namespace App\Http\Middleware;

use App\Support\AdminPermissionRegistry;
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

        $isDashboard = $request->is('dashboard');

        if ($user->adminRole && $user->adminRole->is_active) {
            if ($isDashboard) {
                return $next($request);
            }

            $permission = AdminPermissionRegistry::resolveRequest($request);
            if ($permission && AdminPermissionRegistry::can($user, $permission['feature'], $permission['action'])) {
                return $next($request);
            }

            if ($this->canAccessOwnEventOrganizer($request)) {
                return $next($request);
            }

            abort(403, 'Anda tidak memiliki permission untuk mengakses fitur ini.');
        }

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

    private function canAccessOwnEventOrganizer(Request $request): bool
    {
        if (! $request->is('admin/events/organizers*')) {
            return false;
        }

        $action = $request->isMethod('post') && ! $request->is('admin/events/organizers/*/status')
            ? 'create'
            : 'view';

        return AdminPermissionRegistry::can($request->user(), 'events_items', $action);
    }
}
