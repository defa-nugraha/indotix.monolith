<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataBooking;
use App\Models\WisataCommissionRule;
use App\Models\WisataPayout;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WisataFinanceController extends Controller
{
    public function commissions(): Response
    {
        $destinations = MitraWisataOnboarding::query()
            ->orderBy('destination_name')
            ->get(['id', 'destination_name'])
            ->map(fn ($item) => ['id' => $item->id, 'label' => $item->destination_name ?? 'Destinasi #' . $item->id])
            ->all();

        $rules = WisataCommissionRule::query()
            ->with('destination')
            ->latest('id')
            ->get()
            ->map(fn (WisataCommissionRule $rule) => [
                'id' => $rule->id,
                'type' => $rule->type,
                'value' => $rule->value,
                'start_date' => $rule->start_date?->toDateString(),
                'end_date' => $rule->end_date?->toDateString(),
                'destination' => $rule->destination?->destination_name,
            ]);

        return Inertia::render('admin/wisata/finance/commissions', [
            'destinations' => $destinations,
            'rules' => $rules,
        ]);
    }

    public function storeCommission(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'mitra_wisata_onboarding_id' => ['nullable', 'exists:mitra_wisata_onboardings,id'],
            'type' => ['required', 'in:percentage,fixed'],
            'value' => ['required', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        WisataCommissionRule::create($data);

        return back()->with('status', 'commission-saved');
    }

    public function payouts(): Response
    {
        $payouts = WisataPayout::query()
            ->with('destination')
            ->latest('id')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (WisataPayout $payout) => [
                'id' => $payout->id,
                'period_start' => $payout->period_start?->toDateString(),
                'period_end' => $payout->period_end?->toDateString(),
                'total_gmv' => $payout->total_gmv,
                'commission_amount' => $payout->commission_amount,
                'net_payout' => $payout->net_payout,
                'status' => $payout->status,
                'destination' => $payout->destination?->destination_name,
            ]);

        $destinations = MitraWisataOnboarding::query()
            ->orderBy('destination_name')
            ->get(['id', 'destination_name'])
            ->map(fn ($item) => ['id' => $item->id, 'label' => $item->destination_name ?? 'Destinasi #' . $item->id])
            ->all();

        return Inertia::render('admin/wisata/finance/payouts', [
            'payouts' => $payouts,
            'destinations' => $destinations,
        ]);
    }

    public function generatePayout(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'mitra_wisata_onboarding_id' => ['required', 'exists:mitra_wisata_onboardings,id'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date'],
        ]);

        $total = WisataBooking::query()
            ->where('mitra_wisata_onboarding_id', $data['mitra_wisata_onboarding_id'])
            ->whereBetween('visit_date', [$data['period_start'], $data['period_end']])
            ->whereIn('status', ['paid', 'completed'])
            ->sum('total_price');

        $commission = (int) round($total * 0.1);
        $net = max(0, $total - $commission);

        WisataPayout::create([
            'mitra_wisata_onboarding_id' => $data['mitra_wisata_onboarding_id'],
            'period_start' => $data['period_start'],
            'period_end' => $data['period_end'],
            'total_gmv' => $total,
            'commission_amount' => $commission,
            'net_payout' => $net,
            'status' => 'pending',
        ]);

        return back()->with('status', 'payout-created');
    }

    public function updatePayout(Request $request, WisataPayout $payout): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:approved,paid,rejected'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $payout->update($data);

        return back()->with('status', 'payout-updated');
    }

    public function reports(): Response
    {
        $gmv = WisataBooking::query()
            ->whereIn('status', ['paid', 'completed'])
            ->sum('total_price');

        $refund = WisataBooking::query()
            ->where('refund_status', 'processed')
            ->sum('refund_amount');

        $outstanding = WisataPayout::query()
            ->whereIn('status', ['pending', 'approved'])
            ->sum('net_payout');

        $revenue = (int) round($gmv * 0.1);

        return Inertia::render('admin/wisata/finance/reports', [
            'metrics' => [
                'gmv' => $gmv,
                'revenue' => $revenue,
                'refund' => $refund,
                'outstanding' => $outstanding,
            ],
        ]);
    }
}
