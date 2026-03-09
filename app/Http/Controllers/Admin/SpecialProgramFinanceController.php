<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventAuditLog;
use App\Models\EventCommission;
use App\Models\EventSettlement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramFinanceController extends Controller
{
    public function commissions(): Response
    {
        return Inertia::render('admin/special-programs/finance/commissions', [
            'commissions' => EventCommission::query()
                ->with('event')
                ->whereHas('event', fn ($q) => $q->where('event_type', 'special_program'))
                ->latest()
                ->get(),
            'events' => Event::query()
                ->where('event_type', 'special_program')
                ->select('id', 'title')
                ->orderBy('title')
                ->get(),
        ]);
    }

    public function storeCommission(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
            'type' => ['required', 'in:percentage,fixed'],
            'value' => ['required', 'numeric', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
        ]);

        $commission = EventCommission::create($data);

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'special_program_commission_created',
            'subject_type' => EventCommission::class,
            'subject_id' => $commission->id,
            'metadata' => $data,
        ]);

        return back();
    }

    public function settlements(): Response
    {
        return Inertia::render('admin/special-programs/finance/settlements', [
            'settlements' => EventSettlement::query()->with('organizer')->latest()->paginate(20),
        ]);
    }

    public function createSettlement(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'event_organizer_id' => ['required', 'integer', 'exists:event_organizers,id'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date'],
            'total_sales' => ['required', 'numeric', 'min:0'],
            'commission_amount' => ['required', 'numeric', 'min:0'],
            'net_payout' => ['required', 'numeric', 'min:0'],
        ]);

        $settlement = EventSettlement::create($data);

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'special_program_settlement_created',
            'subject_type' => EventSettlement::class,
            'subject_id' => $settlement->id,
            'metadata' => $data,
        ]);

        return back();
    }

    public function reports(): Response
    {
        $summary = [
            'gmv' => 0,
            'revenue' => 0,
            'refund_total' => 0,
            'outstanding' => 0,
        ];

        return Inertia::render('admin/special-programs/finance/reports', [
            'summary' => $summary,
        ]);
    }
}
