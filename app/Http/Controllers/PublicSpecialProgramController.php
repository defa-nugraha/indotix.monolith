<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventTicket;
use App\Services\ProductReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicSpecialProgramController extends Controller
{
    public function index(Request $request): Response
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
                'start_at' => $program->start_at?->toDateString(),
                'min_price' => $minPrice ? (int) $minPrice : null,
                'image_url' => null,
            ];
        });

        return Inertia::render('public/special-programs/search', [
            'filters' => [
                'q' => $data['q'] ?? null,
            ],
            'programs' => $results,
        ]);
    }

    public function show(Request $request, string $program): Response|RedirectResponse
    {
        $programModel = Event::query()
            ->where('event_type', 'special_program')
            ->where('status', 'published')
            ->where('slug', $program)
            ->first();

        if (! $programModel) {
            try {
                $programId = Crypt::decryptString($program);
                $programModel = Event::query()
                    ->where('event_type', 'special_program')
                    ->where('status', 'published')
                    ->where('id', $programId)
                    ->first();
            } catch (\Throwable $exception) {
                $programModel = null;
            }
        }

        if (! $programModel) {
            abort(404);
        }

        if ($programModel->slug && $programModel->slug !== $program) {
            return redirect()->route('special-programs.show', ['program' => $programModel->slug]);
        }

        $program = $programModel;

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

        $userId = $request->user()?->id;
        $userReview = ProductReviewService::userReview($userId, 'special_program', $program->id);
        $canReview = $userId
            ? (ProductReviewService::hasUsedBooking($userId, 'special_program', $program->id) || (bool) $userReview)
            : false;

        return Inertia::render('public/special-programs/show', [
            'program' => [
                'id' => $program->id,
                'encrypted_id' => Crypt::encryptString((string) $program->id),
                'slug' => $program->slug,
                'title' => $program->title,
                'description' => $program->description,
                'city_name' => $this->resolveCityName($program->city_code),
                'location' => $program->location,
                'address' => $program->address,
                'start_at' => $program->start_at?->toDateTimeString(),
                'end_at' => $program->end_at?->toDateTimeString(),
                'capacity_total' => $program->capacity_total,
                'capacity_sold' => $program->capacity_sold,
            ],
            'tickets' => $tickets,
            'reviews' => ProductReviewService::publicReviews('special_program', $program->id),
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
