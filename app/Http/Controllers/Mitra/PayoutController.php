<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Models\Payout;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayoutController extends Controller
{
    private const STATUSES = ['draft', 'pending', 'approved', 'transferred', 'rejected'];

    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Payout::query()
            ->with('hotel')
            ->where('vendor_id', $user->id)
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('date_from')) {
            $query->whereDate('period_start', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('period_end', '<=', $request->input('date_to'));
        }

        $payouts = $query
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString()
            ->through(fn (Payout $payout) => [
                'id' => $payout->id,
                'hotel_name' => $payout->hotel?->name,
                'period_start' => $payout->period_start?->toDateString(),
                'period_end' => $payout->period_end?->toDateString(),
                'total_bookings' => $payout->total_bookings,
                'gmv' => $payout->gmv,
                'commission_total' => $payout->commission_total,
                'net_payout' => $payout->net_payout,
                'status' => $payout->status,
                'transfer_status' => $payout->transfer_status,
            ]);

        return Inertia::render('mitra/finance/payouts', [
            'payouts' => $payouts,
            'filters' => $request->only(['status', 'date_from', 'date_to']),
            'statusOptions' => self::STATUSES,
        ]);
    }
}
