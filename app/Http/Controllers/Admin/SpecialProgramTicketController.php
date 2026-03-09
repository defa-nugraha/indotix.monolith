<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventAuditLog;
use App\Models\EventTicket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramTicketController extends Controller
{
    public function index(Request $request): Response
    {
        $eventId = $request->integer('event_id');
        $query = EventTicket::query()
            ->with('event')
            ->whereHas('event', fn ($q) => $q->where('event_type', 'special_program'))
            ->latest();
        if ($eventId) {
            $query->where('event_id', $eventId);
        }

        return Inertia::render('admin/special-programs/tickets/index', [
            'tickets' => $query->paginate(20)->withQueryString(),
            'events' => Event::query()
                ->where('event_type', 'special_program')
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
        $data = $request->validate([
            'is_active' => ['required', 'boolean'],
            'max_per_user' => ['required', 'integer', 'min:1'],
            'quota' => ['nullable', 'integer', 'min:0'],
        ]);

        $ticket->update($data);

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'special_program_ticket_updated',
            'subject_type' => EventTicket::class,
            'subject_id' => $ticket->id,
            'metadata' => $data,
        ]);

        return back();
    }
}
