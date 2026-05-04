<?php

namespace App\Actions\Fortify;

use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request): RedirectResponse
    {
        $user = $request->user();

        if ($user?->hasVerifiedEmail()) {
            if ($user->role === 'mitra') {
                return redirect()->route('mitra.dashboard');
            }

            if (str_starts_with((string) $user->role, 'admin')) {
                return redirect()->route('dashboard');
            }

            return redirect()->route('home');
        }

        return redirect()->route('email-otp.notice');
    }
}
