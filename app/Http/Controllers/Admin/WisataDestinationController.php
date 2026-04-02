<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\Regency;
use App\Services\MediaCompressionService;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class WisataDestinationController extends Controller
{
    public function index(Request $request): Response
    {
        $query = MitraWisataOnboarding::query()
            ->with(['user:id,name,email']);

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder->where('destination_name', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('verification_status', $status);
        }

        if ($city = $request->string('city')->toString()) {
            $query->where('city_code', $city);
        }

        $destinations = $query->latest('id')
            ->paginate(10)
            ->withQueryString()
            ->through(function (MitraWisataOnboarding $item) {
                return [
                    'id' => $item->id,
                    'encrypted_id' => Crypt::encryptString((string) $item->id),
                    'destination_name' => $item->destination_name,
                    'destination_type' => $item->destination_type,
                    'city_code' => $item->city_code,
                    'verification_status' => $item->verification_status,
                    'is_live' => $item->is_live,
                    'is_suspended' => $item->is_suspended,
                    'user' => [
                        'id' => $item->user?->id,
                        'name' => $item->user?->name,
                        'email' => $item->user?->email,
                    ],
                ];
            });

        $cities = Regency::query()
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => ['id' => $item->code, 'label' => $item->name])
            ->all();

        return Inertia::render('admin/wisata/destinations/index', [
            'destinations' => $destinations,
            'cities' => $cities,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'city' => $request->string('city')->toString(),
            ],
        ]);
    }

    public function show(string $destination): Response
    {
        $destination = $this->resolveDestination($destination);
        $destination->load(['user:id,name,email']);
        $destination->setAttribute('encrypted_id', Crypt::encryptString((string) $destination->id));

        $provinces = DB::table('provinces')
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => ['id' => $item->code, 'label' => $item->name])
            ->all();

        $cities = Regency::query()
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => ['id' => $item->code, 'label' => $item->name])
            ->all();

        return Inertia::render('admin/wisata/destinations/show', [
            'destination' => $destination,
            'cityName' => Regency::query()->where('code', $destination->city_code)->value('name'),
            'provinces' => $provinces,
            'cities' => $cities,
        ]);
    }

    public function update(Request $request, string $destination, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $destination = $this->resolveDestination($destination);
        $data = $request->validate([
            'destination_name' => ['required', 'string', 'max:255'],
            'destination_type' => ['required', 'in:alam,edukasi,budaya,wahana,event'],
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
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'contact_hours' => ['nullable', 'string', 'max:100'],
            'is_live' => ['nullable', 'boolean'],
            'photo_gate_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png'],
            'photo_area_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png'],
            'photo_ticket_file' => ['nullable', 'file', 'mimes:jpg,jpeg,png'],
            'photo_other_files' => ['nullable', 'array', 'max:5'],
            'photo_other_files.*' => ['file', 'mimes:jpg,jpeg,png'],
            'photo_other_remove' => ['nullable', 'array', 'max:5'],
            'photo_other_remove.*' => ['string'],
        ]);

        $payload = Arr::except($data, [
            'photo_gate_file',
            'photo_area_file',
            'photo_ticket_file',
            'photo_other_files',
            'photo_other_remove',
        ]);
        $destination->fill($payload);

        $folder = "mitra-wisata/{$destination->user_id}";
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

    public function suspend(Request $request, string $destination): RedirectResponse
    {
        $destination = $this->resolveDestination($destination);
        $data = $request->validate([
            'action' => ['required', 'in:suspend,unsuspend'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        if ($data['action'] === 'suspend') {
            $destination->update([
                'is_suspended' => true,
                'suspended_reason' => $data['reason'],
                'suspended_at' => now(),
            ]);
        } else {
            $destination->update([
                'is_suspended' => false,
                'suspended_reason' => null,
                'suspended_at' => null,
            ]);
        }

        return back()->with('status', 'destination-suspended');
    }

    private function resolveDestination(string $destination): MitraWisataOnboarding
    {
        try {
            $id = Crypt::decryptString($destination);
        } catch (DecryptException $exception) {
            if (ctype_digit($destination)) {
                $id = (int) $destination;
            } else {
                abort(404);
            }
        }

        return MitraWisataOnboarding::query()->findOrFail($id);
    }
}
