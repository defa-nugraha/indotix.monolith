<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SouvenirOrder;
use App\Models\SouvenirOrderItem;
use App\Models\SouvenirProduct;
use App\Models\SouvenirVariant;
use App\Models\UserNotification;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SouvenirBookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 15;

    public function index(Request $request): JsonResponse
    {
        $orders = SouvenirOrder::query()
            ->where('user_id', $request->user()->id)
            ->with(['items'])
            ->latest()
            ->get()
            ->map(fn (SouvenirOrder $order) => $this->orderPayload($order));

        return response()->json([
            'orders' => $orders,
        ]);
    }

    public function quote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:souvenir_products,id'],
            'items.*.variant_id' => ['nullable', 'integer', 'exists:souvenir_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        $items = collect($data['items'])->values();
        $productIds = $items->pluck('product_id')->unique()->all();
        $variantIds = $items->pluck('variant_id')->filter()->unique()->all();

        $products = SouvenirProduct::query()->whereIn('id', $productIds)->get()->keyBy('id');
        $variants = SouvenirVariant::query()->whereIn('id', $variantIds)->get()->keyBy('id');

        $total = 0;
        $lines = [];
        foreach ($items as $item) {
            $product = $products->get($item['product_id']);
            if (! $product || $product->status !== 'active' || ! $product->is_active) {
                return response()->json(['message' => 'Produk tidak tersedia.'], 422);
            }

            $variant = $item['variant_id'] ? $variants->get($item['variant_id']) : null;
            if ($variant && (int) $variant->product_id !== (int) $product->id) {
                return response()->json(['message' => 'Varian tidak sesuai produk.'], 422);
            }

            $available = $variant ? (int) $variant->stock : (int) $product->stock;
            if ($available < (int) $item['quantity']) {
                return response()->json(['message' => 'Stok produk tidak mencukupi.'], 422);
            }

            $unitPrice = (int) $product->price + (int) ($variant?->additional_price ?? 0);
            $subtotal = $unitPrice * (int) $item['quantity'];
            $total += $subtotal;

            $lines[] = [
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'name' => $product->name,
                'sku' => $variant?->sku ?? $product->sku,
                'quantity' => (int) $item['quantity'],
                'unit_price' => $unitPrice,
                'subtotal' => $subtotal,
            ];
        }

        return response()->json([
            'items' => $lines,
            'summary' => [
                'subtotal' => $total,
                'total' => $total,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:souvenir_products,id'],
            'items.*.variant_id' => ['nullable', 'integer', 'exists:souvenir_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'email', 'max:255'],
            'guest_phone' => ['required', 'string', 'max:30'],
            'shipping_address' => ['required', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'shipping_method' => ['nullable', 'string', 'max:50'],
        ]);

        $items = collect($data['items'])->values();
        $productIds = $items->pluck('product_id')->unique()->all();
        $variantIds = $items->pluck('variant_id')->filter()->unique()->all();

        try {
            $order = DB::transaction(function () use ($request, $data, $items, $productIds, $variantIds) {
                $products = SouvenirProduct::query()->lockForUpdate()->whereIn('id', $productIds)->get()->keyBy('id');
                $variants = SouvenirVariant::query()->lockForUpdate()->whereIn('id', $variantIds)->get()->keyBy('id');

                $total = 0;
                foreach ($items as $item) {
                    $product = $products->get($item['product_id']);
                    if (! $product || $product->status !== 'active' || ! $product->is_active) {
                        throw new RuntimeException('Produk tidak tersedia.');
                    }

                    $variant = $item['variant_id'] ? $variants->get($item['variant_id']) : null;
                    if ($variant && (int) $variant->product_id !== (int) $product->id) {
                        throw new RuntimeException('Varian tidak sesuai produk.');
                    }

                    $available = $variant ? (int) $variant->stock : (int) $product->stock;
                    if ($available < (int) $item['quantity']) {
                        throw new RuntimeException('Stok produk tidak mencukupi.');
                    }

                    $unitPrice = (int) $product->price + (int) ($variant?->additional_price ?? 0);
                    $total += $unitPrice * (int) $item['quantity'];
                }

                $order = SouvenirOrder::create([
                    'user_id' => $request->user()->id,
                    'guest_name' => $data['guest_name'],
                    'guest_email' => $data['guest_email'],
                    'guest_phone' => $data['guest_phone'],
                    'status' => 'pending_payment',
                    'payment_status' => 'pending',
                    'total_price' => $total,
                    'shipping_method' => $data['shipping_method'] ?? 'delivery',
                    'shipping_address' => $data['shipping_address'],
                    'notes' => $data['notes'] ?? null,
                    'shipping_cost' => 0,
                    'shipping_status' => 'pending',
                    'payment_deadline' => now()->addMinutes(self::PAYMENT_TTL_MINUTES),
                ]);

                foreach ($items as $item) {
                    $product = $products->get($item['product_id']);
                    $variant = $item['variant_id'] ? $variants->get($item['variant_id']) : null;
                    $unitPrice = (int) $product->price + (int) ($variant?->additional_price ?? 0);
                    SouvenirOrderItem::create([
                        'souvenir_order_id' => $order->id,
                        'product_id' => $product->id,
                        'variant_id' => $variant?->id,
                        'product_name' => $product->name,
                        'sku' => $variant?->sku ?? $product->sku,
                        'unit_price' => $unitPrice,
                        'quantity' => (int) $item['quantity'],
                        'subtotal' => $unitPrice * (int) $item['quantity'],
                    ]);

                    if ($variant) {
                        $variant->decrement('stock', (int) $item['quantity']);
                    } else {
                        $product->decrement('stock', (int) $item['quantity']);
                    }
                }

                return $order;
            });
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Pemesanan souvenir berhasil',
            'message' => 'Pesanan souvenir dibuat. Silakan lanjutkan pembayaran.',
            'type' => 'souvenir_booking_created',
            'data' => [
                'booking_id' => $this->encryptId($order->id),
                'category' => 'souvenir',
            ],
        ]);

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Menunggu pembayaran souvenir',
            'message' => 'Ada pembayaran souvenir yang perlu diselesaikan.',
            'type' => 'souvenir_payment_pending',
            'data' => [
                'booking_id' => $this->encryptId($order->id),
                'category' => 'souvenir',
            ],
        ]);

        $order->load('items');

        return response()->json([
            'order' => $this->orderPayload($order),
        ], 201);
    }

    public function show(Request $request, string $order): JsonResponse
    {
        $order = $this->resolveOrder($order);

        if ((int) $order->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        $order->load('items');

        return response()->json([
            'order' => $this->orderPayload($order),
        ]);
    }

    public function pay(Request $request, string $order, MidtransService $midtransService): JsonResponse
    {
        $order = $this->resolveOrder($order);

        if ((int) $order->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        if ($order->status === 'pending_payment' && $order->payment_deadline && $order->payment_deadline->isPast()) {
            $order->update(['status' => 'expired', 'payment_status' => 'expired']);
            return response()->json(['message' => 'Pesanan sudah kedaluwarsa.'], 422);
        }

        if ($order->status === 'paid') {
            $order->load('items');

            return response()->json([
                'order' => $this->orderPayload($order),
            ]);
        }

        if ($order->snap_token) {
            return response()->json([
                'payment' => [
                    'order_id' => $order->midtrans_order_id,
                    'snap_token' => $order->snap_token,
                    'redirect_url' => null,
                ],
            ]);
        }

        $orderId = $order->midtrans_order_id ?: strtoupper('SOUV-'.$order->id.'-'.now()->format('ymdHis'));
        $order->load(['items', 'user']);

        $payload = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $order->total_price,
            ],
            'customer_details' => [
                'first_name' => $order->guest_name ?? $order->user?->name ?? 'Customer',
                'email' => $order->guest_email ?? $order->user?->email,
            ],
            'item_details' => $order->items->map(fn ($item) => [
                'id' => $item->sku ?? (string) $item->id,
                'name' => $item->product_name,
                'price' => $item->unit_price,
                'quantity' => $item->quantity,
            ])->all(),
        ];

        try {
            $snap = $midtransService->snap($payload);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Gagal menghubungi server pembayaran. Silakan coba lagi.'], 500);
        }

        $order->update([
            'midtrans_order_id' => $orderId,
            'snap_token' => $snap['token'] ?? null,
        ]);

        return response()->json([
            'payment' => [
                'order_id' => $orderId,
                'snap_token' => $snap['token'] ?? null,
                'redirect_url' => $snap['redirect_url'] ?? null,
                'payload' => $snap,
            ],
        ]);
    }

    private function orderPayload(SouvenirOrder $order): array
    {
        return [
            'id' => $order->id,
            'encrypted_id' => $this->encryptId($order->id),
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'payment_deadline' => $order->payment_deadline?->toIso8601String(),
            'total_price' => $order->total_price,
            'shipping_address' => $order->shipping_address,
            'shipping_status' => $order->shipping_status,
            'tracking_number' => $order->tracking_number,
            'items' => $order->items->map(fn ($item) => [
                'name' => $item->product_name,
                'sku' => $item->sku,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'subtotal' => $item->subtotal,
            ]),
        ];
    }

    private function resolveOrder(string $order): SouvenirOrder
    {
        if (ctype_digit($order)) {
            $id = (int) $order;
        } else {
            try {
                $id = (int) Crypt::decryptString($order);
            } catch (\Throwable $exception) {
                abort(404);
            }
        }

        return SouvenirOrder::query()->findOrFail($id);
    }

    private function encryptId(int $id): string
    {
        return Crypt::encryptString((string) $id);
    }
}
