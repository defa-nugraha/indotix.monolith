<?php

namespace App\Http\Middleware;

use App\Models\MitraEventOnboarding;
use App\Models\MitraOnboarding;
use App\Models\MitraWisataOnboarding;
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

        $type = $user->mitra_onboarding_type ?? 'hotel';
        if ($type === 'wisata') {
            $onboarding = MitraWisataOnboarding::query()->where('user_id', $user->id)->first();
        } elseif ($type === 'event') {
            $onboarding = MitraEventOnboarding::query()->where('user_id', $user->id)->first();
        } else {
            $onboarding = MitraOnboarding::query()->where('user_id', $user->id)->first();
        }

        if (! $onboarding || $onboarding->verification_status !== 'verified') {
            return redirect()->route('mitra.dashboard')->withErrors([
                'mitra' => 'Akun mitra belum diverifikasi oleh admin.',
            ]);
        }

        return $next($request);
    }
}
