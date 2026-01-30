<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use App\Models\RoomType;
use App\Models\RoomInventory;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Inertia\Inertia;
use Inertia\Response;

class PublicHotelController extends Controller
{
    public function search(Request $request): Response
    {
        if (! $request->filled('check_in') || ! $request->filled('check_out')) {
            return Inertia::render('public/hotels/search', [
                'filters' => [
                    'city' => $request->input('city'),
                    'check_in' => null,
                    'check_out' => null,
                    'rooms' => 1,
                    'guests' => 2,
                    'q' => $request->input('q'),
                ],
                'hotels' => [],
                'recommendations' => $this->recommendations(),
            ]);
        }

        $data = $request->validate([
            'city' => ['nullable', 'string', 'size:4'],
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'rooms' => ['required', 'integer', 'min:1', 'max:10'],
            'guests' => ['required', 'integer', 'min:1', 'max:20'],
            'q' => ['nullable', 'string', 'max:255'],
        ]);

        $dates = $this->dateRange($data['check_in'], $data['check_out']);

        $hotels = Hotel::query()
            ->where('status', 'active')
            ->when($data['city'] ?? null, fn ($query) => $query->where('city_id', $data['city']))
            ->when($data['q'] ?? null, fn ($query, $term) => $query->where('name', 'like', "%{$term}%"))
            ->with(['roomTypes' => function ($query) {
                $query->where('status', 'active');
            }, 'city'])
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
                ];
            })->filter();

            if ($availableRoomTypes->isEmpty()) {
                return null;
            }

            $minPrice = $availableRoomTypes->min('price_per_night');

            return [
                'id' => $hotel->id,
                'encrypted_id' => Crypt::encryptString((string) $hotel->id),
                'name' => $hotel->name,
                'address' => $hotel->address,
                'star_rating' => $hotel->star_rating,
                'city_name' => $hotel->city?->name,
                'min_price' => $minPrice,
                'available_rooms' => $availableRoomTypes->sum('available_rooms'),
            ];
        })->filter()->values();

        return Inertia::render('public/hotels/search', [
            'filters' => [
                'city' => $data['city'] ?? null,
                'check_in' => $data['check_in'],
                'check_out' => $data['check_out'],
                'rooms' => $data['rooms'],
                'guests' => $data['guests'],
                'q' => $data['q'] ?? null,
            ],
            'hotels' => $results,
            'recommendations' => $this->recommendations(),
        ]);
    }

    public function show(Request $request, string $hotel): Response
    {
        try {
            $hotelId = Crypt::decryptString($hotel);
        } catch (\Throwable $exception) {
            abort(404);
        }
        $hotel = Hotel::query()->findOrFail($hotelId);

        if ($hotel->status !== 'active') {
            abort(404);
        }

        $data = $request->validate([
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'rooms' => ['required', 'integer', 'min:1', 'max:10'],
            'guests' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $dates = $this->dateRange($data['check_in'], $data['check_out']);

        $hotel->load(['facilities', 'roomTypes.images', 'city']);

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
                    'images' => $roomType->images->map(fn ($image) => [
                        'id' => $image->id,
                        'url' => $image->image_url ? '/storage/'.$image->image_url : null,
                    ])->filter(fn ($image) => $image['url']),
                ];
            })
            ->filter()
            ->values();

        return Inertia::render('public/hotels/show', [
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
                'facilities' => $hotel->facilities->pluck('facility_code'),
            ],
            'roomTypes' => $roomTypes,
            'filters' => [
                'check_in' => $data['check_in'],
                'check_out' => $data['check_out'],
                'rooms' => $data['rooms'],
                'guests' => $data['guests'],
            ],
        ]);
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

    private function recommendations(): array
    {
        return Hotel::query()
            ->where('status', 'active')
            ->with(['roomTypes', 'city'])
            ->latest()
            ->take(3)
            ->get()
            ->map(fn (Hotel $hotel) => [
                'id' => $hotel->id,
                'encrypted_id' => Crypt::encryptString((string) $hotel->id),
                'name' => $hotel->name,
                'city_name' => $hotel->city?->name,
                'star_rating' => $hotel->star_rating,
                'min_price' => $hotel->roomTypes->min('base_price')
                    ? (int) round($hotel->roomTypes->min('base_price'))
                    : null,
            ])->all();
    }
}
