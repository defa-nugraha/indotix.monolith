<?php

namespace App\Http\Middleware;

use App\Models\EventOrganizer;
use App\Models\MitraEventOnboarding;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMitraEvent
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'mitra') {
            return redirect()->route('dashboard');
        }

        if ($user->mitra_onboarding_type !== 'event') {
            return redirect()->route('mitra.dashboard');
        }

        $onboarding = MitraEventOnboarding::query()->where('user_id', $user->id)->first();
        if (! $onboarding) {
            return redirect()->route('mitra.event.onboarding');
        }

        if ($onboarding->verification_status !== 'verified') {
            return redirect()->route('mitra.event.onboarding')->withErrors([
                'mitra' => 'Akun mitra event belum diverifikasi.',
            ]);
        }

        $organizer = EventOrganizer::query()->where('user_id', $user->id)->first();
        if ($organizer && $organizer->status === 'suspended') {
            return redirect()->route('mitra.dashboard')->withErrors([
                'mitra' => 'Akun mitra event sedang disuspend.',
            ]);
        }

        return $next($request);
    }
}
