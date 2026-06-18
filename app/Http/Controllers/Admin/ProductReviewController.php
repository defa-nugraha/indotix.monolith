<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use App\Services\ProductReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'type' => ['nullable', 'string', 'in:' . implode(',', ProductReviewService::TYPES)],
            'status' => ['nullable', 'string', 'in:active,removed'],
            'q' => ['nullable', 'string', 'max:255'],
        ]);

        $query = ProductReview::query()
            ->with(['user:id,name', 'replier:id,name'])
            ->latest('id');

        if (! empty($filters['type'])) {
            $query->where('product_type', $filters['type']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['q'])) {
            $query->where(function ($builder) use ($filters) {
                $builder
                    ->where('comment', 'like', '%' . $filters['q'] . '%')
                    ->orWhere('reply', 'like', '%' . $filters['q'] . '%');
            });
        }

        $reviews = $query->paginate(\App\Support\PaginationOptions::perPage())->withQueryString();

        $collection = $reviews->getCollection();
        $titlesByType = $collection
            ->groupBy('product_type')
            ->map(fn ($group, $type) => ProductReviewService::resolveTitles((string) $type, $group->pluck('product_id')));

        $reviewsPayload = $collection->map(function (ProductReview $review) use ($titlesByType) {
            $titles = $titlesByType->get($review->product_type, []);

            return [
                'id' => $review->id,
                'product_type' => $review->product_type,
                'product_title' => $titles[$review->product_id] ?? '-',
                'rating' => $review->rating,
                'comment' => $review->comment,
                'status' => $review->status,
                'reply' => $review->reply,
                'reply_by' => $review->replier?->name,
                'user_name' => $review->user?->name ?? 'User',
                'created_at' => $review->created_at?->toDateTimeString(),
            ];
        });

        return Inertia::render('admin/reviews/index', [
            'filters' => $filters,
            'typeOptions' => ProductReviewService::TYPES,
            'statusOptions' => ['active', 'removed'],
            'reviews' => [
                'data' => $reviewsPayload,
                'links' => $reviews->linkCollection(),
            ],
        ]);
    }

    public function reply(Request $request, ProductReview $review): RedirectResponse
    {
        $data = $request->validate([
            'reply' => ['required', 'string', 'max:1000'],
        ]);

        $review->update([
            'reply' => $data['reply'],
            'replied_by' => $request->user()->id,
            'replied_at' => now(),
        ]);

        return back()->with('status', 'review-replied');
    }

    public function destroy(Request $request, ProductReview $review): RedirectResponse
    {
        $review->update([
            'status' => 'removed',
            'removed_by' => $request->user()->id,
            'removed_at' => now(),
        ]);

        return back()->with('status', 'review-removed');
    }
}
