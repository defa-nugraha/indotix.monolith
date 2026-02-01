<?php

namespace App\Http\Controllers\Mitra\Wisata;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataBooking;
use App\Models\WisataCommissionRule;
use App\Models\WisataPayout;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function summary(Request $request): Response
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $paidBookings = WisataBooking::query()
            ->where('mitra_wisata_onboarding_id', $destination->id)
            ->whereIn('status', ['paid', 'completed'])
            ->get(['total_price']);

        $gross = $paidBookings->sum('total_price');

        $commissionRule = WisataCommissionRule::query()
            ->where('mitra_wisata_onboarding_id', $destination->id)
            ->latest('id')
            ->first();

        if (! $commissionRule) {
            $commissionRule = WisataCommissionRule::query()
                ->whereNull('mitra_wisata_onboarding_id')
                ->latest('id')
                ->first();
        }

        $commission = 0;
        if ($commissionRule) {
            if ($commissionRule->type === 'percentage') {
                $commission = (int) round($gross * ($commissionRule->value / 100));
            } else {
                $commission = (int) ($commissionRule->value * max(1, $paidBookings->count()));
            }
        }

        $net = max(0, $gross - $commission);

        return Inertia::render('mitra/wisata/finance/summary', [
            'destination' => [
                'id' => $destination->id,
                'destination_name' => $destination->destination_name,
            ],
            'summary' => [
                'gross' => $gross,
                'commission' => $commission,
                'net' => $net,
                'bookings_count' => $paidBookings->count(),
            ],
            'commission_rule' => $commissionRule ? [
                'type' => $commissionRule->type,
                'value' => $commissionRule->value,
            ] : null,
        ]);
    }

    public function payouts(Request $request): Response
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $payouts = WisataPayout::query()
            ->where('mitra_wisata_onboarding_id', $destination->id)
            ->latest('period_start')
            ->get()
            ->map(fn (WisataPayout $payout) => [
                'id' => $payout->id,
                'period_start' => $payout->period_start?->toDateString(),
                'period_end' => $payout->period_end?->toDateString(),
                'gross' => $payout->gross_amount,
                'commission' => $payout->commission_amount,
                'net' => $payout->net_amount,
                'status' => $payout->status,
            ]);

        return Inertia::render('mitra/wisata/finance/payouts', [
            'destination' => [
                'id' => $destination->id,
                'destination_name' => $destination->destination_name,
            ],
            'payouts' => $payouts,
        ]);
    }
}
