<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\RedirectResponse;

class RoleRedirect
{
    public static function toDashboard(?User $user): RedirectResponse
    {
        if (! $user) {
            return redirect()->route('login');
        }

        if ($user->role === 'mitra') {
            return redirect()->route('mitra.dashboard');
        }

        if (str_starts_with((string) $user->role, 'admin')) {
            return redirect()->route('dashboard');
        }

        return redirect()->route('home');
    }
}
