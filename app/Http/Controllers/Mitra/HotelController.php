<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\HotelImage;
use App\Services\MediaCompressionService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class HotelController extends Controller
{
    private const STATUSES = ['draft', 'active'];
    private const SUSPENDED_STATUS = 'suspended';
    private const MAX_IMAGE_COUNT = 10;
    private const MAX_IMAGE_KILOBYTES = 5120;

    private const FACILITY_CODES = [
        'WIFI',
        'PARKING',
        'POOL',
        'RESTAURANT',
        'BREAKFAST',
        'GYM',
        'SPA',
        'AIRPORT_SHUTTLE',
        'MEETING_ROOM',
        'LAUNDRY',
    ];

    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Hotel::query()
            ->where('vendor_id', $user->id)
            ->with('facilities')
            ->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('city_id')) {
            $query->where('city_id', $request->string('city_id')->toString());
        }

        $hotels = $query
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString()
            ->through(fn (Hotel $hotel) => $this->toPayload($hotel));

        $canCreate = ! Hotel::query()->where('vendor_id', $user->id)->exists();

        return Inertia::render('hotels/index', [
            'hotels' => $hotels,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
                'city_id' => $request->input('city_id'),
            ],
            'statusOptions' => self::STATUSES,
            'cityOptions' => $this->cityOptions(),
            'mitraOptions' => [],
            'isMitra' => true,
            'basePath' => '/mitra/hotels',
            'canCreate' => $canCreate,
        ]);
    }

    public function create(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        $existing = Hotel::query()->where('vendor_id', $user->id)->first();
        if ($existing) {
            return redirect()->route('mitra.hotels.edit', $existing);
        }

        return Inertia::render('hotels/create', [
            'statusOptions' => self::STATUSES,
            'facilityOptions' => self::FACILITY_CODES,
            'mitraOptions' => [],
            'cityOptions' => $this->cityOptions(),
            'isMitra' => true,
            'basePath' => '/mitra/hotels',
            'mitraId' => $user->id,
        ]);
    }

    public function store(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $user = $request->user();
        $this->ensureSubmittedMitraId($request, (int) $user->id);

        if (Hotel::query()->where('vendor_id', $user->id)->exists()) {
            return redirect()->route('mitra.hotels.index');
        }

        $validated = $this->validateHotel($request);
        $validated['vendor_id'] = $user->id;

        $facilityCodes = $validated['facility_codes'] ?? [];
        $images = $validated['images'] ?? [];
        unset($validated['facility_codes']);
        unset($validated['images']);

        if (count($images) > self::MAX_IMAGE_COUNT) {
            return back()
                ->withErrors(['images' => 'Maksimal 10 foto per hotel.'])
                ->withInput();
        }

        $hotel = Hotel::create($validated);

        $this->syncFacilities($hotel, $facilityCodes);
        $this->attachImages($hotel, $images, $mediaCompression);

        return redirect()->route('mitra.hotels.index');
    }

    public function edit(Request $request, Hotel $hotel): Response
    {
        $user = $request->user();
        if ((int) $hotel->vendor_id !== (int) $user->id) {
            abort(404);
        }

        $hotel->load('facilities', 'images');

        return Inertia::render('hotels/edit', [
            'hotel' => $this->toPayload($hotel),
            'statusOptions' => self::STATUSES,
            'facilityOptions' => self::FACILITY_CODES,
            'mitraOptions' => [],
            'cityOptions' => $this->cityOptions(),
            'isMitra' => true,
            'basePath' => '/mitra/hotels',
            'mitraId' => $user->id,
        ]);
    }

    public function update(Request $request, Hotel $hotel, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $user = $request->user();
        if ((int) $hotel->vendor_id !== (int) $user->id) {
            abort(404);
        }

        $this->ensureHotelEditable($hotel);
        $validated = $this->validateHotel($request);
        $validated['vendor_id'] = $user->id;

        $facilityCodes = $validated['facility_codes'] ?? [];
        $images = $validated['images'] ?? [];
        unset($validated['facility_codes']);
        unset($validated['images']);

        if ($hotel->images()->count() + count($images) > self::MAX_IMAGE_COUNT) {
            return back()
                ->withErrors(['images' => 'Maksimal 10 foto per hotel. Hapus foto lama sebelum menambah foto baru.'])
                ->withInput();
        }

        $hotel->update($validated);
        $this->syncFacilities($hotel, $facilityCodes);
        $this->attachImages($hotel, $images, $mediaCompression);

        return redirect()->route('mitra.hotels.index');
    }

    public function destroyImage(Request $request, Hotel $hotel, HotelImage $hotelImage): RedirectResponse
    {
        $user = $request->user();
        if ((int) $hotel->vendor_id !== (int) $user->id) {
            abort(404);
        }
        $this->ensureHotelEditable($hotel);

        if ((int) $hotelImage->hotel_id !== (int) $hotel->id) {
            return redirect()->route('mitra.hotels.edit', $hotel);
        }

        if ($hotelImage->image_url) {
            Storage::disk('public')->delete($hotelImage->image_url);
        }

        $hotelImage->delete();

        return redirect()->route('mitra.hotels.edit', $hotel);
    }

    public function destroy(Request $request, Hotel $hotel): RedirectResponse
    {
        $user = $request->user();
        if ((int) $hotel->vendor_id !== (int) $user->id) {
            abort(404);
        }
        $this->ensureHotelEditable($hotel);

        $hotel->delete();

        return redirect()->route('mitra.hotels.index');
    }

    private function validateHotel(Request $request): array
    {
        return $request->validate([
            'vendor_id' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'city_id' => ['required', 'string', 'size:4', 'exists:regencies,code'],
            'address' => ['required', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'star_rating' => ['nullable', 'integer', 'between:1,5'],
            'check_in_time' => ['nullable', 'date_format:H:i'],
            'check_out_time' => ['nullable', 'date_format:H:i'],
            'status' => ['required', Rule::in(self::STATUSES)],
            'facility_codes' => ['nullable', 'array'],
            'facility_codes.*' => ['string', Rule::in(self::FACILITY_CODES)],
            'images' => ['nullable', 'array', 'max:'.self::MAX_IMAGE_COUNT],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:'.self::MAX_IMAGE_KILOBYTES],
        ], [
            'images.max' => 'Maksimal 10 foto per hotel.',
            'images.*.image' => 'File foto hotel harus berupa gambar.',
            'images.*.mimes' => 'Foto hotel harus berformat JPG, JPEG, PNG, atau WEBP.',
            'images.*.max' => 'Ukuran setiap foto hotel maksimal 5 MB.',
        ]);
    }

    private function ensureSubmittedMitraId(Request $request, int $userId): void
    {
        if (! $request->filled('vendor_id')) {
            return;
        }

        if ((int) $request->input('vendor_id') === $userId) {
            return;
        }

        throw ValidationException::withMessages([
            'vendor_id' => 'Data hotel hanya bisa dibuat untuk akun mitra yang sedang login.',
        ]);
    }

    private function ensureHotelEditable(Hotel $hotel): void
    {
        if ($hotel->status !== self::SUSPENDED_STATUS) {
            return;
        }

        throw ValidationException::withMessages([
            'status' => 'Hotel sedang disuspend oleh admin. Mitra tidak dapat mengubah produk ini.',
        ]);
    }

    private function syncFacilities(Hotel $hotel, array $facilityCodes): void
    {
        $uniqueCodes = collect($facilityCodes)
            ->filter()
            ->unique()
            ->values();

        $hotel->facilities()->delete();

        if ($uniqueCodes->isEmpty()) {
            return;
        }

        $hotel->facilities()->createMany(
            $uniqueCodes->map(fn (string $code) => ['facility_code' => $code])->all()
        );
    }

    private function attachImages(Hotel $hotel, array $images, MediaCompressionService $mediaCompression): void
    {
        if (empty($images)) {
            return;
        }

        $paths = collect($images)
            ->map(fn ($file) => $mediaCompression->store($file, 'hotel-images', 'public'))
            ->filter()
            ->values();

        if ($paths->isEmpty()) {
            return;
        }

        $hotel->images()->createMany(
            $paths->map(fn (string $path) => ['image_url' => $path])->all()
        );
    }

    private function toPayload(Hotel $hotel): array
    {
        return [
            'id' => $hotel->id,
            'vendor_id' => $hotel->vendor_id,
            'name' => $hotel->name,
            'description' => $hotel->description,
            'city_id' => $hotel->city_id,
            'address' => $hotel->address,
            'latitude' => $hotel->latitude,
            'longitude' => $hotel->longitude,
            'star_rating' => $hotel->star_rating,
            'check_in_time' => $hotel->check_in_time
                ? Carbon::parse($hotel->check_in_time)->format('H:i')
                : null,
            'check_out_time' => $hotel->check_out_time
                ? Carbon::parse($hotel->check_out_time)->format('H:i')
                : null,
            'status' => $hotel->status,
            'facility_codes' => $hotel->facilities
                ->pluck('facility_code')
                ->values()
                ->all(),
            'images' => $hotel->images
                ->map(fn (HotelImage $image) => [
                    'id' => $image->id,
                    'url' => $image->image_url ? '/storage/'.$image->image_url : null,
                ])
                ->filter(fn ($image) => $image['url'])
                ->values()
                ->all(),
        ];
    }

    private function cityOptions(): array
    {
        return DB::table('regencies')
            ->select('code', 'name', 'type')
            ->orderBy('name')
            ->get()
            ->map(fn ($row) => [
                'code' => $row->code,
                'label' => trim(sprintf('%s %s', $row->type ?? 'Kabupaten', $row->name)),
            ])
            ->all();
    }
}
