<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class SpecialProgramController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payload = [
            'q' => $request->input('q'),
        ];

        $data = validator($payload, [
            'q' => ['nullable', 'string', 'max:255'],
        ])->validate();

        $programs = Event::query()
            ->where('event_type', 'special_program')
            ->where('status', 'published')
            ->when($data['q'] ?? null, fn ($query, $term) => $query->where('title', 'like', "%{$term}%"))
            ->orderByDesc('start_at')
            ->get();

        $tickets = EventTicket::query()
            ->whereIn('event_id', $programs->pluck('id'))
            ->where('is_active', true)
            ->get()
            ->groupBy('event_id');

        $results = $programs->map(function (Event $program) use ($tickets) {
            $ticketRows = $tickets->get($program->id, collect());
            $minPrice = $ticketRows->min('price');

            return [
                'id' => $program->id,
                'encrypted_id' => Crypt::encryptString((string) $program->id),
                'slug' => $program->slug,
                'title' => $program->title,
                'city_name' => $this->resolveCityName($program->city_code),
                'location' => $program->location,
                'maps_url' => $this->buildMapsUrl($program->location),
                'start_at' => $program->start_at?->toDateString(),
                'min_price' => $minPrice ? (int) $minPrice : null,
                'image_url' => null,
            ];
        });

        return response()->json([
            'filters' => [
                'q' => $data['q'] ?? null,
            ],
            'programs' => $results,
        ]);
    }

    public function show(Request $request, string $program): JsonResponse
    {
        $programId = $this->resolveId($program);

        $program = Event::query()
            ->where('event_type', 'special_program')
            ->where('status', 'published')
            ->where('id', $programId)
            ->firstOrFail();

        $tickets = EventTicket::query()
            ->where('event_id', $program->id)
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
            'program' => [
                'id' => $program->id,
                'encrypted_id' => Crypt::encryptString((string) $program->id),
                'slug' => $program->slug,
                'title' => $program->title,
                'description' => $program->description,
                'city_name' => $this->resolveCityName($program->city_code),
                'location' => $program->location,
                'address' => $program->address,
                'maps_url' => $this->buildMapsUrl($program->address ?? $program->location),
                'start_at' => $program->start_at?->toDateTimeString(),
                'end_at' => $program->end_at?->toDateTimeString(),
                'capacity_total' => $program->capacity_total,
                'capacity_sold' => $program->capacity_sold,
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
