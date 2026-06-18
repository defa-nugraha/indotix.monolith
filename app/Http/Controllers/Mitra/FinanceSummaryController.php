<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CommissionRule;
use App\Models\Hotel;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceSummaryController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $period = $request->input('period', 'monthly');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $selectedHotelId = $request->input('hotel_id');

        if (! $dateFrom || ! $dateTo) {
            [$dateFrom, $dateTo] = $this->resolvePeriodDates($period);
        }

        $hotelOptions = Hotel::query()
            ->where('vendor_id', $user->id)
            ->orderBy('name')
            ->get()
            ->map(fn (Hotel $hotel) => [
                'id' => $hotel->id,
                'label' => $hotel->name,
            ])
            ->all();

        $query = Booking::query()
            ->whereHas('hotel', fn ($builder) => $builder->where('vendor_id', $user->id))
            ->whereIn('status', ['paid', 'completed'])
            ->where('payment_status', '!=', 'refunded')
            ->whereDate('check_out', '>=', $dateFrom)
            ->whereDate('check_out', '<=', $dateTo)
            ->with('hotel');

        if ($selectedHotelId) {
            $query->where('hotel_id', (int) $selectedHotelId);
        }

        $bookings = $query->get();

        $gmv = 0;
        $commissionTotal = 0;
        $totalBookings = $bookings->count();
        $daily = [];

        foreach ($bookings as $booking) {
            $gmv += $booking->total;
            $rule = $this->resolveCommissionRule($booking->hotel_id, $booking->check_out);
            $commissionAmount = $this->calculateCommissionAmount($booking->total, $rule['type'], $rule['value']);
            $commissionTotal += $commissionAmount;

            $dateKey = $booking->check_out->toDateString();
            if (! isset($daily[$dateKey])) {
                $daily[$dateKey] = [
                    'date' => $dateKey,
                    'bookings' => 0,
                    'gmv' => 0,
                ];
            }
            $daily[$dateKey]['bookings'] += 1;
            $daily[$dateKey]['gmv'] += $booking->total;
        }

        $dailyData = array_values($daily);

        return Inertia::render('mitra/finance/summary', [
            'filters' => [
                'period' => $period,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'hotel_id' => $selectedHotelId,
            ],
            'hotelOptions' => $hotelOptions,
            'summary' => [
                'total_bookings' => $totalBookings,
                'gmv' => $gmv,
                'commission_total' => $commissionTotal,
                'net_payout' => max(0, $gmv - $commissionTotal),
            ],
            'daily' => $dailyData,
        ]);
    }

    private function resolvePeriodDates(string $period): array
    {
        $today = Carbon::today();

        return match ($period) {
            'daily' => [$today->toDateString(), $today->toDateString()],
            'weekly' => [$today->copy()->subDays(6)->toDateString(), $today->toDateString()],
            default => [$today->copy()->startOfMonth()->toDateString(), $today->copy()->endOfMonth()->toDateString()],
        };
    }

    private function resolveCommissionRule(int $hotelId, CarbonInterface $date): array
    {
        $rule = CommissionRule::query()
            ->where('is_active', true)
            ->where('hotel_id', $hotelId)
            ->where(function ($query) use ($date) {
                $query->whereNull('starts_at')->orWhere('starts_at', '<=', $date->toDateString());
            })
            ->where(function ($query) use ($date) {
                $query->whereNull('ends_at')->orWhere('ends_at', '>=', $date->toDateString());
            })
            ->latest()
            ->first();

        if (! $rule) {
            $rule = CommissionRule::query()
                ->whereNull('hotel_id')
                ->where('is_active', true)
                ->where(function ($query) use ($date) {
                    $query->whereNull('starts_at')->orWhere('starts_at', '<=', $date->toDateString());
                })
                ->where(function ($query) use ($date) {
                    $query->whereNull('ends_at')->orWhere('ends_at', '>=', $date->toDateString());
                })
                ->latest()
                ->first();
        }

        return [
            'type' => $rule?->type ?? 'percentage',
            'value' => (int) ($rule?->value ?? 10),
        ];
    }

    private function calculateCommissionAmount(int $total, string $type, int $value): int
    {
        if ($type === 'fixed') {
            return min($value, $total);
        }

        return (int) round($total * ($value / 100));
    }
}
