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

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'quota' => ['nullable', 'integer', 'min:0'],
            'max_per_user' => ['required', 'integer', 'min:1'],
            'is_active' => ['required', 'boolean'],
        ]);

        $event = Event::query()
            ->where('event_type', 'special_program')
            ->where('id', $data['event_id'])
            ->firstOrFail();

        $ticket = EventTicket::create([
            'event_id' => $event->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'quota' => $data['quota'],
            'max_per_user' => $data['max_per_user'],
            'is_active' => $data['is_active'],
            'sold_count' => 0,
        ]);

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'special_program_ticket_created',
            'subject_type' => EventTicket::class,
            'subject_id' => $ticket->id,
            'metadata' => $data,
        ]);

        return back()->with('status', 'special-program-ticket-created');
    }
}
