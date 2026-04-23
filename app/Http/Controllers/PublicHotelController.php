<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use App\Models\RoomType;
use App\Models\RoomInventory;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use App\Services\ProductReviewService;
use App\Services\Discovery\DiscoveryService;
use Inertia\Inertia;
use Inertia\Response;

class PublicHotelController extends Controller
{
    public function search(Request $request, DiscoveryService $discovery): Response
    {
        $today = Carbon::today();
        $tomorrow = $today->copy()->addDay();

        $payload = [
            'city' => $request->input('city'),
            'check_in' => $request->input('check_in') ?? $today->toDateString(),
            'check_out' => $request->input('check_out') ?? $tomorrow->toDateString(),
            'rooms' => $request->input('rooms', 1),
            'guests' => $request->input('guests', 2),
            'children' => $request->input('children', 0),
            'q' => $request->input('q'),
            'sort' => $request->input('sort'),
        ];

        $data = validator($payload, [
            'city' => ['nullable', 'string', 'max:255'],
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'rooms' => ['required', 'integer', 'min:1', 'max:10'],
            'guests' => ['required', 'integer', 'min:1', 'max:20'],
            'children' => ['nullable', 'integer', 'min:0', 'max:20'],
            'q' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', 'max:50'],
        ])->validate();

        foreach (['city', 'check_in', 'check_out', 'rooms', 'guests', 'q', 'sort'] as $key) {
            if (($data[$key] ?? null) !== null && $data[$key] !== '') {
                $request->query->set($key, $data[$key]);
            }
        }

        $listing = $discovery->listing('hotels', $request);
        $hotels = collect($listing['data'] ?? [])->map(fn (array $item) => [
            'id' => $item['id'] ?? null,
            'encrypted_id' => $item['encrypted_id'] ?? $item['id'] ?? null,
            'slug' => $item['slug'] ?? null,
            'name' => $item['name'] ?? $item['title'] ?? '',
            'address' => data_get($item, 'metadata.location'),
            'star_rating' => data_get($item, 'metadata.rating'),
            'city_name' => data_get($item, 'metadata.city'),
            'min_price' => $item['price'] ?? null,
            'available_rooms' => data_get($item, 'availability.quota'),
            'image_url' => $item['image_url'] ?? $item['image'] ?? null,
            'breakfast_included' => false,
            'smoking_allowed' => false,
        ])->values();

        return Inertia::render('public/hotels/search', [
            'filters' => [
                'city' => $data['city'] ?? null,
                'check_in' => $data['check_in'],
                'check_out' => $data['check_out'],
                'rooms' => $data['rooms'],
                'guests' => $data['guests'],
                'children' => $data['children'] ?? 0,
                'q' => $data['q'] ?? null,
                'sort' => $data['sort'] ?? null,
            ],
            'hotels' => $hotels,
            'recommendations' => $this->recommendations(),
            'discovery' => $listing['discovery'] ?? null,
            'meta' => $listing['meta'] ?? null,
        ]);
    }

    public function show(Request $request, string $hotel): Response|RedirectResponse
    {
        $data = $request->validate([
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'rooms' => ['required', 'integer', 'min:1', 'max:10'],
            'guests' => ['required', 'integer', 'min:1', 'max:20'],
            'children' => ['nullable', 'integer', 'min:0', 'max:20'],
        ]);

        $hotelModel = Hotel::query()->where('slug', $hotel)->first();
        if (! $hotelModel) {
            try {
                $hotelId = Crypt::decryptString($hotel);
                $hotelModel = Hotel::query()->find($hotelId);
            } catch (\Throwable $exception) {
                $hotelModel = null;
            }
        }

        if (! $hotelModel) {
            abort(404);
        }

        if ($hotelModel->slug && $hotelModel->slug !== $hotel) {
            return redirect()->route('public.hotels.show', array_merge([
                'hotel' => $hotelModel->slug,
            ], $data));
        }

        $hotel = $hotelModel;

        if ($hotel->status !== 'active') {
            abort(404);
        }

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
                'included_adults' => $roomType->included_adults,
                'extra_bed_max' => $roomType->extra_bed_max,
                'extra_bed_price' => $roomType->extra_bed_price ? (int) $roomType->extra_bed_price : 0,
                'extra_adult_price' => $roomType->extra_adult_price ? (int) $roomType->extra_adult_price : 0,
                'extra_child_price' => $roomType->extra_child_price ? (int) $roomType->extra_child_price : 0,
                'child_age_max' => $roomType->child_age_max,
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

        $userId = $request->user()?->id;
        $userReview = ProductReviewService::userReview($userId, 'hotel', $hotel->id);
        $canReview = $userId
            ? (ProductReviewService::hasUsedBooking($userId, 'hotel', $hotel->id) || (bool) $userReview)
            : false;

        return Inertia::render('public/hotels/show', [
            'hotel' => [
                'id' => $hotel->id,
                'encrypted_id' => Crypt::encryptString((string) $hotel->id),
                'slug' => $hotel->slug,
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
                'images' => $hotel->images->map(fn ($image) => [
                    'id' => $image->id,
                    'url' => $image->image_url ? '/storage/'.$image->image_url : null,
                ])->filter(fn ($image) => $image['url'])->values(),
            ],
            'roomTypes' => $roomTypes,
            'filters' => [
                'check_in' => $data['check_in'],
                'check_out' => $data['check_out'],
                'rooms' => $data['rooms'],
                'guests' => $data['guests'],
                'children' => $data['children'] ?? 0,
            ],
            'reviews' => ProductReviewService::publicReviews('hotel', $hotel->id),
            'userReview' => $userReview,
            'canReview' => $canReview,
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
            ->with(['roomTypes', 'city', 'images'])
            ->latest()
            ->take(3)
            ->get()
            ->map(fn (Hotel $hotel) => [
                'id' => $hotel->id,
                'encrypted_id' => Crypt::encryptString((string) $hotel->id),
                'slug' => $hotel->slug,
                'name' => $hotel->name,
                'city_name' => $hotel->city?->name,
                'star_rating' => $hotel->star_rating,
                'min_price' => $hotel->roomTypes->min('base_price')
                    ? (int) round($hotel->roomTypes->min('base_price'))
                    : null,
                'image_url' => $hotel->images->first()?->image_url ? '/storage/'.$hotel->images->first()->image_url : null,
            ])->all();
    }
}
