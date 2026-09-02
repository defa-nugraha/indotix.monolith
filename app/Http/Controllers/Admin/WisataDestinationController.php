<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\Regency;
use App\Models\User;
use App\Services\MediaCompressionService;
use App\Support\AdminDataScope;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WisataDestinationController extends Controller
{
    private const MAX_IMAGE_KILOBYTES = 5120;
    private const MAX_OTHER_PHOTO_COUNT = 5;

    public function index(Request $request): Response
    {
        $query = AdminDataScope::applyCreatedByOrUser(
            MitraWisataOnboarding::query()->with(['user:id,name,email']),
            $request,
        );

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder->where('destination_name', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', "%{$search}%"));
            });
        }

        if (($status = $request->string('status')->toString()) === 'suspended') {
            $query->where('is_suspended', true);
        } elseif ($status) {
            $query->where('verification_status', $status);
        }

        if ($city = $request->string('city')->toString()) {
            $query->where('city_code', $city);
        }

        $destinations = $query->latest('id')
            ->paginate(\App\Support\PaginationOptions::perPage())
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

    public function create(): Response
    {
        return Inertia::render('admin/wisata/destinations/show', [
            'destination' => [
                'id' => null,
                'encrypted_id' => null,
                'user_id' => null,
                'destination_name' => null,
                'destination_type' => 'alam',
                'description' => null,
                'highlights' => null,
                'province_code' => null,
                'city_code' => null,
                'address_full' => null,
                'maps_pin_url' => null,
                'open_days' => null,
                'open_time' => null,
                'close_time' => null,
                'holiday_notes' => null,
                'contact_phone' => null,
                'contact_hours' => null,
                'is_live' => false,
                'is_suspended' => false,
                'verification_status' => 'verified',
            ],
            'cityName' => null,
            'provinces' => $this->provinceOptions(),
            'cities' => $this->cityOptions(),
            'userOptions' => $this->mitraOptions(),
            'isCreate' => true,
        ]);
    }

    public function show(string $destination): Response
    {
        $destination = $this->resolveDestination($destination);
        AdminDataScope::authorizeCreatedByOrUser($destination, request());
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
            'userOptions' => $this->mitraOptions(),
            'isCreate' => false,
        ]);
    }

    public function store(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $data = $this->validateDestination($request, true);
        $destination = new MitraWisataOnboarding();
        $destination->fill(Arr::except($data, [
            'photo_gate_file',
            'photo_area_file',
            'photo_ticket_file',
            'photo_product_file',
            'photo_other_files',
            'photo_other_remove',
        ]));
        $destination->current_step = 3;
        $destination->verification_status = $data['verification_status'] ?? 'verified';
        $destination->payout_status = 'verified';
        $destination->save();

        $this->storeDestinationImages($request, $destination, $mediaCompression, $data);
        $destination->save();

        return redirect()->route('admin.wisata.destinations.show', Crypt::encryptString((string) $destination->id))
            ->with('status', 'destination-created');
    }

    public function update(Request $request, string $destination, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $destination = $this->resolveDestination($destination);
        AdminDataScope::authorizeCreatedByOrUser($destination, $request);
        $data = $this->validateDestination($request, false);

        $payload = Arr::except($data, [
            'photo_gate_file',
            'photo_area_file',
            'photo_ticket_file',
            'photo_product_file',
            'photo_other_files',
            'photo_other_remove',
        ]);
        $destination->fill($payload);

        $this->storeDestinationImages($request, $destination, $mediaCompression, $data);

        $destination->save();

        return back()->with('status', 'destination-updated');
    }

    private function storeDestinationImages(Request $request, MitraWisataOnboarding $destination, MediaCompressionService $mediaCompression, array $data): void
    {
        $folder = "mitra-wisata/{$destination->user_id}";
        $uploads = [
            'photo_gate_file' => 'photo_gate_path',
            'photo_area_file' => 'photo_area_path',
            'photo_ticket_file' => 'photo_ticket_path',
            'photo_product_file' => 'photo_product_path',
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
        if (count($remainingOthers) + count($newFiles) > self::MAX_OTHER_PHOTO_COUNT) {
            throw ValidationException::withMessages([
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

    }

    public function suspend(Request $request, string $destination): RedirectResponse
    {
        $destination = $this->resolveDestination($destination);
        AdminDataScope::authorizeCreatedByOrUser($destination, $request);
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

    public function destroy(string $destination): RedirectResponse
    {
        $destination = $this->resolveDestination($destination);
        AdminDataScope::authorizeCreatedByOrUser($destination, request());
        if ($destination->tickets()->exists() || $destination->bookings()->exists()) {
            return back()->withErrors([
                'destination' => 'Destinasi tidak dapat dihapus karena sudah memiliki tiket atau booking.',
            ]);
        }

        foreach ([
            $destination->photo_product_path,
            $destination->photo_gate_path,
            $destination->photo_area_path,
            $destination->photo_ticket_path,
            ...(is_array($destination->photo_other_paths) ? $destination->photo_other_paths : []),
        ] as $path) {
            if ($path) {
                Storage::disk('public')->delete($path);
            }
        }

        $destination->delete();

        return redirect()->route('admin.wisata.destinations.index')->with('status', 'destination-deleted');
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

    private function validateDestination(Request $request, bool $creating): array
    {
        $mitraRule = Rule::exists('users', 'id');
        if (! AdminDataScope::canViewAll($request->user())) {
            $userId = $request->user()?->id ?? 0;
            $mitraRule = Rule::exists('users', 'id')->where(fn ($query) => $query
                ->where(fn ($mitraQuery) => $mitraQuery
                    ->where('role', 'mitra')
                    ->where('created_by', $userId))
                ->orWhere('id', $userId));
        }

        return $request->validate([
            'user_id' => [$creating ? 'required' : 'sometimes', 'integer', $mitraRule],
            'destination_name' => ['required', 'string', 'max:255'],
            'destination_type' => ['required', 'string', 'max:80'],
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
            'verification_status' => ['nullable', 'in:draft,pending,verified,rejected'],
            'is_live' => ['nullable', 'boolean'],
            'photo_gate_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'photo_area_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'photo_ticket_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'photo_product_file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'photo_other_files' => ['nullable', 'array', 'max:'.self::MAX_OTHER_PHOTO_COUNT],
            'photo_other_files.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
            'photo_other_remove' => ['nullable', 'array', 'max:'.self::MAX_OTHER_PHOTO_COUNT],
            'photo_other_remove.*' => ['string'],
        ], [
            'photo_gate_file.max' => 'Ukuran foto gerbang maksimal 5 MB.',
            'photo_area_file.max' => 'Ukuran foto area utama maksimal 5 MB.',
            'photo_ticket_file.max' => 'Ukuran foto loket maksimal 5 MB.',
            'photo_product_file.max' => 'Ukuran foto produk maksimal 5 MB.',
            'photo_other_files.*.max' => 'Ukuran setiap foto lainnya maksimal 5 MB.',
            '*.image' => 'File harus berupa gambar.',
            '*.mimes' => 'Foto harus berformat JPG, JPEG, PNG, atau WEBP.',
        ]);
    }

    private function provinceOptions(): array
    {
        return DB::table('provinces')
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => ['id' => $item->code, 'label' => $item->name])
            ->all();
    }

    private function cityOptions(): array
    {
        return Regency::query()
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => ['id' => $item->code, 'label' => $item->name])
            ->all();
    }

    private function mitraOptions(): array
    {
        $user = request()->user();
        $userId = $user?->id ?? 0;

        return User::query()
            ->when(AdminDataScope::canViewAll($user),
                fn ($query) => $query,
                fn ($query) => $query->where(fn ($builder) => $builder
                    ->where(fn ($mitraQuery) => $mitraQuery
                        ->where('role', 'mitra')
                        ->where('created_by', $userId))
                    ->orWhere('id', $userId)))
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'label' => trim($user->name.' - '.$user->email),
            ])
            ->all();
    }
}
