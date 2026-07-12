<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SouvenirAuditLog;
use App\Models\SouvenirOrder;
use App\Support\AdminDataScope;
use App\Support\PaginationOptions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SouvenirOrderController extends Controller
{
    private const FULFILLMENT_STATUSES = ['paid', 'processing', 'shipped'];

    public function index(Request $request): Response
    {
        $query = $this->ownedOrdersQuery($request)
            ->with(['user:id,name,email', 'items']);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        $orders = $query->latest()->paginate(PaginationOptions::perPage())->withQueryString();

        return Inertia::render('admin/souvenir/orders/index', [
            'orders' => $orders,
            'mode' => 'orders',
            'filters' => [
                'status' => $request->string('status')->toString(),
            ],
        ]);
    }

    public function fulfillment(Request $request): Response
    {
        $baseQuery = $this->ownedOrdersQuery($request)
            ->whereIn('status', self::FULFILLMENT_STATUSES);
        $query = (clone $baseQuery)->with(['user:id,name,email', 'items']);

        $status = $request->string('status')->toString();
        if (in_array($status, self::FULFILLMENT_STATUSES, true)) {
            $query->where('status', $status);
        }

        $shippingStatus = $request->string('shipping_status')->toString();
        if ($shippingStatus === 'pending') {
            $query->where(fn (Builder $builder) => $builder
                ->whereNull('shipping_status')
                ->orWhere('shipping_status', '')
                ->orWhere('shipping_status', 'pending'));
        } elseif (in_array($shippingStatus, ['processing', 'shipped'], true)) {
            $query->where('shipping_status', $shippingStatus);
        }

        $shippingMethod = $request->string('shipping_method')->toString();
        if (in_array($shippingMethod, ['delivery', 'pickup'], true)) {
            $query->where('shipping_method', $shippingMethod);
        }

        $search = trim($request->string('q')->toString());
        if ($search !== '') {
            preg_match('/^(?:INDOTIX-SOUV-)?(\d+)$/i', $search, $orderCode);
            $orderId = isset($orderCode[1]) ? (int) $orderCode[1] : null;

            $query->where(function (Builder $builder) use ($search, $orderId) {
                $builder
                    ->when($orderId, fn (Builder $orderQuery) => $orderQuery->orWhere('souvenir_orders.id', $orderId))
                    ->orWhere('midtrans_order_id', 'like', "%{$search}%")
                    ->orWhere('tracking_number', 'like', "%{$search}%")
                    ->orWhere('guest_name', 'like', "%{$search}%")
                    ->orWhere('guest_email', 'like', "%{$search}%")
                    ->orWhereHas('user', fn (Builder $userQuery) => $userQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%"));
            });
        }

        $orders = $query->latest()->paginate(PaginationOptions::perPage())->withQueryString();

        return Inertia::render('admin/souvenir/orders/index', [
            'orders' => $orders,
            'mode' => 'fulfillment',
            'filters' => [
                'q' => $search,
                'status' => $status,
                'shipping_status' => $shippingStatus,
                'shipping_method' => $shippingMethod,
            ],
            'summary' => [
                'paid' => (clone $baseQuery)->where('status', 'paid')->count(),
                'processing' => (clone $baseQuery)->where('status', 'processing')->count(),
                'shipped' => (clone $baseQuery)->where('status', 'shipped')->count(),
                'missing_tracking' => (clone $baseQuery)
                    ->where('shipping_method', 'delivery')
                    ->whereIn('status', ['processing', 'shipped'])
                    ->where(fn (Builder $builder) => $builder
                        ->whereNull('tracking_number')
                        ->orWhere('tracking_number', ''))
                    ->count(),
            ],
        ]);
    }

    public function show(SouvenirOrder $order): Response
    {
        $order->load(['user:id,name,email', 'items.product', 'items.variant', 'refunds']);
        abort_unless(
            AdminDataScope::canViewAll(request()->user()) ||
            $order->items->contains(fn ($item) => (int) $item->product?->created_by === (int) request()->user()?->id),
            404
        );

        return Inertia::render('admin/souvenir/orders/show', [
            'order' => $order,
        ]);
    }

    public function updateStatus(Request $request, SouvenirOrder $order): RedirectResponse
    {
        $order->loadMissing('items.product');
        abort_unless(
            AdminDataScope::canViewAll($request->user()) ||
            $order->items->contains(fn ($item) => (int) $item->product?->created_by === (int) $request->user()?->id),
            404
        );

        $data = $request->validate([
            'status' => ['required', 'in:pending_payment,paid,processing,shipped,ready_pickup,completed,cancelled'],
        ]);

        if (
            $data['status'] === 'shipped'
            && $order->shipping_method === 'delivery'
            && blank($order->tracking_number)
        ) {
            throw ValidationException::withMessages([
                'tracking_number' => 'Masukkan nomor resi sebelum menandai pesanan sebagai dikirim.',
            ]);
        }

        $updates = [
            'status' => $data['status'],
            'completed_at' => $data['status'] === 'completed' ? now() : $order->completed_at,
        ];

        if ($data['status'] === 'processing' && in_array($order->shipping_status, [null, '', 'pending'], true)) {
            $updates['shipping_status'] = 'processing';
        }

        if ($data['status'] === 'shipped') {
            $updates['shipping_status'] = 'shipped';
            $updates['shipped_at'] = $order->shipped_at ?? now();
        }

        $order->update($updates);

        $this->logAudit($request, 'order_status_updated', 'Status order souvenir diperbarui.', [
            'order_id' => $order->id,
            'status' => $data['status'],
        ]);

        return back()->with('status', 'souvenir-order-updated');
    }

    public function updateShipping(Request $request, SouvenirOrder $order): RedirectResponse
    {
        $order->loadMissing('items.product');
        abort_unless(
            AdminDataScope::canViewAll($request->user()) ||
            $order->items->contains(fn ($item) => (int) $item->product?->created_by === (int) $request->user()?->id),
            404
        );

        $data = $request->validate([
            'shipping_status' => ['required', 'in:pending,processing,shipped'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
        ]);

        if (
            $data['shipping_status'] === 'shipped'
            && $order->shipping_method === 'delivery'
            && blank($data['tracking_number'] ?? $order->tracking_number)
        ) {
            throw ValidationException::withMessages([
                'tracking_number' => 'Nomor resi wajib diisi untuk pengiriman delivery.',
            ]);
        }

        $updates = [
            'shipping_status' => $data['shipping_status'],
            'tracking_number' => $data['tracking_number'] ?? $order->tracking_number,
            'shipped_at' => $data['shipping_status'] === 'shipped' ? now() : $order->shipped_at,
        ];

        if ($data['shipping_status'] === 'processing' && $order->status === 'paid') {
            $updates['status'] = 'processing';
        }

        if ($data['shipping_status'] === 'shipped') {
            $updates['status'] = 'shipped';
        }

        $order->update($updates);

        $this->logAudit($request, 'order_shipping_updated', 'Pengiriman order souvenir diperbarui.', [
            'order_id' => $order->id,
            'shipping_status' => $data['shipping_status'] ?? $order->shipping_status,
        ]);

        return back()->with('status', 'souvenir-order-shipping-updated');
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

    private function ownedOrdersQuery(Request $request): Builder
    {
        return SouvenirOrder::query()
            ->whereHas('items.product', fn (Builder $builder) => AdminDataScope::applyCreatedBy($builder, $request));
    }
}
