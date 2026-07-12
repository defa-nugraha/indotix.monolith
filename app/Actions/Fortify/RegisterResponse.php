<?php

namespace App\Actions\Fortify;

use App\Support\RoleRedirect;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request): RedirectResponse
    {
        $user = $request->user();

        if ($user?->hasVerifiedEmail()) {
            return RoleRedirect::toDashboard($user);
        }

        return redirect()->route('verification.notice');
    }
}
