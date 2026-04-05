<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use App\Models\UserNotification;
use App\Services\ChatService;
use App\Services\ProductReviewService;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_type' => ['required', 'string', 'in:' . implode(',', ProductReviewService::TYPES)],
            'product_id' => ['required', 'string'],
        ]);

        $productId = $this->resolveId($data['product_id']);
        if (! $productId) {
            return response()->json([
                'message' => 'Product id tidak valid.',
                'errors' => [
                    'product_id' => ['Product id tidak valid.'],
                ],
            ], 422);
        }

        $product = ProductReviewService::findProduct($data['product_type'], $productId);
        if (! $product) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $userId = $request->user()?->id;

        return response()->json([
            'reviews' => ProductReviewService::publicReviews($data['product_type'], $productId),
            'user_review' => ProductReviewService::userReview($userId, $data['product_type'], $productId),
            'can_review' => $userId
                ? ProductReviewService::hasUsedBooking($userId, $data['product_type'], $productId)
                : false,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_type' => ['required', 'string', 'in:' . implode(',', ProductReviewService::TYPES)],
            'product_id' => ['required', 'string'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $productId = $this->resolveId($data['product_id']);
        if (! $productId) {
            return response()->json([
                'message' => 'Product id tidak valid.',
                'errors' => [
                    'product_id' => ['Product id tidak valid.'],
                ],
            ], 422);
        }

        $product = ProductReviewService::findProduct($data['product_type'], $productId);
        if (! $product) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        if (! ProductReviewService::hasUsedBooking($request->user()->id, $data['product_type'], $productId)) {
            return response()->json([
                'message' => 'Ulasan hanya bisa dikirim setelah tiket digunakan atau pesanan selesai.',
                'errors' => [
                    'review' => ['Ulasan hanya bisa dikirim setelah tiket digunakan atau pesanan selesai.'],
                ],
            ], 422);
        }

        $review = ProductReview::query()->firstOrNew([
            'user_id' => $request->user()->id,
            'product_type' => $data['product_type'],
            'product_id' => $productId,
        ]);

        $isNew = ! $review->exists;

        $review->fill([
            'rating' => (int) $data['rating'],
            'comment' => $data['comment'] ?? null,
            'status' => 'active',
        ]);
        $review->save();

        if ($isNew) {
            $ownerId = ProductReviewService::resolveOwnerId($data['product_type'], $productId);
            if (! $ownerId) {
                $ownerId = ChatService::adminId();
            }

            if ($ownerId && (int) $ownerId !== (int) $request->user()->id) {
                $title = ProductReviewService::resolveTitle($data['product_type'], $productId) ?? 'produk';
                UserNotification::create([
                    'user_id' => $ownerId,
                    'title' => 'Ulasan baru',
                    'message' => sprintf('Ada ulasan baru untuk %s (rating %d).', $title, (int) $data['rating']),
                    'type' => 'review_new',
                    'data' => [
                        'review_id' => $review->id,
                        'product_type' => $data['product_type'],
                        'product_id' => $productId,
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
                            'product_id' => (string) $productId,
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

        return response()->json([
            'message' => $isNew ? 'Ulasan berhasil dikirim.' : 'Ulasan berhasil diperbarui.',
            'review' => [
                'id' => Crypt::encryptString((string) $review->id),
                'rating' => $review->rating,
                'comment' => $review->comment,
                'status' => $review->status,
                'created_at' => $review->created_at?->toDateTimeString(),
                'updated_at' => $review->updated_at?->toDateTimeString(),
            ],
        ]);
    }

    private function resolveId(string $value): ?int
    {
        try {
            if (ctype_digit($value)) {
                return (int) $value;
            }

            return (int) Crypt::decryptString($value);
        } catch (\Throwable $exception) {
            return null;
        }
    }
}
