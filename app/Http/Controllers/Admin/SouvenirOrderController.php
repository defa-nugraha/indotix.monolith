<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SouvenirAuditLog;
use App\Models\SouvenirOrder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SouvenirOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $query = SouvenirOrder::query()->with(['user:id,name,email', 'items']);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        $orders = $query->latest()->paginate(10)->withQueryString();

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
        $query = SouvenirOrder::query()->with(['user:id,name,email', 'items']);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        $orders = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('admin/souvenir/orders/index', [
            'orders' => $orders,
            'mode' => 'fulfillment',
            'filters' => [
                'status' => $request->string('status')->toString(),
            ],
        ]);
    }

    public function show(SouvenirOrder $order): Response
    {
        $order->load(['user:id,name,email', 'items.product', 'items.variant', 'refunds']);

        return Inertia::render('admin/souvenir/orders/show', [
            'order' => $order,
        ]);
    }

    public function updateStatus(Request $request, SouvenirOrder $order): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:pending_payment,paid,processing,shipped,ready_pickup,completed,cancelled'],
        ]);

        $order->update([
            'status' => $data['status'],
            'completed_at' => $data['status'] === 'completed' ? now() : $order->completed_at,
        ]);

        $this->logAudit($request, 'order_status_updated', 'Status order souvenir diperbarui.', [
            'order_id' => $order->id,
            'status' => $data['status'],
        ]);

        return back()->with('status', 'souvenir-order-updated');
    }

    public function updateShipping(Request $request, SouvenirOrder $order): RedirectResponse
    {
        $data = $request->validate([
            'shipping_status' => ['nullable', 'string', 'max:50'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
            'estimated_arrival' => ['nullable', 'string', 'max:100'],
        ]);

        $order->update([
            'shipping_status' => $data['shipping_status'] ?? $order->shipping_status,
            'tracking_number' => $data['tracking_number'] ?? $order->tracking_number,
            'shipped_at' => $data['shipping_status'] === 'shipped' ? now() : $order->shipped_at,
        ]);

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
}
