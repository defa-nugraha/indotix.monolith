<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SouvenirAuditLog;
use App\Models\SouvenirProduct;
use App\Models\SouvenirVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SouvenirVariantController extends Controller
{
    public function index(Request $request): Response
    {
        $query = SouvenirVariant::query()->with('product:id,name');

        if ($productId = $request->integer('product_id')) {
            $query->where('product_id', $productId);
        }

        if ($search = $request->string('search')->toString()) {
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%");
        }

        $variants = $query->orderByDesc('id')->paginate(\App\Support\PaginationOptions::perPage())->withQueryString();

        $products = SouvenirProduct::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/souvenir/variants/index', [
            'variants' => $variants,
            'products' => $products,
            'filters' => [
                'product_id' => $request->integer('product_id'),
                'search' => $request->string('search')->toString(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:souvenir_products,id'],
            'variant_type' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:100'],
            'sku' => ['nullable', 'string', 'max:50'],
            'additional_price' => ['nullable', 'integer'],
            'stock' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $variant = SouvenirVariant::create([
            'product_id' => $data['product_id'],
            'variant_type' => $data['variant_type'],
            'name' => $data['name'],
            'sku' => $data['sku'] ?? null,
            'additional_price' => $data['additional_price'] ?? 0,
            'stock' => $data['stock'] ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        $this->logAudit($request, 'variant_created', 'Variasi souvenir dibuat.', [
            'variant_id' => $variant->id,
            'product_id' => $variant->product_id,
        ]);

        return back()->with('status', 'souvenir-variant-created');
    }

    public function update(Request $request, SouvenirVariant $variant): RedirectResponse
    {
        $data = $request->validate([
            'variant_type' => ['sometimes', 'string', 'max:50'],
            'name' => ['sometimes', 'string', 'max:100'],
            'sku' => ['sometimes', 'nullable', 'string', 'max:50'],
            'additional_price' => ['sometimes', 'nullable', 'integer'],
            'stock' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $payload = [
            'variant_type' => $data['variant_type'] ?? $variant->variant_type,
            'name' => $data['name'] ?? $variant->name,
        ];

        if (array_key_exists('sku', $data)) {
            $payload['sku'] = $data['sku'];
        }

        if (array_key_exists('additional_price', $data)) {
            $payload['additional_price'] = $data['additional_price'] ?? 0;
        }

        if (array_key_exists('stock', $data)) {
            $payload['stock'] = $data['stock'] ?? 0;
        }

        if (array_key_exists('is_active', $data)) {
            $payload['is_active'] = (bool) $data['is_active'];
        }

        $variant->update($payload);

        $this->logAudit($request, 'variant_updated', 'Variasi souvenir diperbarui.', [
            'variant_id' => $variant->id,
        ]);

        return back()->with('status', 'souvenir-variant-updated');
    }

    public function destroy(Request $request, SouvenirVariant $variant): RedirectResponse
    {
        $variant->delete();

        $this->logAudit($request, 'variant_deleted', 'Variasi souvenir dihapus.', [
            'variant_id' => $variant->id,
        ]);

        return back()->with('status', 'souvenir-variant-deleted');
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
}
