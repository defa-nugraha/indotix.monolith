<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataBooking;
use App\Models\WisataCommissionRule;
use App\Models\WisataPayout;
use App\Support\AdminDataScope;
use App\Services\WisataFinanceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WisataFinanceController extends Controller
{
    public function commissions(): Response
    {
        $destinations = AdminDataScope::applyCreatedByOrUser(MitraWisataOnboarding::query(), request())
            ->orderBy('destination_name')
            ->get(['id', 'destination_name'])
            ->map(fn ($item) => ['id' => $item->id, 'label' => $item->destination_name ?? 'Destinasi #' . $item->id])
            ->all();

        $rules = WisataCommissionRule::query()
            ->with(['destination', 'createdBy:id,name', 'updatedBy:id,name'])
            ->when(! AdminDataScope::canViewAll(request()->user()), fn ($query) => $query
                ->whereHas('destination', fn ($destinationQuery) => AdminDataScope::applyCreatedByOrUser($destinationQuery, request())))
            ->latest('id')
            ->get()
            ->map(fn (WisataCommissionRule $rule) => [
                'id' => $rule->id,
                'type' => $rule->type,
                'value' => $rule->value,
                'start_date' => $rule->start_date?->toDateString(),
                'end_date' => $rule->end_date?->toDateString(),
                'is_forever' => $rule->is_forever,
                'destination' => $rule->destination?->destination_name,
                'created_by_name' => $rule->createdBy?->name,
                'updated_by_name' => $rule->updatedBy?->name,
            ]);

        return Inertia::render('admin/wisata/finance/commissions', [
            'destinations' => $destinations,
            'rules' => $rules,
        ]);
    }

    public function storeCommission(Request $request): RedirectResponse
    {
        $destinationRule = \Illuminate\Validation\Rule::exists('mitra_wisata_onboardings', 'id');
        if (! AdminDataScope::canViewAll($request->user())) {
            $userId = $request->user()?->id ?? 0;
            $destinationRule = $destinationRule->where(fn ($query) => $query
                ->where('created_by', $userId)
                ->orWhere('user_id', $userId));
        }

        $data = $request->validate([
            'mitra_wisata_onboarding_id' => [\Illuminate\Validation\Rule::requiredIf(fn () => ! AdminDataScope::canViewAll($request->user())), 'nullable', $destinationRule],
            'type' => ['required', 'in:percentage,fixed'],
            'value' => ['required', 'integer', 'min:0'],
            'is_forever' => ['boolean'],
            'start_date' => [\Illuminate\Validation\Rule::requiredIf(fn () => ! $request->boolean('is_forever')), 'nullable', 'date'],
            'end_date' => [\Illuminate\Validation\Rule::requiredIf(fn () => ! $request->boolean('is_forever')), 'nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $data['is_forever'] = $request->boolean('is_forever');
        if ($data['is_forever']) {
            $data['start_date'] = null;
            $data['end_date'] = null;
        }

        WisataCommissionRule::create($data);

        return back()->with('status', 'commission-saved');
    }

    public function payouts(): Response
    {
        $payouts = WisataPayout::query()
            ->with('destination')
            ->whereHas('destination', fn ($builder) => AdminDataScope::applyCreatedByOrUser($builder, request()))
            ->latest('id')
            ->paginate(\App\Support\PaginationOptions::perPage())
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

        $destinations = AdminDataScope::applyCreatedByOrUser(MitraWisataOnboarding::query(), request())
            ->orderBy('destination_name')
            ->get(['id', 'destination_name'])
            ->map(fn ($item) => ['id' => $item->id, 'label' => $item->destination_name ?? 'Destinasi #' . $item->id])
            ->all();

        return Inertia::render('admin/wisata/finance/payouts', [
            'payouts' => $payouts,
            'destinations' => $destinations,
        ]);
    }

    public function generatePayout(Request $request, WisataFinanceService $finance): RedirectResponse
    {
        $destinationRule = \Illuminate\Validation\Rule::exists('mitra_wisata_onboardings', 'id');
        if (! AdminDataScope::canViewAll($request->user())) {
            $userId = $request->user()?->id ?? 0;
            $destinationRule = $destinationRule->where(fn ($query) => $query
                ->where('created_by', $userId)
                ->orWhere('user_id', $userId));
        }

        $data = $request->validate([
            'mitra_wisata_onboarding_id' => ['required', $destinationRule],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date'],
        ]);

        $finance->createPayout(
            (int) $data['mitra_wisata_onboarding_id'],
            $data['period_start'],
            $data['period_end'],
        );

        return back()->with('status', 'payout-created');
    }

    public function updatePayout(Request $request, WisataPayout $payout): RedirectResponse
    {
        if ($payout->destination) {
            AdminDataScope::authorizeCreatedByOrUser($payout->destination, $request);
        }

        $data = $request->validate([
            'status' => ['required', 'in:approved,paid,rejected'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $payout->update($data);

        return back()->with('status', 'payout-updated');
    }

    public function reports(Request $request): Response
    {
        $filters = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $bookingScope = fn () => WisataBooking::query()
            ->whereHas('destination', fn ($builder) => AdminDataScope::applyCreatedByOrUser($builder, $request))
            ->when($filters['start_date'] ?? null, fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['end_date'] ?? null, fn ($query, $date) => $query->whereDate('created_at', '<=', $date));

        $gmv = $bookingScope()
            ->whereIn('status', ['paid', 'completed', 'refunded'])
            ->sum('total_price');

        $refund = $bookingScope()
            ->where('refund_status', 'processed')
            ->sum('refund_amount');

        $outstanding = WisataPayout::query()
            ->whereHas('destination', fn ($builder) => AdminDataScope::applyCreatedByOrUser($builder, $request))
            ->when($filters['start_date'] ?? null, fn ($query, $date) => $query->whereDate('period_end', '>=', $date))
            ->when($filters['end_date'] ?? null, fn ($query, $date) => $query->whereDate('period_start', '<=', $date))
            ->whereIn('status', ['pending', 'approved'])
            ->sum('net_payout');

        $revenue = max(0, (int) round(($gmv - $refund) * 0.1));

        return Inertia::render('admin/wisata/finance/reports', [
            'metrics' => [
                'gmv' => $gmv,
                'revenue' => $revenue,
                'refund' => $refund,
                'outstanding' => $outstanding,
            ],
            'filters' => [
                'start_date' => $filters['start_date'] ?? '',
                'end_date' => $filters['end_date'] ?? '',
            ],
        ]);
    }
}
