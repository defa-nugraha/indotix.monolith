<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademyClass;
use App\Models\AcademyTicket;
use App\Services\ProductReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;

class AcademyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payload = [
            'q' => $request->input('q'),
        ];

        $data = validator($payload, [
            'q' => ['nullable', 'string', 'max:255'],
        ])->validate();

        $term = trim((string) ($data['q'] ?? ''));
        $hasFilter = $term !== '' && ! in_array(strtolower($term), ['null', 'undefined'], true);

        $classesQuery = AcademyClass::query()
            ->where('is_active', true)
            ->with('images');

        if (! $hasFilter) {
            $classesQuery->orderByDesc('start_at')->limit(10);
        } else {
            $classesQuery
                ->where('title', 'like', "%{$term}%")
                ->orderByDesc('start_at');
        }

        $classes = $classesQuery->get();

        $now = now();
        $tickets = AcademyTicket::query()
            ->whereIn('academy_class_id', $classes->pluck('id'))
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
                'maps_url' => $this->buildMapsUrl($class->location_detail),
                'min_price' => $minPrice ? (int) $minPrice : null,
                'image_url' => $image ? Storage::url($image) : null,
            ];
        });

        return response()->json([
            'filters' => [
                'q' => $data['q'] ?? null,
            ],
            'classes' => $results,
        ]);
    }

    public function show(Request $request, string $class): JsonResponse
    {
        $classModel = AcademyClass::query()
            ->where('is_active', true)
            ->where('slug', $class)
            ->first();

        if (! $classModel) {
            $classId = $this->resolveId($class);
            $classModel = AcademyClass::query()
                ->where('is_active', true)
                ->where('id', $classId)
                ->firstOrFail();
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

        $userId = $request->user('sanctum')?->id;
        $userReview = $userId ? ProductReviewService::userReview($userId, 'academy', $class->id) : null;
        $canReview = $userId
            ? (ProductReviewService::hasUsedBooking($userId, 'academy', $class->id) || (bool) $userReview)
            : false;

        return response()->json([
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
                'maps_url' => $this->buildMapsUrl($class->location_detail),
                'capacity_total' => $class->capacity_total,
                'capacity_sold' => $class->capacity_sold,
                'images' => $class->images->map(fn ($image) => Storage::url($image->image_path)),
            ],
            'tickets' => $tickets,
            'reviews' => ProductReviewService::publicReviews('academy', $class->id),
            'user_review' => $userReview,
            'can_review' => $canReview,
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
