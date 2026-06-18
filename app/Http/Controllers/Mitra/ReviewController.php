<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use App\Services\ProductReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $type = (string) $request->route('type');
        if (! ProductReviewService::isValidType($type)) {
            abort(404);
        }

        $user = $request->user();
        $productIds = ProductReviewService::ownerProductIds($user, $type);

        $reviews = ProductReview::query()
            ->with(['user:id,name', 'replier:id,name'])
            ->where('product_type', $type)
            ->whereIn('product_id', $productIds)
            ->latest('id')
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString();

        $titles = ProductReviewService::resolveTitles($type, $productIds);

        $reviewsPayload = $reviews->getCollection()->map(function (ProductReview $review) use ($titles) {
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

        return Inertia::render('mitra/reviews/index', [
            'type' => $type,
            'reviews' => [
                'data' => $reviewsPayload,
                'links' => $reviews->linkCollection(),
            ],
        ]);
    }

    public function reply(Request $request, ProductReview $review): RedirectResponse
    {
        $type = (string) $request->route('type');
        $this->authorizeReview($request, $review, $type);

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
        $type = (string) $request->route('type');
        $this->authorizeReview($request, $review, $type);

        $review->update([
            'status' => 'removed',
            'removed_by' => $request->user()->id,
            'removed_at' => now(),
        ]);

        return back()->with('status', 'review-removed');
    }

    private function authorizeReview(Request $request, ProductReview $review, string $type): void
    {
        if (! ProductReviewService::isValidType($type) || $review->product_type !== $type) {
            abort(404);
        }

        if (! ProductReviewService::canManage($request->user(), $review)) {
            abort(403);
        }
    }
}
