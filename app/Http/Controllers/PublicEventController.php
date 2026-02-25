<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventTicket;
use App\Services\ProductReviewService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicEventController extends Controller
{
    public function index(Request $request): Response
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
                'start_at' => $event->start_at?->toDateString(),
                'min_price' => $minPrice ? (int) $minPrice : null,
                'image_url' => null,
            ];
        });

        return Inertia::render('public/events/search', [
            'filters' => [
                'q' => $data['q'] ?? null,
            ],
            'events' => $results,
        ]);
    }

    public function show(Request $request, string $event): Response
    {
        try {
            $eventId = Crypt::decryptString($event);
        } catch (\Throwable $exception) {
            abort(404);
        }

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

        $userId = $request->user()?->id;
        $userReview = ProductReviewService::userReview($userId, 'event', $event->id);
        $canReview = $userId
            ? (ProductReviewService::hasUsedBooking($userId, 'event', $event->id) || (bool) $userReview)
            : false;

        return Inertia::render('public/events/show', [
            'event' => [
                'id' => $event->id,
                'encrypted_id' => Crypt::encryptString((string) $event->id),
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
