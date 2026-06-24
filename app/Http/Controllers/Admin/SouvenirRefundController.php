<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SouvenirAuditLog;
use App\Models\SouvenirOrder;
use App\Models\SouvenirRefund;
use App\Support\AdminDataScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SouvenirRefundController extends Controller
{
    public function index(Request $request): Response
    {
        $refunds = SouvenirRefund::query()
            ->with(['order'])
            ->whereHas('order.items.product', fn ($builder) => AdminDataScope::applyCreatedBy($builder, $request))
            ->latest()
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString();

        $orders = SouvenirOrder::query()
            ->whereHas('items.product', fn ($builder) => AdminDataScope::applyCreatedBy($builder, $request))
            ->latest()
            ->get(['id']);

        return Inertia::render('admin/souvenir/refunds/index', [
            'refunds' => $refunds,
            'orders' => $orders,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'souvenir_order_id' => ['required', 'exists:souvenir_orders,id'],
            'type' => ['required', 'in:partial,full'],
            'amount' => ['required', 'integer', 'min:0'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);
        $order = SouvenirOrder::query()
            ->whereHas('items.product', fn ($builder) => AdminDataScope::applyCreatedBy($builder, $request))
            ->findOrFail($data['souvenir_order_id']);

        $refund = SouvenirRefund::create([
            'souvenir_order_id' => $order->id,
            'type' => $data['type'],
            'amount' => $data['amount'],
            'reason' => $data['reason'] ?? null,
            'status' => 'pending',
            'created_by' => $request->user()->id,
        ]);

        $this->logAudit($request, 'refund_created', 'Refund souvenir dibuat.', [
            'refund_id' => $refund->id,
            'order_id' => $data['souvenir_order_id'],
        ]);

        return back()->with('status', 'souvenir-refund-created');
    }

    public function update(Request $request, SouvenirRefund $refund): RedirectResponse
    {
        $refund->loadMissing('order.items.product');
        abort_unless(
            AdminDataScope::canViewAll($request->user()) ||
            $refund->order?->items->contains(fn ($item) => (int) $item->product?->created_by === (int) $request->user()?->id),
            404
        );

        $data = $request->validate([
            'status' => ['required', 'in:pending,approved,rejected'],
        ]);

        $refund->update([
            'status' => $data['status'],
            'resolved_at' => $data['status'] !== 'pending' ? now() : null,
        ]);

        if ($data['status'] === 'approved' && $refund->type === 'full') {
            $refund->order?->update(['status' => 'cancelled']);
        }

        $this->logAudit($request, 'refund_updated', 'Refund souvenir diperbarui.', [
            'refund_id' => $refund->id,
            'status' => $data['status'],
        ]);

        return back()->with('status', 'souvenir-refund-updated');
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
