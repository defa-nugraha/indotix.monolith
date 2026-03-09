<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventTicket;
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

            return [
                'id' => $event->id,
                'encrypted_id' => Crypt::encryptString((string) $event->id),
                'title' => $event->title,
                'city_name' => $this->resolveCityName($event->city_code),
                'location' => $event->location,
                'maps_url' => $this->buildMapsUrl($event->location),
                'start_at' => $event->start_at?->toDateString(),
                'min_price' => $minPrice ? (int) $minPrice : null,
                'image_url' => null,
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

        return response()->json([
            'event' => [
                'id' => $event->id,
                'encrypted_id' => Crypt::encryptString((string) $event->id),
                'title' => $event->title,
                'description' => $event->description,
                'city_name' => $this->resolveCityName($event->city_code),
                'location' => $event->location,
                'address' => $event->address,
                'maps_url' => $this->buildMapsUrl($event->address ?? $event->location),
                'start_at' => $event->start_at?->toDateTimeString(),
                'end_at' => $event->end_at?->toDateTimeString(),
                'capacity_total' => $event->capacity_total,
                'capacity_sold' => $event->capacity_sold,
            ],
            'tickets' => $tickets,
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

        $coordinates = $this->extractCoordinates($query);
        $value = $coordinates ? $coordinates[0].','.$coordinates[1] : $query;

        return 'https://www.google.com/maps/search/?api=1&query='.rawurlencode($value);
    }

    private function extractCoordinates(string $value): ?array
    {
        if (preg_match('/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/', $value, $matches)) {
            return [$matches[1], $matches[2]];
        }

        return null;
    }
}
