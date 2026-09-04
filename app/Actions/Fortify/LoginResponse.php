<?php

namespace App\Actions\Fortify;

use App\Support\RoleRedirect;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if ($user->is_suspended) {
            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Akun Anda sedang disuspend. Hubungi admin.',
            ]);
        }

        if (! $user->hasVerifiedEmail()) {
            return redirect()->route('verification.notice');
        }

        if ($request->session()->has('wisata_booking_draft')) {
            return redirect()->route('wisata.booking.review');
        }

        if ($request->session()->has('booking_draft')) {
            return redirect()->route('booking.review');
        }

        return RoleRedirect::toDashboard($user);
    }
}
