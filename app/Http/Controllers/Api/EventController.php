<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventTicket;
use App\Services\ProductReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payload = [
            'q' => $request->input('q'),
        ];

        $data = validator($payload, [
            'q' => ['nullable', 'string', 'max:255'],
        ])->validate();

        $events = Event::query()
            ->where('event_type', 'event')
            ->where('status', 'published')
            ->when($data['q'] ?? null, fn ($query, $term) => $query->where('title', 'like', "%{$term}%"))
            ->orderByDesc('start_at')
            ->get();

        $tickets = EventTicket::query()
            ->whereIn('event_id', $events->pluck('id'))
            ->where('is_active', true)
            ->get()
            ->groupBy('event_id');

        $results = $events->map(function (Event $event) use ($tickets) {
            $ticketRows = $tickets->get($event->id, collect());
            $minPrice = $ticketRows->min('price');

            $mapsQuery = $event->address ?? $event->location ?? $this->resolveCityName($event->city_code);

            return [
                'id' => $event->id,
                'encrypted_id' => Crypt::encryptString((string) $event->id),
                'slug' => $event->slug,
                'title' => $event->title,
                'city_name' => $this->resolveCityName($event->city_code),
                'location' => $event->location,
                'maps_url' => $this->buildMapsUrl($mapsQuery),
                'start_at' => $event->start_at?->toDateString(),
                'min_price' => $minPrice ? (int) $minPrice : null,
                'image_url' => $this->resolveImageUrl($event),
            ];
        });

        return response()->json([
            'filters' => [
                'q' => $data['q'] ?? null,
            ],
            'events' => $results,
        ]);
    }

    public function show(Request $request, string $event): JsonResponse
    {
        $eventId = $this->resolveId($event);

        $event = Event::query()
            ->where('event_type', 'event')
            ->where('status', 'published')
            ->where('id', $eventId)
            ->firstOrFail();

        $tickets = EventTicket::query()
            ->where('event_id', $event->id)
            ->where('is_active', true)
            ->get()
            ->map(function (EventTicket $ticket) {
                return [
                    'id' => $ticket->id,
                    'name' => $ticket->name,
                    'description' => $ticket->description,
                    'price' => $ticket->price,
                    'quota' => $ticket->quota,
                    'sold_count' => $ticket->sold_count,
                    'available' => max(0, (int) $ticket->quota - (int) $ticket->sold_count),
                ];
            });

        $userId = $request->user('sanctum')?->id;
        $userReview = $userId ? ProductReviewService::userReview($userId, 'event', $event->id) : null;
        $canReview = $userId
            ? (ProductReviewService::hasUsedBooking($userId, 'event', $event->id) || (bool) $userReview)
            : false;
        $mapsQuery = $event->address ?? $event->location ?? $this->resolveCityName($event->city_code);

        return response()->json([
            'event' => [
                'id' => $event->id,
                'encrypted_id' => Crypt::encryptString((string) $event->id),
                'slug' => $event->slug,
                'title' => $event->title,
                'description' => $event->description,
                'city_name' => $this->resolveCityName($event->city_code),
                'location' => $event->location,
                'address' => $event->address,
                'maps_url' => $this->buildMapsUrl($mapsQuery),
                'image_url' => $this->resolveImageUrl($event),
                'start_at' => $event->start_at?->toDateTimeString(),
                'end_at' => $event->end_at?->toDateTimeString(),
                'capacity_total' => $event->capacity_total,
                'capacity_sold' => $event->capacity_sold,
            ],
            'tickets' => $tickets,
            'reviews' => ProductReviewService::publicReviews('event', $event->id),
            'user_review' => $userReview,
            'userReview' => $userReview,
            'can_review' => $canReview,
            'canReview' => $canReview,
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

        return 0;
    }

    private function resolveCityName(?string $cityCode): ?string
    {
        if (! $cityCode) {
            return null;
        }

        return DB::table('regencies')->where('code', $cityCode)->value('name');
    }

    private function buildMapsUrl(?string $query): ?string
    {
        if (! $query) {
            return null;
        }

        $value = trim($query);

        if ($this->isMapsUrl($value)) {
            return $value;
        }

        $coordinates = $this->extractCoordinates($value);
        $value = $coordinates ? $coordinates[0].','.$coordinates[1] : $value;

        return 'https://www.google.com/maps/search/?api=1&query='.rawurlencode($value);
    }

    private function isMapsUrl(string $value): bool
    {
        $value = strtolower($value);

        return str_contains($value, 'google.com/maps')
            || str_contains($value, 'maps.app.goo.gl')
            || str_contains($value, 'goo.gl/maps');
    }

    private function extractCoordinates(string $value): ?array
    {
        if (preg_match('/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/', $value, $matches)) {
            return [$matches[1], $matches[2]];
        }

        return null;
    }

    private function resolveImageUrl(Event $event): string
    {
        if ($event->image_path ?? null) {
            return '/storage/'.$event->image_path;
        }

        return $this->fallbackImageUrl($event->id);
    }

    private function fallbackImageUrl(int $id): string
    {
        return '/images/placeholder-card.jpg';
    }
}
