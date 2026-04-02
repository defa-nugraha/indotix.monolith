<?php

namespace App\Http\Controllers\Mitra\Wisata;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Services\MediaCompressionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DestinationController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $user->id)
            ->firstOrFail();

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
            'provinces' => $provinces,
            'cities' => $cities,
        ]);
    }

    public function update(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $user = $request->user();
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $user->id)
            ->firstOrFail();

        $data = $request->validate([
            'destination_name' => ['required', 'string', 'max:255'],
            'destination_type' => ['required', 'in:alam,edukasi,budaya,wahana,event'],
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
            'is_temporarily_closed' => ['nullable', 'boolean'],
            'closure_note' => ['nullable', 'string', 'max:255'],
            'photo_gate_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png'],
            'photo_area_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png'],
            'photo_ticket_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png'],
            'photo_other_files' => ['nullable', 'array', 'max:5'],
            'photo_other_files.*' => ['file', 'mimes:jpg,jpeg,png'],
            'photo_other_remove' => ['nullable', 'array', 'max:5'],
            'photo_other_remove.*' => ['string'],
        ]);

        $destination->fill([
            'destination_name' => $data['destination_name'],
            'destination_type' => $data['destination_type'],
            'description' => $data['description'] ?? $destination->description,
            'highlights' => $data['highlights'] ?? $destination->highlights,
            'province_code' => $data['province_code'],
            'city_code' => $data['city_code'],
            'address_full' => $data['address_full'],
            'maps_pin_url' => $data['maps_pin_url'] ?? $destination->maps_pin_url,
            'open_days' => $data['open_days'] ?? $destination->open_days,
            'open_time' => $data['open_time'] ?? $destination->open_time,
            'close_time' => $data['close_time'] ?? $destination->close_time,
            'holiday_notes' => $data['holiday_notes'] ?? $destination->holiday_notes,
            'facilities' => $data['facilities'] ?? $destination->facilities,
            'contact_phone' => $data['contact_phone'] ?? $destination->contact_phone,
            'contact_hours' => $data['contact_hours'] ?? $destination->contact_hours,
            'is_temporarily_closed' => (bool) ($data['is_temporarily_closed'] ?? false),
            'closure_note' => $data['closure_note'] ?? null,
        ]);

        $folder = "mitra-wisata/{$user->id}";
        $uploads = [
            'photo_gate_file' => 'photo_gate_path',
            'photo_area_file' => 'photo_area_path',
            'photo_ticket_file' => 'photo_ticket_path',
        ];

        foreach ($uploads as $input => $column) {
            if ($request->hasFile($input)) {
                $old = $destination->{$column};
                $path = $mediaCompression->store($request->file($input), $folder, 'public');
                $destination->{$column} = $path;
                if ($old) {
                    Storage::disk('public')->delete($old);
                }
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
        if (count($remainingOthers) + count($newFiles) > 5) {
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
}
