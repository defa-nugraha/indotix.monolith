<?php

namespace App\Http\Controllers;

use App\Models\SouvenirCategory;
use App\Models\SouvenirProduct;
use App\Services\ProductReviewService;
use App\Services\Discovery\DiscoveryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicSouvenirController extends Controller
{
    public function index(Request $request, DiscoveryService $discovery): Response
    {
        $listing = $discovery->listing('souvenirs', $request);
        $products = collect($listing['data'] ?? [])->map(fn (array $item) => [
            'id' => $item['id'] ?? null,
            'encrypted_id' => $item['encrypted_id'] ?? $item['id'] ?? null,
            'slug' => $item['slug'] ?? null,
            'name' => $item['name'] ?? $item['title'] ?? '',
            'price' => (int) ($item['price'] ?? 0),
            'stock' => (int) (data_get($item, 'availability.quota') ?? 0),
            'category' => data_get($item, 'metadata.category'),
            'image_url' => $item['image_url'] ?? $item['image'] ?? null,
        ])->values();

        $filterPayload = $discovery->filters('souvenirs', $request);
        $categories = collect(data_get($filterPayload, 'data.categories', []))->map(fn (array $category) => [
            'id' => (int) ($category['value'] ?? 0),
            'name' => $category['label'] ?? '',
        ])->filter(fn (array $category) => $category['id'] > 0 && $category['name'] !== '')->values();

        return Inertia::render('public/souvenir/search', [
            'filters' => [
                'q' => $request->string('q')->toString(),
                'category_id' => $request->integer('category_id') ?: null,
                'sort' => $request->input('sort'),
            ],
            'products' => [
                'data' => $products,
                'links' => [],
                'meta' => $listing['meta'] ?? null,
            ],
            'categories' => $categories,
            'discovery' => $listing['discovery'] ?? null,
        ]);
    }

    public function show(Request $request, string $product): Response|RedirectResponse
    {
        $productModel = SouvenirProduct::query()
            ->with(['category', 'images', 'variants'])
            ->where('status', 'active')
            ->where('is_active', true)
            ->where('slug', $product)
            ->first();

        if (! $productModel) {
            try {
                $productId = Crypt::decryptString($product);
                $productModel = SouvenirProduct::query()
                    ->with(['category', 'images', 'variants'])
                    ->where('status', 'active')
                    ->where('is_active', true)
                    ->find($productId);
            } catch (\Throwable $exception) {
                $productModel = null;
            }
        }

        if (! $productModel) {
            abort(404);
        }

        if ($productModel->slug && $productModel->slug !== $product) {
            return redirect()->route('souvenir.show', ['product' => $productModel->slug]);
        }

        $userId = $request->user()?->id;
        $userReview = ProductReviewService::userReview($userId, 'souvenir', $productModel->id);
        $canReview = $userId
            ? (ProductReviewService::hasUsedBooking($userId, 'souvenir', $productModel->id) || (bool) $userReview)
            : false;

        return Inertia::render('public/souvenir/show', [
            'product' => [
                'id' => $productModel->id,
                'encrypted_id' => Crypt::encryptString((string) $productModel->id),
                'slug' => $productModel->slug,
                'name' => $productModel->name,
                'description' => $productModel->description,
                'price' => (int) $productModel->price,
                'stock' => (int) $productModel->stock,
                'category' => $productModel->category?->name,
                'images' => $productModel->images
                    ->map(fn ($image) => $image->image_url ? Storage::url($image->image_url) : null)
                    ->filter()
                    ->values(),
                'variants' => $productModel->variants->map(fn ($variant) => [
                    'id' => $variant->id,
                    'name' => $variant->name,
                    'variant_type' => $variant->variant_type,
                    'sku' => $variant->sku,
                    'additional_price' => (int) $variant->additional_price,
                    'stock' => (int) $variant->stock,
                    'is_active' => $variant->is_active,
                ]),
            ],
            'reviews' => ProductReviewService::publicReviews('souvenir', $productModel->id),
            'userReview' => $userReview,
            'canReview' => $canReview,
        ]);
    }
}
