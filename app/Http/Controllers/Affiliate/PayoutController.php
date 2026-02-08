<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateCommissionItem;
use App\Models\WisataAffiliatePayout;
use App\Models\WisataAffiliateSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayoutController extends Controller
{
    public function index(Request $request): Response
    {
        $affiliate = WisataAffiliate::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $payouts = WisataAffiliatePayout::query()
            ->where('affiliate_id', $affiliate->id)
            ->latest('id')
            ->get();

        $approvedTotal = WisataAffiliateCommissionItem::query()
            ->where('affiliate_id', $affiliate->id)
            ->where('status', 'approved')
            ->sum('commission_amount');

        $reserved = WisataAffiliatePayout::query()
            ->where('affiliate_id', $affiliate->id)
            ->whereIn('status', ['pending', 'approved', 'paid'])
            ->sum('total_commission');

        $available = max(0, $approvedTotal - $reserved);

        $setting = WisataAffiliateSetting::query()->first();

        return Inertia::render('affiliate/payouts', [
            'payouts' => $payouts,
            'available' => $available,
            'min_payout' => $setting?->min_payout ?? 0,
            'affiliate' => [
                'bank_name' => $affiliate->bank_name,
                'bank_account_number' => $affiliate->bank_account_number,
                'bank_account_name' => $affiliate->bank_account_name,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $affiliate = WisataAffiliate::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $approvedTotal = WisataAffiliateCommissionItem::query()
            ->where('affiliate_id', $affiliate->id)
            ->where('status', 'approved')
            ->sum('commission_amount');

        $reserved = WisataAffiliatePayout::query()
            ->where('affiliate_id', $affiliate->id)
            ->whereIn('status', ['pending', 'approved', 'paid'])
            ->sum('total_commission');

        $available = max(0, $approvedTotal - $reserved);

        $setting = WisataAffiliateSetting::query()->first();
        $minPayout = $setting?->min_payout ?? 0;

        if ($available < $minPayout || $available <= 0) {
            return back()->withErrors(['amount' => 'Saldo belum memenuhi minimum payout.']);
        }

        WisataAffiliatePayout::create([
            'affiliate_id' => $affiliate->id,
            'total_commission' => $available,
            'status' => 'pending',
            'bank_name' => $affiliate->bank_name,
            'bank_account_number' => $affiliate->bank_account_number,
            'bank_account_name' => $affiliate->bank_account_name,
        ]);

        return back()->with('status', 'payout-requested');
    }
}
