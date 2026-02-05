<?php

namespace App\Http\Controllers;

use App\Models\SouvenirProduct;
use App\Models\SouvenirVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SouvenirCartController extends Controller
{
    public function index(Request $request): Response
    {
        $cart = $this->resolveCart($request);

        return Inertia::render('public/souvenir/cart', [
            'items' => $cart['items'],
            'summary' => $cart['summary'],
        ]);
    }

    public function add(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:souvenir_products,id'],
            'variant_id' => ['nullable', 'integer', 'exists:souvenir_variants,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $product = SouvenirProduct::query()
            ->where('id', $data['product_id'])
            ->where('status', 'active')
            ->where('is_active', true)
            ->firstOrFail();

        $variant = null;
        if (! empty($data['variant_id'])) {
            $variant = SouvenirVariant::query()
                ->where('id', $data['variant_id'])
                ->where('product_id', $product->id)
                ->where('is_active', true)
                ->firstOrFail();
        }

        $availableStock = $variant ? $variant->stock : $product->stock;
        if ($availableStock < (int) $data['quantity']) {
            return back()->withErrors(['quantity' => 'Stok tidak mencukupi.']);
        }

        $cart = $request->session()->get('souvenir_cart', []);
        $key = $this->itemKey($product->id, $variant?->id);
        $currentQty = $cart[$key]['quantity'] ?? 0;
        $newQty = min(20, $currentQty + (int) $data['quantity']);
        if ($newQty > $availableStock) {
            return back()->withErrors(['quantity' => 'Stok tidak mencukupi.']);
        }

        $cart[$key] = [
            'product_id' => $product->id,
            'variant_id' => $variant?->id,
            'quantity' => $newQty,
        ];

        $request->session()->put('souvenir_cart', $cart);

        return back()->with('status', 'souvenir-cart-added');
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:souvenir_products,id'],
            'variant_id' => ['nullable', 'integer'],
            'quantity' => ['required', 'integer', 'min:0', 'max:20'],
        ]);

        $cart = $request->session()->get('souvenir_cart', []);
        $key = $this->itemKey((int) $data['product_id'], $data['variant_id'] ? (int) $data['variant_id'] : null);

        if (! isset($cart[$key])) {
            return back();
        }

        if ((int) $data['quantity'] === 0) {
            unset($cart[$key]);
            $request->session()->put('souvenir_cart', $cart);
            return back()->with('status', 'souvenir-cart-removed');
        }

        $product = SouvenirProduct::query()->findOrFail($data['product_id']);
        $variant = null;
        if (! empty($data['variant_id'])) {
            $variant = SouvenirVariant::query()->where('id', $data['variant_id'])
                ->where('product_id', $product->id)
                ->first();
        }
        $availableStock = $variant ? $variant->stock : $product->stock;
        if ($availableStock < (int) $data['quantity']) {
            return back()->withErrors(['quantity' => 'Stok tidak mencukupi.']);
        }

        $cart[$key]['quantity'] = (int) $data['quantity'];
        $request->session()->put('souvenir_cart', $cart);

        return back()->with('status', 'souvenir-cart-updated');
    }

    public function remove(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer'],
            'variant_id' => ['nullable', 'integer'],
        ]);

        $cart = $request->session()->get('souvenir_cart', []);
        $key = $this->itemKey((int) $data['product_id'], $data['variant_id'] ? (int) $data['variant_id'] : null);
        unset($cart[$key]);
        $request->session()->put('souvenir_cart', $cart);

        return back()->with('status', 'souvenir-cart-removed');
    }

    public function clear(Request $request): RedirectResponse
    {
        $request->session()->forget('souvenir_cart');

        return back()->with('status', 'souvenir-cart-cleared');
    }

    public function resolveCart(Request $request): array
    {
        $cart = $request->session()->get('souvenir_cart', []);
        $items = collect($cart)->values();

        if ($items->isEmpty()) {
            return [
                'items' => [],
                'summary' => [
                    'subtotal' => 0,
                    'total' => 0,
                ],
            ];
        }

        $productIds = $items->pluck('product_id')->unique()->all();
        $variantIds = $items->pluck('variant_id')->filter()->unique()->all();

        $products = SouvenirProduct::query()
            ->with('images')
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        $variants = SouvenirVariant::query()
            ->whereIn('id', $variantIds)
            ->get()
            ->keyBy('id');

        $mapped = $items->map(function (array $item) use ($products, $variants) {
            $product = $products->get($item['product_id']);
            $variant = $item['variant_id'] ? $variants->get($item['variant_id']) : null;

            if (! $product) {
                return null;
            }

            $unitPrice = (int) $product->price + (int) ($variant?->additional_price ?? 0);
            $imageUrl = $product->images->first()?->image_url ? Storage::url($product->images->first()->image_url) : null;

            return [
                'key' => $this->itemKey($product->id, $variant?->id),
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'encrypted_product_id' => Crypt::encryptString((string) $product->id),
                'name' => $product->name,
                'variant_name' => $variant?->name,
                'price' => $unitPrice,
                'quantity' => (int) $item['quantity'],
                'subtotal' => $unitPrice * (int) $item['quantity'],
                'image_url' => $imageUrl,
                'stock' => $variant?->stock ?? $product->stock,
            ];
        })->filter()->values();

        $subtotal = $mapped->sum('subtotal');

        return [
            'items' => $mapped,
            'summary' => [
                'subtotal' => $subtotal,
                'total' => $subtotal,
            ],
        ];
    }

    private function itemKey(int $productId, ?int $variantId): string
    {
        return $variantId ? $productId.'-'.$variantId : (string) $productId;
    }
}
