<?php

namespace App\Http\Controllers;

use App\Models\SouvenirOrder;
use App\Models\SouvenirOrderItem;
use App\Models\SouvenirProduct;
use App\Models\SouvenirVariant;
use App\Models\UserNotification;
use App\Services\MidtransService;
use App\Services\ProductReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class SouvenirBookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 15;

    public function review(Request $request): Response|RedirectResponse
    {
        $cart = $request->session()->get('souvenir_cart', []);

        if (! $request->user()) {
            return redirect()->route('login');
        }

        if ($request->user()->role !== 'user') {
            return redirect()->route('home');
        }

        if (empty($cart)) {
            $pendingId = $request->session()->get('souvenir_order_pending');
            if (! $pendingId) {
                return redirect()->route('souvenir.cart')->withErrors(['cart' => 'Keranjang masih kosong.']);
            }

            $order = SouvenirOrder::query()->with('items')->find($pendingId);
            if (! $order) {
                return redirect()->route('souvenir.cart')->withErrors(['cart' => 'Keranjang masih kosong.']);
            }

            $snapshot = $this->orderSnapshot($order);
            return Inertia::render('public/souvenir/booking/review', [
                'items' => $snapshot['items'],
                'summary' => $snapshot['summary'],
                'snapToken' => $order->snap_token,
                'snapClientKey' => (string) config('services.midtrans.client_key', ''),
                'snapScriptUrl' => config('services.midtrans.is_production')
                    ? 'https://app.midtrans.com/snap/snap.js'
                    : 'https://app.sandbox.midtrans.com/snap/snap.js',
            ]);
        }

        $cartData = app(SouvenirCartController::class)->resolveCart($request);

        return Inertia::render('public/souvenir/booking/review', [
            'items' => $cartData['items'],
            'summary' => $cartData['summary'],
            'snapClientKey' => (string) config('services.midtrans.client_key', ''),
            'snapScriptUrl' => config('services.midtrans.is_production')
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js',
        ]);
    }

    public function confirm(Request $request, MidtransService $midtransService): Response|\Illuminate\Http\JsonResponse|RedirectResponse
    {
        $cart = $request->session()->get('souvenir_cart', []);
        if (empty($cart)) {
            return redirect()->route('souvenir.cart')->withErrors(['cart' => 'Keranjang masih kosong.']);
        }

        $data = $request->validate([
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'email', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $profilePhone = $request->user()?->phone;
        if (! $profilePhone) {
            return back()->withErrors(['guest_phone' => 'Nomor HP belum diisi di profil.']);
        }

        $shippingAddress = $request->user()?->defaultAddressString();
        if (! $shippingAddress) {
            return back()->withErrors(['shipping_address' => 'Alamat utama belum diisi di profil.']);
        }

        $data['guest_phone'] = $profilePhone;
        $data['shipping_address'] = $shippingAddress;

        $existingOrderId = $request->session()->get('souvenir_order_pending');
        if ($existingOrderId) {
            $existing = SouvenirOrder::query()->find($existingOrderId);
            if ($existing) {
                $snap = $this->createSnapPayment($existing, $midtransService);
                if ($request->expectsJson()) {
                    return response()->json([
                        'order_id' => $this->encryptId($existing->id),
                        'snap_token' => $snap['token'] ?? null,
                        'redirect_url' => $snap['redirect_url'] ?? null,
                    ]);
                }
                $snapshot = $this->orderSnapshot($existing);
                return Inertia::render('public/souvenir/booking/review', [
                    'items' => $snapshot['items'],
                    'summary' => $snapshot['summary'],
                    'snapToken' => $snap['token'] ?? null,
                    'snapClientKey' => (string) config('services.midtrans.client_key', ''),
                    'snapScriptUrl' => config('services.midtrans.is_production')
                        ? 'https://app.midtrans.com/snap/snap.js'
                        : 'https://app.sandbox.midtrans.com/snap/snap.js',
                ]);
            }
        }

        $order = DB::transaction(function () use ($cart, $data, $request) {
            $items = collect($cart)->values();
            $productIds = $items->pluck('product_id')->unique()->all();
            $variantIds = $items->pluck('variant_id')->filter()->unique()->all();

            $products = SouvenirProduct::query()->lockForUpdate()->whereIn('id', $productIds)->get()->keyBy('id');
            $variants = SouvenirVariant::query()->lockForUpdate()->whereIn('id', $variantIds)->get()->keyBy('id');

            $total = 0;
            foreach ($items as $item) {
                $product = $products->get($item['product_id']);
                if (! $product || $product->status !== 'active' || ! $product->is_active) {
                    throw new RuntimeException('Produk tidak tersedia.');
                }

                $variant = $item['variant_id'] ? $variants->get($item['variant_id']) : null;
                $available = $variant ? $variant->stock : $product->stock;
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
                'shipping_method' => 'delivery',
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

        $request->session()->forget('souvenir_cart');
        $request->session()->put('souvenir_order_pending', $order->id);

        if ($request->expectsJson()) {
            try {
                $snap = $this->createSnapPayment($order, $midtransService);
            } catch (\Throwable $exception) {
                return response()->json([
                    'message' => 'Gagal menghubungi server pembayaran. Silakan coba lagi.',
                ], 422);
            }

            return response()->json([
                'order_id' => $this->encryptId($order->id),
                'snap_token' => $snap['token'] ?? null,
                'redirect_url' => $snap['redirect_url'] ?? null,
            ]);
        }

        $snapshot = $this->orderSnapshot($order);
        $snap = $this->createSnapPayment($order, $midtransService);

        return Inertia::render('public/souvenir/booking/review', [
            'items' => $snapshot['items'],
            'summary' => $snapshot['summary'],
            'snapToken' => $snap['token'] ?? null,
            'snapClientKey' => (string) config('services.midtrans.client_key', ''),
            'snapScriptUrl' => config('services.midtrans.is_production')
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js',
        ]);
    }

    public function show(Request $request, string $order): Response
    {
        $orderId = $this->decryptId($order);

        $order = SouvenirOrder::query()
            ->with(['items'])
            ->findOrFail($orderId);

        $userId = $request->user()?->id;

        return Inertia::render('public/souvenir/booking/show', [
            'order' => [
                'id' => $order->id,
                'encrypted_id' => Crypt::encryptString((string) $order->id),
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'payment_deadline' => $order->payment_deadline?->toIso8601String(),
                'total_price' => $order->total_price,
                'shipping_address' => $order->shipping_address,
                'items' => $order->items->map(fn ($item) => [
                    'product_id' => $item->product_id,
                    'product_encrypted_id' => $item->product_id
                        ? Crypt::encryptString((string) $item->product_id)
                        : null,
                    'name' => $item->product_id ? $item->product_name : 'Produk tidak tersedia',
                    'sku' => $item->sku,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'subtotal' => $item->subtotal,
                    'review' => [
                        'can_review' => $item->product_id && $userId
                            ? ProductReviewService::hasUsedBooking($userId, 'souvenir', (int) $item->product_id)
                            : false,
                        'url' => $item->product_id
                            ? '/souvenir/'.Crypt::encryptString((string) $item->product_id)
                            : null,
                    ],
                ]),
            ],
        ]);
    }

    public function payment(string $order, MidtransService $midtransService): Response
    {
        $orderId = $this->decryptId($order);
        $order = SouvenirOrder::query()
            ->with(['items'])
            ->findOrFail($orderId);

        if ($order->status === 'paid') {
            return Inertia::render('public/souvenir/booking/show', [
                'order' => [
                    'id' => $order->id,
                    'encrypted_id' => Crypt::encryptString((string) $order->id),
                    'status' => $order->status,
                    'payment_status' => $order->payment_status,
                    'payment_deadline' => $order->payment_deadline?->toIso8601String(),
                    'total_price' => $order->total_price,
                    'shipping_address' => $order->shipping_address,
                    'items' => $order->items->map(fn ($item) => [
                        'name' => $item->product_id ? $item->product_name : 'Produk tidak tersedia',
                        'sku' => $item->sku,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'subtotal' => $item->subtotal,
                    ]),
                ],
            ]);
        }

        $snap = $this->createSnapPayment($order, $midtransService);
        $snapshot = $this->orderSnapshot($order);

        return Inertia::render('public/souvenir/booking/review', [
            'items' => $snapshot['items'],
            'summary' => $snapshot['summary'],
            'snapToken' => $snap['token'] ?? null,
            'snapClientKey' => (string) config('services.midtrans.client_key', ''),
            'snapScriptUrl' => config('services.midtrans.is_production')
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js',
        ]);
    }

    private function createSnapPayment(SouvenirOrder $order, MidtransService $midtransService): array
    {
        if ($order->snap_token) {
            return [
                'token' => $order->snap_token,
                'redirect_url' => null,
            ];
        }

        $orderId = $order->midtrans_order_id ?: strtoupper('SOUV-'.$order->id.'-'.now()->format('ymdHis'));

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

        $snap = $midtransService->snap($payload);

        $order->update([
            'midtrans_order_id' => $orderId,
            'snap_token' => $snap['token'] ?? null,
        ]);

        return $snap;
    }

    private function encryptId(int $id): string
    {
        return Crypt::encryptString((string) $id);
    }

    private function orderSnapshot(SouvenirOrder $order): array
    {
        $items = $order->items->map(fn ($item) => [
            'key' => $item->id,
            'name' => $item->product_id ? $item->product_name : 'Produk tidak tersedia',
            'variant_name' => null,
            'quantity' => $item->quantity,
            'price' => $item->unit_price,
            'subtotal' => $item->subtotal,
        ]);

        return [
            'items' => $items,
            'summary' => [
                'subtotal' => $order->total_price,
                'total' => $order->total_price,
            ],
        ];
    }

    private function decryptId(string $payload): int
    {
        try {
            return (int) Crypt::decryptString($payload);
        } catch (\Throwable $exception) {
            abort(404);
        }
    }
}
