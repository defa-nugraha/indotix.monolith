<?php

namespace App\Http\Controllers\Mitra\Wisata;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Services\MediaCompressionService;
use App\Services\MitraWisataSensitiveDocumentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DestinationController extends Controller
{
    private const MAX_IMAGE_KILOBYTES = 5120;
    private const MAX_OTHER_PHOTO_COUNT = 5;

    public function edit(Request $request): Response
    {
        $user = $request->user();
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $user->id)
            ->firstOrFail();
        $this->ensureDestinationEditable($destination);

        $provinces = DB::table('provinces')
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => ['id' => $item->code, 'label' => $item->name])
            ->all();

        $cities = DB::table('regencies')
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => ['id' => $item->code, 'label' => $item->name])
            ->all();

        return Inertia::render('mitra/wisata/destination', [
            'destination' => $destination,
            'sensitiveDocumentUrls' => [
                'ktp' => $destination->ktp_path ? route('mitra.wisata.documents.show', ['type' => 'ktp']) : null,
                'selfie' => $destination->selfie_ktp_path ? route('mitra.wisata.documents.show', ['type' => 'selfie']) : null,
                'legal' => $destination->legal_doc_path ? route('mitra.wisata.documents.show', ['type' => 'legal']) : null,
            ],
            'provinces' => $provinces,
            'cities' => $cities,
        ]);
    }

    public function update(Request $request, MediaCompressionService $mediaCompression, MitraWisataSensitiveDocumentService $sensitiveDocuments): RedirectResponse
    {
        $user = $request->user();
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $user->id)
            ->firstOrFail();
        $this->ensureDestinationEditable($destination);

        $data = $request->validate([
            'responsible_name' => ['nullable', 'string', 'max:255'],
            'responsible_phone' => ['nullable', 'string', 'max:50'],
            'responsible_role' => ['nullable', 'string', 'max:80'],
            'destination_name' => ['required', 'string', 'max:255'],
            'destination_type' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:1000'],
            'highlights' => ['nullable', 'string', 'max:1000'],
            'province_code' => ['required', 'exists:provinces,code'],
            'city_code' => ['required', 'exists:regencies,code'],
            'address_full' => ['required', 'string', 'max:500'],
            'maps_pin_url' => ['nullable', 'string', 'max:500'],
            'open_days' => ['nullable', 'array'],
            'open_days.*' => ['string'],
            'open_time' => ['nullable', 'string', 'max:8'],
            'close_time' => ['nullable', 'string', 'max:8'],
            'holiday_notes' => ['nullable', 'string', 'max:255'],
            'facilities' => ['nullable', 'array'],
            'facilities.*' => ['string'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'contact_hours' => ['nullable', 'string', 'max:100'],
            'legal_doc_type' => ['nullable', 'in:nib,sk_desa,surat_pokdarwis,izin_wisata,dokumen_kawasan'],
            'legal_doc_number' => ['nullable', 'string', 'max:255'],
            'bank_name' => ['nullable', 'required_with:bank_account_number,bank_account_name', 'string', 'max:255'],
            'bank_account_number' => ['nullable', 'required_with:bank_name,bank_account_name', 'string', 'regex:/^[0-9]{6,30}$/'],
            'bank_account_name' => ['nullable', 'required_with:bank_name,bank_account_number', 'string', 'max:255'],
            'is_temporarily_closed' => ['nullable', 'boolean'],
            'closure_note' => ['nullable', 'string', 'max:255'],
            'photo_gate_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'photo_area_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'photo_ticket_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'photo_product_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'ktp_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'selfie_ktp_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'legal_doc_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'photo_other_files' => ['nullable', 'array', 'max:'.self::MAX_OTHER_PHOTO_COUNT],
            'photo_other_files.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'photo_other_remove' => ['nullable', 'array', 'max:'.self::MAX_OTHER_PHOTO_COUNT],
            'photo_other_remove.*' => ['string'],
        ], [
            'photo_gate_file.max' => 'Ukuran foto gerbang maksimal 5 MB.',
            'photo_area_file.max' => 'Ukuran foto area utama maksimal 5 MB.',
            'photo_ticket_file.max' => 'Ukuran foto loket maksimal 5 MB.',
            'photo_product_file.max' => 'Ukuran foto produk maksimal 5 MB.',
            'ktp_file.max' => 'Ukuran KTP maksimal 5 MB.',
            'selfie_ktp_file.max' => 'Ukuran selfie KTP maksimal 5 MB.',
            'legal_doc_file.max' => 'Ukuran dokumen legal maksimal 5 MB.',
            'photo_other_files.*.max' => 'Ukuran setiap foto lainnya maksimal 5 MB.',
            '*.image' => 'File harus berupa gambar.',
            '*.mimes' => 'Foto harus berformat JPG, JPEG, PNG, atau WEBP.',
        ]);

        $destination->fill([
            'responsible_name' => $data['responsible_name'] ?? null,
            'responsible_phone' => $data['responsible_phone'] ?? null,
            'responsible_role' => $data['responsible_role'] ?? null,
            'destination_name' => $data['destination_name'],
            'destination_type' => $data['destination_type'],
            'description' => $data['description'] ?? null,
            'highlights' => $data['highlights'] ?? null,
            'province_code' => $data['province_code'],
            'city_code' => $data['city_code'],
            'address_full' => $data['address_full'],
            'maps_pin_url' => $data['maps_pin_url'] ?? null,
            'open_days' => $data['open_days'] ?? [],
            'open_time' => $data['open_time'] ?? null,
            'close_time' => $data['close_time'] ?? null,
            'holiday_notes' => $data['holiday_notes'] ?? null,
            'facilities' => $data['facilities'] ?? [],
            'contact_phone' => $data['contact_phone'] ?? null,
            'contact_hours' => $data['contact_hours'] ?? null,
            'legal_doc_type' => $data['legal_doc_type'] ?? null,
            'legal_doc_number' => $data['legal_doc_number'] ?? null,
            'bank_name' => $data['bank_name'] ?? null,
            'bank_account_number' => $data['bank_account_number'] ?? null,
            'bank_account_name' => $data['bank_account_name'] ?? null,
            'is_temporarily_closed' => (bool) ($data['is_temporarily_closed'] ?? false),
            'closure_note' => $data['closure_note'] ?? null,
        ]);

        $folder = "mitra-wisata/{$user->id}";
        $publicUploads = [
            'photo_gate_file' => 'photo_gate_path',
            'photo_area_file' => 'photo_area_path',
            'photo_ticket_file' => 'photo_ticket_path',
            'photo_product_file' => 'photo_product_path',
        ];

        foreach ($publicUploads as $input => $column) {
            if ($request->hasFile($input)) {
                $old = $destination->{$column};
                $path = $mediaCompression->store($request->file($input), $folder, 'public');
                $destination->{$column} = $path;
                if ($old) {
                    Storage::disk('public')->delete($old);
                }
            }
        }

        $sensitiveUploads = [
            'ktp_file' => 'ktp_path',
            'selfie_ktp_file' => 'selfie_ktp_path',
            'legal_doc_file' => 'legal_doc_path',
        ];

        foreach ($sensitiveUploads as $input => $column) {
            if ($request->hasFile($input)) {
                $destination->{$column} = $sensitiveDocuments->store(
                    $request->file($input),
                    (int) $user->id,
                    $destination->{$column},
                );
            }
        }

        $existingOthers = is_array($destination->photo_other_paths)
            ? $destination->photo_other_paths
            : [];
        $removeOthers = $data['photo_other_remove'] ?? [];
        $remainingOthers = array_values(array_filter(
            $existingOthers,
            fn ($path) => $path && ! in_array($path, $removeOthers, true),
        ));
        $newFiles = $request->file('photo_other_files', []);
        if (! is_array($newFiles)) {
            $newFiles = $newFiles ? [$newFiles] : [];
        }
        if (count($remainingOthers) + count($newFiles) > self::MAX_OTHER_PHOTO_COUNT) {
            return back()->withErrors([
                'photo_other_files' => 'Maksimal 5 foto lainnya.',
            ]);
        }
        foreach ($removeOthers as $oldPath) {
            if (in_array($oldPath, $existingOthers, true)) {
                Storage::disk('public')->delete($oldPath);
            }
        }
        if ($newFiles !== []) {
            $added = [];
            foreach ($newFiles as $file) {
                $added[] = $mediaCompression->store($file, $folder, 'public');
            }
            $remainingOthers = array_merge($remainingOthers, $added);
        }
        if ($removeOthers !== [] || $newFiles !== []) {
            $destination->photo_other_paths = $remainingOthers !== []
                ? array_values($remainingOthers)
                : null;
        }

        $destination->save();

        return back()->with('status', 'destination-updated');
    }

    private function ensureDestinationEditable(MitraWisataOnboarding $destination): void
    {
        if (! $destination->is_suspended) {
            return;
        }

        throw ValidationException::withMessages([
            'destination_name' => 'Destinasi sedang disuspend oleh admin. Mitra tidak dapat mengubah produk.',
        ]);
    }
}
