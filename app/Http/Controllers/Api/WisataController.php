<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataBooking;
use App\Models\WisataTicket;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class WisataController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $today = Carbon::today();

        $payload = [
            'q' => $request->input('q'),
            'visit_date' => $request->input('visit_date') ?? $today->toDateString(),
            'quantity' => $request->input('quantity', 1),
        ];

        $data = validator($payload, [
            'q' => ['nullable', 'string', 'max:255'],
            'visit_date' => ['required', 'date'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ])->validate();

        $destinations = MitraWisataOnboarding::query()
            ->where('verification_status', 'verified')
            ->where('is_suspended', false)
            ->where('is_temporarily_closed', false)
            ->when($data['q'] ?? null, fn ($query, $term) => $query->where('destination_name', 'like', "%{$term}%"))
            ->with('user:id,name')
            ->orderBy('destination_name')
            ->get();

        $tickets = WisataTicket::query()
            ->where('is_active', true)
            ->where('is_closed', false)
            ->whereIn('mitra_wisata_onboarding_id', $destinations->pluck('id'))
            ->get()
            ->groupBy('mitra_wisata_onboarding_id');

        $results = $destinations->map(function (MitraWisataOnboarding $destination) use ($tickets, $data) {
            $items = $tickets->get($destination->id, collect());

            $ticketRows = $items->map(function (WisataTicket $ticket) use ($data) {
                $reserved = WisataBooking::query()
                    ->where('wisata_ticket_id', $ticket->id)
                    ->whereDate('visit_date', $data['visit_date'])
                    ->whereIn('status', ['pending_payment', 'paid', 'completed'])
                    ->sum('quantity');

                $maxQuota = $ticket->daily_quota ?? $ticket->quota;
                $available = max(0, $maxQuota - $reserved);

                if ($available < (int) $data['quantity']) {
                    return null;
                }

                return [
                    'id' => $ticket->id,
                    'name' => $ticket->name,
                    'price' => $ticket->price,
                    'available' => $available,
                ];
            })->filter()->values();

            if ($ticketRows->isEmpty()) {
                return null;
            }

            return [
                'id' => $destination->id,
                'encrypted_id' => Crypt::encryptString((string) $destination->id),
                'destination_name' => $destination->destination_name,
                'destination_type' => $destination->destination_type,
                'city_name' => $this->resolveCityName($destination->city_code),
                'photo_url' => $destination->photo_area_path ? '/storage/'.$destination->photo_area_path : null,
                'tickets' => $ticketRows,
            ];
        })->filter()->values();

        return response()->json([
            'filters' => [
                'q' => $data['q'] ?? null,
                'visit_date' => $data['visit_date'],
                'quantity' => $data['quantity'],
            ],
            'destinations' => $results,
        ]);
    }

    public function show(Request $request, string $destination): JsonResponse
    {
        $destinationId = $this->resolveId($destination);

        $destination = MitraWisataOnboarding::query()
            ->where('verification_status', 'verified')
            ->where('is_suspended', false)
            ->where('id', $destinationId)
            ->firstOrFail();

        $today = Carbon::today();
        $payload = [
            'visit_date' => $request->input('visit_date') ?? $today->toDateString(),
            'quantity' => $request->input('quantity', 1),
        ];

        $data = validator($payload, [
            'visit_date' => ['required', 'date'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ])->validate();

        $tickets = WisataTicket::query()
            ->where('mitra_wisata_onboarding_id', $destination->id)
            ->where('is_active', true)
            ->where('is_closed', false)
            ->get()
            ->map(function (WisataTicket $ticket) use ($data) {
                $reserved = WisataBooking::query()
                    ->where('wisata_ticket_id', $ticket->id)
                    ->whereDate('visit_date', $data['visit_date'])
                    ->whereIn('status', ['pending_payment', 'paid', 'completed'])
                    ->sum('quantity');

                $maxQuota = $ticket->daily_quota ?? $ticket->quota;
                $available = max(0, $maxQuota - $reserved);

                return [
                    'id' => $ticket->id,
                    'name' => $ticket->name,
                    'description' => $ticket->description,
                    'price' => $ticket->price,
                    'available' => $available,
                    'ticket_type' => $ticket->ticket_type,
                    'refund_policy' => $ticket->refund_policy,
                ];
            });

        $latitude = $this->extractLatitude($destination->maps_pin_url);
        $longitude = $this->extractLongitude($destination->maps_pin_url);
        $mapsUrl = $this->buildMapsUrl($latitude, $longitude);

        return response()->json([
            'filters' => [
                'visit_date' => $data['visit_date'],
                'quantity' => $data['quantity'],
            ],
            'destination' => [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'id' => $destination->id,
                'encrypted_id' => Crypt::encryptString((string) $destination->id),
                'destination_name' => $destination->destination_name,
                'destination_type' => $destination->destination_type,
                'description' => $destination->description,
                'highlights' => $destination->highlights,
                'address_full' => $destination->address_full,
                'city_name' => $this->resolveCityName($destination->city_code),
                'open_days' => $destination->open_days,
                'open_time' => $destination->open_time,
                'close_time' => $destination->close_time,
                'facilities' => $destination->facilities,
                'photo_gate_url' => $destination->photo_gate_path ? '/storage/'.$destination->photo_gate_path : null,
                'photo_area_url' => $destination->photo_area_path ? '/storage/'.$destination->photo_area_path : null,
                'photo_ticket_url' => $destination->photo_ticket_path ? '/storage/'.$destination->photo_ticket_path : null,
                'maps_pin_url' => $mapsUrl ?? $destination->maps_pin_url,
                'maps_url' => $mapsUrl,
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
    }

    private function resolveCityName(?string $cityCode): ?string
    {
        if (! $cityCode) {
            return null;
        }

        return DB::table('regencies')->where('code', $cityCode)->value('name');
    }

    private function extractLatitude(?string $mapsUrl): ?string
    {
        if (! $mapsUrl) {
            return null;
        }

        if (preg_match('/@(-?\d+\.\d+),(-?\d+\.\d+)/', $mapsUrl, $matches)) {
            return $matches[1];
        }

        if (preg_match('/q=(-?\d+\.\d+),(-?\d+\.\d+)/', $mapsUrl, $matches)) {
            return $matches[1];
        }

        return null;
    }

    private function extractLongitude(?string $mapsUrl): ?string
    {
        if (! $mapsUrl) {
            return null;
        }

        if (preg_match('/@(-?\d+\.\d+),(-?\d+\.\d+)/', $mapsUrl, $matches)) {
            return $matches[2];
        }

        if (preg_match('/q=(-?\d+\.\d+),(-?\d+\.\d+)/', $mapsUrl, $matches)) {
            return $matches[2];
        }

        return null;
    }

    private function buildMapsUrl(?string $latitude, ?string $longitude): ?string
    {
        if (! $latitude || ! $longitude) {
            return null;
        }

        return sprintf('https://www.google.com/maps?q=%s,%s', $latitude, $longitude);
    }
}
