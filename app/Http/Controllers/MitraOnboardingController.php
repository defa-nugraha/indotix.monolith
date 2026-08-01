<?php

namespace App\Http\Controllers;

use App\Models\MitraOnboarding;
use App\Models\Regency;
use App\Services\MediaCompressionService;
use App\Support\CommissionInfo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MitraOnboardingController extends Controller
{
    private const MAX_UPLOAD_KILOBYTES = 5120;

    public function selectType(Request $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'type' => ['required', 'in:hotel,wisata,event'],
        ]);

        if ($user->mitra_onboarding_type && $user->mitra_onboarding_type !== $data['type']) {
            return back()->withErrors([
                'type' => 'Jenis mitra sudah dipilih dan tidak bisa diubah.',
            ]);
        }

        $user->mitra_onboarding_type = $data['type'];
        $user->save();

        if ($data['type'] === 'wisata') {
            return redirect()->route('mitra.wisata.onboarding');
        }
        if ($data['type'] === 'event') {
            return redirect()->route('mitra.event.onboarding');
        }

        return redirect()->route('mitra.onboarding');
    }

    public function show(Request $request): Response
    {
        $user = $request->user();
        if ($user->mitra_onboarding_type === 'wisata') {
            return redirect()->route('mitra.wisata.onboarding');
        }
        if ($user->mitra_onboarding_type === 'event') {
            return redirect()->route('mitra.event.onboarding');
        }

        if (! $user->mitra_onboarding_type) {
            return redirect()->route('mitra.dashboard')->withErrors([
                'mitra' => 'Silakan pilih jenis mitra terlebih dahulu.',
            ]);
        }
        $onboarding = MitraOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $cities = Regency::query()
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => [
                'id' => $item->code,
                'label' => $item->name,
            ])
            ->all();

        return Inertia::render('mitra/onboarding', [
            'onboarding' => $onboarding,
            'cities' => $cities,
            'commissionInfo' => CommissionInfo::hotel(),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function updateStepOne(Request $request): RedirectResponse
    {
        $user = $request->user();
        $onboarding = MitraOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $data = $request->validate([
            'hotel_name' => ['nullable', 'string', 'max:255'],
            'property_type' => ['nullable', 'in:hotel,guest_house,homestay,kost_harian'],
            'city_code' => ['nullable', 'exists:regencies,code'],
            'address_short' => ['nullable', 'string', 'max:255'],
            'estimated_room_count' => ['nullable', 'integer', 'min:0'],
        ]);

        $onboarding->fill($data);
        $onboarding->current_step = max($onboarding->current_step, 1);
        $onboarding->save();

        return back()->with('status', 'onboarding-saved');
    }

    public function updateStepTwo(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $user = $request->user();
        $onboarding = MitraOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $data = $request->validate([
            'responsible_name' => ['nullable', 'string', 'max:255'],
            'responsible_nik' => ['nullable', 'string', 'max:32'],
            'responsible_role' => ['nullable', 'in:owner,manager,admin'],
            'ktp_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:'.self::MAX_UPLOAD_KILOBYTES],
            'selfie_ktp_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png', 'max:'.self::MAX_UPLOAD_KILOBYTES],
            'legal_doc_type' => ['nullable', 'in:nib,siup,tdp,surat_izin_daerah,surat_rt_rw,akta_pendirian'],
            'legal_doc_number' => ['nullable', 'string', 'max:255'],
            'legal_doc_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:'.self::MAX_UPLOAD_KILOBYTES],
            'photo_front_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png', 'max:'.self::MAX_UPLOAD_KILOBYTES],
            'photo_lobby_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png', 'max:'.self::MAX_UPLOAD_KILOBYTES],
            'photo_room_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png', 'max:'.self::MAX_UPLOAD_KILOBYTES],
            'address_full' => ['nullable', 'string', 'max:500'],
            'maps_pin_url' => ['nullable', 'string', 'max:500'],
            'reception_phone' => ['nullable', 'string', 'max:50'],
            'operational_hours' => ['nullable', 'string', 'max:100'],
            'reservation_pic' => ['nullable', 'string', 'max:100'],
        ]);

        if (! $onboarding->selfie_ktp_path && ! $request->hasFile('selfie_ktp_file')) {
            return back()->withErrors([
                'selfie_ktp_file' => 'Selfie + KTP wajib diunggah.',
            ]);
        }

        $onboarding->fill([
            'responsible_name' => $data['responsible_name'] ?? $onboarding->responsible_name,
            'responsible_nik' => $data['responsible_nik'] ?? $onboarding->responsible_nik,
            'responsible_role' => $data['responsible_role'] ?? $onboarding->responsible_role,
            'legal_doc_type' => $data['legal_doc_type'] ?? $onboarding->legal_doc_type,
            'legal_doc_number' => $data['legal_doc_number'] ?? $onboarding->legal_doc_number,
            'address_full' => $data['address_full'] ?? $onboarding->address_full,
            'maps_pin_url' => $data['maps_pin_url'] ?? $onboarding->maps_pin_url,
            'reception_phone' => $data['reception_phone'] ?? $onboarding->reception_phone,
            'operational_hours' => $data['operational_hours'] ?? $onboarding->operational_hours,
            'reservation_pic' => $data['reservation_pic'] ?? $onboarding->reservation_pic,
        ]);

        $folder = "mitra-onboarding/{$user->id}";
        $uploads = [
            'ktp_file' => 'ktp_path',
            'selfie_ktp_file' => 'selfie_ktp_path',
            'legal_doc_file' => 'legal_doc_path',
            'photo_front_file' => 'photo_front_path',
            'photo_lobby_file' => 'photo_lobby_path',
            'photo_room_file' => 'photo_room_path',
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

        $onboarding->current_step = max($onboarding->current_step, 2);
        $onboarding->save();

        return back()->with('status', 'onboarding-saved');
    }

    public function updateStepThree(Request $request): RedirectResponse
    {
        $user = $request->user();
        $onboarding = MitraOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $data = $request->validate([
            'bank_name' => ['nullable', 'string', 'max:255'],
            'bank_account_number' => ['nullable', 'string', 'max:100'],
            'bank_account_name' => ['nullable', 'string', 'max:255'],
            'tax_npwp' => ['nullable', 'string', 'max:100'],
            'tax_type' => ['nullable', 'in:pribadi,badan'],
        ]);

        $onboarding->fill($data);
        $onboarding->current_step = max($onboarding->current_step, 3);
        $onboarding->save();

        return back()->with('status', 'onboarding-saved');
    }

    public function submitVerification(Request $request): RedirectResponse
    {
        $user = $request->user();
        $onboarding = MitraOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $payload = [
            'hotel_name' => $onboarding->hotel_name,
            'property_type' => $onboarding->property_type,
            'city_code' => $onboarding->city_code,
            'address_short' => $onboarding->address_short,
            'responsible_name' => $onboarding->responsible_name,
            'responsible_nik' => $onboarding->responsible_nik,
            'responsible_role' => $onboarding->responsible_role,
            'ktp_path' => $onboarding->ktp_path,
            'selfie_ktp_path' => $onboarding->selfie_ktp_path,
            'photo_front_path' => $onboarding->photo_front_path,
            'photo_lobby_path' => $onboarding->photo_lobby_path,
            'photo_room_path' => $onboarding->photo_room_path,
            'address_full' => $onboarding->address_full,
            'maps_pin_url' => $onboarding->maps_pin_url,
            'reception_phone' => $onboarding->reception_phone,
            'operational_hours' => $onboarding->operational_hours,
            'reservation_pic' => $onboarding->reservation_pic,
        ];

        \Validator::make($payload, [
            'hotel_name' => ['required', 'string', 'max:255'],
            'property_type' => ['required', 'in:hotel,guest_house,homestay,kost_harian'],
            'city_code' => ['required', 'exists:regencies,code'],
            'address_short' => ['required', 'string', 'max:255'],
            'responsible_name' => ['required', 'string', 'max:255'],
            'responsible_nik' => ['required', 'string', 'max:32'],
            'responsible_role' => ['required', 'in:owner,manager,admin'],
            'ktp_path' => ['required', 'string'],
            'selfie_ktp_path' => ['required', 'string'],
            'photo_front_path' => ['required', 'string'],
            'photo_lobby_path' => ['required', 'string'],
            'photo_room_path' => ['required', 'string'],
            'address_full' => ['required', 'string', 'max:500'],
            'maps_pin_url' => ['required', 'string', 'max:500'],
            'reception_phone' => ['required', 'string', 'max:50'],
            'operational_hours' => ['required', 'string', 'max:100'],
            'reservation_pic' => ['required', 'string', 'max:100'],
        ])->validate();

        $onboarding->update([
            'verification_status' => 'pending',
            'verification_reason' => null,
        ]);

        return back()->with('status', 'verification-submitted');
    }

    public function submitPayout(Request $request): RedirectResponse
    {
        $user = $request->user();
        $onboarding = MitraOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $payload = [
            'bank_name' => $onboarding->bank_name,
            'bank_account_number' => $onboarding->bank_account_number,
            'bank_account_name' => $onboarding->bank_account_name,
        ];

        \Validator::make($payload, [
            'bank_name' => ['required', 'string', 'max:255'],
            'bank_account_number' => ['required', 'string', 'max:100'],
            'bank_account_name' => ['required', 'string', 'max:255'],
        ])->validate();

        $onboarding->update([
            'payout_status' => 'pending',
            'payout_reason' => null,
        ]);

        return back()->with('status', 'payout-submitted');
    }
}
