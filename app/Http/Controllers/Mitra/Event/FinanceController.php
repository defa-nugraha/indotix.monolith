<?php

namespace App\Http\Controllers\Mitra\Event;

use App\Http\Controllers\Controller;
use App\Models\EventBooking;
use App\Models\EventCommission;
use App\Models\EventOrganizer;
use App\Models\EventSettlement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function summary(Request $request): Response
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $bookings = EventBooking::query()
            ->with('event')
            ->whereIn('status', ['paid', 'completed'])
            ->whereHas('event', fn ($q) => $q->where('event_organizer_id', $organizer->id))
            ->get();

        $gross = $bookings->sum('total_price');

        $commissionTotal = 0;
        foreach ($bookings as $booking) {
            $rule = EventCommission::query()
                ->where('event_id', $booking->event_id)
                ->latest('id')
                ->first();

            if (! $rule) {
                $rule = EventCommission::query()
                    ->whereNull('event_id')
                    ->latest('id')
                    ->first();
            }

            if (! $rule) {
                continue;
            }

            if ($rule->type === 'percentage') {
                $commissionTotal += (int) round($booking->total_price * ($rule->value / 100));
            } else {
                $commissionTotal += (int) $rule->value;
            }
        }

        $net = max(0, $gross - $commissionTotal);

        return Inertia::render('mitra/events/finance/summary', [
            'organizer' => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ],
            'summary' => [
                'gross' => $gross,
                'commission' => $commissionTotal,
                'net' => $net,
                'bookings_count' => $bookings->count(),
            ],
        ]);
    }

    public function payouts(Request $request): Response
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $payouts = EventSettlement::query()
            ->where('event_organizer_id', $organizer->id)
            ->latest('period_start')
            ->get()
            ->map(fn (EventSettlement $payout) => [
                'id' => $payout->id,
                'period_start' => $payout->period_start?->toDateString(),
                'period_end' => $payout->period_end?->toDateString(),
                'gross' => $payout->total_sales,
                'commission' => $payout->commission_amount,
                'net' => $payout->net_payout,
                'status' => $payout->status,
            ]);

        return Inertia::render('mitra/events/finance/payouts', [
            'organizer' => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ],
            'payouts' => $payouts,
        ]);
    }
}
