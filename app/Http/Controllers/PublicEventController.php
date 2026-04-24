<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventTicket;
use App\Services\Discovery\DiscoveryService;
use App\Services\ProductReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicEventController extends Controller
{
    public function index(Request $request, DiscoveryService $discovery): Response
    {
        $listing = $discovery->listing('events', $request);
        $events = collect($listing['data'] ?? [])->map(fn (array $item) => [
            'id' => $item['id'] ?? null,
            'encrypted_id' => $item['encrypted_id'] ?? $item['id'] ?? null,
            'slug' => $item['slug'] ?? null,
            'title' => $item['title'] ?? '',
            'city_name' => data_get($item, 'metadata.city'),
            'location' => data_get($item, 'metadata.location'),
            'start_at' => data_get($item, 'metadata.date'),
            'min_price' => $item['price'] ?? null,
            'image_url' => $item['image_url'] ?? $item['image'] ?? null,
        ])->values();

        return Inertia::render('public/events/search', [
            'filters' => [
                'q' => $request->input('q'),
                'sort' => $request->input('sort'),
                'start_date' => $request->input('start_date'),
                'quantity' => (int) $request->input('quantity', 1),
            ],
            'events' => $events,
            'discovery' => $listing['discovery'] ?? null,
            'meta' => $listing['meta'] ?? null,
        ]);
    }

    public function show(Request $request, string $event): Response|RedirectResponse
    {
        $eventModel = Event::query()
            ->where('event_type', 'event')
            ->where('status', 'published')
            ->where('slug', $event)
            ->first();

        if (! $eventModel) {
            try {
                $eventId = Crypt::decryptString($event);
                $eventModel = Event::query()
                    ->where('event_type', 'event')
                    ->where('status', 'published')
                    ->where('id', $eventId)
                    ->first();
            } catch (\Throwable $exception) {
                $eventModel = null;
            }
        }

        if (! $eventModel) {
            abort(404);
        }

        if ($eventModel->slug && $eventModel->slug !== $event) {
            return redirect()->route('events.show', ['event' => $eventModel->slug]);
        }

        $event = $eventModel;

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

        $userId = $request->user()?->id;
        $userReview = ProductReviewService::userReview($userId, 'event', $event->id);
        $canReview = $userId
            ? (ProductReviewService::hasUsedBooking($userId, 'event', $event->id) || (bool) $userReview)
            : false;

        return Inertia::render('public/events/show', [
            'event' => [
                'id' => $event->id,
                'encrypted_id' => Crypt::encryptString((string) $event->id),
                'slug' => $event->slug,
                'title' => $event->title,
                'description' => $event->description,
                'city_name' => $this->resolveCityName($event->city_code),
                'location' => $event->location,
                'address' => $event->address,
                'start_at' => $event->start_at?->toDateTimeString(),
                'end_at' => $event->end_at?->toDateTimeString(),
                'capacity_total' => $event->capacity_total,
                'capacity_sold' => $event->capacity_sold,
            ],
            'tickets' => $tickets,
            'reviews' => ProductReviewService::publicReviews('event', $event->id),
            'userReview' => $userReview,
            'canReview' => $canReview,
        ]);
    }

    private function resolveCityName(?string $cityCode): ?string
    {
        if (! $cityCode) {
            return null;
        }

        return DB::table('regencies')->where('code', $cityCode)->value('name');
    }
}
