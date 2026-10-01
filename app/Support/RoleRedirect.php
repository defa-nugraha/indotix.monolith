<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\RedirectResponse;

class RoleRedirect
{
    public static function dashboardUrl(?User $user): string
    {
        if (! $user) {
            return route('login');
        }

        if ($user->role === 'mitra') {
            return route('mitra.dashboard');
        }

        if (str_starts_with((string) $user->role, 'admin')) {
            return route('dashboard');
        }

        return route('home');
    }

    public static function toDashboard(?User $user): RedirectResponse
    {
        return redirect()->to(self::dashboardUrl($user));
    }
}
