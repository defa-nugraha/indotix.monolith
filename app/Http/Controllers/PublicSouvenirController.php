<?php

namespace App\Http\Controllers;

use App\Models\SouvenirCategory;
use App\Models\SouvenirProduct;
use App\Services\ProductReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicSouvenirController extends Controller
{
    public function index(Request $request): Response
    {
        $query = SouvenirProduct::query()
            ->with(['category', 'images'])
            ->where('status', 'active')
            ->where('is_active', true);

        if ($search = $request->string('q')->toString()) {
            $query->where(function ($query) use ($search) {
                $query->where('name', 'like', '%'.$search.'%')
                    ->orWhere('sku', 'like', '%'.$search.'%');
            });
        }

        if ($categoryId = $request->integer('category_id')) {
            $query->where('category_id', $categoryId);
        }

        $products = $query->latest()->paginate(12)->withQueryString()->through(function (SouvenirProduct $product) {
            return [
                'id' => $product->id,
                'encrypted_id' => Crypt::encryptString((string) $product->id),
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

        return Inertia::render('public/souvenir/search', [
            'filters' => [
                'q' => $request->string('q')->toString(),
                'category_id' => $request->integer('category_id'),
            ],
            'products' => $products,
            'categories' => $categories,
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
