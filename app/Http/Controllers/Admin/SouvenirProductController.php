<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SouvenirAuditLog;
use App\Models\SouvenirCategory;
use App\Models\SouvenirProduct;
use App\Models\SouvenirProductImage;
use App\Services\MediaCompressionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SouvenirProductController extends Controller
{
    public function index(Request $request): Response
    {
        $query = SouvenirProduct::query()->with('category', 'images');

        if ($search = $request->string('search')->toString()) {
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%");
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($categoryId = $request->integer('category_id')) {
            $query->where('category_id', $categoryId);
        }

        $products = $query->orderByDesc('id')->paginate(10)->withQueryString()->through(
            fn (SouvenirProduct $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'sku' => $product->sku,
                'price' => $product->price,
                'cost_price' => $product->cost_price,
                'weight' => $product->weight,
                'length' => $product->length,
                'width' => $product->width,
                'height' => $product->height,
                'status' => $product->status,
                'is_active' => $product->is_active,
                'min_stock' => $product->min_stock,
                'stock' => $product->stock,
                'category' => $product->category,
                'images' => $product->images
                    ->map(fn (SouvenirProductImage $image) => [
                        'id' => $image->id,
                        'url' => $image->image_url ? Storage::url($image->image_url) : null,
                    ])
                    ->filter(fn ($image) => $image['url'])
                    ->values(),
            ]
        );

        $categories = SouvenirCategory::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('admin/souvenir/products/index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'category_id' => $request->integer('category_id'),
            ],
        ]);
    }

    public function store(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:souvenir_categories,id'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'cost_price' => ['nullable', 'integer', 'min:0'],
            'sku' => ['required', 'string', 'max:50', 'unique:souvenir_products,sku'],
            'weight' => ['nullable', 'integer', 'min:0'],
            'length' => ['nullable', 'integer', 'min:0'],
            'width' => ['nullable', 'integer', 'min:0'],
            'height' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', 'in:draft,active,inactive'],
            'min_stock' => ['nullable', 'integer', 'min:0'],
            'stock' => ['nullable', 'integer'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['file', 'image'],
        ]);

        $product = SouvenirProduct::create([
            'name' => $data['name'],
            'slug' => SouvenirProduct::generateUniqueSlug($data['name']),
            'category_id' => $data['category_id'] ?? null,
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'cost_price' => $data['cost_price'] ?? null,
            'sku' => $data['sku'],
            'weight' => $data['weight'] ?? 0,
            'length' => $data['length'] ?? null,
            'width' => $data['width'] ?? null,
            'height' => $data['height'] ?? null,
            'status' => $data['status'],
            'is_active' => $data['status'] === 'active',
            'min_stock' => $data['min_stock'] ?? 0,
            'stock' => $data['stock'] ?? 0,
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        $images = $data['images'] ?? [];
        $this->attachImages($product, $images, $mediaCompression);

        $this->logAudit($request, 'product_created', 'Produk souvenir dibuat.', [
            'product_id' => $product->id,
            'name' => $product->name,
        ]);

        return back()->with('status', 'souvenir-product-created');
    }

    public function update(Request $request, SouvenirProduct $product, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:souvenir_categories,id'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'cost_price' => ['nullable', 'integer', 'min:0'],
            'sku' => ['required', 'string', 'max:50', 'unique:souvenir_products,sku,'.$product->id],
            'weight' => ['nullable', 'integer', 'min:0'],
            'length' => ['nullable', 'integer', 'min:0'],
            'width' => ['nullable', 'integer', 'min:0'],
            'height' => ['nullable', 'integer', 'min:0'],
            'status' => ['required', 'in:draft,active,inactive'],
            'min_stock' => ['nullable', 'integer', 'min:0'],
            'stock' => ['nullable', 'integer'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['file', 'image'],
        ]);

        $images = $data['images'] ?? [];
        if (! empty($images)) {
            $existingCount = $product->images()->count();
            if ($existingCount + count($images) > 10) {
                return back()->withErrors([
                    'images' => 'Maksimal 10 foto per produk.',
                ]);
            }
        }

        $product->update([
            'name' => $data['name'],
            'slug' => SouvenirProduct::generateUniqueSlug($data['name'], $product->id),
            'category_id' => $data['category_id'] ?? null,
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'cost_price' => $data['cost_price'] ?? null,
            'sku' => $data['sku'],
            'weight' => $data['weight'] ?? 0,
            'length' => $data['length'] ?? null,
            'width' => $data['width'] ?? null,
            'height' => $data['height'] ?? null,
            'status' => $data['status'],
            'is_active' => $data['status'] === 'active',
            'min_stock' => $data['min_stock'] ?? 0,
            'stock' => $data['stock'] ?? $product->stock,
            'updated_by' => $request->user()->id,
        ]);

        $this->attachImages($product, $images, $mediaCompression);

        $this->logAudit($request, 'product_updated', 'Produk souvenir diperbarui.', [
            'product_id' => $product->id,
        ]);

        return back()->with('status', 'souvenir-product-updated');
    }

    public function destroyImage(Request $request, SouvenirProduct $product, SouvenirProductImage $image): RedirectResponse
    {
        if ($image->product_id !== $product->id) {
            abort(404);
        }

        if ($image->image_url) {
            Storage::disk('public')->delete($image->image_url);
        }
        $image->delete();

        $this->logAudit($request, 'product_image_deleted', 'Foto produk souvenir dihapus.', [
            'product_id' => $product->id,
            'image_id' => $image->id,
        ]);

        return back()->with('status', 'souvenir-product-image-deleted');
    }

    public function destroy(Request $request, SouvenirProduct $product): RedirectResponse
    {
        $product->update([
            'status' => 'inactive',
            'is_active' => false,
            'updated_by' => $request->user()->id,
        ]);

        $this->logAudit($request, 'product_deactivated', 'Produk souvenir dinonaktifkan.', [
            'product_id' => $product->id,
        ]);

        return back()->with('status', 'souvenir-product-deactivated');
    }

    public function forceDelete(Request $request, SouvenirProduct $product): RedirectResponse
    {
        $product->images->each(function (SouvenirProductImage $image): void {
            if ($image->image_url) {
                Storage::disk('public')->delete($image->image_url);
            }
        });

        $product->images()->delete();
        $product->variants()->delete();
        $product->stockMovements()->delete();
        $product->delete();

        $this->logAudit($request, 'product_deleted', 'Produk souvenir dihapus permanen.', [
            'product_id' => $product->id,
        ]);

        return back()->with('status', 'souvenir-product-deleted');
    }

    public function duplicate(Request $request, SouvenirProduct $product): RedirectResponse
    {
        $duplicate = $product->replicate(['sku', 'slug']);
        $duplicate->sku = $product->sku.'-COPY-'.now()->format('His');
        $duplicate->slug = SouvenirProduct::generateUniqueSlug($product->name.' copy');
        $duplicate->status = 'draft';
        $duplicate->is_active = false;
        $duplicate->created_by = $request->user()->id;
        $duplicate->updated_by = $request->user()->id;
        $duplicate->save();

        $this->logAudit($request, 'product_duplicated', 'Produk souvenir diduplikasi.', [
            'source_product_id' => $product->id,
            'new_product_id' => $duplicate->id,
        ]);

        return back()->with('status', 'souvenir-product-duplicated');
    }

    private function logAudit(Request $request, string $action, string $description, array $data = []): void
    {
        SouvenirAuditLog::create([
            'action' => $action,
            'description' => $description,
            'data' => $data,
            'created_by' => $request->user()->id,
        ]);
    }

    private function attachImages(SouvenirProduct $product, array $images, MediaCompressionService $mediaCompression): void
    {
        if (empty($images)) {
            return;
        }

        $paths = collect($images)
            ->map(fn ($file) => $mediaCompression->store($file, 'souvenir-products', 'public'))
            ->filter();

        $product->images()->createMany(
            $paths->map(fn (string $path) => ['image_url' => $path])->all()
        );
    }
}
