<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventAuditLog;
use App\Models\EventTicket;
use App\Support\AdminDataScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventTicketController extends Controller
{
    public function index(Request $request): Response
    {
        $eventId = $request->integer('event_id');
        $query = EventTicket::query()
            ->with('event')
            ->whereHas('event', fn ($q) => $q
                ->where('event_type', 'event')
                ->when(! AdminDataScope::canViewAll($request->user()), fn ($eventQuery) => $eventQuery
                    ->whereHas('organizer', fn ($organizer) => $organizer->where('user_id', $request->user()?->id ?? 0))))
            ->latest();
        if ($eventId) {
            $query->where('event_id', $eventId);
        }

        return Inertia::render('admin/events/tickets/index', [
            'tickets' => $query->paginate(\App\Support\PaginationOptions::perPage())->withQueryString(),
            'events' => Event::query()
                ->where('event_type', 'event')
                ->when(! AdminDataScope::canViewAll($request->user()), fn ($query) => $query
                    ->whereHas('organizer', fn ($organizer) => $organizer->where('user_id', $request->user()?->id ?? 0)))
                ->select('id', 'title')
                ->orderBy('title')
                ->get(),
            'filters' => [
                'event_id' => $eventId ?: null,
            ],
        ]);
    }

    public function update(Request $request, EventTicket $ticket): RedirectResponse
    {
        $ticket->loadMissing('event.organizer');
        abort_unless(
            AdminDataScope::canViewAll($request->user()) ||
            (int) $ticket->event?->organizer?->user_id === (int) ($request->user()?->id ?? 0),
            404
        );

        $data = $request->validate([
            'is_active' => ['required', 'boolean'],
            'max_per_user' => ['required', 'integer', 'min:1'],
            'quota' => ['nullable', 'integer', 'min:0'],
        ]);

        $ticket->update($data);

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'event_ticket_updated',
            'subject_type' => EventTicket::class,
            'subject_id' => $ticket->id,
            'metadata' => $data,
        ]);

        return back();
    }
}
