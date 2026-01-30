<?php

namespace App\Actions\Fortify;

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
            return redirect()->route('email-otp.notice');
        }

        if ($user->role === 'mitra') {
            return redirect()->route('mitra.dashboard');
        }

        if ($user->role === 'admin') {
            return redirect()->route('dashboard');
        }

        if ($request->session()->has('booking_draft')) {
            return redirect()->route('booking.review');
        }

        return redirect()->route('home');
    }
}
