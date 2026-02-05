<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SouvenirOrder;
use App\Models\SouvenirOrderItem;
use App\Models\SouvenirRefund;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SouvenirReportController extends Controller
{
    public function index(): Response
    {
        $totalOrders = SouvenirOrder::query()->count();
        $totalRevenue = SouvenirOrder::query()->whereIn('status', ['paid', 'processing', 'shipped', 'ready_pickup', 'completed'])
            ->sum('total_price');
        $refundTotal = SouvenirRefund::query()->where('status', 'approved')->sum('amount');
        $pendingOrders = SouvenirOrder::query()->where('status', 'pending_payment')->count();

        $topProducts = SouvenirOrderItem::query()
            ->select('product_id', 'product_name', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(subtotal) as total_sales'))
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
