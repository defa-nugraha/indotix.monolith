<?php

namespace App\Services;

use App\Models\MitraWisataOnboarding;
use App\Models\WisataBooking;
use App\Models\WisataCommissionRule;
use App\Models\WisataPayout;
use App\Models\WisataPayoutAdjustment;
use App\Models\WisataRefund;
use Illuminate\Support\Facades\DB;

class WisataFinanceService
{
    public function calculatePeriod(int $destinationId, string $startDate, string $endDate): array
    {
        $bookings = WisataBooking::query()
            ->where('mitra_wisata_onboarding_id', $destinationId)
            ->whereBetween('visit_date', [$startDate, $endDate])
            ->whereIn('status', ['paid', 'completed'])
            ->get();

        $gross = 0;
        $refunds = 0;
        $commission = 0;

        foreach ($bookings as $booking) {
            $grossAmount = (int) $booking->total_price;
            $refundAmount = $booking->refund_status === 'processed'
                ? min($grossAmount, (int) ($booking->refund_amount ?? 0))
                : 0;
            $netSale = max(0, $grossAmount - $refundAmount);

            $gross += $grossAmount;
            $refunds += $refundAmount;

            $date = $booking->visit_date?->toDateString()
                ?? $booking->created_at?->toDateString()
                ?? now()->toDateString();
            $rule = $this->resolveCommissionRule($destinationId, $date);

            if (! $rule || $netSale === 0) {
                continue;
            }

            if ($rule->type === 'percentage') {
                $commission += (int) round($netSale * ((int) $rule->value / 100));
            } else {
                $commission += min($netSale, (int) $rule->value);
            }
        }

        $netSales = max(0, $gross - $refunds);
        $commission = min($netSales, $commission);

        return [
            'gross' => $gross,
            'refunds' => $refunds,
            'net_sales' => $netSales,
            'commission' => $commission,
            'net_payout' => max(0, $netSales - $commission),
            'bookings_count' => $bookings->count(),
        ];
    }

    public function createPayout(int $destinationId, string $startDate, string $endDate): WisataPayout
    {
        return DB::transaction(function () use ($destinationId, $startDate, $endDate) {
            MitraWisataOnboarding::query()->whereKey($destinationId)->lockForUpdate()->firstOrFail();

            $existing = WisataPayout::query()
                ->where('mitra_wisata_onboarding_id', $destinationId)
                ->whereDate('period_start', $startDate)
                ->whereDate('period_end', $endDate)
                ->whereIn('status', ['pending', 'approved', 'paid'])
                ->first();

            if ($existing) {
                return $existing;
            }

            $calculation = $this->calculatePeriod($destinationId, $startDate, $endDate);
            $adjustments = WisataPayoutAdjustment::query()
                ->where('mitra_wisata_onboarding_id', $destinationId)
                ->whereIn('status', ['pending', 'partial'])
                ->lockForUpdate()
                ->orderBy('id')
                ->get();

            $outstandingAdjustment = $adjustments->sum(fn (WisataPayoutAdjustment $item) => $item->remainingAmount());
            $appliedAdjustment = min((int) $calculation['net_payout'], (int) $outstandingAdjustment);

            $payout = WisataPayout::query()->create([
                'mitra_wisata_onboarding_id' => $destinationId,
                'idempotency_key' => hash('sha256', $destinationId.'|'.$startDate.'|'.$endDate),
                'period_start' => $startDate,
                'period_end' => $endDate,
                'total_gmv' => $calculation['gross'],
                'gross_refund_amount' => $calculation['refunds'],
                'commission_amount' => $calculation['commission'],
                'prior_adjustment_amount' => $appliedAdjustment,
                'net_payout' => max(0, (int) $calculation['net_payout'] - $appliedAdjustment),
                'status' => 'pending',
            ]);

            $remainingToApply = $appliedAdjustment;
            foreach ($adjustments as $adjustment) {
                if ($remainingToApply <= 0) {
                    break;
                }

                $take = min($remainingToApply, $adjustment->remainingAmount());
                $newApplied = (int) $adjustment->applied_amount + $take;
                $adjustment->update([
                    'applied_amount' => $newApplied,
                    'status' => $newApplied >= (int) $adjustment->amount ? 'applied' : 'partial',
                    'applied_payout_id' => $payout->id,
                ]);
                $remainingToApply -= $take;
            }

            return $payout;
        }, 3);
    }

    public function recordRefundImpact(WisataBooking $booking, WisataRefund $refund): void
    {
        if (! $booking->mitra_wisata_onboarding_id || ! $booking->visit_date) {
            return;
        }

        DB::transaction(function () use ($booking, $refund) {
            $affectedPayout = WisataPayout::query()
                ->where('mitra_wisata_onboarding_id', $booking->mitra_wisata_onboarding_id)
                ->whereDate('period_start', '<=', $booking->visit_date->toDateString())
                ->whereDate('period_end', '>=', $booking->visit_date->toDateString())
                ->whereIn('status', ['pending', 'approved', 'paid'])
                ->lockForUpdate()
                ->latest('id')
                ->first();

            if (! $affectedPayout) {
                return;
            }

            $calculation = $this->calculatePeriod(
                (int) $booking->mitra_wisata_onboarding_id,
                $affectedPayout->period_start->toDateString(),
                $affectedPayout->period_end->toDateString(),
            );

            $oldNet = (int) $affectedPayout->net_payout + (int) ($affectedPayout->prior_adjustment_amount ?? 0);
            $newNet = (int) $calculation['net_payout'];
            $impact = max(0, $oldNet - $newNet);

            if ($affectedPayout->status === 'paid') {
                if ($impact > 0) {
                    WisataPayoutAdjustment::query()->firstOrCreate(
                        ['wisata_refund_id' => $refund->id],
                        [
                            'mitra_wisata_onboarding_id' => $booking->mitra_wisata_onboarding_id,
                            'wisata_booking_id' => $booking->id,
                            'amount' => $impact,
                            'applied_amount' => 0,
                            'status' => 'pending',
                        ],
                    );
                }

                return;
            }

            $affectedPayout->update([
                'total_gmv' => $calculation['gross'],
                'gross_refund_amount' => $calculation['refunds'],
                'commission_amount' => $calculation['commission'],
                'net_payout' => $calculation['net_payout'],
            ]);

            if ($impact > 0) {
                WisataPayoutAdjustment::query()->updateOrCreate(
                    ['wisata_refund_id' => $refund->id],
                    [
                        'mitra_wisata_onboarding_id' => $booking->mitra_wisata_onboarding_id,
                        'wisata_booking_id' => $booking->id,
                        'amount' => $impact,
                        'applied_amount' => $impact,
                        'status' => 'applied',
                        'applied_payout_id' => $affectedPayout->id,
                    ],
                );
            }
        }, 3);
    }

    public function resolveCommissionRule(int $destinationId, string $date): ?WisataCommissionRule
    {
        $scoped = WisataCommissionRule::query()
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

        if ($scoped) {
            return $scoped;
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
}
