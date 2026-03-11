<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use App\Models\User;
use App\Models\HotelImage;
use App\Services\MediaCompressionService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class HotelController extends Controller
{
    private const STATUSES = ['draft', 'active', 'suspended'];

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
        $query = Hotel::query()->with('facilities')->latest();

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

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', (int) $request->input('vendor_id'));
        }

        $hotels = $query
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Hotel $hotel) => $this->toPayload($hotel));

        return Inertia::render('hotels/index', [
            'hotels' => $hotels,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
                'city_id' => $request->input('city_id'),
                'vendor_id' => $request->input('vendor_id'),
            ],
            'statusOptions' => self::STATUSES,
            'cityOptions' => $this->cityOptions(),
            'mitraOptions' => $this->mitraOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('hotels/create', [
            'statusOptions' => self::STATUSES,
            'facilityOptions' => self::FACILITY_CODES,
            'mitraOptions' => $this->mitraOptions(),
            'cityOptions' => $this->cityOptions(),
            'taxes' => [],
        ]);
    }

    public function store(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $validated = $this->validateHotel($request);

        $facilityCodes = $validated['facility_codes'] ?? [];
        $images = $validated['images'] ?? [];
        $taxes = $validated['taxes'] ?? [];
        unset($validated['facility_codes']);
        unset($validated['images']);
        unset($validated['taxes']);

        $hotel = Hotel::create($validated);

        $this->syncFacilities($hotel, $facilityCodes);
        $this->syncTaxes($hotel, $taxes);
        $this->attachImages($hotel, $images, $mediaCompression);

        return redirect()->route('hotels.index');
    }

    public function edit(Hotel $hotel): Response
    {
        $hotel->load('facilities', 'images', 'taxes');

        return Inertia::render('hotels/edit', [
            'hotel' => $this->toPayload($hotel),
            'statusOptions' => self::STATUSES,
            'facilityOptions' => self::FACILITY_CODES,
            'mitraOptions' => $this->mitraOptions(),
            'cityOptions' => $this->cityOptions(),
        ]);
    }

    public function update(Request $request, Hotel $hotel, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $validated = $this->validateHotel($request);
        $facilityCodes = $validated['facility_codes'] ?? [];
        $images = $validated['images'] ?? [];
        $taxes = $validated['taxes'] ?? [];
        unset($validated['facility_codes']);
        unset($validated['images']);
        unset($validated['taxes']);

        $hotel->update($validated);
        $this->syncFacilities($hotel, $facilityCodes);
        $this->syncTaxes($hotel, $taxes);
        $this->attachImages($hotel, $images, $mediaCompression);

        return redirect()->route('hotels.index');
    }

    public function destroyImage(Hotel $hotel, HotelImage $hotelImage): RedirectResponse
    {
        if ((int) $hotelImage->hotel_id !== (int) $hotel->id) {
            return redirect()->route('hotels.edit', $hotel);
        }

        if ($hotelImage->image_url) {
            Storage::disk('public')->delete($hotelImage->image_url);
        }

        $hotelImage->delete();

        return redirect()->route('hotels.edit', $hotel);
    }

    public function destroy(Hotel $hotel): RedirectResponse
    {
        $hotel->delete();

        return redirect()->route('hotels.index');
    }

    private function validateHotel(Request $request): array
    {
        return $request->validate([
            'vendor_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where('role', 'mitra'),
            ],
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
            'taxes' => ['nullable', 'array'],
            'taxes.*.name' => ['required_with:taxes.*.rate', 'string', 'max:120'],
            'taxes.*.rate' => ['required_with:taxes.*.name', 'numeric', 'min:0', 'max:100'],
            'images' => ['nullable', 'array'],
            'images.*' => ['file', 'image'],
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

    private function syncTaxes(Hotel $hotel, array $taxes): void
    {
        $cleanTaxes = collect($taxes)
            ->filter(fn ($tax) => filled($tax['name'] ?? null) || filled($tax['rate'] ?? null))
            ->map(fn ($tax) => [
                'name' => trim((string) ($tax['name'] ?? '')),
                'rate' => (float) ($tax['rate'] ?? 0),
            ])
            ->filter(fn ($tax) => $tax['name'] !== '')
            ->values();

        $hotel->taxes()->delete();

        if ($cleanTaxes->isEmpty()) {
            return;
        }

        $hotel->taxes()->createMany($cleanTaxes->all());
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
            'taxes' => $hotel->taxes
                ->map(fn ($tax) => [
                    'id' => $tax->id,
                    'name' => $tax->name,
                    'rate' => $tax->rate,
                ])
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

    private function mitraOptions(): array
    {
        return User::query()
            ->select('id', 'name', 'email')
            ->where('role', 'mitra')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'label' => "{$user->name} ({$user->email})",
            ])
            ->all();
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
