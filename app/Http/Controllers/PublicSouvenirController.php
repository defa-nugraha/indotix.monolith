<?php

namespace App\Http\Controllers;

use App\Models\SouvenirCategory;
use App\Models\SouvenirProduct;
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
            $query->where('name', 'like', '%'.$search.'%')
                ->orWhere('sku', 'like', '%'.$search.'%');
        }

        if ($categoryId = $request->integer('category_id')) {
            $query->where('category_id', $categoryId);
        }

        $products = $query->latest()->paginate(12)->withQueryString()->through(function (SouvenirProduct $product) {
            return [
                'id' => $product->id,
                'encrypted_id' => Crypt::encryptString((string) $product->id),
                'name' => $product->name,
                'price' => $product->price,
                'stock' => $product->stock,
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

    public function show(string $product): Response
    {
        try {
            $productId = Crypt::decryptString($product);
        } catch (\Throwable $exception) {
            abort(404);
        }

        $product = SouvenirProduct::query()
            ->with(['category', 'images', 'variants'])
            ->where('status', 'active')
            ->where('is_active', true)
            ->findOrFail($productId);

        return Inertia::render('public/souvenir/show', [
            'product' => [
                'id' => $product->id,
                'encrypted_id' => Crypt::encryptString((string) $product->id),
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'stock' => $product->stock,
                'category' => $product->category?->name,
                'images' => $product->images
                    ->map(fn ($image) => $image->image_url ? Storage::url($image->image_url) : null)
                    ->filter()
                    ->values(),
                'variants' => $product->variants->map(fn ($variant) => [
                    'id' => $variant->id,
                    'name' => $variant->name,
                    'variant_type' => $variant->variant_type,
                    'sku' => $variant->sku,
                    'additional_price' => $variant->additional_price,
                    'stock' => $variant->stock,
                    'is_active' => $variant->is_active,
                ]),
            ],
        ]);
    }
}
