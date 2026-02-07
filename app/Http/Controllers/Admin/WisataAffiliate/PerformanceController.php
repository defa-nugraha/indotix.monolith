<?php

namespace App\Http\Controllers\Admin\WisataAffiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateClick;
use App\Models\WisataAffiliateCommissionItem;
use Inertia\Inertia;
use Inertia\Response;

class PerformanceController extends Controller
{
    public function index(): Response
    {
        $totalClicks = WisataAffiliateClick::query()->count();
        $totalCommission = WisataAffiliateCommissionItem::query()->sum('commission_amount');
        $totalApproved = WisataAffiliateCommissionItem::query()->where('status', 'approved')->sum('commission_amount');
        $totalPending = WisataAffiliateCommissionItem::query()->where('status', 'pending')->sum('commission_amount');

        $topAffiliates = WisataAffiliate::query()
            ->withCount('links')
            ->latest('id')
            ->take(10)
            ->get();

        return Inertia::render('admin/wisata-affiliates/performance', [
            'stats' => [
                'total_clicks' => $totalClicks,
                'total_commission' => $totalCommission,
                'total_approved' => $totalApproved,
                'total_pending' => $totalPending,
            ],
            'affiliates' => $topAffiliates,
        ]);
    }
}
