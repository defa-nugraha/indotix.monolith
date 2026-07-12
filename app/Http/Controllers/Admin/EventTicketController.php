<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventAuditLog;
use App\Models\EventTicket;
use App\Support\AdminDataScope;
use App\Support\AdminPermissionRegistry;
use App\Support\PaginationOptions;
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
            'tickets' => $query->paginate(PaginationOptions::perPage())->withQueryString(),
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
            'canCreate' => AdminPermissionRegistry::can($request->user(), 'events_tickets', 'create'),
            'canUpdate' => AdminPermissionRegistry::can($request->user(), 'events_tickets', 'update'),
            'canDelete' => AdminPermissionRegistry::can($request->user(), 'events_tickets', 'delete'),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('admin/events/tickets/create', [
            'events' => $this->availableEvents($request),
            'canCreateEvent' => AdminPermissionRegistry::can($request->user(), 'events_items', 'create'),
            'ticket' => null,
        ]);
    }

    public function edit(Request $request, EventTicket $ticket): Response
    {
        $this->authorizeTicket($ticket, $request);

        return Inertia::render('admin/events/tickets/create', [
            'events' => $this->availableEvents($request),
            'canCreateEvent' => false,
            'ticket' => [
                'id' => $ticket->id,
                'event_id' => $ticket->event_id,
                'name' => $ticket->name,
                'description' => $ticket->description,
                'price' => (int) $ticket->price,
                'quota' => $ticket->quota,
                'max_per_user' => $ticket->max_per_user,
                'benefits' => $ticket->benefits ?? [],
                'is_active' => $ticket->is_active,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedTicket($request);
        $event = $this->findAvailableEvent($request, $data['event_id']);

        $ticket = EventTicket::create([
            'event_id' => $event->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'quota' => $data['quota'],
            'max_per_user' => $data['max_per_user'],
            'benefits' => $data['benefits'] ?? [],
            'is_active' => $data['is_active'],
            'sold_count' => 0,
        ]);

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'event_ticket_created',
            'subject_type' => EventTicket::class,
            'subject_id' => $ticket->id,
            'metadata' => $data,
        ]);

        return redirect()
            ->route('admin.events.tickets.index', ['event_id' => $event->id])
            ->with('status', 'ticket-created');
    }

    public function update(Request $request, EventTicket $ticket): RedirectResponse
    {
        $this->authorizeTicket($ticket, $request);
        $data = $this->validatedTicket($request);
        $event = $this->findAvailableEvent($request, $data['event_id']);

        $ticket->update([
            ...$data,
            'event_id' => $event->id,
            'description' => $data['description'] ?? null,
            'benefits' => $data['benefits'] ?? [],
        ]);

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'event_ticket_updated',
            'subject_type' => EventTicket::class,
            'subject_id' => $ticket->id,
            'metadata' => $data,
        ]);

        return redirect()
            ->route('admin.events.tickets.index', ['event_id' => $event->id])
            ->with('status', 'ticket-updated');
    }

    public function destroy(Request $request, EventTicket $ticket): RedirectResponse
    {
        $this->authorizeTicket($ticket, $request);

        $bookingCount = $ticket->bookings()->count();
        if ($bookingCount > 0) {
            return back()->withErrors([
                'ticket' => "Tiket tidak dapat dihapus karena sudah memiliki {$bookingCount} booking.",
            ]);
        }

        $metadata = $ticket->toArray();
        $ticketId = $ticket->id;
        $ticket->delete();

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'event_ticket_deleted',
            'subject_type' => EventTicket::class,
            'subject_id' => $ticketId,
            'metadata' => $metadata,
        ]);

        return back()->with('status', 'ticket-deleted');
    }

    private function availableEvents(Request $request): array
    {
        return Event::query()
            ->where('event_type', 'event')
            ->when(! AdminDataScope::canViewAll($request->user()), fn ($query) => $query
                ->whereHas('organizer', fn ($organizer) => $organizer
                    ->where('user_id', $request->user()?->id ?? 0)))
            ->select('id', 'title', 'start_at', 'status')
            ->orderByDesc('start_at')
            ->orderBy('title')
            ->get()
            ->map(fn (Event $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'start_at' => $event->start_at?->toISOString(),
                'status' => $event->status,
            ])
            ->all();
    }

    private function validatedTicket(Request $request): array
    {
        return $request->validate([
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'quota' => ['required', 'integer', 'min:0'],
            'max_per_user' => ['required', 'integer', 'min:1'],
            'benefits' => ['nullable', 'array'],
            'benefits.*' => ['string', 'max:255'],
            'is_active' => ['required', 'boolean'],
        ]);
    }

    private function findAvailableEvent(Request $request, int $eventId): Event
    {
        return Event::query()
            ->where('event_type', 'event')
            ->when(! AdminDataScope::canViewAll($request->user()), fn ($query) => $query
                ->whereHas('organizer', fn ($organizer) => $organizer
                    ->where('user_id', $request->user()?->id ?? 0)))
            ->findOrFail($eventId);
    }

    private function authorizeTicket(EventTicket $ticket, Request $request): void
    {
        $ticket->loadMissing('event.organizer');
        abort_unless(
            AdminDataScope::canViewAll($request->user()) ||
            (int) $ticket->event?->organizer?->user_id === (int) ($request->user()?->id ?? 0),
            404
        );
    }
}
