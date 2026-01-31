<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payout;
use App\Models\PayoutItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceReportController extends Controller
{
    public function index(Request $request): Response
    {
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $bookings = Booking::query()
            ->whereIn('status', ['paid', 'completed'])
            ->when($dateFrom, fn ($q) => $q->whereDate('check_out', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('check_out', '<=', $dateTo));

        $gmv = (int) $bookings->sum('total');

        $revenueQuery = PayoutItem::query()
            ->when($dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('created_at', '<=', $dateTo));
        $revenue = (int) $revenueQuery->sum('commission_amount');

        $payoutOutstanding = (int) Payout::query()
            ->whereIn('status', ['pending', 'approved'])
            ->sum('net_payout');

        $refund = (int) Booking::query()
            ->where('payment_status', 'refunded')
            ->when($dateFrom, fn ($q) => $q->whereDate('updated_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('updated_at', '<=', $dateTo))
            ->sum('total');

        return Inertia::render('admin/finance/reports/index', [
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'summary' => [
                'gmv' => $gmv,
                'revenue' => $revenue,
                'payout_outstanding' => $payoutOutstanding,
                'refund' => $refund,
            ],
        ]);
    }
}
