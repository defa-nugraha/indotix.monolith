<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataBooking;
use App\Models\WisataBookingItem;
use App\Models\WisataTicket;
use App\Services\ProductReviewService;
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

        $visitDate = Carbon::parse($data['visit_date'], config('app.timezone'))->startOfDay();

        $destinations = MitraWisataOnboarding::query()
            ->publiclyVisible()
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
                $reserved = $this->reservedTicketQuantity((int) $ticket->id, $data['visit_date']);
                $maxQuota = $ticket->daily_quota ?? $ticket->quota;
                $available = max(0, $maxQuota - $reserved);

                if ($available < (int) $data['quantity']) {
                    return null;
                }

                $encryptedTicketId = Crypt::encryptString((string) $ticket->id);

                return [
                    'id' => $encryptedTicketId,
                    'name' => $ticket->name,
                    'price' => $ticket->priceForVisitDate($visitDate),
                    'available' => $available,
                    'min_order_quantity' => max(1, (int) ($ticket->min_order_quantity ?? 1)),
                    'max_order_quantity' => $ticket->max_order_quantity,
                    'ticket_kind' => $ticket->ticket_kind ?? 'single',
                    'is_entry_ticket' => (bool) ($ticket->is_entry_ticket ?? true),
                    'package_items' => $ticket->package_items ?? [],
                ];
            })->filter()->values();

            if ($ticketRows->isEmpty()) {
                return null;
            }

            $encryptedDestinationId = Crypt::encryptString((string) $destination->id);

            return [
                'id' => $encryptedDestinationId,
                'encrypted_id' => $encryptedDestinationId,
                'slug' => $destination->slug,
                'destination_name' => $destination->destination_name,
                'destination_type' => $destination->destination_type,
                'city_name' => $this->resolveCityName($destination->city_code),
                'photo_url' => $this->resolveCoverPhotoUrl($destination),
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
        $destinationModel = MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->where('slug', $destination)
            ->first();

        if (! $destinationModel) {
            $destinationId = $this->resolveId($destination);
            $destinationModel = MitraWisataOnboarding::query()
                ->publiclyVisible()
                ->where('id', $destinationId)
                ->firstOrFail();
        }

        $destination = $destinationModel;

        $today = Carbon::today();
        $payload = [
            'visit_date' => $request->input('visit_date') ?? $today->toDateString(),
            'quantity' => $request->input('quantity', 1),
        ];

        $data = validator($payload, [
            'visit_date' => ['required', 'date'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ])->validate();

        $visitDate = Carbon::parse($data['visit_date'], config('app.timezone'))->startOfDay();

        $tickets = WisataTicket::query()
            ->where('mitra_wisata_onboarding_id', $destination->id)
            ->where('is_active', true)
            ->where('is_closed', false)
            ->get()
            ->map(function (WisataTicket $ticket) use ($data, $visitDate) {
                $reserved = $this->reservedTicketQuantity((int) $ticket->id, $data['visit_date']);
                $maxQuota = $ticket->daily_quota ?? $ticket->quota;
                $available = max(0, $maxQuota - $reserved);

                return [
                    'id' => Crypt::encryptString((string) $ticket->id),
                    'name' => $ticket->name,
                    'description' => $ticket->description,
                    'price' => $ticket->priceForVisitDate($visitDate),
                    'available' => $available,
                    'min_order_quantity' => max(1, (int) ($ticket->min_order_quantity ?? 1)),
                    'max_order_quantity' => $ticket->max_order_quantity,
                    'ticket_type' => $ticket->ticket_type,
                    'ticket_kind' => $ticket->ticket_kind ?? 'single',
                    'is_entry_ticket' => (bool) ($ticket->is_entry_ticket ?? true),
                    'package_items' => $ticket->package_items ?? [],
                    'refund_policy' => $ticket->refund_policy,
                ];
            });

        $latitude = $this->extractLatitude($destination->maps_pin_url);
        $longitude = $this->extractLongitude($destination->maps_pin_url);
        $mapsUrl = $this->buildMapsUrl($latitude, $longitude, $destination->maps_pin_url);
        $mapsEmbedUrl = $this->buildMapsEmbedUrl($destination->maps_pin_url);
        $userId = $request->user('sanctum')?->id;
        $userReview = $userId ? ProductReviewService::userReview($userId, 'wisata', $destination->id) : null;
        $canReview = $userId ? ProductReviewService::hasUsedBooking($userId, 'wisata', $destination->id) : false;
        $coverPhotoUrl = $this->resolveCoverPhotoUrl($destination);
        $encryptedDestinationId = Crypt::encryptString((string) $destination->id);

        return response()->json([
            'filters' => [
                'visit_date' => $data['visit_date'],
                'quantity' => $data['quantity'],
            ],
            'destination' => [
                'cover_photo_url' => $coverPhotoUrl,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'id' => $encryptedDestinationId,
                'encrypted_id' => $encryptedDestinationId,
                'slug' => $destination->slug,
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
                'photo_product_url' => $destination->photo_product_path ? '/storage/'.$destination->photo_product_path : null,
                'photo_gate_url' => $destination->photo_gate_path ? '/storage/'.$destination->photo_gate_path : null,
                'photo_area_url' => $destination->photo_area_path ? '/storage/'.$destination->photo_area_path : null,
                'photo_ticket_url' => $destination->photo_ticket_path ? '/storage/'.$destination->photo_ticket_path : null,
                'photo_other_urls' => collect($destination->photo_other_paths ?? [])
                    ->filter()
                    ->map(fn ($path) => '/storage/'.$path)
                    ->values()
                    ->all(),
                'maps_pin_url' => $destination->maps_pin_url,
                'maps_url' => $mapsUrl,
                'maps_embed_url' => $mapsEmbedUrl,
            ],
            'tickets' => $tickets,
            'reviews' => ProductReviewService::publicReviews('wisata', $destination->id),
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

    private function buildMapsUrl(?string $latitude, ?string $longitude, ?string $fallbackUrl = null): ?string
    {
        if (! $latitude || ! $longitude) {
            return $fallbackUrl;
        }

        return sprintf('https://www.google.com/maps/search/?api=1&query=%s,%s', $latitude, $longitude);
    }

    private function buildMapsEmbedUrl(?string $mapsPinUrl): ?string
    {
        if (! $mapsPinUrl) {
            return null;
        }

        if (str_contains($mapsPinUrl, 'output=embed')) {
            return $mapsPinUrl;
        }

        if (str_contains($mapsPinUrl, 'google.com/maps')) {
            return $mapsPinUrl.(str_contains($mapsPinUrl, '?') ? '&' : '?').'output=embed';
        }

        return null;
    }

    private function resolveCoverPhotoUrl(MitraWisataOnboarding $destination): string
    {
        $candidates = [
            $destination->photo_product_path,
            $destination->photo_area_path,
            $destination->photo_gate_path,
            $destination->photo_ticket_path,
        ];

        $photoOthers = $destination->photo_other_paths ?? [];
        if (is_array($photoOthers) && count($photoOthers) > 0) {
            $candidates[] = $photoOthers[0];
        }

        foreach ($candidates as $path) {
            if ($path) {
                return '/storage/'.$path;
            }
        }

        return $this->fallbackImageUrl($destination->id);
    }

    private function reservedTicketQuantity(int $ticketId, string $date): int
    {
        $itemReserved = WisataBookingItem::query()
            ->where('wisata_ticket_id', $ticketId)
            ->whereHas('booking', function ($query) use ($date) {
                $query
                    ->whereDate('visit_date', $date)
                    ->whereIn('status', ['pending_payment', 'paid', 'completed']);
            })
            ->sum('quantity');

        $legacyReserved = WisataBooking::query()
            ->where('wisata_ticket_id', $ticketId)
            ->whereDate('visit_date', $date)
            ->whereIn('status', ['pending_payment', 'paid', 'completed'])
            ->whereDoesntHave('items')
            ->sum('quantity');

        return (int) $itemReserved + (int) $legacyReserved;
    }

    private function fallbackImageUrl(int $id): string
    {
        return '/images/placeholder-card.jpg';
    }
}
