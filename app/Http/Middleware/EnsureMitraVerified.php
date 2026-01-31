<?php

namespace App\Http\Middleware;

use App\Models\MitraOnboarding;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMitraVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'mitra') {
            return redirect()->route('dashboard');
        }

        $onboarding = MitraOnboarding::query()->where('user_id', $user->id)->first();

        if (! $onboarding || $onboarding->verification_status !== 'verified') {
            return redirect()->route('mitra.dashboard')->withErrors([
                'mitra' => 'Akun mitra belum diverifikasi oleh admin.',
            ]);
        }

        return $next($request);
    }
}
