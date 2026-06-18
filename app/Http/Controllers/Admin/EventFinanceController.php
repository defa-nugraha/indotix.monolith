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

class EventFinanceController extends Controller
{
    public function commissions(): Response
    {
        return Inertia::render('admin/events/finance/commissions', [
            'commissions' => EventCommission::query()
                ->with(['event', 'createdBy:id,name', 'updatedBy:id,name'])
                ->where(function ($query) {
                    $query->whereNull('event_id')
                        ->orWhereHas('event', fn ($q) => $q->where('event_type', 'event'));
                })
                ->latest()
                ->get()
                ->map(fn (EventCommission $commission) => [
                    'id' => $commission->id,
                    'type' => $commission->type,
                    'value' => $commission->value,
                    'starts_at' => $commission->starts_at?->toDateString(),
                    'ends_at' => $commission->ends_at?->toDateString(),
                    'is_forever' => $commission->is_forever,
                    'event' => $commission->event ? [
                        'title' => $commission->event->title,
                    ] : null,
                    'created_by_name' => $commission->createdBy?->name,
                    'updated_by_name' => $commission->updatedBy?->name,
                ]),
            'events' => Event::query()
                ->where('event_type', 'event')
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
            'is_forever' => ['boolean'],
            'starts_at' => [\Illuminate\Validation\Rule::requiredIf(fn () => ! $request->boolean('is_forever')), 'nullable', 'date'],
            'ends_at' => [\Illuminate\Validation\Rule::requiredIf(fn () => ! $request->boolean('is_forever')), 'nullable', 'date', 'after_or_equal:starts_at'],
        ]);

        $data['is_forever'] = $request->boolean('is_forever');
        if ($data['is_forever']) {
            $data['starts_at'] = null;
            $data['ends_at'] = null;
        }

        $commission = EventCommission::create($data);

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'event_commission_created',
            'subject_type' => EventCommission::class,
            'subject_id' => $commission->id,
            'metadata' => $data,
        ]);

        return back();
    }

    public function settlements(): Response
    {
        return Inertia::render('admin/events/finance/settlements', [
            'settlements' => EventSettlement::query()->with('organizer')->latest()->paginate(\App\Support\PaginationOptions::perPage()),
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
            'action' => 'event_settlement_created',
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

        return Inertia::render('admin/events/finance/reports', [
            'summary' => $summary,
        ]);
    }
}
