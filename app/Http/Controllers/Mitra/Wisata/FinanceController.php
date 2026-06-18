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
            ->get(['total_price', 'visit_date', 'created_at']);

        $gross = $paidBookings->sum('total_price');

        $commission = 0;
        $commissionRule = null;
        foreach ($paidBookings as $booking) {
            $date = $booking->visit_date?->toDateString()
                ?? $booking->created_at?->toDateString()
                ?? now()->toDateString();
            $rule = $this->resolveCommissionRule($destination->id, $date);
            $commissionRule ??= $rule;

            if (! $rule) {
                continue;
            }

            if ($rule->type === 'percentage') {
                $commission += (int) round($booking->total_price * ($rule->value / 100));
            } else {
                $commission += (int) $rule->value;
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
