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
        if (! $organizer) {
            $organizer = EventOrganizer::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'name' => $onboarding->eo_name ?: ($onboarding->responsible_name ?? $user->name),
                    'email' => $user->email,
                    'phone' => $onboarding->responsible_phone,
                    'status' => 'verified',
                    'notes' => null,
                    'documents' => [
                        'responsible_name' => $onboarding->responsible_name,
                        'responsible_role' => $onboarding->responsible_role,
                        'legal_doc_type' => $onboarding->legal_doc_type,
                        'legal_doc_number' => $onboarding->legal_doc_number,
                        'legal_doc_path' => $onboarding->legal_doc_path,
                        'ktp_path' => $onboarding->ktp_path,
                        'selfie_ktp_path' => $onboarding->selfie_ktp_path,
                        'bank_name' => $onboarding->bank_name,
                        'bank_account_number' => $onboarding->bank_account_number,
                        'bank_account_name' => $onboarding->bank_account_name,
                        'bank_account_relation' => $onboarding->bank_account_relation,
                        'operational_phone' => $onboarding->operational_phone,
                        'operational_email' => $onboarding->operational_email,
                        'operational_hours' => $onboarding->operational_hours,
                    ],
                ]
            );
        }
        if ($organizer && $organizer->status === 'suspended') {
            return redirect()->route('mitra.dashboard')->withErrors([
                'mitra' => 'Akun mitra event sedang disuspend.',
            ]);
        }

        return $next($request);
    }
}
