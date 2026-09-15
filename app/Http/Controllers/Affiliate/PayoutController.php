<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateCommissionItem;
use App\Models\WisataAffiliatePayout;
use App\Models\WisataAffiliateSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $payout = DB::transaction(function () use ($request) {
            $affiliate = WisataAffiliate::query()
                ->where('user_id', $request->user()->id)
                ->lockForUpdate()
                ->firstOrFail();

            $approvedTotal = (int) WisataAffiliateCommissionItem::query()
                ->where('affiliate_id', $affiliate->id)
                ->where('status', 'approved')
                ->sum('commission_amount');

            $reserved = (int) WisataAffiliatePayout::query()
                ->where('affiliate_id', $affiliate->id)
                ->whereIn('status', ['pending', 'approved', 'paid'])
                ->sum('total_commission');

            $available = max(0, $approvedTotal - $reserved);
            $minPayout = (int) (WisataAffiliateSetting::query()->first()?->min_payout ?? 0);

            if ($available < $minPayout || $available <= 0) {
                return null;
            }

            $key = hash('sha256', $affiliate->id.'|'.$approvedTotal.'|'.$reserved.'|'.$available);

            return WisataAffiliatePayout::query()->firstOrCreate(
                ['idempotency_key' => $key],
                [
                    'affiliate_id' => $affiliate->id,
                    'idempotency_key' => $key,
                    'total_commission' => $available,
                    'status' => 'pending',
                    'bank_name' => $affiliate->bank_name,
                    'bank_account_number' => $affiliate->bank_account_number,
                    'bank_account_name' => $affiliate->bank_account_name,
                ],
            );
        }, 3);

        if (! $payout) {
            return back()->withErrors(['amount' => 'Saldo belum memenuhi minimum payout.']);
        }

        return back()->with('status', 'payout-requested');
    }
}
