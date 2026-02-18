<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SouvenirProduct;
use App\Models\SouvenirVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;

class SouvenirCartController extends Controller
{
    private const MAX_QTY = 20;
    private const CACHE_TTL_DAYS = 30;

    public function index(Request $request): JsonResponse
    {
        $cart = $this->resolveCart($request);

        return response()->json($cart);
    }

    public function add(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:souvenir_products,id'],
            'variant_id' => ['nullable', 'integer', 'exists:souvenir_variants,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:'.self::MAX_QTY],
        ]);

        $product = SouvenirProduct::query()
            ->where('id', $data['product_id'])
            ->where('status', 'active')
            ->where('is_active', true)
            ->first();

        if (! $product) {
            return response()->json(['message' => 'Produk tidak tersedia.'], 422);
        }

        $variant = null;
        if (! empty($data['variant_id'])) {
            $variant = SouvenirVariant::query()
                ->where('id', $data['variant_id'])
                ->where('product_id', $product->id)
                ->where('is_active', true)
                ->first();
            if (! $variant) {
                return response()->json(['message' => 'Varian tidak tersedia.'], 422);
            }
        }

        $availableStock = $variant ? $variant->stock : $product->stock;
        if ($availableStock < (int) $data['quantity']) {
            return response()->json(['message' => 'Stok tidak mencukupi.'], 422);
        }

        $cart = $this->getCart($request);
        $key = $this->itemKey($product->id, $variant?->id);
        $currentQty = $cart[$key]['quantity'] ?? 0;
        $newQty = min(self::MAX_QTY, $currentQty + (int) $data['quantity']);
        if ($newQty > $availableStock) {
            return response()->json(['message' => 'Stok tidak mencukupi.'], 422);
        }

        $cart[$key] = [
            'product_id' => $product->id,
            'variant_id' => $variant?->id,
            'quantity' => $newQty,
        ];

        $this->putCart($request, $cart);

        return response()->json($this->resolveCart($request));
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:souvenir_products,id'],
            'variant_id' => ['nullable', 'integer'],
            'quantity' => ['required', 'integer', 'min:0', 'max:'.self::MAX_QTY],
        ]);

        $cart = $this->getCart($request);
        $key = $this->itemKey((int) $data['product_id'], $data['variant_id'] ? (int) $data['variant_id'] : null);

        if (! isset($cart[$key])) {
            return response()->json($this->resolveCart($request));
        }

        if ((int) $data['quantity'] === 0) {
            unset($cart[$key]);
            $this->putCart($request, $cart);
            return response()->json($this->resolveCart($request));
        }

        $product = SouvenirProduct::query()->find($data['product_id']);
        if (! $product || $product->status !== 'active' || ! $product->is_active) {
            return response()->json(['message' => 'Produk tidak tersedia.'], 422);
        }

        $variant = null;
        if (! empty($data['variant_id'])) {
            $variant = SouvenirVariant::query()
                ->where('id', $data['variant_id'])
                ->where('product_id', $product->id)
                ->first();
            if (! $variant) {
                return response()->json(['message' => 'Varian tidak tersedia.'], 422);
            }
        }

        $availableStock = $variant ? $variant->stock : $product->stock;
        if ($availableStock < (int) $data['quantity']) {
            return response()->json(['message' => 'Stok tidak mencukupi.'], 422);
        }

        $cart[$key]['quantity'] = (int) $data['quantity'];
        $this->putCart($request, $cart);

        return response()->json($this->resolveCart($request));
    }

    public function remove(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer'],
            'variant_id' => ['nullable', 'integer'],
        ]);

        $cart = $this->getCart($request);
        $key = $this->itemKey((int) $data['product_id'], $data['variant_id'] ? (int) $data['variant_id'] : null);
        unset($cart[$key]);
        $this->putCart($request, $cart);

        return response()->json($this->resolveCart($request));
    }

    public function clear(Request $request): JsonResponse
    {
        Cache::forget($this->cacheKey($request));

        return response()->json([
            'items' => [],
            'summary' => [
                'subtotal' => 0,
                'total' => 0,
            ],
        ]);
    }

    private function resolveCart(Request $request): array
    {
        $cart = $this->getCart($request);
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

    private function getCart(Request $request): array
    {
        return Cache::get($this->cacheKey($request), []);
    }

    private function putCart(Request $request, array $cart): void
    {
        Cache::put($this->cacheKey($request), $cart, now()->addDays(self::CACHE_TTL_DAYS));
    }

    private function cacheKey(Request $request): string
    {
        return 'souvenir_cart_user_'.$request->user()->id;
    }

    private function itemKey(int $productId, ?int $variantId): string
    {
        return $variantId ? $productId.'-'.$variantId : (string) $productId;
    }
}
