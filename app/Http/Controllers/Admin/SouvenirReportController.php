<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SouvenirOrder;
use App\Models\SouvenirOrderItem;
use App\Models\SouvenirRefund;
use App\Support\AdminDataScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SouvenirReportController extends Controller
{
    public function index(Request $request): Response
    {
        $ownedOrders = fn () => SouvenirOrder::query()
            ->whereHas('items.product', fn ($builder) => AdminDataScope::applyCreatedBy($builder, $request));
        $totalOrders = $ownedOrders()->count();
        $totalRevenue = $ownedOrders()->whereIn('status', ['paid', 'processing', 'shipped', 'ready_pickup', 'completed'])
            ->sum('total_price');
        $refundTotal = SouvenirRefund::query()
            ->whereHas('order.items.product', fn ($builder) => AdminDataScope::applyCreatedBy($builder, $request))
            ->where('status', 'approved')
            ->sum('amount');
        $pendingOrders = $ownedOrders()->where('status', 'pending_payment')->count();

        $topProducts = SouvenirOrderItem::query()
            ->select('product_id', 'product_name', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(subtotal) as total_sales'))
            ->whereHas('product', fn ($builder) => AdminDataScope::applyCreatedBy($builder, $request))
            ->groupBy('product_id', 'product_name')
            ->orderByDesc('total_qty')
            ->limit(10)
            ->get();

        return Inertia::render('admin/souvenir/reports/index', [
            'stats' => [
                'totalOrders' => $totalOrders,
                'totalRevenue' => $totalRevenue,
                'refundTotal' => $refundTotal,
                'pendingOrders' => $pendingOrders,
            ],
            'topProducts' => $topProducts,
        ]);
    }
}
