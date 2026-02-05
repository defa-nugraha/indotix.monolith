<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SouvenirAuditLog;
use App\Models\SouvenirProduct;
use App\Models\SouvenirStockMovement;
use App\Models\SouvenirVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SouvenirInventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $products = SouvenirProduct::query()
            ->with('variants')
            ->orderBy('name')
            ->get();

        $logs = SouvenirStockMovement::query()
            ->with(['product:id,name', 'variant:id,name', 'product.category'])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/souvenir/inventory/index', [
            'products' => $products,
            'logs' => $logs,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:souvenir_products,id'],
            'variant_id' => ['nullable', 'exists:souvenir_variants,id'],
            'type' => ['required', 'in:in,out,adjust'],
            'quantity' => ['required', 'integer'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $variant = null;
        if (! empty($data['variant_id'])) {
            $variant = SouvenirVariant::query()->where('id', $data['variant_id'])
                ->where('product_id', $data['product_id'])
                ->firstOrFail();
        }

        $product = SouvenirProduct::query()->findOrFail($data['product_id']);
        $current = $variant ? $variant->stock : $product->stock;

        $movementQuantity = (int) $data['quantity'];
        $newStock = $current;

        if ($data['type'] === 'in') {
            $newStock = $current + $movementQuantity;
        } elseif ($data['type'] === 'out') {
            $newStock = max(0, $current - $movementQuantity);
        } else {
            $newStock = max(0, $movementQuantity);
            $movementQuantity = $newStock - $current;
        }

        if ($variant) {
            $variant->update(['stock' => $newStock]);
            $totalVariantStock = SouvenirVariant::query()
                ->where('product_id', $product->id)
                ->sum('stock');
            if ($totalVariantStock <= 0 && $product->status === 'active') {
                $product->update(['status' => 'inactive', 'is_active' => false]);
            }
        } else {
            $product->update(['stock' => $newStock]);
        }

        $movement = SouvenirStockMovement::create([
            'product_id' => $product->id,
            'variant_id' => $variant?->id,
            'type' => $data['type'],
            'quantity' => $movementQuantity,
            'note' => $data['note'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        if (! $variant && $newStock <= 0 && $product->status === 'active') {
            $product->update(['status' => 'inactive', 'is_active' => false]);
        }

        $this->logAudit($request, 'stock_updated', 'Penyesuaian stok souvenir.', [
            'movement_id' => $movement->id,
            'product_id' => $product->id,
            'variant_id' => $variant?->id,
            'type' => $data['type'],
            'quantity' => $movementQuantity,
        ]);

        return back()->with('status', 'souvenir-stock-updated');
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
