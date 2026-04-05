<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SouvenirCategory;
use App\Models\SouvenirProduct;
use App\Services\ProductReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;

class SouvenirController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SouvenirProduct::query()
            ->with(['category', 'images'])
            ->where('status', 'active')
            ->where('is_active', true);

        if ($search = $request->string('q')->toString()) {
            $query->where('name', 'like', '%'.$search.'%')
                ->orWhere('sku', 'like', '%'.$search.'%');
        }

        if ($categoryId = $request->integer('category_id')) {
            $query->where('category_id', $categoryId);
        }

        $products = $query->latest()->paginate(12)->withQueryString();
        $products->getCollection()->transform(function (SouvenirProduct $product) {
            $encryptedId = Crypt::encryptString((string) $product->id);

            return [
                'id' => $encryptedId,
                'encrypted_id' => $encryptedId,
                'slug' => $product->slug,
                'name' => $product->name,
                'price' => (int) $product->price,
                'stock' => (int) $product->stock,
                'category' => $product->category?->name,
                'image_url' => $product->images->first()?->image_url ? Storage::url($product->images->first()->image_url) : null,
            ];
        });

        $categories = SouvenirCategory::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json([
            'filters' => [
                'q' => $request->string('q')->toString(),
                'category_id' => $request->integer('category_id'),
            ],
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    public function show(string $product): JsonResponse
    {
        $productId = $this->resolveId($product);

        $product = SouvenirProduct::query()
            ->with(['category', 'images', 'variants'])
            ->where('status', 'active')
            ->where('is_active', true)
            ->findOrFail($productId);

        $userId = request()->user('sanctum')?->id;
        $userReview = $userId ? ProductReviewService::userReview($userId, 'souvenir', $product->id) : null;
        $canReview = $userId
            ? (ProductReviewService::hasUsedBooking($userId, 'souvenir', $product->id) || (bool) $userReview)
            : false;
        $encryptedProductId = Crypt::encryptString((string) $product->id);

        return response()->json([
            'product' => [
                'id' => $encryptedProductId,
                'encrypted_id' => $encryptedProductId,
                'slug' => $product->slug,
                'name' => $product->name,
                'description' => $product->description,
                'price' => (int) $product->price,
                'stock' => (int) $product->stock,
                'category' => $product->category?->name,
                'images' => $product->images
                    ->map(fn ($image) => $image->image_url ? Storage::url($image->image_url) : null)
                    ->filter()
                    ->values(),
                'variants' => $product->variants->map(fn ($variant) => [
                    'id' => Crypt::encryptString((string) $variant->id),
                    'name' => $variant->name,
                    'variant_type' => $variant->variant_type,
                    'sku' => $variant->sku,
                    'additional_price' => (int) $variant->additional_price,
                    'stock' => (int) $variant->stock,
                    'is_active' => $variant->is_active,
                ]),
            ],
            'reviews' => ProductReviewService::publicReviews('souvenir', $product->id),
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
    }
}
