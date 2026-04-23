<?php

namespace App\Http\Controllers;

use App\Models\AcademyClass;
use App\Models\AcademyTicket;
use App\Services\Discovery\DiscoveryService;
use App\Services\ProductReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicAcademyController extends Controller
{
    public function index(Request $request, DiscoveryService $discovery): Response
    {
        $listing = $discovery->listing('academy', $request);
        $classes = collect($listing['data'] ?? [])->map(fn (array $item) => [
            'id' => $item['id'] ?? null,
            'encrypted_id' => $item['encrypted_id'] ?? $item['id'] ?? null,
            'slug' => $item['slug'] ?? null,
            'title' => $item['title'] ?? '',
            'category' => data_get($item, 'metadata.category'),
            'start_at' => data_get($item, 'metadata.date'),
            'location' => data_get($item, 'metadata.location'),
            'min_price' => $item['price'] ?? null,
            'image_url' => $item['image_url'] ?? $item['image'] ?? null,
        ])->values();

        return Inertia::render('public/academy/search', [
            'filters' => [
                'q' => $request->input('q'),
                'sort' => $request->input('sort'),
            ],
            'classes' => $classes,
            'discovery' => $listing['discovery'] ?? null,
            'meta' => $listing['meta'] ?? null,
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

        $now = now();
        $tickets = AcademyTicket::query()
            ->where('academy_class_id', $class->id)
            ->where('is_active', true)
            ->where(function ($query) use ($now) {
                $query->whereNull('sales_start_at')
                    ->orWhere('sales_start_at', '<=', $now);
            })
            ->where(function ($query) use ($now) {
                $query->whereNull('sales_end_at')
                    ->orWhere('sales_end_at', '>=', $now);
            })
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
                    'sales_start_at' => $ticket->sales_start_at?->toDateTimeString(),
                    'sales_end_at' => $ticket->sales_end_at?->toDateTimeString(),
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
