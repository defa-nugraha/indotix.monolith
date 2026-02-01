<?php

namespace App\Http\Middleware;

use App\Models\MitraWisataOnboarding;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMitraWisata
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'mitra') {
            return redirect()->route('dashboard');
        }

        if ($user->mitra_onboarding_type !== 'wisata') {
            return redirect()->route('mitra.dashboard');
        }

        $onboarding = MitraWisataOnboarding::query()->where('user_id', $user->id)->first();
        if (! $onboarding) {
            return redirect()->route('mitra.wisata.onboarding');
        }

        if ($onboarding->verification_status !== 'verified') {
            return redirect()->route('mitra.wisata.onboarding')->withErrors([
                'mitra' => 'Akun mitra wisata belum diverifikasi.',
            ]);
        }

        if ($onboarding->is_suspended) {
            return redirect()->route('mitra.dashboard')->withErrors([
                'mitra' => 'Akun mitra wisata sedang disuspend.',
            ]);
        }

        return $next($request);
    }
}
