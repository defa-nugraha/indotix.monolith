<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateClick;
use App\Models\WisataAffiliateCommissionItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $affiliate = WisataAffiliate::query()
            ->with('links')
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $linkIds = $affiliate->links->pluck('id');
        $totalClicks = $linkIds->isEmpty()
            ? 0
            : WisataAffiliateClick::query()->whereIn('affiliate_link_id', $linkIds)->count();
        $totalBookings = WisataAffiliateCommissionItem::query()
            ->where('affiliate_id', $affiliate->id)
            ->count();

        $totalCommission = WisataAffiliateCommissionItem::query()
            ->where('affiliate_id', $affiliate->id)
            ->sum('commission_amount');
        $approvedCommission = WisataAffiliateCommissionItem::query()
            ->where('affiliate_id', $affiliate->id)
            ->where('status', 'approved')
            ->sum('commission_amount');
        $pendingCommission = WisataAffiliateCommissionItem::query()
            ->where('affiliate_id', $affiliate->id)
            ->where('status', 'pending')
            ->sum('commission_amount');

        $conversionRate = $totalClicks > 0 ? round(($totalBookings / $totalClicks) * 100, 2) : 0;

        return Inertia::render('affiliate/dashboard', [
            'affiliate' => [
                'id' => $affiliate->id,
                'name' => $affiliate->name,
                'status' => $affiliate->status,
            ],
            'stats' => [
                'total_clicks' => $totalClicks,
                'total_bookings' => $totalBookings,
                'conversion_rate' => $conversionRate,
                'total_commission' => $totalCommission,
                'approved_commission' => $approvedCommission,
                'pending_commission' => $pendingCommission,
            ],
        ]);
    }
}
