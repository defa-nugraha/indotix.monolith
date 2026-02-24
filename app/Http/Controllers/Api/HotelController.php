<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\RoomInventory;
use App\Models\RoomType;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class HotelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $today = Carbon::today();
        $tomorrow = $today->copy()->addDay();

        $payload = [
            'city' => $request->input('city'),
            'check_in' => $request->input('check_in') ?? $today->toDateString(),
            'check_out' => $request->input('check_out') ?? $tomorrow->toDateString(),
            'rooms' => $request->input('rooms', 1),
            'guests' => $request->input('guests', 2),
            'q' => $request->input('q'),
        ];

        $data = validator($payload, [
            'city' => ['nullable', 'string', 'size:4'],
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'rooms' => ['required', 'integer', 'min:1', 'max:10'],
            'guests' => ['required', 'integer', 'min:1', 'max:20'],
            'q' => ['nullable', 'string', 'max:255'],
        ])->validate();

        $dates = $this->dateRange($data['check_in'], $data['check_out']);

        $hotels = Hotel::query()
            ->where('status', 'active')
            ->when($data['city'] ?? null, fn ($query) => $query->where('city_id', $data['city']))
            ->when($data['q'] ?? null, fn ($query, $term) => $query->where('name', 'like', "%{$term}%"))
            ->with(['roomTypes' => function ($query) {
                $query->where('status', 'active');
            }, 'city', 'images'])
            ->get();

        $results = $hotels->map(function (Hotel $hotel) use ($dates, $data) {
            $availableRoomTypes = $hotel->roomTypes->map(function (RoomType $roomType) use ($dates, $data) {
                $inventories = RoomInventory::query()
                    ->where('room_type_id', $roomType->id)
                    ->whereIn('date', $dates)
                    ->get()
                    ->keyBy(fn ($inventory) => $inventory->date->toDateString());

                if (count($inventories) !== count($dates)) {
                    return null;
                }

                $minAvailable = $inventories->min('available_rooms');
                $isClosed = $inventories->contains(fn ($item) => $item->is_closed);

                if ($isClosed || $minAvailable < $data['rooms']) {
                    return null;
                }
                $breakfastIncluded = $inventories->every(fn ($item) => (bool) $item->breakfast_included);
                $smokingAllowed = $inventories->every(fn ($item) => (bool) $item->smoking_allowed);

                $total = 0;
                foreach ($dates as $date) {
                    $inventory = $inventories->get($date);
                    $price = $inventory->price_override ?? $roomType->base_price;
                    $total += (int) round($price) * $data['rooms'];
                }

                return [
                    'id' => $roomType->id,
                    'name' => $roomType->name,
                    'max_guest' => $roomType->max_guest,
                    'bed_type' => $roomType->bed_type,
                    'total_price' => $total,
                    'price_per_night' => (int) round($roomType->base_price),
                    'available_rooms' => $minAvailable,
                    'breakfast_included' => $breakfastIncluded,
                    'smoking_allowed' => $smokingAllowed,
                ];
            })->filter();

            if ($availableRoomTypes->isEmpty()) {
                return null;
            }

            $minPrice = $availableRoomTypes->min('price_per_night');

            $coverImage = $hotel->images->first();
            return [
                'id' => $hotel->id,
                'encrypted_id' => Crypt::encryptString((string) $hotel->id),
                'name' => $hotel->name,
                'address' => $hotel->address,
                'star_rating' => $hotel->star_rating,
                'city_name' => $hotel->city?->name,
                'min_price' => $minPrice,
                'available_rooms' => $availableRoomTypes->sum('available_rooms'),
                'image_url' => $coverImage?->image_url ? '/storage/'.$coverImage->image_url : null,
                'breakfast_included' => $availableRoomTypes->contains('breakfast_included', true),
                'smoking_allowed' => $availableRoomTypes->contains('smoking_allowed', true),
            ];
        })->filter()->values();

        return response()->json([
            'filters' => [
                'city' => $data['city'] ?? null,
                'check_in' => $data['check_in'],
                'check_out' => $data['check_out'],
                'rooms' => $data['rooms'],
                'guests' => $data['guests'],
                'q' => $data['q'] ?? null,
            ],
            'hotels' => $results,
        ]);
    }

    public function show(Request $request, string $hotel): JsonResponse
    {
        $hotelId = $this->resolveId($hotel);
        $hotel = Hotel::query()->findOrFail($hotelId);

        if ($hotel->status !== 'active') {
            abort(404);
        }

        $today = Carbon::today();
        $payload = [
            'check_in' => $request->input('check_in') ?? $today->toDateString(),
            'check_out' => $request->input('check_out') ?? $today->copy()->addDay()->toDateString(),
            'rooms' => $request->input('rooms', 1),
            'guests' => $request->input('guests', 2),
        ];

        $data = validator($payload, [
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'rooms' => ['required', 'integer', 'min:1', 'max:10'],
            'guests' => ['required', 'integer', 'min:1', 'max:20'],
        ])->validate();

        $dates = $this->dateRange($data['check_in'], $data['check_out']);

        $hotel->load(['facilities', 'roomTypes.images', 'city', 'images']);

        $roomTypes = $hotel->roomTypes
            ->where('status', 'active')
            ->map(function (RoomType $roomType) use ($dates, $data) {
                $inventories = RoomInventory::query()
                    ->where('room_type_id', $roomType->id)
                    ->whereIn('date', $dates)
                    ->get()
                    ->keyBy(fn ($inventory) => $inventory->date->toDateString());

                if (count($inventories) !== count($dates)) {
                    return null;
                }

                $minAvailable = $inventories->min('available_rooms');
                $isClosed = $inventories->contains(fn ($item) => $item->is_closed);

                if ($isClosed || $minAvailable < $data['rooms']) {
                    return null;
                }
                $breakfastIncluded = $inventories->every(fn ($item) => (bool) $item->breakfast_included);
                $smokingAllowed = $inventories->every(fn ($item) => (bool) $item->smoking_allowed);

                $total = 0;
                foreach ($dates as $date) {
                    $inventory = $inventories->get($date);
                    $price = $inventory->price_override ?? $roomType->base_price;
                    $total += (int) round($price) * $data['rooms'];
                }

                return [
                    'id' => $roomType->id,
                    'name' => $roomType->name,
                    'description' => $roomType->description,
                    'max_guest' => $roomType->max_guest,
                    'bed_type' => $roomType->bed_type,
                    'base_price' => (int) round($roomType->base_price),
                    'strike_price' => $roomType->strike_price ? (int) round($roomType->strike_price) : null,
                    'available_rooms' => $minAvailable,
                    'total_price' => $total,
                    'breakfast_included' => $breakfastIncluded,
                    'smoking_allowed' => $smokingAllowed,
                    'images' => $roomType->images->map(fn ($image) => [
                        'id' => $image->id,
                        'url' => $image->image_url ? '/storage/'.$image->image_url : null,
                    ])->filter(fn ($image) => $image['url']),
                ];
            })
            ->filter()
            ->values();

        return response()->json([
            'hotel' => [
                'id' => $hotel->id,
                'encrypted_id' => Crypt::encryptString((string) $hotel->id),
                'name' => $hotel->name,
                'description' => $hotel->description,
                'address' => $hotel->address,
                'city_name' => $hotel->city?->name,
                'star_rating' => $hotel->star_rating,
                'check_in_time' => $hotel->check_in_time,
                'check_out_time' => $hotel->check_out_time,
                'latitude' => $hotel->latitude,
                'longitude' => $hotel->longitude,
                'maps_url' => $this->buildMapsUrl($hotel->latitude, $hotel->longitude),
                'facilities' => $hotel->facilities->pluck('facility_code'),
                'images' => $hotel->images->map(fn ($image) => [
                    'id' => $image->id,
                    'url' => $image->image_url ? '/storage/'.$image->image_url : null,
                ])->filter(fn ($image) => $image['url'])->values(),
            ],
            'room_types' => $roomTypes,
            'filters' => [
                'check_in' => $data['check_in'],
                'check_out' => $data['check_out'],
                'rooms' => $data['rooms'],
                'guests' => $data['guests'],
            ],
        ]);
    }

    private function resolveId(string $value): int
    {
        if (ctype_digit($value)) {
            return (int) $value;
        }

        try {
            return (int) Crypt::decryptString($value);
        } catch (\Throwable $exception) {
            abort(404);
        }
    }

    private function dateRange(string $checkIn, string $checkOut): array
    {
        $start = Carbon::parse($checkIn);
        $end = Carbon::parse($checkOut);

        if ($end->lessThanOrEqualTo($start)) {
            return [];
        }

        $period = CarbonPeriod::create($start, $end->copy()->subDay());
        return collect($period)->map(fn ($date) => $date->toDateString())->all();
    }

    private function buildMapsUrl(?float $latitude, ?float $longitude): ?string
    {
        if ($latitude === null || $longitude === null) {
            return null;
        }

        return sprintf('https://www.google.com/maps?q=%s,%s', $latitude, $longitude);
    }
}
