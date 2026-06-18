<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use App\Services\ProductReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'status' => ['nullable', 'string', 'in:active,removed'],
            'q' => ['nullable', 'string', 'max:255'],
        ]);

        $query = ProductReview::query()
            ->with(['user:id,name', 'replier:id,name'])
            ->where('product_type', 'special_program')
            ->latest('id');

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
        $titles = ProductReviewService::resolveTitles(
            'special_program',
            $reviews->getCollection()->pluck('product_id'),
        );

        return Inertia::render('admin/special-programs/reviews/index', [
            'filters' => $filters,
            'statusOptions' => ['active', 'removed'],
            'reviews' => [
                'data' => $reviews->getCollection()->map(fn (ProductReview $review) => [
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
                ]),
                'links' => $reviews->linkCollection(),
            ],
        ]);
    }

    public function reply(Request $request, ProductReview $review): RedirectResponse
    {
        abort_unless($review->product_type === 'special_program', 404);

        $data = $request->validate([
            'reply' => ['required', 'string', 'max:1000'],
        ]);

        $review->update([
            'reply' => $data['reply'],
            'replied_by' => $request->user()->id,
            'replied_at' => now(),
        ]);

        return back()->with('status', 'special-program-review-replied');
    }

    public function destroy(Request $request, ProductReview $review): RedirectResponse
    {
        abort_unless($review->product_type === 'special_program', 404);

        $review->update([
            'status' => 'removed',
            'removed_by' => $request->user()->id,
            'removed_at' => now(),
        ]);

        return back()->with('status', 'special-program-review-removed');
    }
}
