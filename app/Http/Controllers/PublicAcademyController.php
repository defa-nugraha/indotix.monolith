<?php

namespace App\Http\Controllers;

use App\Models\AcademyClass;
use App\Models\AcademyTicket;
use App\Services\ProductReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicAcademyController extends Controller
{
    public function index(Request $request): Response
    {
        $payload = [
            'q' => $request->input('q'),
        ];

        $data = validator($payload, [
            'q' => ['nullable', 'string', 'max:255'],
        ])->validate();

        $classes = AcademyClass::query()
            ->where('is_active', true)
            ->whereIn('status', ['scheduled', 'open_for_sale'])
            ->when($data['q'] ?? null, fn ($query, $term) => $query->where('title', 'like', "%{$term}%"))
            ->with('images')
            ->orderByDesc('start_at')
            ->get();

        $tickets = AcademyTicket::query()
            ->whereIn('academy_class_id', $classes->pluck('id'))
            ->where('is_active', true)
            ->get()
            ->groupBy('academy_class_id');

        $results = $classes->map(function (AcademyClass $class) use ($tickets) {
            $ticketRows = $tickets->get($class->id, collect());
            $minPrice = $ticketRows->min('price');
            $image = $class->images->first()?->image_path;

            return [
                'id' => $class->id,
                'encrypted_id' => Crypt::encryptString((string) $class->id),
                'slug' => $class->slug,
                'title' => $class->title,
                'category' => $class->category,
                'start_at' => $class->start_at?->toDateString(),
                'location' => $class->location_detail,
                'min_price' => $minPrice ? (int) $minPrice : null,
                'image_url' => $image ? Storage::url($image) : null,
            ];
        });

        return Inertia::render('public/academy/search', [
            'filters' => [
                'q' => $data['q'] ?? null,
            ],
            'classes' => $results,
        ]);
    }

    public function show(Request $request, string $class): Response|RedirectResponse
    {
        $classModel = AcademyClass::query()
            ->where('is_active', true)
            ->where('slug', $class)
            ->first();

        if (! $classModel) {
            try {
                $classId = Crypt::decryptString($class);
                $classModel = AcademyClass::query()
                    ->where('is_active', true)
                    ->where('id', $classId)
                    ->first();
            } catch (\Throwable $exception) {
                $classModel = null;
            }
        }

        if (! $classModel) {
            abort(404);
        }

        if ($classModel->slug && $classModel->slug !== $class) {
            return redirect()->route('academy.show', ['class' => $classModel->slug]);
        }

        $class = $classModel;

        $class->load('images');

        $tickets = AcademyTicket::query()
            ->where('academy_class_id', $class->id)
            ->where('is_active', true)
            ->get()
            ->map(function (AcademyTicket $ticket) {
                $quota = $ticket->quota ?? 0;
                $available = $ticket->quota === null ? 9999 : max(0, (int) $quota - (int) $ticket->sold_count);

                return [
                    'id' => $ticket->id,
                    'name' => $ticket->name,
                    'price' => $ticket->price,
                    'quota' => $ticket->quota,
                    'sold_count' => $ticket->sold_count,
                    'available' => $available,
                    'ticket_type' => $ticket->ticket_type,
                    'refundable' => $ticket->refundable,
                    'sales_start_at' => $ticket->sales_start_at?->toDateString(),
                    'sales_end_at' => $ticket->sales_end_at?->toDateString(),
                ];
            });

        $userId = $request->user()?->id;
        $userReview = ProductReviewService::userReview($userId, 'academy', $class->id);
        $canReview = $userId
            ? (ProductReviewService::hasUsedBooking($userId, 'academy', $class->id) || (bool) $userReview)
            : false;

        return Inertia::render('public/academy/show', [
            'class' => [
                'id' => $class->id,
                'encrypted_id' => Crypt::encryptString((string) $class->id),
                'slug' => $class->slug,
                'title' => $class->title,
                'description' => $class->description,
                'category' => $class->category,
                'start_at' => $class->start_at?->toDateTimeString(),
                'end_at' => $class->end_at?->toDateTimeString(),
                'duration_minutes' => $class->duration_minutes,
                'location_type' => $class->location_type,
                'location_detail' => $class->location_detail,
                'capacity_total' => $class->capacity_total,
                'capacity_sold' => $class->capacity_sold,
                'images' => $class->images->map(fn ($image) => Storage::url($image->image_path)),
            ],
            'tickets' => $tickets,
            'reviews' => ProductReviewService::publicReviews('academy', $class->id),
            'userReview' => $userReview,
            'canReview' => $canReview,
        ]);
    }
}
