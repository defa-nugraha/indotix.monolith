<?php

namespace App\Http\Controllers;

use App\Models\MitraWisataOnboarding;
use App\Services\MediaCompressionService;
use App\Services\MitraWisataSensitiveDocumentService;
use App\Support\CommissionInfo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MitraWisataOnboardingController extends Controller
{
    private const MAX_IMAGE_KILOBYTES = 5120;

    public function show(Request $request): Response
    {
        $user = $request->user();
        $this->ensureWisataMitra($request);

        $onboarding = MitraWisataOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $provinces = DB::table('provinces')
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => [
                'id' => $item->code,
                'label' => $item->name,
            ])
            ->all();

        $cities = DB::table('regencies')
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => [
                'id' => $item->code,
                'label' => $item->name,
            ])
            ->all();

        return Inertia::render('mitra/wisata-onboarding', [
            'onboarding' => $onboarding,
            'sensitiveDocumentUrls' => [
                'ktp' => $onboarding->ktp_path ? route('mitra.wisata.documents.show', ['type' => 'ktp']) : null,
                'selfie' => $onboarding->selfie_ktp_path ? route('mitra.wisata.documents.show', ['type' => 'selfie']) : null,
                'legal' => $onboarding->legal_doc_path ? route('mitra.wisata.documents.show', ['type' => 'legal']) : null,
            ],
            'provinces' => $provinces,
            'cities' => $cities,
            'commissionInfo' => CommissionInfo::wisata($onboarding->id),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function updateStepOne(Request $request): RedirectResponse
    {
        $user = $request->user();
        $this->ensureWisataMitra($request);

        $onboarding = MitraWisataOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $data = $request->validate([
            'responsible_name' => ['nullable', 'string', 'max:255'],
            'responsible_phone' => ['nullable', 'string', 'max:50'],
            'responsible_role' => ['nullable', 'string', 'max:80'],
        ]);

        $onboarding->fill($data);
        $onboarding->current_step = max($onboarding->current_step, 1);
        $onboarding->save();

        return back()->with('status', 'onboarding-saved');
    }

    public function updateStepTwo(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $user = $request->user();
        $this->ensureWisataMitra($request);

        $onboarding = MitraWisataOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $data = $request->validate([
            'destination_name' => ['nullable', 'string', 'max:255'],
            'destination_type' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:1000'],
            'highlights' => ['nullable', 'string', 'max:1000'],
            'province_code' => ['nullable', 'exists:provinces,code'],
            'city_code' => ['nullable', 'exists:regencies,code'],
            'address_full' => ['nullable', 'string', 'max:500'],
            'maps_pin_url' => ['nullable', 'string', 'max:500'],
            'open_days' => ['nullable', 'array'],
            'open_days.*' => ['string'],
            'open_time' => ['nullable', 'string', 'max:8'],
            'close_time' => ['nullable', 'string', 'max:8'],
            'holiday_notes' => ['nullable', 'string', 'max:255'],
            'facilities' => ['nullable', 'array'],
            'facilities.*' => ['string'],
            'photo_gate_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'photo_area_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'photo_ticket_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'contact_hours' => ['nullable', 'string', 'max:100'],
        ], [
            'photo_gate_file.max' => 'Ukuran foto gerbang maksimal 5 MB.',
            'photo_area_file.max' => 'Ukuran foto area utama maksimal 5 MB.',
            'photo_ticket_file.max' => 'Ukuran foto loket maksimal 5 MB.',
            '*.image' => 'File harus berupa gambar.',
            '*.mimes' => 'Foto harus berformat JPG, JPEG, PNG, atau WEBP.',
        ]);

        $onboarding->fill([
            'destination_name' => $data['destination_name'] ?? $onboarding->destination_name,
            'destination_type' => $data['destination_type'] ?? $onboarding->destination_type,
            'description' => $data['description'] ?? $onboarding->description,
            'highlights' => $data['highlights'] ?? $onboarding->highlights,
            'province_code' => $data['province_code'] ?? $onboarding->province_code,
            'city_code' => $data['city_code'] ?? $onboarding->city_code,
            'address_full' => $data['address_full'] ?? $onboarding->address_full,
            'maps_pin_url' => $data['maps_pin_url'] ?? $onboarding->maps_pin_url,
            'open_days' => $data['open_days'] ?? $onboarding->open_days,
            'open_time' => $data['open_time'] ?? $onboarding->open_time,
            'close_time' => $data['close_time'] ?? $onboarding->close_time,
            'holiday_notes' => $data['holiday_notes'] ?? $onboarding->holiday_notes,
            'facilities' => $data['facilities'] ?? $onboarding->facilities,
            'contact_phone' => $data['contact_phone'] ?? $onboarding->contact_phone,
            'contact_hours' => $data['contact_hours'] ?? $onboarding->contact_hours,
        ]);

        $folder = "mitra-wisata/{$user->id}";
        $uploads = [
            'photo_gate_file' => 'photo_gate_path',
            'photo_area_file' => 'photo_area_path',
            'photo_ticket_file' => 'photo_ticket_path',
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

    public function updateStepThree(Request $request, MitraWisataSensitiveDocumentService $sensitiveDocuments): RedirectResponse
    {
        $user = $request->user();
        $this->ensureWisataMitra($request);

        $onboarding = MitraWisataOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $data = $request->validate([
            'ktp_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'selfie_ktp_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'legal_doc_type' => ['nullable', 'in:nib,sk_desa,surat_pokdarwis,izin_wisata,dokumen_kawasan'],
            'legal_doc_number' => ['nullable', 'string', 'max:255'],
            'legal_doc_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'bank_name' => ['nullable', 'required_with:bank_account_number,bank_account_name', 'string', 'max:255'],
            'bank_account_number' => ['nullable', 'required_with:bank_name,bank_account_name', 'string', 'regex:/^[0-9]{6,30}$/'],
            'bank_account_name' => ['nullable', 'required_with:bank_name,bank_account_number', 'string', 'max:255'],
        ], [
            '*.max' => 'Ukuran setiap dokumen maksimal 5 MB.',
            '*.mimes' => 'Format dokumen tidak sesuai.',
        ]);

        $onboarding->fill([
            'legal_doc_type' => $data['legal_doc_type'] ?? $onboarding->legal_doc_type,
            'legal_doc_number' => $data['legal_doc_number'] ?? $onboarding->legal_doc_number,
            'bank_name' => $data['bank_name'] ?? $onboarding->bank_name,
            'bank_account_number' => $data['bank_account_number'] ?? $onboarding->bank_account_number,
            'bank_account_name' => $data['bank_account_name'] ?? $onboarding->bank_account_name,
        ]);

        $uploads = [
            'ktp_file' => 'ktp_path',
            'selfie_ktp_file' => 'selfie_ktp_path',
            'legal_doc_file' => 'legal_doc_path',
        ];

        foreach ($uploads as $input => $column) {
            if ($request->hasFile($input)) {
                $onboarding->{$column} = $sensitiveDocuments->store(
                    $request->file($input),
                    (int) $user->id,
                    $onboarding->{$column},
                );
            }
        }

        $onboarding->current_step = max($onboarding->current_step, 3);
        $onboarding->save();

        return back()->with('status', 'onboarding-saved');
    }

    public function submitVerification(Request $request): RedirectResponse
    {
        $user = $request->user();
        $this->ensureWisataMitra($request);

        $onboarding = MitraWisataOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $payload = [
            'responsible_name' => $onboarding->responsible_name,
            'responsible_phone' => $onboarding->responsible_phone,
            'responsible_role' => $onboarding->responsible_role,
            'destination_name' => $onboarding->destination_name,
            'destination_type' => $onboarding->destination_type,
            'description' => $onboarding->description,
            'province_code' => $onboarding->province_code,
            'city_code' => $onboarding->city_code,
            'address_full' => $onboarding->address_full,
            'maps_pin_url' => $onboarding->maps_pin_url,
            'open_days' => $onboarding->open_days,
            'open_time' => $onboarding->open_time,
            'close_time' => $onboarding->close_time,
            'photo_gate_path' => $onboarding->photo_gate_path,
            'photo_area_path' => $onboarding->photo_area_path,
            'photo_ticket_path' => $onboarding->photo_ticket_path,
            'ktp_path' => $onboarding->ktp_path,
            'legal_doc_type' => $onboarding->legal_doc_type,
            'legal_doc_number' => $onboarding->legal_doc_number,
            'legal_doc_path' => $onboarding->legal_doc_path,
        ];

        \Validator::make($payload, [
            'responsible_name' => ['required', 'string', 'max:255'],
            'responsible_phone' => ['required', 'string', 'max:50'],
            'responsible_role' => ['required', 'string', 'max:80'],
            'destination_name' => ['required', 'string', 'max:255'],
            'destination_type' => ['required', 'string', 'max:80'],
            'description' => ['required', 'string', 'max:1000'],
            'province_code' => ['required', 'exists:provinces,code'],
            'city_code' => ['required', 'exists:regencies,code'],
            'address_full' => ['required', 'string', 'max:500'],
            'maps_pin_url' => ['required', 'string', 'max:500'],
            'open_days' => ['required', 'array', 'min:1'],
            'open_time' => ['required', 'string', 'max:8'],
            'close_time' => ['required', 'string', 'max:8'],
            'photo_gate_path' => ['required', 'string'],
            'photo_area_path' => ['required', 'string'],
            'photo_ticket_path' => ['required', 'string'],
            'ktp_path' => ['required', 'string'],
            'legal_doc_type' => ['required', 'in:nib,sk_desa,surat_pokdarwis,izin_wisata,dokumen_kawasan'],
            'legal_doc_number' => ['required', 'string', 'max:255'],
            'legal_doc_path' => ['required', 'string'],
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
        $this->ensureWisataMitra($request);

        $onboarding = MitraWisataOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $payload = [
            'bank_name' => $onboarding->bank_name,
            'bank_account_number' => $onboarding->bank_account_number,
            'bank_account_name' => $onboarding->bank_account_name,
        ];

        \Validator::make($payload, [
            'bank_name' => ['required', 'string', 'max:255'],
            'bank_account_number' => ['required', 'string', 'regex:/^[0-9]{6,30}$/'],
            'bank_account_name' => ['required', 'string', 'max:255'],
        ])->validate();

        $onboarding->update([
            'payout_status' => 'pending',
            'payout_reason' => null,
        ]);

        return back()->with('status', 'payout-submitted');
    }

    private function ensureWisataMitra(Request $request): void
    {
        abort_unless(
            $request->user()?->mitra_onboarding_type === 'wisata',
            403,
            'Pendaftaran mitra saat ini hanya tersedia untuk pengelola wisata.'
        );
    }
}
