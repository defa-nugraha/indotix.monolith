<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CommissionRule;
use App\Models\Hotel;
use App\Models\Payout;
use App\Models\PayoutItem;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PayoutController extends Controller
{
    private const STATUSES = ['draft', 'pending', 'approved', 'transferred', 'rejected'];

    public function index(Request $request): Response
    {
        $query = Payout::query()->with(['hotel', 'vendor'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('hotel_id')) {
            $query->where('hotel_id', (int) $request->input('hotel_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('period_start', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('period_end', '<=', $request->input('date_to'));
        }

        $payouts = $query
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Payout $payout) => [
                'id' => $payout->id,
                'hotel_name' => $payout->hotel?->name,
                'vendor_name' => $payout->vendor?->name,
                'period_start' => $payout->period_start?->toDateString(),
                'period_end' => $payout->period_end?->toDateString(),
                'total_bookings' => $payout->total_bookings,
                'gmv' => $payout->gmv,
                'commission_total' => $payout->commission_total,
                'net_payout' => $payout->net_payout,
                'status' => $payout->status,
                'transfer_status' => $payout->transfer_status,
            ]);

        return Inertia::render('admin/finance/payouts/index', [
            'payouts' => $payouts,
            'filters' => $request->only(['status', 'hotel_id', 'date_from', 'date_to']),
            'statusOptions' => self::STATUSES,
            'hotelOptions' => $this->hotelOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/finance/payouts/create', [
            'hotelOptions' => $this->hotelOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'hotel_id' => ['required', 'integer', 'exists:hotels,id'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'notes' => ['nullable', 'string'],
        ]);

        $hotel = Hotel::query()->findOrFail($data['hotel_id']);
        $periodStart = Carbon::parse($data['period_start'])->startOfDay();
        $periodEnd = Carbon::parse($data['period_end'])->endOfDay();

        $bookings = Booking::query()
            ->where('hotel_id', $hotel->id)
            ->whereIn('status', ['paid', 'completed'])
            ->where('payment_status', '!=', 'refunded')
            ->whereDate('check_out', '>=', $periodStart)
            ->whereDate('check_out', '<=', $periodEnd)
            ->whereNotIn('id', PayoutItem::query()->select('booking_id'))
            ->get();

        if ($bookings->isEmpty()) {
            return back()->withErrors(['booking' => 'Tidak ada booking yang bisa dipayout pada periode ini.']);
        }

        DB::transaction(function () use ($bookings, $hotel, $data, $periodStart, $periodEnd) {
            $totals = $this->calculateTotals($bookings, $hotel->id, $periodStart);

            $payout = Payout::create([
                'hotel_id' => $hotel->id,
                'vendor_id' => $hotel->vendor_id,
                'period_start' => $periodStart->toDateString(),
                'period_end' => $periodEnd->toDateString(),
                'total_bookings' => $totals['total_bookings'],
                'gmv' => $totals['gmv'],
                'commission_total' => $totals['commission_total'],
                'net_payout' => $totals['net_payout'],
                'status' => 'pending',
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            foreach ($totals['items'] as $item) {
                $item['payout_id'] = $payout->id;
                PayoutItem::create($item);
            }
        });

        return redirect()->route('admin.payouts.index');
    }

    public function approve(Payout $payout): RedirectResponse
    {
        $payout->update([
            'status' => 'approved',
        ]);

        return back()->with('status', 'payout-approved');
    }

    public function transfer(Payout $payout): RedirectResponse
    {
        $payout->update([
            'status' => 'transferred',
            'transfer_status' => 'transferred',
        ]);

        return back()->with('status', 'payout-transferred');
    }

    private function hotelOptions(): array
    {
        return Hotel::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn (Hotel $hotel) => [
                'id' => $hotel->id,
                'label' => $hotel->name,
            ])
            ->all();
    }

    private function calculateTotals($bookings, int $hotelId, Carbon $date): array
    {
        $items = [];
        $gmv = 0;
        $commissionTotal = 0;

        foreach ($bookings as $booking) {
            $rule = $this->resolveCommissionRule($hotelId, $date);
            $commissionAmount = $this->calculateCommissionAmount($booking->total, $rule['type'], $rule['value']);
            $items[] = [
                'booking_id' => $booking->id,
                'commission_type' => $rule['type'],
                'commission_value' => $rule['value'],
                'commission_amount' => $commissionAmount,
                'booking_total' => $booking->total,
            ];
            $gmv += $booking->total;
            $commissionTotal += $commissionAmount;
        }

        return [
            'total_bookings' => count($items),
            'gmv' => $gmv,
            'commission_total' => $commissionTotal,
            'net_payout' => max(0, $gmv - $commissionTotal),
            'items' => $items,
        ];
    }

    private function resolveCommissionRule(int $hotelId, Carbon $date): array
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
