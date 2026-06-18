<?php

namespace App\Http\Controllers;

use App\Models\MitraWisataOnboarding;
use App\Models\WisataAffiliateClick;
use App\Models\WisataAffiliateLink;
use App\Models\WisataBooking;
use App\Models\WisataTicket;
use App\Services\ProductReviewService;
use App\Services\Discovery\DiscoveryService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicWisataController extends Controller
{
    public function index(Request $request, DiscoveryService $discovery): Response
    {
        $listing = $discovery->listing('wisata', $request);
        $destinations = collect($listing['data'] ?? [])->map(function (array $item) {
            $price = $item['price'] ?? null;
            $quota = data_get($item, 'availability.quota');

            return [
                'id' => $item['id'] ?? null,
                'encrypted_id' => $item['encrypted_id'] ?? $item['id'] ?? null,
                'slug' => $item['slug'] ?? null,
                'destination_name' => $item['destination_name'] ?? $item['title'] ?? '',
                'destination_type' => data_get($item, 'metadata.category'),
                'city_name' => data_get($item, 'metadata.city'),
                'photo_url' => $item['image_url'] ?? $item['image'] ?? null,
                'tickets' => $price !== null ? [[
                    'id' => 0,
                    'name' => 'Tiket',
                    'price' => (int) $price,
                    'available' => $quota !== null ? (int) $quota : 0,
                ]] : [],
            ];
        })->values();

        $today = Carbon::today();

        return Inertia::render('public/wisata/search', [
            'filters' => [
                'q' => $request->input('q'),
                'visit_date' => $request->input('visit_date') ?? $today->toDateString(),
                'quantity' => (int) $request->input('quantity', 1),
                'sort' => $request->input('sort'),
            ],
            'destinations' => $destinations,
            'discovery' => $listing['discovery'] ?? null,
            'meta' => $listing['meta'] ?? null,
        ]);
    }

    public function show(Request $request, string $destination): Response|RedirectResponse
    {
        $destinationModel = MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->where('slug', $destination)
            ->first();

        if (! $destinationModel && strlen($destination) <= 10) {
            $destinationId = $this->resolveAffiliateDestination($request, $destination);
            if ($destinationId) {
                $destinationModel = MitraWisataOnboarding::query()
                    ->publiclyVisible()
                    ->where('id', $destinationId)
                    ->first();
            }
        }

        if (! $destinationModel) {
            try {
                $destinationId = Crypt::decryptString($destination);
                $destinationModel = MitraWisataOnboarding::query()
                    ->publiclyVisible()
                    ->where('id', $destinationId)
                    ->first();
            } catch (\Throwable $exception) {
                $destinationModel = null;
            }
        }

        if (! $destinationModel) {
            abort(404);
        }

        if ($destinationModel->slug && $destinationModel->slug !== $destination) {
            $redirect = redirect()->route('wisata.show', ['destination' => $destinationModel->slug] + $request->query());
            $affiliateLink = $request->attributes->get('affiliate_link');
            $shouldStoreCookie = (bool) $request->attributes->get('affiliate_link_store');
            if ($affiliateLink && $shouldStoreCookie) {
                $redirect->withCookie(cookie(
                    'affiliate_ref',
                    json_encode(['link_id' => $affiliateLink->id, 'set_at' => now()->timestamp]),
                    $affiliateLink->cookie_days * 1440
                ));
            }

            return $redirect;
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

        $userId = $request->user()?->id;
        $userReview = ProductReviewService::userReview($userId, 'wisata', $destination->id);
        $canReview = $userId
            ? (ProductReviewService::hasUsedBooking($userId, 'wisata', $destination->id) || (bool) $userReview)
            : false;

        $response = Inertia::render('public/wisata/show', [
            'filters' => [
                'visit_date' => $data['visit_date'],
                'quantity' => $data['quantity'],
            ],
            'destination' => [
                'id' => $destination->id,
                'encrypted_id' => Crypt::encryptString((string) $destination->id),
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
                'photo_gate_url' => $destination->photo_gate_path ? '/storage/'.$destination->photo_gate_path : null,
                'photo_area_url' => $destination->photo_area_path ? '/storage/'.$destination->photo_area_path : null,
                'photo_ticket_url' => $destination->photo_ticket_path ? '/storage/'.$destination->photo_ticket_path : null,
                'photo_other_urls' => collect($destination->photo_other_paths ?? [])
                    ->filter()
                    ->map(fn ($path) => '/storage/'.$path)
                    ->values()
                    ->all(),
                'maps_pin_url' => $destination->maps_pin_url,
                'latitude' => $this->extractLatitude($destination->maps_pin_url),
                'longitude' => $this->extractLongitude($destination->maps_pin_url),
            ],
            'tickets' => $tickets,
            'reviews' => ProductReviewService::publicReviews('wisata', $destination->id),
            'userReview' => $userReview,
            'canReview' => $canReview,
        ]);

        $affiliateLink = $request->attributes->get('affiliate_link');
        $shouldStoreCookie = (bool) $request->attributes->get('affiliate_link_store');
        if ($affiliateLink && $shouldStoreCookie) {
            $response->withCookie(cookie(
                'affiliate_ref',
                json_encode(['link_id' => $affiliateLink->id, 'set_at' => now()->timestamp]),
                $affiliateLink->cookie_days * 1440
            ));
        }

        return $response;
    }

    private function resolveCityName(?string $cityCode): ?string
    {
        if (! $cityCode) {
            return null;
        }

        return DB::table('regencies')->where('code', $cityCode)->value('name');
    }

    private function resolveAffiliateDestination(Request $request, string $code): ?int
    {
        $link = WisataAffiliateLink::query()
            ->with('affiliate')
            ->where('code', strtoupper($code))
            ->where('status', 'active')
            ->first();

        if (! $link || ! $link->affiliate || ! $link->affiliate->wisata_id) {
            return null;
        }

        $shouldStore = false;
        $existing = $request->session()->get('affiliate_ref');
        if (! $existing || $link->attribution_model === 'last_click') {
            $request->session()->put('affiliate_ref', [
                'link_id' => $link->id,
                'set_at' => now()->timestamp,
            ]);
            $shouldStore = true;
        }

        WisataAffiliateClick::create([
            'affiliate_link_id' => $link->id,
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
        ]);

        $request->attributes->set('affiliate_link', $link);
        $request->attributes->set('affiliate_link_store', $shouldStore);

        return (int) $link->affiliate->wisata_id;
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
}
