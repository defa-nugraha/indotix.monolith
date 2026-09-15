<?php

namespace App\Http\Controllers\Mitra\Wisata;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataBooking;
use App\Models\WisataCommissionRule;
use App\Models\WisataPayout;
use App\Services\WisataFinanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function summary(Request $request, WisataFinanceService $finance): Response
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $calculation = $finance->calculatePeriod(
            $destination->id,
            now()->subYears(10)->toDateString(),
            now()->addYears(10)->toDateString(),
        );
        $commissionRule = $finance->resolveCommissionRule($destination->id, now()->toDateString());

        return Inertia::render('mitra/wisata/finance/summary', [
            'destination' => [
                'id' => $destination->id,
                'destination_name' => $destination->destination_name,
            ],
            'summary' => [
                'gross' => $calculation['gross'],
                'refunds' => $calculation['refunds'],
                'commission' => $calculation['commission'],
                'net' => $calculation['net_payout'],
                'bookings_count' => $calculation['bookings_count'],
            ],
            'commission_rule' => $commissionRule ? [
                'type' => $commissionRule->type,
                'value' => $commissionRule->value,
            ] : null,
        ]);
    }

    private function resolveCommissionRule(int $destinationId, string $date): ?WisataCommissionRule
    {
        $rule = WisataCommissionRule::query()
            ->where('mitra_wisata_onboarding_id', $destinationId)
            ->where(function ($query) use ($date) {
                $query->where('is_forever', true)
                    ->orWhereNull('start_date')
                    ->orWhere('start_date', '<=', $date);
            })
            ->where(function ($query) use ($date) {
                $query->where('is_forever', true)
                    ->orWhereNull('end_date')
                    ->orWhere('end_date', '>=', $date);
            })
            ->latest('id')
            ->first();

        if ($rule) {
            return $rule;
        }

        return WisataCommissionRule::query()
            ->whereNull('mitra_wisata_onboarding_id')
            ->where(function ($query) use ($date) {
                $query->where('is_forever', true)
                    ->orWhereNull('start_date')
                    ->orWhere('start_date', '<=', $date);
            })
            ->where(function ($query) use ($date) {
                $query->where('is_forever', true)
                    ->orWhereNull('end_date')
                    ->orWhere('end_date', '>=', $date);
            })
            ->latest('id')
            ->first();
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
                'gross' => $payout->total_gmv,
                'refunds' => $payout->gross_refund_amount,
                'commission' => $payout->commission_amount,
                'net' => $payout->net_payout,
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
