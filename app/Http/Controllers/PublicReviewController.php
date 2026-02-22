<?php

namespace App\Http\Controllers;

use App\Models\ProductReview;
use App\Models\UserNotification;
use App\Services\ProductReviewService;
use App\Services\ChatService;
use App\Services\PushNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PublicReviewController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'product_type' => ['required', 'string', 'in:' . implode(',', ProductReviewService::TYPES)],
            'product_id' => ['required', 'integer'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $product = ProductReviewService::findProduct($data['product_type'], (int) $data['product_id']);
        if (! $product) {
            abort(404);
        }

        if (! ProductReviewService::hasUsedBooking($request->user()->id, $data['product_type'], (int) $data['product_id'])) {
            return back()->withErrors([
                'review' => 'Ulasan hanya bisa dikirim setelah tiket digunakan atau pesanan selesai.',
            ]);
        }

        $review = ProductReview::query()->firstOrNew([
            'user_id' => $request->user()->id,
            'product_type' => $data['product_type'],
            'product_id' => (int) $data['product_id'],
        ]);

        $isNew = ! $review->exists;

        $review->fill([
            'rating' => (int) $data['rating'],
            'comment' => $data['comment'] ?? null,
            'status' => 'active',
        ]);
        $review->save();

        if ($isNew) {
            $ownerId = ProductReviewService::resolveOwnerId($data['product_type'], (int) $data['product_id']);
            if (! $ownerId) {
                $ownerId = ChatService::adminId();
            }

            if ($ownerId && (int) $ownerId !== (int) $request->user()->id) {
                $title = ProductReviewService::resolveTitle($data['product_type'], (int) $data['product_id']) ?? 'produk';
                UserNotification::create([
                    'user_id' => $ownerId,
                    'title' => 'Ulasan baru',
                    'message' => sprintf('Ada ulasan baru untuk %s (rating %d).', $title, (int) $data['rating']),
                    'type' => 'review_new',
                    'data' => [
                        'review_id' => $review->id,
                        'product_type' => $data['product_type'],
                        'product_id' => (int) $data['product_id'],
                    ],
                ]);

                try {
                    app(PushNotificationService::class)->sendToUser(
                        $ownerId,
                        'Ulasan baru',
                        sprintf('Ada ulasan baru untuk %s (rating %d).', $title, (int) $data['rating']),
                        [
                            'review_id' => (string) $review->id,
                            'product_type' => $data['product_type'],
                            'product_id' => (string) $data['product_id'],
                            'notification_type' => 'review_new',
                        ]
                    );
                } catch (\Throwable $exception) {
                    Log::warning('Push review notification failed', [
                        'user_id' => $ownerId,
                        'error' => $exception->getMessage(),
                    ]);
                }
            }
        }

        return back()->with('status', 'review-saved');
    }
}
