<?php

namespace App\Http\Controllers;

use App\Models\MitraEventOnboarding;
use App\Services\MediaCompressionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MitraEventOnboardingController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();
        if ($user->mitra_onboarding_type === 'hotel') {
            return redirect()->route('mitra.onboarding');
        }
        if ($user->mitra_onboarding_type === 'wisata') {
            return redirect()->route('mitra.wisata.onboarding');
        }
        if (! $user->mitra_onboarding_type) {
            return redirect()->route('mitra.dashboard')->withErrors([
                'mitra' => 'Silakan pilih jenis mitra terlebih dahulu.',
            ]);
        }

        $onboarding = MitraEventOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        return Inertia::render('mitra/event-onboarding', [
            'onboarding' => $onboarding,
            'status' => $request->session()->get('status'),
        ]);
    }

    public function updateStepOne(Request $request): RedirectResponse
    {
        $user = $request->user();
        $onboarding = MitraEventOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $data = $request->validate([
            'responsible_name' => ['nullable', 'string', 'max:255'],
            'responsible_phone' => ['nullable', 'string', 'max:50'],
            'responsible_role' => ['nullable', 'in:owner,project_manager,ketua_panitia,admin_eo'],
        ]);

        $onboarding->fill($data);
        $onboarding->current_step = max($onboarding->current_step, 1);
        $onboarding->save();

        return back()->with('status', 'onboarding-saved');
    }

    public function updateStepTwo(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $user = $request->user();
        $onboarding = MitraEventOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $data = $request->validate([
            'eo_name' => ['nullable', 'string', 'max:255'],
            'organizer_type' => ['nullable', 'in:eo_profesional,komunitas,kampus,individu'],
            'founded_year' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'eo_description' => ['nullable', 'string', 'max:1000'],
            'legal_doc_type' => ['nullable', 'in:nib_siup_akta,surat_eo_komunitas,surat_kampus_ukm,surat_pernyataan'],
            'legal_doc_number' => ['nullable', 'string', 'max:255'],
            'legal_doc_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf'],
            'operational_phone' => ['nullable', 'string', 'max:50'],
            'operational_email' => ['nullable', 'email', 'max:255'],
            'operational_hours' => ['nullable', 'string', 'max:255'],
        ]);

        $onboarding->fill([
            'eo_name' => $data['eo_name'] ?? $onboarding->eo_name,
            'organizer_type' => $data['organizer_type'] ?? $onboarding->organizer_type,
            'founded_year' => $data['founded_year'] ?? $onboarding->founded_year,
            'eo_description' => $data['eo_description'] ?? $onboarding->eo_description,
            'legal_doc_type' => $data['legal_doc_type'] ?? $onboarding->legal_doc_type,
            'legal_doc_number' => $data['legal_doc_number'] ?? $onboarding->legal_doc_number,
            'operational_phone' => $data['operational_phone'] ?? $onboarding->operational_phone,
            'operational_email' => $data['operational_email'] ?? $onboarding->operational_email,
            'operational_hours' => $data['operational_hours'] ?? $onboarding->operational_hours,
        ]);

        if ($request->hasFile('legal_doc_file')) {
            $folder = "mitra-event/{$user->id}";
            $old = $onboarding->legal_doc_path;
            $path = $mediaCompression->store($request->file('legal_doc_file'), $folder, 'public');
            $onboarding->legal_doc_path = $path;
            if ($old) {
                Storage::disk('public')->delete($old);
            }
        }

        $onboarding->current_step = max($onboarding->current_step, 2);
        $onboarding->save();

        return back()->with('status', 'onboarding-saved');
    }

    public function updateStepThree(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $user = $request->user();
        $onboarding = MitraEventOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $data = $request->validate([
            'ktp_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf'],
            'selfie_ktp_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png'],
        ]);

        $folder = "mitra-event/{$user->id}";
        $uploads = [
            'ktp_file' => 'ktp_path',
            'selfie_ktp_file' => 'selfie_ktp_path',
        ];

        foreach ($uploads as $input => $column) {
            if ($request->hasFile($input)) {
                $old = $onboarding->{$column};
                $path = $mediaCompression->store($request->file($input), $folder, 'public');
                $onboarding->{$column} = $path;
                if ($old) {
                    Storage::disk('public')->delete($old);
                }
            }
        }

        $onboarding->current_step = max($onboarding->current_step, 3);
        $onboarding->save();

        return back()->with('status', 'onboarding-saved');
    }

    public function updateStepFour(Request $request): RedirectResponse
    {
        $user = $request->user();
        $onboarding = MitraEventOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $data = $request->validate([
            'bank_name' => ['nullable', 'string', 'max:255'],
            'bank_account_number' => ['nullable', 'string', 'max:100'],
            'bank_account_name' => ['nullable', 'string', 'max:255'],
            'bank_account_relation' => ['nullable', 'in:pribadi,organisasi,perusahaan'],
        ]);

        $onboarding->fill($data);
        $onboarding->current_step = max($onboarding->current_step, 4);
        $onboarding->save();

        return back()->with('status', 'onboarding-saved');
    }

    public function submitVerification(Request $request): RedirectResponse
    {
        $user = $request->user();
        $onboarding = MitraEventOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $payload = [
            'responsible_name' => $onboarding->responsible_name,
            'responsible_phone' => $onboarding->responsible_phone,
            'responsible_role' => $onboarding->responsible_role,
            'eo_name' => $onboarding->eo_name,
            'organizer_type' => $onboarding->organizer_type,
            'legal_doc_type' => $onboarding->legal_doc_type,
            'legal_doc_number' => $onboarding->legal_doc_number,
            'legal_doc_path' => $onboarding->legal_doc_path,
            'ktp_path' => $onboarding->ktp_path,
            'bank_name' => $onboarding->bank_name,
            'bank_account_number' => $onboarding->bank_account_number,
            'bank_account_name' => $onboarding->bank_account_name,
            'bank_account_relation' => $onboarding->bank_account_relation,
            'operational_phone' => $onboarding->operational_phone,
            'operational_email' => $onboarding->operational_email,
            'operational_hours' => $onboarding->operational_hours,
        ];

        \Validator::make($payload, [
            'responsible_name' => ['required', 'string', 'max:255'],
            'responsible_phone' => ['required', 'string', 'max:50'],
            'responsible_role' => ['required', 'in:owner,project_manager,ketua_panitia,admin_eo'],
            'eo_name' => ['required', 'string', 'max:255'],
            'organizer_type' => ['required', 'in:eo_profesional,komunitas,kampus,individu'],
            'legal_doc_type' => ['required', 'in:nib_siup_akta,surat_eo_komunitas,surat_kampus_ukm,surat_pernyataan'],
            'legal_doc_number' => ['required', 'string', 'max:255'],
            'legal_doc_path' => ['required', 'string'],
            'ktp_path' => ['required', 'string'],
            'bank_name' => ['required', 'string', 'max:255'],
            'bank_account_number' => ['required', 'string', 'max:100'],
            'bank_account_name' => ['required', 'string', 'max:255'],
            'bank_account_relation' => ['required', 'in:pribadi,organisasi,perusahaan'],
            'operational_phone' => ['required', 'string', 'max:50'],
            'operational_email' => ['required', 'email', 'max:255'],
            'operational_hours' => ['required', 'string', 'max:255'],
        ])->validate();

        $onboarding->update([
            'verification_status' => 'pending',
            'verification_reason' => null,
        ]);

        \App\Models\EventOrganizer::updateOrCreate(
            ['user_id' => $user->id],
            [
                'name' => $onboarding->eo_name ?: ($onboarding->responsible_name ?? $user->name),
                'email' => $user->email,
                'phone' => $onboarding->responsible_phone,
                'status' => 'pending',
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

        return back()->with('status', 'verification-submitted');
    }
}
